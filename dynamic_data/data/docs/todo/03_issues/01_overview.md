---
title: "Editor V2 — Status"
description: What's done and what's left
sidebar_label: Status
---

## Migration plan

Map H2 = issue, top-level bullet under it = subtask. All `milestone: phase-2` unless noted.

### Created

| Issue                                                                            | Subtasks | Component   | Status      |
|----------------------------------------------------------------------------------|---------:|-------------|-------------|
| [editor-core](/todo-migration/2025-06-25-editor-core)                            | 13       | live-editor | in-progress |
| [editor-advanced](/todo-migration/2025-06-25-editor-advanced)                    | 8        | live-editor | open        |
| [editor-sidebars](/todo-migration/2025-06-25-editor-sidebars)                    | 4        | live-editor | open        |
| [sync-and-presence](/todo-migration/2025-06-25-sync-and-presence)                | 3        | live-editor | in-progress |
| [true-wysiwyg](/todo-migration/2025-06-25-true-wysiwyg)                          | —        | live-editor | open (low)  |

Editor menu (doc switcher), menubar & view modes, chrome toggles, TOC view, asset manager, v1 cleanup, editor v2 documentation, and resolved historical bugs are subtasks under **editor-core**.

Preview split vertical and RAM / CPU viewer are subtasks under **editor-advanced**.

### Pending

| # | Issue                              | Subtasks | Component   | Status      | Notes                                                                                |
|---|------------------------------------|---------:|-------------|-------------|--------------------------------------------------------------------------------------|
| 1 | File explorer                      | 7        | live-editor | in-progress | tree ✓ — left: context menu, new file, new folder, rename, delete, form editors      |
| 2 | Diagram preview (in editor)        | 3        | live-editor | open        | Mermaid / Graphviz / Excalidraw inside editor pane                                   |
| 3 | Canvas rendering research          | 1        | live-editor | done        | Researched ✓; revisit when viable libs emerge                                        |
| 4 | Issues tracker layout              | 7        | layouts     | in-progress | per your instruction — under `layouts`, phase-2                                      |
| 5 | Global URL prefix                  | 1        | loaders     | open        | `app.com/docs/...` configurable in `site.yaml`                                       |
| 6 | Editor security (future)           | 2        | infra       | open (low)  | password / OAuth, access codes                                                       |
| 7 | Editor server management (future)  | 1        | infra       | open (low)  | PM2, health endpoint, graceful shutdown                                              |

### Folded into existing issues (no new issue needed)

| Source section   | → existing issue                                                            |
|------------------|-----------------------------------------------------------------------------|
| Skills           | `2025-06-25-claude-skills` (add subtasks)                                   |
| Search & RAG     | `2025-06-25-plugin-system` → existing `02_search` subtask + AI subtask      |
| Deployment skill | `2025-06-25-deployment` (add a subtask for the skill itself)                |

### Open questions

1. Security + Server management — merge into one "Editor server hardening (future)" issue?
2. Should "Issues tracker layout" subtasks also include the **Phase 2 Issues Tracker** items already in the new framework (vocabulary, multi-file, etc.) — or only the parts still open?

---

> **Migrated to issues:** Editor section → [editor-core](/todo-migration/2025-06-25-editor-core),
> [editor-advanced](/todo-migration/2025-06-25-editor-advanced),
> [editor-sidebars](/todo-migration/2025-06-25-editor-sidebars).

## Explorer

- [x] File tree sidebar
  - [x] Text chevrons, indent lines, extension badges
  - [x] No icons, clean layout
  - [x] Auto-open from session / referrer
  - [x] Session persistence (survives HMR)
- [ ] <span style="color: #e55561"> Right-click context menu</span> — <span style="color: #e55561">built, needs testing</span>
- [ ] <span style="color: #e55561">New file creator dialog</span>
  - [ ] <span style="color: #e55561">Auto XX_ prefix assignment</span>
  - [ ] <span style="color: #e55561">Frontmatter template</span>
- [ ] <span style="color: #e55561">New folder creator</span>
- [ ] <span style="color: #e55561">Rename file / folder</span>
- [ ] <span style="color: #e55561">Delete file / folder</span>
- [ ] settings.json form editor per folder
- [ ] Frontmatter form editor per file

## Diagrams

- [ ] Mermaid diagram preview
  - [ ] Live render in preview pane
  - [ ] Syntax highlighting in source
- [ ] Graphviz / DOT rendering
  - [ ] Live preview for ```dot code blocks
- [ ] Excalidraw integration
  - [ ] .excalidraw file editing
  - [ ] Inline diagram editor

## Canvas Rendering

- [ ] Replace DOM with canvas rendering
  - [x] Researched — no production-ready solution exists
  - [x] Google Docs uses DOM as source of truth
  - [x] Decision: stay with CM6 for now
  - [ ] Revisit when viable libraries emerge

## Issues Layout

- [ ] GitHub-style issue tracker layout
  - [ ] Markdown files as issues with extended frontmatter
  - [ ] Frontmatter fields: status, date, tags, priority, assignee
  - [ ] Index page with filterable/sortable list view
  - [ ] Filter by status (open/closed), priority, tags
  - [ ] Sort by date, priority
  - [ ] Badge/label rendering for status and priority
  - [ ] Individual issue page with full markdown body

## Config

- [ ] Global prefix for all docs and pages
  - [ ] e.g. all routes under /docs (app.com/docs/...)
  - [ ] Configurable in site.yaml

## Deployment

- [ ] Skill for deployment setup
  - [ ] Docker Compose with nginx config
  - [ ] Nginx routing: app.com/ -> main app, app.com/docs -> static docs build
  - [ ] Skill explains how to add nginx config or use docker-compose
  - [ ] this would cover both case where we use routing
    - [ ] like `app.com/docs`
      - [ ] single nginx serving multiple sources (1 nginx docker container)
      - [ ] multipe ningx with a routing (more than 1 ningx container)
    - [ ] use `docs.app.com` seperate nginx run
  - [ ] Skills to create sepecific docs like and the structure for
    - [ ] issue docs
    - [ ] tech docs
    - [ ] temp docs
    - [ ] todos
    - [ ] blogs
    - [ ] custom pages
    - [ ] countdowns
    - [ ] home pages
    - [ ] docs for ai and ralphloop
    - [ ] idea dump docs
- [ ] Static build output for docs

## Skills

- [ ] Improve documentation template skills
  - [ ] /docs-guide enhancements
  - [ ] /docs-settings enhancements
  - [ ] New skills for common workflows

## Search Option and integration
  - [ ] search global with fuzzy and dict corrections
  - [ ] RAG and AI based serach

---

# Future Options

## Security
- [ ] Authentication for editor access
  - [ ] Simple password protection
  - [ ] Optional OAuth integration (GitHub, Google)
- [ ] Access Code based invite system
  - [ ] Generate single-use access codes for collaborators
  - [ ] Code entry form on editor load

## Better Server Management and server mode | instead of just static rendering this becomese an editor server that can be used in multiple ways
- [ ] Process manager for editor server (PM2 or similar)
- [ ] Auto-restart on crash
- [ ] Graceful shutdown handling (close WebSocket connections, save state)
- [ ] Health check endpoint for monitoring
