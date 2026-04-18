---
title: "Excalidraw Integration"
description: Add Excalidraw canvas for viewing and editing diagrams within documentation
sidebar_label: Excalidraw Integration
---

# Excalidraw Integration

**Type:** Feature  
**Priority:** Low  
**Component:** `src/dev-toolbar/`, `src/custom-tags/`  
**Status:** Planned

---

## Problem

Documentation often needs diagrams - architecture overviews, flowcharts, sequence diagrams, data models. Currently, diagrams must be created externally, exported as images, and embedded as static files. This creates friction:

- Diagrams go stale as the architecture changes
- No way to quickly sketch ideas inline while writing docs
- Image files bloat the repo
- Editing requires the original diagram source file and tool

## Proposed Solution

Integrate Excalidraw as both a **custom tag for rendering** and an **editor mode for creating/editing** diagrams directly in the documentation.

### Rendering: Custom Tag

Add an `:::excalidraw` custom tag that renders `.excalidraw` JSON files as SVG inline in documentation pages.

```markdown
:::excalidraw{src="architecture.excalidraw"}
:::
```

- Renders the Excalidraw scene as inline SVG (no iframe)
- Supports light/dark mode theming
- Responsive sizing with optional width/height attributes
- Click-to-zoom for detailed diagrams

### Editing: Canvas Mode

Add an Excalidraw canvas mode to the dev toolbar editor for creating and editing `.excalidraw` files.

- **New canvas** - Create a new `.excalidraw` file from the editor
- **Edit existing** - Open `.excalidraw` files in the Excalidraw editor
- **Live preview** - See the diagram rendered in the preview pane while editing
- **Collaborative** - Wire Excalidraw's collaboration to the existing Yjs CRDT sync (Excalidraw natively supports Yjs)
- **Export** - Export diagrams as SVG or PNG for use outside the docs

### File Storage

- `.excalidraw` files stored alongside markdown files in content directories
- Or in a dedicated `assets/diagrams/` folder
- JSON format (Excalidraw's native format) for version control friendliness

## Implementation Plan

1. **Custom tag** - Create `:::excalidraw` tag that reads `.excalidraw` files and renders as SVG
2. **Excalidraw editor** - Embed `@excalidraw/excalidraw` React component in the editor overlay
3. **Yjs integration** - Connect Excalidraw's built-in Yjs provider to the existing `YjsSync` rooms
4. **File management** - Support creating, saving, and organizing `.excalidraw` files
5. **Theme sync** - Pass the site's light/dark mode to the Excalidraw canvas

## Risks

- Excalidraw is a React component; this project uses Astro (need an Astro-React island or standalone embed)
- Bundle size: Excalidraw is ~500KB+ gzipped
- SVG rendering at build time requires a headless Excalidraw renderer
- Collaborative editing on canvas objects is more complex than text CRDT
