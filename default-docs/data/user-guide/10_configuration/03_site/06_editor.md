---
title: Editor Configuration
description: Configure live editor autosave, presence, and synchronization settings
---

# Editor Configuration

The `editor` block configures the live documentation editor in the dev toolbar. The `autosave_interval` field is **required** — the dev server will throw an error if it's missing. The `presence` sub-block is optional.

```yaml
editor:
  autosave_interval: 10000  # Auto-save interval in milliseconds
  presence:
    ping_interval: 5000       # How often clients ping the server (ms)
    stale_threshold: 30000    # Remove users with no heartbeat after this (ms)
    cursor_throttle: 100      # Min interval between cursor broadcasts (ms)
    content_debounce: 150     # Debounce for raw text diff sync (ms)
    render_interval: 5000     # Interval for rendered preview updates (ms)
    sse_keepalive: 15000      # SSE keepalive comment interval (ms)
    sse_reconnect: 2000       # SSE auto-reconnect delay on disconnect (ms)
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `autosave_interval` | `number` | Yes | Interval in ms for auto-saving edited documents. Minimum: `1000` |
| `presence` | `object` | No | Multi-user presence and editor timing configuration |
| `presence.ping_interval` | `number` | No | Client ping frequency in ms. Default: `5000`. Minimum: `1000` |
| `presence.stale_threshold` | `number` | No | Remove silent users after this ms. Default: `30000`. Minimum: `5000` |
| `presence.cursor_throttle` | `number` | No | Min ms between cursor position sends. Default: `100`. Minimum: `16` |
| `presence.content_debounce` | `number` | No | Debounce for raw text diff sync in ms. Default: `150`. Minimum: `50` |
| `presence.render_interval` | `number` | No | Server render interval in ms. Default: `5000`. Minimum: `1000` |
| `presence.sse_keepalive` | `number` | No | SSE keepalive comment interval in ms. Default: `15000`. Minimum: `5000` |
| `presence.sse_reconnect` | `number` | No | SSE auto-reconnect delay in ms. Default: `2000`. Minimum: `500` |

## `autosave_interval`

Controls how frequently the live editor auto-saves changes to disk while you're editing. During editing, changes are held in memory and periodically flushed to disk at this interval.

```yaml
editor:
  autosave_interval: 10000  # Save every 10 seconds
```

- **Minimum value**: `1000` (1 second)
- **Recommended**: `10000` (10 seconds) — balances responsiveness with disk I/O
- **Lower values**: More frequent saves, more disk writes
- **Higher values**: Fewer saves, more data at risk if the server crashes

If this field is missing or invalid, the dev server will fail to start with a clear error message explaining what to add.

## `presence`

Controls timing for multi-user presence awareness, live cursor tracking, and editor synchronization. All fields are optional — sensible defaults are used when omitted. The server sends timing values (`pingInterval`, `cursorThrottle`, `renderInterval`) to editor clients via WebSocket on connect.

```yaml
editor:
  presence:
    ping_interval: 5000       # Clients ping every 5 seconds
    stale_threshold: 30000    # Remove users after 30 seconds of silence
    cursor_throttle: 100      # Send cursor updates at most every 100ms
    content_debounce: 150     # Debounce raw text diffs at 150ms
    render_interval: 5000     # Re-render preview every 5 seconds
    sse_keepalive: 15000      # SSE keepalive every 15 seconds
    sse_reconnect: 2000       # SSE reconnect after 2 seconds
```

- **`ping_interval`** — How often each editor client pings the server (via WebSocket) for latency measurement and heartbeat. Lower values give more responsive latency readings but more traffic.
- **`stale_threshold`** — How long to wait before removing a user who stops sending heartbeats (e.g. crashed tab, lost network). The cleanup check runs at 1/3 of this interval.
- **`cursor_throttle`** — Minimum delay between cursor position broadcasts from the client. Lower values give smoother remote cursors but more traffic.
- **`content_debounce`** — Debounce interval for raw text diff synchronization. Controls how quickly local edits are computed and sent to the Yjs CRDT.
- **`render_interval`** — How often the server re-renders the document and pushes preview updates to editor clients. Only triggers when content has changed since the last render.
- **`sse_keepalive`** — Interval for SSE keepalive comments. Also updates `lastSeen` timestamps to prevent stale removal for non-editing users (those browsing without an open editor).
- **`sse_reconnect`** — How long the client waits before reconnecting the SSE stream after a disconnect.
