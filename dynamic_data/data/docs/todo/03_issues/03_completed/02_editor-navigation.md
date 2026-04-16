---
title: "Editor Navigation and File Management"
description: Add Obsidian-style file tree navigation and folder configuration to the editor
sidebar_label: Editor Navigation
---

# Editor Navigation and File Management

**Type:** Feature  
**Priority:** Medium  
**Component:** `src/dev-toolbar/editor-app.ts`  
**Status:** Planned

---

## Problem

The current editor only opens a single file at a time, triggered by clicking "Edit Page" on the current page. There is no way to:

- Browse or navigate between files without leaving the editor
- Open multiple files or switch between them
- Configure folder settings (`settings.json`) from within the editor
- Create new files or folders
- Rearrange document order (change `XX_` prefixes)

This makes the editor useful for quick edits but not for sustained documentation work.

## Proposed Solution

Add an Obsidian-style sidebar to the editor overlay with a file tree, folder actions, and multi-file navigation.

### File Tree Sidebar

- **Tree view** of all documentation folders (`data/docs/`, `data/blog/`)
- Files displayed with their titles (from frontmatter), not raw filenames
- Current file highlighted in the tree
- Click to switch between files (open in the same editor pane)
- Collapsible folders matching the sidebar structure

### Folder Context Menu (Right-Click)

- **Edit `settings.json`** - Inline editor for folder label, collapsible state, ordering
- **New file** - Create a new markdown file with frontmatter template
- **New subfolder** - Create a new folder with `settings.json`
- **Rename** - Rename file/folder (updates `XX_` prefix)
- **Reorder** - Change sort order by adjusting `XX_` prefixes
- **Delete** - Remove file/folder with confirmation

### Tab System

- Open files appear as tabs above the editor
- Switch between open files without losing unsaved changes
- Each tab maintains its own Yjs sync connection
- Close tabs individually or close all

## Implementation Plan

1. **File tree component** - Build a tree view that reads from the content loader's folder structure
2. **API endpoints** - Add `/__editor/list`, `/__editor/create`, `/__editor/rename`, `/__editor/delete` endpoints
3. **Multi-file state** - Extend `EditorStore` and `YjsSync` to handle multiple open files per client
4. **Tab management** - Track open files, active file, and unsaved state per tab
5. **Context menu** - Implement right-click menu with folder/file actions
6. **Settings editor** - Inline JSON editor for `settings.json` with validation

## Risks

- Multi-file state management adds complexity to the Yjs sync layer
- File creation/deletion must trigger proper cache invalidation and HMR
- The `XX_` prefix reordering needs to rename files on disk atomically
- Sidebar width management on smaller screens
