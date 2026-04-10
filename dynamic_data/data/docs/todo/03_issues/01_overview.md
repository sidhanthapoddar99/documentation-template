---
title: "Editor V2 — Status"
description: What's done and what's left
sidebar_label: Status
---

## Editor

- [x] CM6 integration
  - [x] VS Code Dark+ syntax highlighting
  - [x] Nested code block highlighting
  - [x] Line numbers
  - [x] Word wrap toggle
  - [x] Source mode (color only, no bold/size)
- [ ] Formatting toolbar (source mode)
  - [ ] Bold, italic, link, code, list, quote, table buttons
  - [ ] Heading level picker
- [ ] Slash commands
  - [ ] /callout, /table, /code, /image, /link
  - [ ] Autocomplete popup in CM6
- [ ] Obsidian-style [[]] wiki links
  - [ ] Autocomplete file picker on [[
  - [ ] Resolve to actual page URLs
- [ ] Auto-save timer
- [ ] Keyboard shortcuts (Ctrl+B bold, etc.)
- [ ] Tab bar for multiple open files
- [ ] Embedding support
  - [ ] Embed other docs inline via ![[filename]]
  - [ ] Preview rendered embedded content
- [ ] Spell Check
- [ ] Split screen View or rather diff layouts for docs (opening multiple docs at a time)
- [ ] Drag and drop file upload into editor
- [ ] doc tabs with close buttons and drag to reorder
- [ ] Live Staus
- [ ] Sidebar primary providing options
- [ ] View only mode | Edit mode lock
- [ ] Secondary sidebar 
  - [ ] file explorer
  - [ ] settings
  - [ ] sync status and live users
  - [ ] ram and cpu usage
  - [ ] AI assistant 



## Sync

- [x] Yjs CRDT via WebSocket
  - [x] Content duplication bug fix (disposed flag)
  - [x] Consume-on-read counter (replaced setTimeout)
  - [x] Textarea readonly until sync completes
  - [x] Room idle eviction (30min, 0 connections)
  - [x] Stats endpoint (/__editor/stats)
- [ ] Live users display
  - [ ] Show active users in menubar with avatars/colors
  - [ ] Goto user cursor position on click
- [ ] Presence cursors in CM6
  - [ ] Remote cursor labels with user color
  - [ ] Remote selection highlights
- [ ] Sync testing
  - [ ] Multi-tab concurrent edit test
  - [ ] Reconnection after disconnect
  - [ ] Conflict resolution verification

## Explorer

- [x] File tree sidebar
  - [x] Text chevrons, indent lines, extension badges
  - [x] No icons, clean layout
  - [x] Auto-open from session / referrer
  - [x] Session persistence (survives HMR)
- [ ] Right-click context menu
- [ ] New file creator dialog
  - [ ] Auto XX_ prefix assignment
  - [ ] Frontmatter template
- [ ] New folder creator
- [ ] Rename file / folder
- [ ] Delete file / folder
- [ ] settings.json form editor per folder
- [ ] Frontmatter form editor per file

## Layout

- [x] Menu bar (File / Edit / View)
  - [x] Right-side status (save, user, theme, close)
  - [x] View modes: Source, Split, Preview
  - [x] Split vertical / horizontal
  - [x] WYSIWYG placeholder
- [x] Floating sidebar toggle
- [x] Resize handles (sidebar, preview)
- [x] Dark / light theme toggle
- [x] CSS moved to .css files
- [x] Scroll sync editor <-> preview
- [x] Close navigates to last edited file URL
- [x] Toolbar single-click to editor
- [ ] TOC view
  - [ ] Outline panel showing heading structure
  - [ ] Click to jump to heading in editor
- [ ] Preview split vertical option
  - [ ] Preview on right (current) or below editor
- [ ] RAM / CPU utilization viewer
  - [ ] Server-side metrics in menubar
  - [ ] Client-side memory usage

## Assets

- [ ] Asset manager (upload, delete, grid view)
- [ ] Drag-and-drop upload
- [ ] Inline image preview
- [ ] View code files directly (JS, TS, CSS etc. as assets)
  - [ ] Syntax highlighted read-only viewer
  - [ ] Edit non-markdown files in CM6

## Diagrams

- [ ] Mermaid diagram preview
  - [ ] Live render in preview pane
  - [ ] Syntax highlighting in source
- [ ] Graphviz / DOT rendering
  - [ ] Live preview for ```dot code blocks
- [ ] Excalidraw integration
  - [ ] .excalidraw file editing
  - [ ] Inline diagram editor

## WYSIWYG

- [ ] Real WYSIWYG mode (not placeholder)
  - [ ] Rich text editing with CM6 or ProseMirror
  - [ ] Inline formatting (bold, italic visible)
  - [ ] Block-level elements (headings, lists, tables)

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

## Editor Menu

- [ ] Doc switcher dropdown in menubar
  - [ ] Show all available doc roots (from navbar config)
  - [ ] Click to switch editor context to another doc

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

## Cleanup

- [ ] Delete v1 editor code after v2 is complete
  - [ ] Remove src/dev-toolbar/editor/ (old server)
  - [ ] Remove src/dev-toolbar/editor-ui/ (old client)
  - [ ] Remove src/dev-toolbar/editor-app.ts
  - [ ] Remove v1 config from integration.ts
- [ ] Delete old transition code after migration

## Documentation

- [ ] Update documentation engine docs
  - [ ] Architecture docs for v2 editor
  - [ ] Updated dev-docs reflecting new structure
- [ ] Update README.md
  - [ ] New setup instructions
  - [ ] Editor v2 usage guide

## Skills

- [ ] Improve documentation template skills
  - [ ] /docs-guide enhancements
  - [ ] /docs-settings enhancements
  - [ ] New skills for common workflows

## Search Option and integration
  - [ ] search global with fuzzy and dict corrections
  - [ ] RAG and AI based serach

## Bugs

- [x] Content duplication on long docs without scrolling
- [x] Zombie WebSocket reconnection after cleanup
- [x] Yjs sync fires too early (before content arrives)
- [x] CM6 doc length 0 despite ytext having content
- [x] Catch-all route crash on /editor
- [x] Preview not formatted (missing content CSS)
- [x] Sidebar collapse not working (inline style override)
- [x] Dark mode table alternate row coloring
- [x] Code blocks all green (missing codeLanguages)

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