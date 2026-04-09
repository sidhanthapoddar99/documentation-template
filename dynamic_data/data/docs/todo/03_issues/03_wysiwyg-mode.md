---
title: "WYSIWYG Editing Mode"
description: Add a what-you-see-is-what-you-get editing mode alongside the raw markdown editor
sidebar_label: WYSIWYG Mode
---

# WYSIWYG Editing Mode

**Type:** Feature  
**Priority:** Medium  
**Component:** `src/dev-toolbar/editor-ui/`  
**Status:** Planned

---

## Problem

The current editor is a raw markdown editor with syntax highlighting. Users who are unfamiliar with markdown syntax (content writers, designers, non-technical stakeholders) struggle to write and format documentation. They have to learn markdown syntax and mentally translate between the raw markdown and the rendered preview.

## Proposed Solution

Add a WYSIWYG editing mode that renders markdown as rich text inline, allowing users to edit formatted content directly. The mode should be toggleable between raw markdown and WYSIWYG.

### Core Features

- **Rich text editing** - Bold, italic, headings, lists, links rendered inline as formatted text
- **Toolbar** - Formatting toolbar with buttons for common operations (B, I, H1-H3, link, image, list, code)
- **Mode toggle** - Switch between raw markdown and WYSIWYG with a keyboard shortcut or button
- **Markdown round-trip** - Edits in WYSIWYG produce clean markdown (no HTML artifacts)
- **Frontmatter handling** - Show frontmatter as a structured form or collapsible section, not raw YAML

### Candidate Libraries

| Library | Approach | Pros | Cons |
|---------|----------|------|------|
| ProseMirror | Schema-based rich text | Extensible, markdown round-trip | Complex setup |
| TipTap | ProseMirror wrapper | Easier API, good extensions | Larger bundle |
| Milkdown | Markdown-first WYSIWYG | Built for markdown editing | Smaller community |
| BlockNote | Block-based (Notion-like) | Modern UX, drag-and-drop blocks | Opinionated structure |

## Implementation Plan

1. **Library evaluation** - Prototype with top 2 candidates, evaluate markdown fidelity
2. **Schema design** - Map all supported markdown features (including custom tags like callouts, tabs) to editor nodes
3. **Yjs integration** - Wire the WYSIWYG editor's document model to the existing Yjs CRDT sync
4. **Mode switching** - Implement seamless toggle between raw and WYSIWYG without content loss
5. **Custom tag support** - Render custom tags (callouts, tabs, collapsible) as interactive blocks in WYSIWYG

## Risks

- Markdown round-trip fidelity (WYSIWYG editors often produce subtly different markdown)
- Custom tag rendering in WYSIWYG mode adds significant complexity
- Two editor modes doubles the surface area for bugs
- Bundle size increase from rich text editor library
