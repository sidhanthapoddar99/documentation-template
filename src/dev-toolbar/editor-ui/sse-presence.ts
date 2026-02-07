// Global SSE connection & presence state management
//
// Module-scope state: one SSE connection shared across the page lifetime.
// Callbacks are registered/unregistered by the editor overlay modules.

import type { Identity } from './types.js';

// ---- Private state ----

let eventSource: EventSource | null = null;
let pingIntervalTimer: ReturnType<typeof setInterval> | null = null;
let lastPingClientTime = 0;
let lastLatencyMs = 0;
let presenceUsers: any[] = [];
let presenceUpdateCallback: ((users: any[]) => void) | null = null;
let cursorUpdateCallback: ((data: any) => void) | null = null;
let renderUpdateCallback: ((data: any) => void) | null = null;
let sseReconnectTimer: ReturnType<typeof setTimeout> | null = null;

// Server-provided config (from site.yaml via SSE config event)
// Defaults used until config event arrives
let serverPingInterval = 5000;
let serverCursorThrottle = 100;
let serverRenderInterval = 5000;
let serverSseReconnect = 2000;

// Identity reference set by initPresence
let currentIdentity: Identity | null = null;

// ---- Callback registration ----

export function setPresenceUpdateCallback(cb: ((users: any[]) => void) | null): void {
  presenceUpdateCallback = cb;
}

export function setCursorUpdateCallback(cb: ((data: any) => void) | null): void {
  cursorUpdateCallback = cb;
}

export function setRenderUpdateCallback(cb: ((data: any) => void) | null): void {
  renderUpdateCallback = cb;
}

// ---- Config getters ----

export function getServerCursorThrottle(): number { return serverCursorThrottle; }
export function getServerRenderInterval(): number { return serverRenderInterval; }
export function getServerSseReconnect(): number { return serverSseReconnect; }
export function getPresenceUsers(): any[] { return presenceUsers; }

// ---- SSE connection ----

function connectSSE(): void {
  if (!currentIdentity) return;
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  eventSource = new EventSource(`/__editor/events?userId=${currentIdentity.userId}`);

  eventSource.addEventListener('config', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      if (data.pingInterval) serverPingInterval = data.pingInterval;
      if (data.cursorThrottle) serverCursorThrottle = data.cursorThrottle;
      if (data.renderInterval) serverRenderInterval = data.renderInterval;
      if (data.sseReconnect) serverSseReconnect = data.sseReconnect;
      restartPingLoop();
    } catch { /* ignore parse errors */ }
  });

  eventSource.addEventListener('presence', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      presenceUsers = data.users || [];
      presenceUpdateCallback?.(presenceUsers);
    } catch { /* ignore parse errors */ }
  });

  eventSource.addEventListener('cursor', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      cursorUpdateCallback?.(data);
    } catch { /* ignore parse errors */ }
  });

  eventSource.addEventListener('render-update', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      renderUpdateCallback?.(data);
    } catch { /* ignore parse errors */ }
  });

  eventSource.onerror = () => {
    eventSource?.close();
    eventSource = null;
    if (sseReconnectTimer) clearTimeout(sseReconnectTimer);
    sseReconnectTimer = setTimeout(connectSSE, serverSseReconnect);
  };
}

function disconnectSSE(): void {
  if (sseReconnectTimer) {
    clearTimeout(sseReconnectTimer);
    sseReconnectTimer = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

// ---- Ping ----

function doPing(): void {
  if (!currentIdentity) return;
  const clientTime = Date.now();
  fetch('/__editor/ping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentIdentity.userId,
      clientTime,
      latencyMs: lastLatencyMs,
    }),
  }).then(res => {
    if (res.ok) return res.json();
  }).then(data => {
    if (data?.clientTime) {
      lastLatencyMs = Date.now() - data.clientTime;
    }
    lastPingClientTime = clientTime;
  }).catch(() => { /* ignore ping failures */ });
}

function startPingLoop(): void {
  if (pingIntervalTimer) return;
  pingIntervalTimer = setInterval(doPing, serverPingInterval);
}

function stopPingLoop(): void {
  if (pingIntervalTimer) {
    clearInterval(pingIntervalTimer);
    pingIntervalTimer = null;
  }
}

function restartPingLoop(): void {
  stopPingLoop();
  startPingLoop();
}

// ---- Presence actions ----

export function sendPresenceAction(action: Record<string, any>): void {
  if (!currentIdentity) return;
  fetch('/__editor/presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentIdentity.userId, ...action }),
  }).catch(() => { /* ignore errors */ });
}

// ---- Lifecycle ----

export function initPresence(identity: Identity): void {
  currentIdentity = identity;
  connectSSE();
  sendPresenceAction({
    type: 'join',
    name: identity.name,
    color: identity.color,
    page: window.location.pathname,
  });
  startPingLoop();
}

function teardownPresence(): void {
  if (!currentIdentity) return;
  stopPingLoop();
  disconnectSSE();
  const blob = new Blob(
    [JSON.stringify({ type: 'leave', userId: currentIdentity.userId })],
    { type: 'application/json' }
  );
  navigator.sendBeacon('/__editor/presence', blob);
}

function softCleanup(): void {
  stopPingLoop();
  disconnectSSE();
  presenceUpdateCallback = null;
  cursorUpdateCallback = null;
  renderUpdateCallback = null;
}

// ---- HMR guard ----

export function setupHmrGuard(identity: Identity): void {
  const HMR_KEY = '__editorPresenceCleanup';
  if (typeof (window as any)[HMR_KEY] === 'function') {
    (window as any)[HMR_KEY]();
  }
  initPresence(identity);
  (window as any)[HMR_KEY] = softCleanup;

  if ((window as any).__editorBeforeUnload) {
    window.removeEventListener('beforeunload', (window as any).__editorBeforeUnload);
  }
  (window as any).__editorBeforeUnload = teardownPresence;
  window.addEventListener('beforeunload', teardownPresence);
}
