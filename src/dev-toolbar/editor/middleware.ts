/**
 * Editor Middleware - HTTP endpoints for the live editor
 *
 * Adds Vite middleware to handle editor API requests:
 * - GET  /__editor/events    — SSE stream for presence + cursor events
 * - GET  /__editor/styles    — Combined content CSS
 * - POST /__editor/open      — Open document + create Yjs room
 * - POST /__editor/update    — Full content sync (used before save)
 * - POST /__editor/render    — Re-render document and broadcast preview
 * - POST /__editor/save      — Save document to disk
 * - POST /__editor/close     — Close document (save if dirty, destroy Yjs room)
 * - POST /__editor/presence  — Presence actions (join/leave/page/cursor/cursor-clear)
 * - POST /__editor/ping      — Latency measurement
 * - WS   /__editor/yjs       — Yjs CRDT sync (handled by YjsSync, not this middleware)
 *
 * Dev-only: never loaded in production builds.
 */

import type { ViteDevServer } from 'vite';
import type { EditorStore } from './server';
import type { PresenceManager, PresenceAction } from './presence';
import type { YjsSync } from './yjs-sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Parse JSON body from an incoming request
 */
function parseBody(req: any): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send a JSON response
 */
function sendJson(res: any, statusCode: number, data: any): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function setupEditorMiddleware(
  server: ViteDevServer,
  store: EditorStore,
  presence: PresenceManager,
  yjsSync: YjsSync,
): void {
  /**
   * Build combined CSS for the editor preview from theme + content styles.
   * No caching — reads fresh on each request so theme edits are reflected immediately.
   * These are small files so the overhead is negligible.
   */
  function getContentCSS(): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const srcRoot = path.resolve(__dirname, '../..');

    const cssFiles = [
      path.join(srcRoot, 'styles/color.css'),
      path.join(srcRoot, 'styles/font.css'),
      path.join(srcRoot, 'styles/element.css'),
      path.join(srcRoot, 'styles/markdown.css'),
      path.join(srcRoot, 'layouts/docs/components/body/default/styles.css'),
    ];

    let combined = '';
    for (const file of cssFiles) {
      try {
        if (fs.existsSync(file)) {
          combined += fs.readFileSync(file, 'utf-8') + '\n';
        }
      } catch { /* skip missing files */ }
    }

    return combined;
  }

  server.middlewares.use(async (req: any, res: any, next: any) => {
    const url = req.url as string;

    // Only handle /__editor/* routes
    if (!url.startsWith('/__editor/')) {
      return next();
    }

    // GET /__editor/styles — serve combined content CSS
    if (url === '/__editor/styles' && req.method === 'GET') {
      const css = getContentCSS();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/css');
      res.setHeader('Cache-Control', 'no-cache');
      res.end(css);
      return;
    }

    // GET /__editor/events?userId=xxx — SSE stream for presence + cursor events
    if (url.startsWith('/__editor/events') && req.method === 'GET') {
      const parsedUrl = new URL(url, 'http://localhost');
      const userId = parsedUrl.searchParams.get('userId');

      if (!userId) {
        return sendJson(res, 400, { error: 'userId query parameter is required' });
      }

      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      // Register stream with presence manager (sends initial snapshot)
      presence.addStream(userId, res);

      // Send keepalive comments at configurable interval
      const keepalive = setInterval(() => {
        if (!res.writableEnded) {
          try { res.write(': keepalive\n\n'); } catch { /* stream closed */ }
        }
      }, presence.config.sseKeepalive);

      // Cleanup on disconnect
      req.on('close', () => {
        clearInterval(keepalive);
        presence.removeStream(userId);
      });

      // Do NOT call next() — keep connection open
      return;
    }

    // Only accept POST for remaining endpoints
    if (req.method !== 'POST') {
      return sendJson(res, 405, { error: 'Method not allowed' });
    }

    try {
      const body = await parseBody(req);

      switch (url) {
        case '/__editor/presence': {
          const action = body as PresenceAction;
          if (!action.type || !action.userId) {
            return sendJson(res, 400, { error: 'type and userId are required' });
          }
          presence.handleAction(action);
          return sendJson(res, 200, { ok: true });
        }

        case '/__editor/ping': {
          const { userId, clientTime, latencyMs } = body;
          if (!userId) {
            return sendJson(res, 400, { error: 'userId is required' });
          }
          // Update latency from the previous round-trip measurement
          if (typeof latencyMs === 'number') {
            presence.updateLatency(userId, latencyMs);
          }
          return sendJson(res, 200, { clientTime });
        }

        case '/__editor/open': {
          const { filePath } = body;
          if (!filePath || typeof filePath !== 'string') {
            return sendJson(res, 400, { error: 'filePath is required' });
          }

          const doc = await store.openDocument(filePath);
          // Create Yjs room (idempotent — returns existing if already open)
          yjsSync.getOrCreateRoom(filePath, doc.raw);
          return sendJson(res, 200, {
            raw: doc.raw,
            rendered: doc.rendered,
            title: doc.frontmatter.title || 'Untitled',
          });
        }

        case '/__editor/update': {
          const { filePath, content } = body;
          if (!filePath || typeof filePath !== 'string') {
            return sendJson(res, 400, { error: 'filePath is required' });
          }
          if (typeof content !== 'string') {
            return sendJson(res, 400, { error: 'content is required' });
          }

          const doc = await store.updateDocument(filePath, content);

          return sendJson(res, 200, {
            rendered: doc.rendered,
            frontmatter: doc.frontmatter,
          });
        }

        case '/__editor/render': {
          const { filePath } = body;
          if (!filePath || typeof filePath !== 'string') {
            return sendJson(res, 400, { error: 'filePath is required' });
          }

          const doc = await store.renderDocument(filePath);
          presence.broadcastRenderUpdate(filePath, doc.rendered);

          return sendJson(res, 200, { rendered: doc.rendered });
        }

        case '/__editor/save': {
          const { filePath } = body;
          if (!filePath || typeof filePath !== 'string') {
            return sendJson(res, 400, { error: 'filePath is required' });
          }

          const result = store.saveDocument(filePath);
          return sendJson(res, 200, result);
        }

        case '/__editor/close': {
          const { filePath } = body;
          if (!filePath || typeof filePath !== 'string') {
            return sendJson(res, 400, { error: 'filePath is required' });
          }

          store.closeDocument(filePath);
          // Destroy Yjs room if no more WebSocket connections
          if (!yjsSync.hasConnections(filePath)) {
            yjsSync.destroyRoom(filePath);
          }

          return sendJson(res, 200, { success: true });
        }

        default:
          return sendJson(res, 404, { error: 'Unknown editor endpoint' });
      }
    } catch (err: any) {
      console.error('[editor] Middleware error:', err);
      return sendJson(res, 500, { error: err.message || 'Internal server error' });
    }
  });

  console.log('[editor] Middleware registered (/__editor/*)');
}
