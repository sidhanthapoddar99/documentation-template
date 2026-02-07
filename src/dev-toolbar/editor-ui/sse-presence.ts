// Global SSE connection & presence state management
//
// Module-scope state: one SSE connection shared across the page lifetime.
// SSE is now ONLY used for the global presence table (join/leave/page).
// Cursor, ping, render, and config are all handled via the Yjs WebSocket.

import type { Identity } from './types.js';

// ---- Private state ----

let eventSource: EventSource | null = null;
let presenceUsers: any[] = [];
let presenceUpdateCallback: ((users: any[]) => void) | null = null;
let sseReconnectTimer: ReturnType<typeof setTimeout> | null = null;

// Hardcoded — no longer received from server config (WS delivers config to editor)
const sseReconnect = 2000;

// Identity reference set by initPresence
let currentIdentity: Identity | null = null;

// ---- Callback registration ----

export function setPresenceUpdateCallback(cb: ((users: any[]) => void) | null): void {
  presenceUpdateCallback = cb;
}

// ---- Getters ----

export function getPresenceUsers(): any[] { return presenceUsers; }

// ---- SSE connection ----

function connectSSE(): void {
  if (!currentIdentity) return;
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  eventSource = new EventSource(`/__editor/events?userId=${currentIdentity.userId}`);

  eventSource.addEventListener('presence', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      presenceUsers = data.users || [];
      presenceUpdateCallback?.(presenceUsers);
    } catch { /* ignore parse errors */ }
  });

  eventSource.onerror = () => {
    eventSource?.close();
    eventSource = null;
    if (sseReconnectTimer) clearTimeout(sseReconnectTimer);
    sseReconnectTimer = setTimeout(connectSSE, sseReconnect);
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
}

function teardownPresence(): void {
  if (!currentIdentity) return;
  disconnectSSE();
  const blob = new Blob(
    [JSON.stringify({ type: 'leave', userId: currentIdentity.userId })],
    { type: 'application/json' }
  );
  navigator.sendBeacon('/__editor/presence', blob);
}

function softCleanup(): void {
  disconnectSSE();
  presenceUpdateCallback = null;
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
