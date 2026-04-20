## Goal

Turn the documentation corpus into a **URL-native knowledge graph**. Every `.md` file and every asset in the data directory gets a canonical URL at build time — references become URL lookups, not filesystem-relative path resolution. Renames and moves are first-class events: while the dev server is running, the graph stays live and auto-rewrites inbound references in source files so nothing silently breaks.

This is an **engine restructure**, not a bolt-on. It collapses today's per-parser path resolvers (docs-relative, blog-central, issue-folder) and the `contentType === 'docs'` gate in the internal-links postprocessor into one unified pipeline backed by a shared URL registry.

> The original layered scope (universal link resolution / wiki links / graph indexer / surfaces) lives in `notes/01_original-layered-scope.md` — it remains the canonical conceptual map for the work.

## Why engine, not bolt-on

Three current realities pushed the scope toward a restructure rather than incremental add-ons:

1. **Three different path resolvers.** `DocsParser` uses file-relative paths, `BlogParser` uses a central `assets/<slug>/` convention, `IssuesParser` uses folder-relative — three mental models for the same authoring problem.
2. **`contentType === 'docs'` gate in `internal-links.ts:53`.** Relative `.md` links only resolve for docs; every other content type lands on broken filesystem paths.
3. **Custom-tags registry (`src/custom-tags/`) is wired nowhere.** `<callout>`, `<tabs>`, `<collapsible>` are infrastructure-without-wiring across all parsers. Asset-embed is wired into docs + blog but skipped for issues (`IssuesParser` has `getAssetPath()` but no preprocessor registration).

Each of these looks fixable in isolation, but the root cause is shared: every parser owns its own pipeline wiring with no common source of truth for references. Replacing that with one unified pipeline + registry fixes all three at once.

## Syntax split

| Syntax | Meaning | Rendered as |
|--------|---------|-------------|
| `[[target]]` | **Wiki link** — a reference. Author navigates to the target. | `<a href="…">` |
| `[[[target]]]` | **Embedding** — inline the target's content where it sits. | `<img>` / `<code>` / expanded text |
| `\[[target]]` / `\[[[target]]]` | Escaped — renders literal. | Plain text |

Deliberately chose `[[[]]]` (triple bracket) for embeds rather than overloading `[[]]` with mode-switching on target type. Keeps the intent visible at the author surface — you can tell from the syntax whether you're linking or inlining, no need to know the target's MIME type.

`target` resolves against the registry in this order:

1. Exact slug / URL match
2. Exact filename match (`foo.md`, `diagram.png`)
3. Exact title match (from frontmatter)
4. Case-insensitive title match
5. Fuzzy match (threshold configurable)
6. Optional namespace shortcut: `[[user-guide:themes/tokens]]`, `[[issues:2026-04-10-issues-layout]]`

## URL model

- **URL = slug.** No opaque IDs. Paths look like `/user-guide/getting-started/overview`, `/issues/2026-04-19-docs-phase-2`, `/user-guide/getting-started/assets/diagram.png`.
- **Every file gets a URL**, including assets (images, excalidraw, code snippets, YAML data files).
- **Exception:** `settings.json` files (folder settings + issue metadata) are internal — they drive loading, they aren't addressable.
- **Also excluded:** `.env`, root `site.yaml` / `navbar.yaml` / `footer.yaml` — system configuration, not content.

## Autorewrite

- **Dev server running:** file rename/move triggers a graph query for inbound references, which get rewritten in-place in source markdown. Debounced (500 ms). Coordinated with the Yjs editor — if the referring file is open, the rewrite flows through the Yjs document rather than racing the write.
- **Headless build:** registry rebuilds from scratch; missing targets surface as broken-link warnings. No auto-rewrite in headless mode — renames must be resolved during development.

## Dependencies

- **Hard**: `2026-04-19-docs-phase-2` (docs IA restructure). Broken-link reports are false positives while the IA is mid-flux; start this after phase-2 lands.
- **Soft**: `2026-04-19-site-wide-search` (Orama index) — shared indexing pass is an optimisation, not a blocker.

## Open questions

1. **Asset URL shape:** content-adjacent (`/<base>/<slug>/assets/foo.png`) or shared namespace (`/_assets/<kind>/<hash>`)? Content-adjacent keeps the "asset belongs to its page" mental model but couples URLs to content structure. Leaning content-adjacent.
2. **Autorewrite batching:** debounce file events (500 ms) or run on every change? Favouring debounce.
3. **External-edit detection:** compete with Yjs for writes, or queue rewrites for the next idle moment? Probably queue.
4. **Cross-content-type wiki links:** global namespace by default, with `namespace:target` as optional disambiguator.

## Non-goals

- Full-text search — owned by `2026-04-19-site-wide-search`.
- Semantic / vector link suggestion — resolution stays deterministic.
- Graph visualization UI — flat list surface covers v1.
- Historical graph diff — current state only.
- Auto-create missing pages from broken `[[links]]` — warn, don't scaffold.
- Opaque-URL / UUID addressing mode — URL is always the slug.

## Subtasks

See `subtasks/01_…` through `07_…` for concrete workstreams:

1. Standardize the parser pipeline + graph indexer + cache + queries
2. URL registry — every file and asset (except `settings.json`) gets one
3. Autoconvert shorthand → URLs in the pipeline; autorewrite references on file change
4. Update user-guide + migration note
5. Update dev-docs (architecture + parser + graph)
6. Update Claude skills (authors + agent-queryable graph APIs)
7. Surfaces — backlinks cards + graph dev-tools app
