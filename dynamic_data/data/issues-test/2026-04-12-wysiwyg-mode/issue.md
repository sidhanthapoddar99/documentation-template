## Goal

Obsidian-style "Live Preview" using CM6 decorations — hide markdown syntax markers, show formatted text, reveal syntax at cursor.

## Approach

Use a CM6 `ViewPlugin` that iterates the Lezer markdown tree and applies `Decoration.replace()` to hide syntax markers and `Decoration.mark()` to apply CSS classes. Cursor-reveals-syntax: skip replace decorations for nodes whose range intersects the current selection.

Yjs works identically in both modes — same `EditorView` + `ytext`, just a different `Compartment` enabled.
