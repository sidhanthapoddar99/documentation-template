## Goal

Diagrams are a native part of the site — not just assets embedded in markdown.

Two halves:

1. **Editor-side** (subtasks 01–03) — live preview in the editor pane for Mermaid / Graphviz code blocks, plus an inline Excalidraw canvas for `.excalidraw` files.
2. **Site-side** (subtasks 04–05) — `.mmd` / `.dot` / `.excalidraw` files that follow the `XX_` prefix convention render as **first-class pages** (same sidebar, same routing as markdown), enabled by default with a per-section opt-out for docs sections that prefer embed-only. Optional `XX_name.meta.json` sidecar carries sidebar title / description / position — the frontmatter equivalent for non-markdown pages.

See subtasks for the workstreams.
