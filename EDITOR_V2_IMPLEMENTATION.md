# Editor V2: Obsidian-Style Editor — Implementation Plan

## Context

Replace the textarea-based editor with a full-featured Obsidian-style writing environment using CodeMirror 6 for canvas-based rendering, a file tree sidebar, slash commands, and asset management.

## Architecture

```
src/dev-toolbar/editor-v2/
  index.ts                    # Toolbar app entry point
  types.ts                    # Shared types (EditorV2Context, FileTreeNode, etc.)

  core/
    codemirror-setup.ts       # CM6 extensions, theme, keybindings
    codemirror-yjs.ts         # y-codemirror.next binding + awareness
    codemirror-languages.ts   # Lazy-loaded language extensions registry
    slash-commands.ts         # Slash command autocomplete extension

  layout/
    shell.ts                  # Full-screen overlay (header, sidebar, editor, preview)
    shell-styles.ts           # All CSS
    sidebar.ts                # File tree sidebar component
    header.ts                 # Header bar (tabs, save status, actions)
    preview-panel.ts          # Collapsible preview panel
    resize-handles.ts         # Drag handles for sidebar/preview widths

  file-tree/
    tree-data.ts              # Fetch + cache file tree from server
    tree-renderer.ts          # DOM rendering of tree nodes
    tree-actions.ts           # Create/rename/delete/reorder handlers + modals
    context-menu.ts           # Right-click context menu

  forms/
    frontmatter-form.ts       # Form-based frontmatter editor
    settings-form.ts          # settings.json editor
    form-fields.ts            # Reusable form components

  assets/
    asset-manager.ts          # Asset upload, preview, delete flows
    asset-upload.ts           # Drag-and-drop + file picker
    asset-grid.ts             # Grid display of images/files

  sync/
    yjs-client-v2.ts          # Yjs client for CM6 (reuses WS protocol)
    multi-file-state.ts       # Track multiple open files, active file, tabs
    save-manager.ts           # Save status, auto-save coordination

  util/
    lazy-import.ts            # Dynamic import wrapper with loading states
    prefix-utils.ts           # XX_ prefix parsing, next-prefix, reorder
    dom-helpers.ts            # createElement shortcuts, event delegation
```

## CodeMirror 6 Packages

### Eager (loaded with editor)
| Package | Purpose |
|---------|---------|
| `@codemirror/state` | Core state, transactions |
| `@codemirror/view` | EditorView, DOM rendering, virtual scrolling |
| `@codemirror/commands` | Default keybindings |
| `@codemirror/language` | Language infrastructure, folding |
| `@codemirror/autocomplete` | Slash command panel |
| `@codemirror/search` | Find/replace |
| `@codemirror/lang-markdown` | Markdown language mode |
| `@codemirror/theme-one-dark` | Dark theme base |
| `y-codemirror.next` | Yjs <-> CM6 binding, awareness cursors |

### Lazy (loaded per file type)
| Package | Extensions |
|---------|-----------|
| `@codemirror/lang-javascript` | .js, .ts, .jsx, .tsx |
| `@codemirror/lang-json` | .json, .excalidraw |
| `@codemirror/lang-css` | .css |
| `@codemirror/lang-html` | .html |
| `@codemirror/lang-python` | .py |
| `@codemirror/lang-yaml` | .yaml, .yml |

## Performance: Why CM6 is Faster

| Aspect | V1 (textarea) | V2 (CodeMirror 6) |
|--------|---------------|-------------------|
| Rendering | Full DOM for entire document | Virtual scrolling (~50 visible lines) |
| Highlighting | O(n) regex per keystroke | Incremental Lezer parser |
| Sync layers | 3 overlapping divs + scroll sync | Single rendering surface |
| Yjs binding | String diff (prefix/suffix) per keystroke | Direct transaction interception |
| Cursors | Mirror div + getBoundingClientRect | Awareness protocol (built-in) |
| Initial load | Immediate (textarea is native) | Lazy import (~150KB gzipped) |

## New Server Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/__editor/tree?root=<key>` | File tree for content directory |
| POST | `/__editor/file/create` | Create file with XX_ prefix + template |
| POST | `/__editor/file/rename` | Rename preserving prefix |
| POST | `/__editor/file/delete` | Delete with path validation |
| POST | `/__editor/file/reorder` | Change XX_ prefix |
| POST | `/__editor/asset/upload` | Multipart file upload |
| POST | `/__editor/asset/delete` | Delete asset |
| GET | `/__editor/asset/list?dir=<path>` | List assets |
| POST | `/__editor/settings/update` | Update folder settings.json |
| POST | `/__editor/frontmatter/update` | Update file frontmatter |

## Slash Commands

Triggered by `/` at line start. Inserts templates for:
- Headings (h1-h3), callouts (info/warning/tip), tabs, collapsible
- Code blocks (with language picker), tables, lists, task lists
- Images, links, mermaid diagrams, horizontal rules, frontmatter

## Implementation Phases

### Phase 1: Core CM6 Editor (current)
- CodeMirror setup with markdown, theme, Yjs binding
- Full-screen shell (no sidebar yet)
- Collapsible preview panel
- Save/close/status
- MSG_AWARENESS in yjs-sync.ts
- Feature flag: `editor.version: 2` in site.yaml

### Phase 2: File Tree + Sidebar
- Tree endpoint + renderer
- File/folder CRUD with prefix handling
- Context menu
- Multi-file state + tab switching

### Phase 3: Forms + Settings
- Frontmatter form editor
- settings.json form editor

### Phase 4: Slash Commands + Assets
- Slash command autocomplete
- Asset upload/delete/grid
- Lazy language loading for code files

### Phase 5: Polish + Testing
- Tab bar UI
- Keyboard shortcuts
- Edge case testing
- Memory leak audit
- Performance profiling

## Efficiency & Bug Prevention Checklist

### Memory
- [ ] Every EditorView is .destroy()-ed when switching files or closing
- [ ] Every Y.Doc is .destroy()-ed when closing a file
- [ ] Event listeners on document/window removed in cleanup
- [ ] disposed flag prevents zombie WS reconnects

### Race Conditions
- [ ] File CRUD operations serialized (no parallel stale-tree requests)
- [ ] Room creation idempotent (getOrCreateRoom pattern)
- [ ] No input before Yjs sync (CM6 readOnly compartment)
- [ ] Awareness messages don't echo back to sender

### Content Integrity
- [ ] Frontmatter form uses single CM6 transaction (atomic replace)
- [ ] File rename closes old Yjs room, opens new one
- [ ] Delete requires confirmation, folders require typing name

### UI Responsiveness
- [ ] Server requests have 10s timeout with error UI
- [ ] File tree shows skeleton during fetch
- [ ] Create/rename modals disable submit during request
- [ ] Preview innerHTML gated by content comparison

### Bundle Size
- [ ] CM6 core + markdown + yjs: ~150KB gzipped
- [ ] Languages lazy-loaded (10-30KB each)
- [ ] Editor bundle split from toolbar panel bundle

### Accessibility
- [ ] CM6 built-in ARIA support active
- [ ] File tree uses role="tree" / role="treeitem"
- [ ] Context menus keyboard-navigable
- [ ] Focus trap in modals

## Migration

- V1 and V2 coexist via `site.yaml → editor.version`
- Same server infra, same Yjs protocol + MSG_AWARENESS extension
- V1 clients ignore unknown MSG_AWARENESS messages
- Rollback: change version back to 1
