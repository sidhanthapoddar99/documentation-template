---
author: claude
date: 2026-04-20
---

# Custom-tags doc removed from user-guide

Removed `user-guide/15_writing-content/04_custom-tags.md` on 2026-04-20. Renumbered `05_outline.md → 04_outline.md` to close the gap.

## Why

The custom-tag transformers (`<callout>`, `<tabs>`, `<collapsible>`) exist in code at `src/custom-tags/` but are **not wired into any parser pipeline** — no parser imports `createCustomTagsRegistry()` or adds it as a processor. The doc was describing intended behaviour that doesn't render today, which would mislead any author following it.

## Where the content lives now

Preserved verbatim at:

- `2026-04-20-custom-tags/notes/01_original-user-doc.md`

Known inaccuracies in the preserved copy (to fix on restore):

- Callout types list 4 — code has 5 (`note` missing from docs).
- Missing `title` attribute (overrides default heading).
- Missing `collapsible="true"` attribute (renders as `<details>`).

## What now references what

- User-guide `01_overview.md` carries a note pointing readers to `2026-04-20-custom-tags` for status.
- User-guide `02_markdown-basics.md` no longer links to a custom-tags section.
- Pipeline diagram in `01_overview.md` no longer lists "custom-tag expansion" under preprocessors.

## When to restore

Restore the user-guide page once `2026-04-19-knowledge-graph-and-wiki-links/subtasks/01_unified-pipeline-and-graph.md` wires the custom-tags registry into the unified pipeline. The restored page uses `2026-04-20-custom-tags/notes/01_original-user-doc.md` as the starting point, with the accuracy fixes above applied.

## Tracker impact

Progress tracker (`comments/001_user-guide.md`) updated:

- `04_custom-tags.md` row removed.
- `05_outline.md` → renumbered to `04_outline.md`.
