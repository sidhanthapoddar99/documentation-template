---
title: Live Documentation Editor
description: In-browser split-pane editor for editing markdown with live preview
---

# Live Documentation Editor

The dev toolbar includes an Overleaf-style live editor for docs and blog pages. Click **Edit Page** in the toolbar to open a full-screen split-pane editor: raw markdown on the left, rendered preview on the right.

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
- Monospace font for consistent formatting

### Right Pane — Live Preview

Rendered HTML preview that updates as you type (~300ms debounce). The preview:

- Uses the same rendering pipeline as production (asset embedding, heading IDs, external link handling)
- Applies your site's active theme and content styles
- Matches the appearance of the actual docs page

### Resize Handle

Drag the divider between panes to adjust the split ratio.

### Scroll Sync

Both panes scroll together proportionally — scrolling the markdown editor scrolls the preview to the matching position, and vice versa.

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

## HMR Suppression

While a file is open in the editor, hot module replacement (HMR) is suppressed for that file. This prevents the page from reloading mid-edit when the auto-save writes to disk.

- Caches are still cleared on each save so the next full load picks up changes
- Other files not being edited still trigger normal HMR
- When you close the editor, a full reload is triggered to apply all changes

## How It Works

### Architecture

```
Browser (Dev Toolbar)                Vite Dev Server
┌───────────────────────┐           ┌────────────────────────┐
│ Full-screen overlay   │           │ Vite Middleware         │
│ ┌─────────┬─────────┐ │  fetch   │ POST /__editor/open    │
│ │ Raw MD  │ Preview │ │ ←──────→ │ POST /__editor/update  │
│ │ (edit)  │ (HTML)  │ │          │ POST /__editor/save    │
│ └─────────┴─────────┘ │          │ POST /__editor/close   │
└───────────────────────┘          │        ↓               │
                                   │ EditorStore (in-memory) │
                                   │        ↓ auto-save     │
                                   │ fs.writeFile (disk)     │
                                   └────────────────────────┘
```

### File Path Communication

The server embeds the content file path into the page as a `data-editor-path` attribute on the `<html>` element (dev mode only). The toolbar reads this to know which file to open. This attribute is stripped in production builds.

### API Endpoints

All endpoints are dev-only and handled by Vite middleware:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/__editor/open` | POST | Open a document — returns raw markdown and rendered HTML |
| `/__editor/update` | POST | Send updated content — returns re-rendered preview |
| `/__editor/save` | POST | Save current content to disk |
| `/__editor/close` | POST | Save and close — triggers page reload |
| `/__editor/styles` | GET | Returns combined CSS for preview styling |

### Source Files

| File | Purpose |
|------|---------|
| `src/dev-toolbar/editor-app.ts` | Client-side toolbar UI and editor overlay |
| `src/dev-toolbar/editor/server.ts` | In-memory document store (`EditorStore`) |
| `src/dev-toolbar/editor/middleware.ts` | HTTP endpoint handlers |
| `src/dev-toolbar/integration.ts` | Wires editor into the dev toolbar and Vite |
