/**
 * Presence Manager - Multi-user presence tracking for the live editor
 *
 * Tracks connected users, their current pages, cursor positions, and latency.
 * Uses SSE (Server-Sent Events) for server→client push and HTTP POST for
 * client→server actions. Cursor broadcasts are file-scoped to reduce traffic.
 *
 * All timing values are configurable via site.yaml → editor.presence.
 *
 * Dev-only: never loaded in production builds.
 */

import type { ServerResponse } from 'http';

export interface PresenceConfig {
  /** How often clients should ping the server (ms). Sent to clients in SSE init. */
  pingInterval: number;
  /** Remove users with no heartbeat after this duration (ms). */
  staleThreshold: number;
  /** Min interval between cursor position broadcasts on the client (ms). Sent to clients in SSE init. */
  cursorThrottle: number;
  /** Debounce for raw text diff sync (ms). Sent to clients in SSE init. */
  contentDebounce: number;
  /** Interval for rendered preview updates (ms). Sent to clients in SSE init. */
  renderInterval: number;
  /** SSE keepalive comment interval (ms). */
  sseKeepalive: number;
  /** SSE auto-reconnect delay on disconnect (ms). Sent to clients in SSE init. */
  sseReconnect: number;
}

export interface PresenceUser {
  userId: string;
  name: string;
  color: string;
  currentPage: string;
  editingFile: string | null;
  cursor: { line: number; col: number; offset: number } | null;
  latencyMs: number;
  lastSeen: number;
}

export interface PresenceAction {
  type: 'join' | 'leave' | 'page' | 'cursor' | 'cursor-clear';
  userId: string;
  name?: string;
  color?: string;
  page?: string;
  file?: string;
  cursor?: { line: number; col: number; offset: number };
}

export class PresenceManager {
  private users = new Map<string, PresenceUser>();
  private streams = new Map<string, ServerResponse>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  readonly config: PresenceConfig;

  constructor(config: PresenceConfig) {
    this.config = config;
  }

  /**
   * Register an SSE stream for a user.
   * Closes any existing stream for the same userId (reconnect case).
   * Sends an initial presence snapshot + client config to the new stream.
   */
  addStream(userId: string, res: ServerResponse): void {
    // Close existing stream for this user (reconnect)
    const existing = this.streams.get(userId);
    if (existing && !existing.writableEnded) {
      try { existing.end(); } catch { /* already closed */ }
    }

    this.streams.set(userId, res);

    // Send client config (timing values from site.yaml)
    this.sendToStream(res, 'config', {
      type: 'config',
      pingInterval: this.config.pingInterval,
      cursorThrottle: this.config.cursorThrottle,
      contentDebounce: this.config.contentDebounce,
      renderInterval: this.config.renderInterval,
      sseReconnect: this.config.sseReconnect,
    });

    // Send initial presence snapshot
    this.sendToStream(res, 'presence', {
      type: 'presence',
      users: this.getUsers(),
    });
  }

  /**
   * Remove an SSE stream and leave the user.
   */
  removeStream(userId: string): void {
    const stream = this.streams.get(userId);
    if (stream && !stream.writableEnded) {
      try { stream.end(); } catch { /* already closed */ }
    }
    this.streams.delete(userId);
    this.users.delete(userId);
    this.broadcastPresence();
  }

  /**
   * Handle a presence action from a client.
   */
  handleAction(action: PresenceAction): void {
    const { type, userId } = action;

    switch (type) {
      case 'join': {
        this.users.set(userId, {
          userId,
          name: action.name || 'Anonymous',
          color: action.color || '#7aa2f7',
          currentPage: action.page || '/',
          editingFile: null,
          cursor: null,
          latencyMs: 0,
          lastSeen: Date.now(),
        });
        this.broadcastPresence();
        break;
      }

      case 'leave': {
        this.users.delete(userId);
        const stream = this.streams.get(userId);
        if (stream && !stream.writableEnded) {
          try { stream.end(); } catch { /* already closed */ }
        }
        this.streams.delete(userId);
        this.broadcastPresence();
        break;
      }

      case 'page': {
        const user = this.users.get(userId);
        if (user) {
          user.currentPage = action.page || '/';
          user.editingFile = null;
          user.cursor = null;
          user.lastSeen = Date.now();
          this.broadcastPresence();
        }
        break;
      }

      case 'cursor': {
        const user = this.users.get(userId);
        if (user && action.file && action.cursor) {
          user.editingFile = action.file;
          user.cursor = action.cursor;
          user.lastSeen = Date.now();
          this.broadcastCursor(userId, action.file, action.cursor);
        }
        break;
      }

      case 'cursor-clear': {
        const user = this.users.get(userId);
        if (user) {
          user.editingFile = null;
          user.cursor = null;
          user.lastSeen = Date.now();
          this.broadcastPresence();
        }
        break;
      }
    }
  }

  /**
   * Update a user's latency. Only broadcasts presence if the latency
   * changed by more than 20ms to avoid N² SSE writes every ping interval.
   */
  updateLatency(userId: string, ms: number): void {
    const user = this.users.get(userId);
    if (user) {
      const delta = Math.abs(user.latencyMs - ms);
      user.latencyMs = ms;
      user.lastSeen = Date.now();
      // Only broadcast on meaningful latency changes or first measurement
      if (delta > 20 || user.latencyMs === 0) {
        this.broadcastPresence();
      }
    }
  }

  /**
   * Broadcast full user list to ALL connected streams.
   * Pre-serializes once to avoid repeated JSON.stringify per recipient.
   */
  private broadcastPresence(): void {
    const formatted = `event: presence\ndata: ${JSON.stringify({
      type: 'presence',
      users: this.getUsers(),
    })}\n\n`;

    for (const [userId, stream] of this.streams) {
      if (!stream.writableEnded) {
        try { stream.write(formatted); } catch { /* stream broken */ }
      } else {
        this.streams.delete(userId);
      }
    }
  }

  /**
   * Broadcast an SSE event to all users editing the same file (excludes sender).
   * Pre-serializes the payload once to avoid repeated JSON.stringify per recipient.
   */
  private broadcastToFileEditors(
    fromUserId: string,
    file: string,
    event: string,
    payload: Record<string, any>
  ): void {
    const formatted = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

    for (const [userId, user] of this.users) {
      if (userId === fromUserId) continue;
      if (user.editingFile !== file) continue;

      const stream = this.streams.get(userId);
      if (stream && !stream.writableEnded) {
        try { stream.write(formatted); } catch { /* stream broken */ }
      }
    }
  }

  /**
   * Broadcast cursor update ONLY to users editing the same file.
   */
  private broadcastCursor(
    fromUserId: string,
    file: string,
    cursor: { line: number; col: number; offset: number }
  ): void {
    const fromUser = this.users.get(fromUserId);
    if (!fromUser) return;

    this.broadcastToFileEditors(fromUserId, file, 'cursor', {
      type: 'cursor',
      userId: fromUserId,
      name: fromUser.name,
      color: fromUser.color,
      cursor,
      file,
    });
  }

  /**
   * Broadcast a text diff to co-editors of the same file (excludes sender).
   */
  broadcastTextDiff(
    fromUserId: string,
    file: string,
    op: { offset: number; deleteCount: number; insert: string }
  ): void {
    this.broadcastToFileEditors(fromUserId, file, 'text-diff', {
      type: 'text-diff',
      userId: fromUserId,
      file,
      op,
    });
  }

  /**
   * Broadcast a rendered HTML update to ALL editors of a file (including requester).
   */
  broadcastRenderUpdate(file: string, rendered: string): void {
    const formatted = `event: render-update\ndata: ${JSON.stringify({
      type: 'render-update',
      file,
      rendered,
    })}\n\n`;

    for (const [userId, user] of this.users) {
      if (user.editingFile !== file) continue;

      const stream = this.streams.get(userId);
      if (stream && !stream.writableEnded) {
        try { stream.write(formatted); } catch { /* stream broken */ }
      }
    }
  }

  /**
   * Broadcast external file change to ALL editors of a file.
   */
  broadcastFileChanged(file: string, raw: string): void {
    const formatted = `event: file-changed\ndata: ${JSON.stringify({
      type: 'file-changed',
      file,
      raw,
    })}\n\n`;

    for (const [userId, user] of this.users) {
      if (user.editingFile !== file) continue;

      const stream = this.streams.get(userId);
      if (stream && !stream.writableEnded) {
        try { stream.write(formatted); } catch { /* stream broken */ }
      }
    }
  }

  /**
   * Send an SSE event to a single stream.
   */
  private sendToStream(res: ServerResponse, event: string, data: any): void {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      /* stream broken — will be cleaned up */
    }
  }

  /**
   * Get a snapshot of all connected users.
   */
  getUsers(): PresenceUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Start periodic cleanup of stale users.
   * Cleanup interval runs at 1/3 of stale threshold for responsiveness.
   */
  startCleanup(): void {
    if (this.cleanupTimer) return;

    const cleanupInterval = Math.max(Math.floor(this.config.staleThreshold / 3), 1000);

    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const staleIds: string[] = [];

      for (const [userId, user] of this.users) {
        if (now - user.lastSeen > this.config.staleThreshold) {
          console.log(`[presence] Removing stale user: ${user.name} (${userId})`);
          staleIds.push(userId);
        }
      }

      if (staleIds.length > 0) {
        for (const userId of staleIds) {
          const stream = this.streams.get(userId);
          if (stream && !stream.writableEnded) {
            try { stream.end(); } catch { /* already closed */ }
          }
          this.streams.delete(userId);
          this.users.delete(userId);
        }
        this.broadcastPresence();
      }
    }, cleanupInterval);

    console.log(`[presence] Stale user cleanup started (threshold: ${this.config.staleThreshold}ms, check interval: ${cleanupInterval}ms)`);
  }

  /**
   * Stop the cleanup interval.
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}
