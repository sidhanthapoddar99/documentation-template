# Editor V2 — Performance Optimizations

The editor is well-architected and mostly well-optimized for a dev-only tool, but a review found several concrete wins.

## High-impact

- Viewport-restrict live-preview decorations — `buildLivePreviewDecorations` iterates the full syntax tree on every selection change. Switch to iterating only `view.visibleRanges`.
- Debounce `onContentChange` in Yjs sync ~50–100ms so rapid typing doesn't stringify the whole document per keystroke.
- Cache combined preview CSS — currently reads 5 CSS files from disk on every `/__editor/styles` request.

## Medium-impact

- Skip the decoration sort when possible — Lezer iterates in document order already.
- Cache cursor line numbers in `buildLivePreviewDecorations` to avoid calling `doc.lineAt` up to 3× per node.
- Replace `treeReadyPlugin` polling with `ensureSyntaxTree` / `forceParsing` events.

## Recommended order

If only three land: viewport-restrict decorations, debounce content change, cache preview CSS.
