/**
 * Yjs Sync - CRDT-based real-time text synchronization + multiplexed editor messages
 *
 * Manages Yjs documents (rooms) per file and syncs them over WebSocket.
 * Each room has a Y.Doc with a shared Y.Text ("content") that represents
 * the file's raw markdown. The Yjs CRDT handles concurrent edits correctly
 * without manual operational transform.
 *
 * In addition to Yjs sync (MSG_SYNC), the WebSocket carries cursor positions,
 * ping/latency, config delivery, and rendered preview updates. This eliminates
 * the need for HTTP POST and SSE for per-file editing traffic — SSE is only
 * used for the global presence table (join/leave/page).
 *
 * Architecture:
 * - Server owns the authoritative Y.Doc per file
 * - Clients connect via WebSocket, exchange sync messages
 * - Any local edit → Y.Text change → Yjs broadcasts to all peers
 * - EditorStore.doc.raw is kept in sync via an observe callback
 *
 * Dev-only: never loaded in production builds.
 */

import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { PresenceManager, PresenceConfig } from './presence';
import type { EditorStore } from './server';

// WS message types (first varuint in every frame)
const MSG_SYNC       = 0; // Yjs binary sync (unchanged)
const MSG_CURSOR     = 1; // C→S: cursor pos, S→C: enriched cursor broadcast
const MSG_PING       = 2; // C→S: {clientTime, latencyMs}, S→C: {clientTime}
const MSG_CONFIG     = 3; // S→C: timing config on connect
const MSG_RENDER     = 4; // S→C: rendered HTML update
const MSG_RENDER_REQ = 5; // C→S: request server render

interface YjsRoom {
  doc: Y.Doc;
  text: Y.Text;
  conns: Map<WebSocket, string>; // ws → userId
}

export class YjsSync {
  private rooms = new Map<string, YjsRoom>();
  private wss: WebSocketServer;
  private onContentChange: ((filePath: string, raw: string) => void) | null = null;

  // Late-bound dependencies (set via setDependencies after construction)
  private presence: PresenceManager | null = null;
  private store: EditorStore | null = null;
  private config: PresenceConfig | null = null;

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
  }

  /**
   * Inject dependencies that aren't available at construction time.
   * Called once from integration.ts after all components are created.
   */
  setDependencies(presence: PresenceManager, store: EditorStore, config: PresenceConfig): void {
    this.presence = presence;
    this.store = store;
    this.config = config;
  }

  /**
   * Set the callback that fires when a Yjs document's content changes
   * (from a client edit). Used to keep EditorStore.doc.raw in sync.
   */
  setContentChangeHandler(handler: (filePath: string, raw: string) => void): void {
    this.onContentChange = handler;
  }

  /**
   * Attach the WebSocket upgrade handler to Vite's HTTP server.
   * Handles upgrades on /__editor/yjs?file=<filePath>&userId=<userId>.
   */
  attachToServer(httpServer: Server): void {
    httpServer.on('upgrade', (request, socket, head) => {
      if (!request.url?.startsWith('/__editor/yjs')) return;

      const url = new URL(request.url, 'http://localhost');
      const filePath = url.searchParams.get('file');
      const userId = url.searchParams.get('userId');
      if (!filePath || !userId) {
        socket.destroy();
        return;
      }

      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.handleConnection(ws, filePath, userId);
      });
    });

    console.log('[yjs] WebSocket sync attached to server (/__editor/yjs)');
  }

  /**
   * Get or create a Yjs room for a file.
   * If the room already exists, returns it unchanged.
   * If not, creates a new Y.Doc initialized with the content.
   */
  getOrCreateRoom(filePath: string, initialContent: string): YjsRoom {
    const existing = this.rooms.get(filePath);
    if (existing) return existing;

    const doc = new Y.Doc();
    const text = doc.getText('content');

    // Initialize with file content
    doc.transact(() => {
      text.insert(0, initialContent);
    }, 'init');

    // Observe text changes from client edits → update EditorStore
    text.observe((_event: Y.YTextEvent, transaction: Y.Transaction) => {
      if (transaction.origin === 'init' || transaction.origin === 'reset') return;
      this.onContentChange?.(filePath, text.toString());
    });

    // Broadcast doc updates to all connected clients (except sender)
    doc.on('update', (update: Uint8Array, origin: unknown) => {
      const room = this.rooms.get(filePath);
      if (!room) return;

      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);

      for (const [conn] of room.conns) {
        if (conn === origin) continue;
        if (conn.readyState === WebSocket.OPEN) {
          try { conn.send(message); } catch { /* broken connection */ }
        }
      }
    });

    const room: YjsRoom = { doc, text, conns: new Map() };
    this.rooms.set(filePath, room);

    console.log(`[yjs] Room created: ${filePath.split('/').slice(-3).join('/')}`);
    return room;
  }

  /**
   * Destroy a Yjs room when no more connections are open.
   */
  destroyRoom(filePath: string): void {
    const room = this.rooms.get(filePath);
    if (!room) return;

    for (const [ws] of room.conns) {
      try { ws.close(); } catch { /* already closed */ }
    }
    room.doc.destroy();
    this.rooms.delete(filePath);

    console.log(`[yjs] Room destroyed: ${filePath.split('/').slice(-3).join('/')}`);
  }

  /**
   * Reset a room's content (for external file changes).
   * Replaces all text in the Y.Doc, which broadcasts to all clients.
   */
  resetContent(filePath: string, newContent: string): void {
    const room = this.rooms.get(filePath);
    if (!room) return;

    room.doc.transact(() => {
      room.text.delete(0, room.text.length);
      room.text.insert(0, newContent);
    }, 'reset');

    console.log(`[yjs] Content reset: ${filePath.split('/').slice(-3).join('/')}`);
  }

  /**
   * Check if a room has active connections.
   */
  hasConnections(filePath: string): boolean {
    const room = this.rooms.get(filePath);
    return room ? room.conns.size > 0 : false;
  }

  /**
   * Broadcast a rendered HTML update to all WS clients in a room.
   */
  broadcastRenderUpdate(filePath: string, rendered: string): void {
    const room = this.rooms.get(filePath);
    if (!room) return;
    this.broadcastToRoom(room, MSG_RENDER, { file: filePath, rendered });
  }

  // ---- Private helpers ----

  /**
   * Send a JSON-encoded message over WebSocket using lib0 framing.
   */
  private sendWsJson(ws: WebSocket, type: number, payload: Record<string, any>): void {
    if (ws.readyState !== WebSocket.OPEN) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, type);
    encoding.writeVarString(encoder, JSON.stringify(payload));
    try { ws.send(encoding.toUint8Array(encoder)); } catch { /* broken */ }
  }

  /**
   * Broadcast a JSON message to all clients in a room, optionally excluding one.
   */
  private broadcastToRoom(room: YjsRoom, type: number, payload: Record<string, any>, excludeWs?: WebSocket): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, type);
    encoding.writeVarString(encoder, JSON.stringify(payload));
    const message = encoding.toUint8Array(encoder);

    for (const [conn] of room.conns) {
      if (conn === excludeWs) continue;
      if (conn.readyState === WebSocket.OPEN) {
        try { conn.send(message); } catch { /* broken */ }
      }
    }
  }

  /**
   * Handle a new WebSocket connection for a file.
   */
  private handleConnection(ws: WebSocket, filePath: string, userId: string): void {
    const room = this.rooms.get(filePath);
    if (!room) {
      ws.close(4004, 'Room not found — open the file first');
      return;
    }

    room.conns.set(ws, userId);

    // Send config on connect
    if (this.config) {
      this.sendWsJson(ws, MSG_CONFIG, {
        pingInterval: this.config.pingInterval,
        cursorThrottle: this.config.cursorThrottle,
        renderInterval: this.config.renderInterval,
      });
    }

    // Send SyncStep1 (our state vector) so the client can respond with its diff
    const initEncoder = encoding.createEncoder();
    encoding.writeVarUint(initEncoder, MSG_SYNC);
    syncProtocol.writeSyncStep1(initEncoder, room.doc);
    ws.send(encoding.toUint8Array(initEncoder));

    // Handle incoming messages from client
    ws.on('message', (data: ArrayBuffer | Buffer) => {
      try {
        const message = new Uint8Array(
          data instanceof ArrayBuffer
            ? data
            : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
        );
        const decoder = decoding.createDecoder(message);
        const messageType = decoding.readVarUint(decoder);

        switch (messageType) {
          case MSG_SYNC: {
            const responseEncoder = encoding.createEncoder();
            encoding.writeVarUint(responseEncoder, MSG_SYNC);
            syncProtocol.readSyncMessage(decoder, responseEncoder, room.doc, ws);
            if (encoding.length(responseEncoder) > 1) {
              ws.send(encoding.toUint8Array(responseEncoder));
            }
            break;
          }

          case MSG_CURSOR: {
            const payload = JSON.parse(decoding.readVarString(decoder));
            // Update presence state (no SSE broadcast)
            this.presence?.updateCursorState(userId, filePath, payload.cursor);
            // Enrich with user info and broadcast to room peers
            const user = this.presence?.getUser(userId);
            this.broadcastToRoom(room, MSG_CURSOR, {
              userId,
              name: user?.name || 'Anonymous',
              color: user?.color || '#7aa2f7',
              cursor: payload.cursor,
              file: filePath,
            }, ws);
            break;
          }

          case MSG_PING: {
            const payload = JSON.parse(decoding.readVarString(decoder));
            // Update latency in presence
            if (typeof payload.latencyMs === 'number') {
              this.presence?.updateLatency(userId, payload.latencyMs);
            }
            // Echo clientTime for round-trip measurement
            this.sendWsJson(ws, MSG_PING, { clientTime: payload.clientTime });
            break;
          }

          case MSG_RENDER_REQ: {
            // Client requests a re-render
            if (this.store) {
              this.store.renderDocument(filePath).then(doc => {
                this.broadcastRenderUpdate(filePath, doc.rendered);
              }).catch(err => {
                console.error('[yjs] Render request failed:', err);
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error('[yjs] Error handling message:', err);
      }
    });

    ws.on('close', () => {
      room.conns.delete(ws);
      // Auto cursor-clear on disconnect
      this.presence?.handleAction({ type: 'cursor-clear', userId });
      console.log(`[yjs] Client disconnected (${room.conns.size} remaining)`);
    });

    ws.on('error', () => {
      room.conns.delete(ws);
    });

    console.log(`[yjs] Client connected: ${userId} (${room.conns.size} total)`);
  }
}
