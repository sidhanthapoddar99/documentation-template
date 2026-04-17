# Canvas Rendering — Design Notes

## Approach

Use an `OffscreenCanvas` per viewport slice. Render plain text + inline-syntax tokens through a custom text shaper that mirrors CM6's decoration model but outputs glyph runs instead of DOM nodes.

## Open problems

- **Accessibility:** text-to-speech and screen readers rely on the DOM. We'd need to mirror the canvas content into an offscreen ARIA layer, which defeats much of the performance win.
- **Text selection:** canvas has no native selection model. We'd ship our own selection renderer (rectangles + caret) and re-implement double/triple click, drag selection, keyboard selection.
- **Code syntax colouring:** the existing CM6 syntax tree is fine; we just need to walk it and emit glyph runs with the right style tokens.

## Decision

Parked — the engineering cost is large and the win only materializes on 10k+ line docs. Revisit if a user actually hits the ceiling.
