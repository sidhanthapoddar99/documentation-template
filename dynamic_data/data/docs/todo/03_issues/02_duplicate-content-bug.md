---
title: "Content Duplication in Edit Mode"
description: Race condition causes document content to duplicate when editing long documents
sidebar_label: Duplicate Content Bug
---

# Content Duplication in Edit Mode

**Type:** Bug  
**Priority:** Critical  
**Component:** `src/dev-toolbar/editor-ui/yjs-client.ts`  
**Status:** Fixed

---

## Description

When editing a long document in the dev toolbar editor, content sometimes gets duplicated. The entire document appears twice in the editor textarea. Particularly reproducible when quickly closing and reopening the editor.

## Root Cause

**Zombie WebSocket reconnection after editor close.**

When the user closes the editor, `masterCleanup()` calls `yjsWs.close()`. But the WebSocket `close` event fires **asynchronously** — after `masterCleanup` has already returned. The `close` event handler schedules a reconnect timer (`setTimeout(connectYjsWs, 2000)`), which was never cleared because `masterCleanup` had already cleared the *previous* timer before the new one was scheduled.

2 seconds later, `connectYjsWs()` runs on a **destroyed Y.Doc**, connecting to whatever room exists for that file. If the user has reopened the editor, a new room exists and the zombie connection joins it as a second client, sending stale/empty sync state that corrupts the room content — causing duplication.

**Evidence from server logs:**
```
[yjs] Client connected: e27f5597... (1 total)   ← new editor session
[yjs] Client connected: e27f5597... (2 total)   ← zombie reconnect from old session
[yjs] Client disconnected (1 remaining)
```

## Fix Applied

### Primary fix: `disposed` flag in `yjs-client.ts`

Added a `disposed` boolean that is set to `true` at the top of `masterCleanup()`. The `connectYjsWs()` function checks this flag and returns immediately if disposed. This prevents the zombie reconnect regardless of when the async `close` event fires.

```typescript
let disposed = false;

function connectYjsWs(): void {
    if (disposed) return;  // Kill zombie reconnects
    // ...
}

function masterCleanup() {
    disposed = true;  // Set FIRST, before any async close events
    // ...
}
```

### Secondary hardening (also applied)

| Fix | File | Purpose |
|-----|------|---------|
| `textarea.readOnly = true` until Yjs sync | `yjs-client.ts` | Prevents user input during initial sync race window |
| `ignoreSaveSet` → counter-based `ignoreSaveMap` | `server.ts` | Eliminates 1-second timeout race between editor saves and file watcher |
| onInput sanity guard | `yjs-client.ts` | Rejects pathological full-content inserts (deleteCount=0, insertLen > 80% of doc) |
| Room idle eviction | `yjs-sync.ts` | Cleans up abandoned rooms (0 connections, idle > 30min) |
| `GET /__editor/stats` | `middleware.ts` | Observability endpoint for debugging room/document state |

## Affected Files

- `src/dev-toolbar/editor-ui/yjs-client.ts` — disposed flag, readOnly guard, onInput sanity check
- `src/dev-toolbar/editor/server.ts` — ignoreSaveMap counter, getDocumentStats()
- `src/dev-toolbar/editor/yjs-sync.ts` — room eviction, lastActivity tracking, getRoomStats()
- `src/dev-toolbar/editor/middleware.ts` — stats endpoint
- `src/dev-toolbar/integration.ts` — consumeEditorSave() call sites, eviction wiring
