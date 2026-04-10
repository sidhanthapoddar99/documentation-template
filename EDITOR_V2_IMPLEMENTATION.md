# Editor V2: Obsidian-Style Editor — Implementation Plan

## Research Conclusions

### Canvas Rendering: Not Viable
No production-ready canvas text editor exists for web. Google Docs uses canvas as a paint layer but keeps DOM as source of truth (IME, accessibility require DOM). Building a custom canvas editor would take months. **Decision: Use CodeMirror 6 (DOM-based) with polished theming.**

### CodeMirror 6 over Monaco
- Obsidian uses CodeMirror 6 — we're emulating Obsidian
- 124KB vs 2.4MB bundle (20x smaller)
- Vite-native (no plugin needed), Monaco requires vite-plugin-monaco-editor
- y-codemirror.next more mature than y-monaco
- Fully customizable theming via `EditorView.theme()`

### Theme: Pure Black/White, No Tint
- Dark: `#0a0a0a` bg, `#ffffff` text, `#333` borders
- Light: `#ffffff` bg, `#1a1a1a` text, `#e5e5e5` borders
- Syntax: Muted colors only — no neon, no blue/purple tint in chrome
- Icons: Lucide (minimalist SVG, stroke-based, 16px)

---

## Architecture

```
src/dev-toolbar/editor-v2/
  editor-page.ts              # Page-based entry point (mounted from /editor?root=...)
  index.ts                    # Dev toolbar button (navigates to /editor?root=...)
  types.ts                    # Shared types

  core/
    editor-setup.ts           # CM6 config, extensions, keybindings
    editor-yjs.ts             # y-codemirror.next binding + awareness
    editor-languages.ts       # Lazy-loaded language extensions
    editor-theme.ts           # Pure black/white theme (dark + light)
    slash-commands.ts          # / command autocomplete

  layout/
    shell.ts                  # Full-page shell (menubar, sidebar, editor, preview)
    shell-styles.ts           # All CSS — minimal, no tint
    menubar.ts                # Top menu bar (File, Edit, View)
    toolbar.ts                # Editor formatting toolbar
    sidebar.ts                # Collapsible sidebar container
    preview-panel.ts          # Collapsible preview
    resize-handles.ts         # Drag handles
    modal.ts                  # Reusable modal component
    icons.ts                  # Lucide SVG icon registry

  file-tree/
    tree-data.ts              # Fetch tree from /__editor/tree
    tree-renderer.ts          # DOM rendering with Lucide icons
    tree-actions.ts           # CRUD operations (create, rename, delete, reorder)
    context-menu.ts           # Right-click menu

  forms/
    frontmatter-form.ts       # Form-based frontmatter editor
    settings-form.ts          # Folder settings.json editor
    form-fields.ts            # Input components

  sync/
    yjs-client-v2.ts          # Yjs WS client + awareness
    save-manager.ts           # Auto-save, save status, dirty tracking

  util/
    prefix-utils.ts           # XX_ prefix parsing/formatting
    dom-helpers.ts            # Element creation, fetch helpers

src/pages/
  editor.astro                # /editor?root=dev-docs page route
```

---

## Implementation Phases

### Phase 1: Theme & Core Polish (fix what's broken)
**Goal:** Editor opens, looks polished, file loads correctly.

1. **Pure black/white CM6 theme** (`editor-theme.ts`)
   - Dark: `#0a0a0a` bg, `#ffffff` text, `#1a1a1a` gutters, `#333` borders
   - Light: `#ffffff` bg, `#1a1a1a` text, `#fafafa` gutters, `#e5e5e5` borders
   - Muted syntax colors (strings: `#a8cc8c`, keywords: `#d4bfff`, comments: `#666`)
   - Custom scrollbars: 6px, `#333` thumb dark / `#ccc` thumb light
   - Code blocks: proper background contrast
   - Selection: subtle `rgba(255,255,255,0.1)` dark / `rgba(0,0,0,0.08)` light

2. **Auto-open current file** from referrer URL
   - Read `document.referrer` on mount
   - Match referrer path to a file in the tree
   - Open that file automatically

3. **Fix file tree loading** — ensure `/__editor/tree` endpoint works from the page context

4. **Light/dark mode switcher** — toggle button in header, persisted in localStorage

5. **Lucide SVG icons** (`icons.ts`) — inline SVG for file, folder, markdown, image, settings, code, chevron, plus, trash, save, x, sun, moon

### Phase 2: File Explorer & Context Menu
**Goal:** Full file management from the sidebar.

1. **Collapsible sidebar** — toggle button to show/hide
2. **Right-click context menu** — New File, New Folder, Rename, Delete, Edit Settings
3. **Create file dialog** — name input, auto XX_ prefix, frontmatter template
4. **Create folder dialog** — name input, auto settings.json
5. **Delete with confirmation** — modal with file name, warns about references
6. **Rename** — inline rename or modal
7. **Folder settings form** — label, collapsible, collapsed (from settings.json)
8. **Frontmatter form** — title, description, sidebar_label (form above editor)

### Phase 3: Menu Bar, Toolbar & Editor Features
**Goal:** Full editing capabilities.

1. **Menu bar** — File (New, Save, Close), Edit (Undo, Redo, Find), View (Preview, Explorer, Theme)
2. **Editor toolbar** — Bold, Italic, Heading, Link, Image, Code, List, Quote, Table buttons
3. **Slash commands** — `/heading`, `/callout`, `/tabs`, `/code`, `/table`, `/mermaid`, etc.
4. **Auto-save** — timer-based, configurable interval, status indicator with animation
5. **Keyboard shortcuts** — Ctrl+S save, Ctrl+B bold, Ctrl+I italic, Ctrl+K link, Ctrl+/ comment

### Phase 4: Collaboration & Multi-file
**Goal:** Production-quality collaborative editing.

1. **Presence/ping** — SSE stream, active users list with colored badges
2. **Remote cursors** — via y-codemirror.next awareness (already supported)
3. **Tab bar** — open multiple files, switch between them, unsaved indicators
4. **Preview scroll sync** — proportional scroll between editor and preview
5. **Preview content CSS** — load same markdown styles as doc pages
6. **Diagram rendering** — mermaid/graphviz in preview

### Phase 5: Asset Management & Advanced
**Goal:** Complete content management.

1. **Asset browser** — grid view of images/files in assets folder
2. **Upload** — drag-and-drop on editor or sidebar upload button
3. **Delete assets** — with confirmation
4. **Insert asset** — click asset to insert markdown reference at cursor
5. **Code file editing** — lazy-loaded language modes (JS, TS, JSON, YAML, CSS, HTML, Python)
6. **Excalidraw** — view/edit .excalidraw files (future, needs React island)

---

## Theme Spec

### Dark Mode
```
Background:       #0a0a0a
Surface:          #111111
Gutters:          #111111
Borders:          #222222
Text:             #e0e0e0
Text muted:       #666666
Selection:        rgba(255,255,255,0.08)
Cursor:           #ffffff
Active line:      rgba(255,255,255,0.03)
Scrollbar thumb:  #333333
Scrollbar track:  transparent

Syntax:
  Comment:        #555555
  String:         #a8cc8c
  Keyword:        #d4bfff
  Function:       #e0e0e0
  Number:         #f0c674
  Operator:       #888888
  Tag/Heading:    #e0e0e0 bold
  Link:           #7aa2f7
  Code span:      #a8cc8c
  Frontmatter:    #555555
```

### Light Mode
```
Background:       #ffffff
Surface:          #fafafa
Gutters:          #fafafa
Borders:          #e5e5e5
Text:             #1a1a1a
Text muted:       #999999
Selection:        rgba(0,0,0,0.06)
Cursor:           #000000
Active line:      rgba(0,0,0,0.02)
Scrollbar thumb:  #cccccc
Scrollbar track:  transparent

Syntax:
  Comment:        #999999
  String:         #2e7d32
  Keyword:        #7b1fa2
  Function:       #1a1a1a
  Number:         #e65100
  Operator:       #666666
  Tag/Heading:    #1a1a1a bold
  Link:           #1565c0
  Code span:      #2e7d32
  Frontmatter:    #999999
```

---

## Lucide Icons Needed

| Use | Icon Name | Context |
|-----|-----------|---------|
| Markdown file | `file-text` | File tree |
| Generic file | `file` | File tree |
| Folder closed | `folder` | File tree |
| Folder open | `folder-open` | File tree |
| Image file | `image` | File tree |
| Settings/JSON | `settings` | File tree |
| Code file | `file-code` | File tree |
| Chevron right | `chevron-right` | Tree expand/collapse |
| Plus | `plus` | New file/folder |
| Trash | `trash-2` | Delete |
| Edit/Rename | `pencil` | Rename |
| Save | `save` | Header/toolbar |
| Close | `x` | Header |
| Sun | `sun` | Light mode |
| Moon | `moon` | Dark mode |
| Search | `search` | Find |
| Bold | `bold` | Toolbar |
| Italic | `italic` | Toolbar |
| Heading | `heading` | Toolbar |
| Link | `link` | Toolbar |
| Image insert | `image-plus` | Toolbar |
| Code | `code` | Toolbar |
| List | `list` | Toolbar |
| Quote | `quote` | Toolbar |
| Table | `table` | Toolbar |
| Undo | `undo` | Menu |
| Redo | `redo` | Menu |
| Menu | `menu` | Sidebar toggle |
| Eye | `eye` | Preview toggle |
| Eye off | `eye-off` | Preview hidden |
| Upload | `upload` | Asset upload |
| Sidebar | `panel-left` | Sidebar toggle |

---

## Server Endpoints (existing + new)

### Existing (keep as-is)
- `POST /__editor/open` — Open document + Yjs room
- `POST /__editor/save` — Save to disk
- `POST /__editor/close` — Close document + destroy room
- `POST /__editor/presence` — Presence actions
- `GET  /__editor/events` — SSE presence stream
- `GET  /__editor/stats` — Debug stats
- `GET  /__editor/styles` — Content CSS for preview
- `WS   /__editor/yjs` — Yjs sync + awareness

### New (to implement)
- `GET  /__editor/tree?root=<path>` — File tree (already added)
- `POST /__editor/file/create` — Create file with template
- `POST /__editor/file/rename` — Rename file/folder
- `POST /__editor/file/delete` — Delete with validation
- `POST /__editor/file/reorder` — Change XX_ prefix
- `POST /__editor/asset/upload` — Multipart upload
- `POST /__editor/asset/delete` — Delete asset
- `POST /__editor/settings/update` — Update folder settings.json
- `POST /__editor/frontmatter/update` — Update frontmatter fields

---

## Efficiency & Bug Prevention Checklist

### Memory
- [ ] Every EditorView .destroy()-ed on file switch/close
- [ ] Every Y.Doc .destroy()-ed on file close
- [ ] Event listeners removed in cleanup
- [ ] disposed flag prevents zombie WS reconnects
- [ ] File tree listeners cleaned up on re-render

### Race Conditions
- [ ] File CRUD operations serialized
- [ ] Room creation idempotent
- [ ] No input before Yjs sync (readOnly until synced)
- [ ] Auto-save uses counter-based consumeEditorSave

### Content Integrity
- [ ] Frontmatter form uses single atomic transaction
- [ ] File rename closes old room, opens new
- [ ] Delete requires confirmation
- [ ] XX_ prefix changes don't collide

### UI Responsiveness
- [ ] Server requests have 10s timeout with error UI
- [ ] File tree shows skeleton during fetch
- [ ] Loading states for lazy modules
- [ ] Preview innerHTML gated by content comparison

### Accessibility
- [ ] File tree: role="tree", role="treeitem", aria-expanded
- [ ] Modals: focus trap, Escape to close
- [ ] Theme: respects prefers-color-scheme initially
- [ ] Keyboard navigation in context menus

### Performance
- [ ] CM6 virtual scrolling (built-in)
- [ ] Incremental Lezer parsing (built-in)
- [ ] Languages lazy-loaded per file type
- [ ] File tree cached with 2s TTL
- [ ] Preview render debounced 500ms
