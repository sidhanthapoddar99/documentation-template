---
title: Live Documentation Editor
description: In-browser split-pane editor with multi-user presence and live cursors
---

# Live Documentation Editor

The dev toolbar includes an Overleaf-style live editor for docs and blog pages. Click **Edit Page** in the toolbar to open a full-screen split-pane editor: raw markdown on the left, rendered preview on the right.

Multiple developers on the same network can see each other's presence, pages, latency, and live cursor positions — similar to Google Docs or Figma.

This is a **development-only** feature — it is completely disabled in production builds.

## Accessing the Editor

1. Start the dev server (`bun run dev`)
2. Navigate to any docs or blog page
3. Click the **pencil icon** ("Edit Page") in the dev toolbar at the bottom
4. Click **"Edit this page"** in the panel

The button is only enabled on pages that have content files (docs and blog pages). Custom pages like the home page do not show the editor.

## Editor Layout

The editor opens as a full-screen overlay with three sections:

### Header Bar

| Element | Description |
|---------|-------------|
| **File name** | Shows the path of the file being edited |
| **Status indicator** | Green "Saved", orange "Unsaved changes", or yellow "Saving..." |
| **Save button** | Manual save (also via `Ctrl+S` / `Cmd+S`) |
| **Close button** | Save and close the editor, triggers page reload |

### Left Pane — Markdown Editor

A syntax-highlighted text editor showing the raw markdown including frontmatter. Features:

- **Syntax highlighting** for markdown elements:
  - Headings (`#`, `##`, etc.)
  - Bold (`**text**`) and italic (`*text*`)
  - Inline code and fenced code blocks
  - Links and images
  - Blockquotes, lists, and horizontal rules
  - YAML frontmatter block
- **Tab key** inserts spaces instead of changing focus
- **Remote cursors** — colored cursor markers with labels show where other users are editing in the same file
- Monospace font for consistent formatting

### Right Pane — Live Preview

Rendered HTML preview that updates as you type (~300ms debounce). The preview:

- Uses the same rendering pipeline as production (asset embedding, heading IDs, external link handling)
- Applies your site's active theme and content styles
- Matches the appearance of the actual docs page

### Resize Handle

Drag the divider between panes to adjust the split ratio.

### Scroll Sync

Both panes scroll together proportionally — scrolling the markdown editor scrolls the preview to the matching position, and vice versa. Remote cursors reposition automatically during scrolling.

## Multi-User Presence

When multiple developers have the dev server open, a **presence table** appears in the toolbar panel showing all connected users.

### Presence Table

| Column | Content |
|--------|---------|
| **User** | Colored dot + randomly assigned name (e.g. "Swift Otter") with "(you)" marker |
| **Page** | Shortened URL path of the page the user is viewing |
| **Ping** | Round-trip latency, color-coded: green (<100ms), yellow (<300ms), red (>=300ms) |
| **Action** | "Jump" button to navigate to that user's current page |

The connected user count is shown as a badge in the section header.

### User Identity

Each browser tab is assigned a random identity (adjective + animal name and a color) on first load. This identity is preserved across page refreshes within the same session via `sessionStorage`.

### Live Cursors

When two or more users have the editor open on the **same file**, each user sees colored cursor markers showing other users' positions in real time:

- Cursors appear as a thin colored line with a name label above
- Position updates are throttled (configurable, default 100ms) to reduce network traffic
- Cursor broadcasts are **file-scoped** — only users editing the same file receive updates
- Cursors reposition on scroll and hide when scrolled out of view

### How Presence Works

```
Browser A                    Vite Dev Server                Browser B
┌──────────────┐            ┌──────────────────┐           ┌──────────────┐
│ SSE stream <─│────────────│─ PresenceManager │───────────│─> SSE stream │
│              │   POST     │   users Map      │   POST    │              │
│ join/cursor ─│───────────>│   streams Map    │<──────────│─ join/cursor │
│ ping ────────│───────────>│   broadcastAll() │<──────────│──────── ping │
│              │            │   broadcastFile()│           │              │
│ Presence UI  │            └──────────────────┘           │ Presence UI  │
│ Remote cursors│                                          │Remote cursors│
└──────────────┘                                           └──────────────┘
```

- **SSE (Server-Sent Events)** pushes presence and cursor updates from server to clients
- **HTTP POST** sends actions (join, leave, cursor, ping) from clients to server
- **`sendBeacon`** ensures leave events fire reliably on page unload / tab close
- **Stale cleanup** automatically removes users with no heartbeat (configurable threshold)

## Auto-Save

The editor automatically saves changes to disk at a configurable interval. During editing:

1. **Keystroke** — Changes stored in memory on the server, preview re-rendered
2. **Auto-save interval** — Dirty documents written to disk periodically
3. **Manual save** — `Ctrl+S` or the Save button triggers an immediate disk write
4. **Close** — Any unsaved changes are written to disk, then the page reloads

### Configuration

The auto-save interval is configured in `site.yaml` and is **required**:

```yaml
editor:
  autosave_interval: 10000  # milliseconds (minimum: 1000)
```

If this field is missing, the dev server will fail to start with an error message explaining what to add.

### Presence Configuration

All presence timing values are configurable in `site.yaml` under `editor.presence`:

```yaml
editor:
  autosave_interval: 10000
  presence:
    ping_interval: 5000       # How often clients ping the server (ms)
    stale_threshold: 30000    # Remove users with no heartbeat after this (ms)
    cursor_throttle: 100      # Min interval between cursor broadcasts (ms)
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ping_interval` | `number` | `5000` | Client ping frequency in ms. Minimum: `1000` |
| `stale_threshold` | `number` | `30000` | Duration before a silent user is removed. Minimum: `5000` |
| `cursor_throttle` | `number` | `100` | Min ms between cursor position sends. Minimum: `16` |

All fields are optional — sensible defaults are used if omitted. The server sends these values to clients via SSE on connection, so there are no hardcoded values on the client side.

## HMR Suppression

While a file is open in the editor, hot module replacement (HMR) is suppressed for that file. This prevents the page from reloading mid-edit when the auto-save writes to disk.

- Caches are still cleared on each save so the next full load picks up changes
- Other files not being edited still trigger normal HMR
- When you close the editor, a full reload is triggered to apply all changes

## How It Works

### Architecture

```
Browser (Dev Toolbar)                Vite Dev Server
┌───────────────────────┐          ┌────────────────────────┐
│ Full-screen overlay   │          │ Vite Middleware         │
│ ┌─────────┬─────────┐ │  fetch   │ POST /__editor/open    │
│ │ Raw MD  │ Preview │ │ <──────> │ POST /__editor/update  │
│ │ (edit)  │ (HTML)  │ │          │ POST /__editor/save    │
│ └─────────┴─────────┘ │          │ POST /__editor/close   │
│                       │          │ POST /__editor/presence │
│ Presence table        │   SSE    │ POST /__editor/ping    │
│ Remote cursors        │ <─────── │ GET  /__editor/events  │
└───────────────────────┘          │        ↓               │
                                   │ EditorStore (in-memory)│
                                   │ PresenceManager        │
                                   │        ↓ auto-save     │
                                   │ fs.writeFile (disk)    │
                                   └────────────────────────┘
```

### File Path Communication

The server embeds the content file path into the page as a `data-editor-path` attribute on the `<html>` element (dev mode only). The toolbar reads this to know which file to open. This attribute is stripped in production builds.

### API Endpoints

All endpoints are dev-only and handled by Vite middleware:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/__editor/events` | GET | SSE stream for presence and cursor events (long-lived connection) |
| `/__editor/styles` | GET | Returns combined CSS for preview styling |
| `/__editor/open` | POST | Open a document — returns raw markdown and rendered HTML |
| `/__editor/update` | POST | Send updated content — returns re-rendered preview |
| `/__editor/save` | POST | Save current content to disk |
| `/__editor/close` | POST | Save and close — triggers page reload |
| `/__editor/presence` | POST | Presence actions: join, leave, page, cursor, cursor-clear |
| `/__editor/ping` | POST | Latency measurement — echoes `clientTime`, accepts `latencyMs` |

### SSE Event Types

The `/__editor/events` endpoint sends three types of Server-Sent Events:

| Event | When | Payload |
|-------|------|---------|
| `config` | On connection | `{ pingInterval, cursorThrottle }` — timing config from site.yaml |
| `presence` | User joins/leaves/navigates | `{ users: [...] }` — full user list |
| `cursor` | User moves cursor | `{ userId, name, color, cursor, file }` — file-scoped |

### Source Files

| File | Purpose |
|------|---------|
| `src/dev-toolbar/editor-app.ts` | Client-side toolbar UI, editor overlay, presence table, cursor tracking |
| `src/dev-toolbar/editor/server.ts` | In-memory document store (`EditorStore`) |
| `src/dev-toolbar/editor/presence.ts` | Multi-user presence manager (`PresenceManager`) |
| `src/dev-toolbar/editor/middleware.ts` | HTTP endpoint handlers (editor + presence + SSE) |
| `src/dev-toolbar/integration.ts` | Wires editor and presence into the dev toolbar and Vite |
