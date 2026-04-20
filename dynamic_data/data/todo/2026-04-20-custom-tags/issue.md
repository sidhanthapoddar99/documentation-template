## Goal

Make custom tags (`<callout>`, `<tabs>`, `<collapsible>`, and author-defined tags) a real, documented, tested feature of the markdown pipeline. Today they are infrastructure-without-wiring: the transformers exist in code but nothing renders them; the user-guide page describing them was removed on 2026-04-20 because it was lying about what worked.

## Current state

| Thing | Status |
|-------|--------|
| Transformer code (`<callout>` with 5 types, `<tabs>` / `<tab>`, `<collapsible>`) | ✅ Implemented in `src/custom-tags/` |
| Registry infrastructure (`TagTransformerRegistry`, `createCustomTagsRegistry()`) | ✅ Implemented in `src/parsers/transformers/registry.ts` + `src/custom-tags/index.ts` |
| Wired into any parser pipeline | ❌ Never wired — no parser imports `createCustomTagsRegistry()` or adds it as a processor |
| User-guide doc | 🔴 Removed on 2026-04-20 (see `2026-04-19-docs-phase-2/comments/004_custom-tags-removed.md`); original copy preserved in `notes/01_original-user-doc.md` |
| Component showcase / live examples | ❌ Never built (was scoped under `2025-06-25-components/subtasks/03_components-library.md`, now partially ticked) |
| Theme testing across light/dark | ❌ Never tested |
| Author-defined tag design (registering your own) | ❌ Registry supports it, no documented workflow |

## Concerns

1. **Wiring is orphaned.** `createCustomTagsRegistry()` returns a registry but nothing calls `.createProcessor()` and adds it to a parser pipeline. The fix belongs in the phase-3 engine restructure — see `2026-04-19-knowledge-graph-and-wiki-links/subtasks/01_unified-pipeline-and-graph.md`. Do not re-implement the wiring here; track the hand-off.

2. **Callout types drifted from code.** The removed doc listed 4 types (`info`, `warning`, `danger`, `tip`). Code supports 5 — `note` is missing from docs. Also missing: the `title` attribute (overrides default heading) and `collapsible="true"` (renders as `<details>`).

3. **No showcase surface.** Even once wired, authors have no page to see them rendered. The components-library subtask covers this but is still open.

4. **No theme validation.** Callout variants use colour tokens; need explicit light/dark verification once wired.

5. **Author-defined tags are undocumented.** The registry supports `register({ tag, transform })` but there's no guidance on where user tag definitions should live, how they're discovered, or how they interact with the built-ins.

## Scope

- Wiring: **out of scope** (handed off to phase-3 subtask 01). Tracked here only as a dependency.
- Documentation restoration: once wiring lands, restore the user-guide page using `notes/01_original-user-doc.md` as the starting point, with the accuracy fixes noted under Concerns #2.
- Showcase page: implement once wiring lands. Lives in the components-library subtask of `2025-06-25-components/`.
- Theme validation: after showcase exists.
- Author-defined tags: design how users register their own tags (config file? auto-discovered module? site.yaml entry?). New subtask to be created when the above ship.

## Dependencies

- **Hard**: `2026-04-19-knowledge-graph-and-wiki-links/subtasks/01_unified-pipeline-and-graph.md` — wires the registry into the parser pipeline. Nothing in this issue renders until that lands.
- **Related**: `2025-06-25-components/subtasks/03_components-library.md` — partially ticked on 2026-04-20 for the callout / tabs / accordion items that correspond to the transformers in this issue.

## Non-goals

- Moving the transformer code. It stays at `src/custom-tags/`.
- Adding more built-in tags in v1 (callout / tabs / collapsible cover the current need).
- Graph / search integration — separate issues.

## Subtasks

- `01_components-library.md` — Absorbed from `2025-06-25-components/subtasks/03_components-library.md`. Covers Cards (callout) / Tabs / Accordion (collapsible) — ticked because the transformer code exists — plus Badges / Buttons / showcase page / live-examples / theme testing (still open).

To be created once wiring lands:

- Restore + refresh the user-guide doc (`15_writing-content/04_custom-tags.md` or equivalent) with correct types + attributes.
- Author-defined tag registration workflow — design + docs.
