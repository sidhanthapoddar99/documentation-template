---
title: "Virtualize the outline for docs with 100+ headings"
done: false
---

## Problem

The outline panel renders every heading as a DOM node. On docs with 300+
headings (rare but real — some generated API refs) it pushes layout recalc
into the red. Even with the rest of the editor fast, the outline flashes.

## Plan

Use a standard windowed list — `react-window` pattern but hand-rolled since
we're on vanilla TS here. Render only the headings overlapping the scroll
viewport ± 20 items of over-scroll.

- [ ] Abstract the outline node render behind a `renderRow(index)` signature
- [ ] Fixed row height — measure once, reuse (our heading rows are single-line)
- [ ] Add a resize observer on the outline container so we re-derive the
      visible window on panel resize
- [ ] Keep the active-heading scroll-spy working across the virtual window

## Open questions

- Do we ever need variable-height rows? (e.g. wrapped long headings) — if yes,
  switch to CSS `content-visibility: auto` which is simpler than a windowed list.
- Tree-mode outlines (nested by depth) — does the windowing still apply, or do
  we need to flatten first?

## Acceptance

- Docs with 500 headings render the outline in < 16ms
- Scrolling the outline stays at 60fps
- Active-heading highlight still updates as the reader scrolls the main pane
