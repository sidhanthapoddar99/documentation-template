## Goal

Turn the documentation corpus into a **browsable, queryable knowledge graph** — three layers of work, each useful on its own, collectively unlocking the docs-as-AI-memory story.

1. **Universal relative-link resolution.** The internal-links postprocessor currently only rewrites `XX_` prefixes and resolves relative `.md` links for `contentType === 'docs'` (see `src/parsers/postprocessors/internal-links.ts:53`). Extend resolution to every content type — docs, blog, issues, custom — and support cross-content-type relative links (an issue linking to a user-guide page, a blog post linking to an issue, etc.).
2. **`[[wiki-link]]` syntax.** A shortcut for cross-referencing without typing full URLs. `[[Theme tokens]]` resolves against the global page index by title / slug / filename. `[[Theme tokens|tokens]]` uses a display alias. Ambiguous or broken links render with a warning surfaced in the error-logger dev tool.
3. **Knowledge-graph indexer.** For every page, store outbound + inbound links. Powers backlinks panels, orphan detection, broken-link reports, and an agent-queryable graph API.

## Why now

Phase-2 (`2026-04-19-docs-phase-2`) settles the IA — the right moment to build on top of it. Once pages are in their final homes, authors (human and AI) will want three things:

- **Cross-reference without typing URLs** — `[[page]]` is faster than remembering the full path and catches typos via fuzzy match.
- **See what points here before renaming** — a backlinks panel means renaming a page doesn't silently break the rest of the corpus.
- **Find orphans** — pages nobody links to are either missing from the IA or ready to be deleted. The graph makes them visible.

And it makes the project *actually useful as an AI memory system*. An agent asking "what references the theme-token contract before I change it?" gets a structured graph answer, not a full-text grep.

## Scope

### Layer 1 — Universal link resolution

- Drop the `contentType === 'docs'` gate in `internal-links.ts`. Rewrite relative `.md` / `.mdx` links for all content types.
- Cross-content-type links: a relative path in an issue's markdown that crosses into `/user-guide/` should resolve to the absolute URL, not land on the filesystem path.
- Keep fragment identifiers (`#heading`) intact.
- Preserve the existing behaviour for docs (XX_ stripping, `/index` suffix removal) — just generalise it.
- Tests: one per content-type + one cross-type matrix.

### Layer 2 — Wiki links

- New pre-processor (or remark plugin) that parses `[[target]]` and `[[target|display]]` in markdown bodies.
- Resolution order against the global page index:
  1. Exact slug / filename match
  2. Exact title match (from frontmatter)
  3. Case-insensitive title match
  4. Fuzzy match (Levenshtein or similar, threshold configurable)
- Namespace shortcut syntax: `[[issues:2026-04-10-issues-layout]]`, `[[user-guide:themes/tokens]]`.
- Ambiguous match → pick closest + emit warning (surfaces in the error-logger dev tool).
- Unresolved → render as broken-link style text + emit warning.
- Opt-out escape: `\[[not a wiki link]]` renders as literal `[[...]]`.

### Layer 3 — Graph builder + queries

- Indexer pass that walks every rendered page's final HTML, extracts all internal hrefs, stores `(source_path, target_path, link_text)` tuples.
- Reverse index for backlinks (`target → [source, source, ...]`).
- Persistence strategy: in-memory, rebuilt on mtime invalidation via the unified `cache-manager`. Optional on-disk snapshot for cold-start warmth.
- **APIs** (exposed under `/api/graph/*`):
  - `GET /api/graph/backlinks/:path` — pages linking *to* `:path`
  - `GET /api/graph/outlinks/:path` — pages linked *from* `:path`
  - `GET /api/graph/orphans` — pages with zero inbound links
  - `GET /api/graph/broken` — links whose target doesn't exist
  - `GET /api/graph/stats` — totals for the dev-tool surface

### Layer 4 — Surfaces

- **Backlinks card** on detail pages (docs / blog / issues). Shows "Referenced by N pages" with an expandable list. Collapsible sidebar component, lives alongside the TOC / outline.
- **Dev-tools app** — new toolbar entry following the system-metrics / cache-inspector pattern. Summary of orphans + broken links on the current page + whole-site totals.
- **Claude skill update** — document the graph APIs so agents can query pre-rename: "what references `theme-tokens` before I rename it?"

## Non-goals

- Full-text search — lives in `2026-04-19-site-wide-search` (they can share index infrastructure later, but each owns its own structure in v1).
- Semantic / vector link suggestion — keep resolution deterministic (slug / title / fuzzy-string) in v1. Embeddings are a later opt-in.
- Graph visualization UI (D3 / Obsidian-style graph) — a flat list surface is enough for v1. Revisit if demand materialises.
- Historical graph (diff between git revisions) — current state only.
- Auto-creating missing pages from broken `[[links]]` — warn, don't silently scaffold.

## Dependencies

- **Hard**: `2026-04-19-docs-phase-2` (docs IA restructure). Broken-link reports are false positives while the IA is mid-flux; start this after phase-2 lands.
- **Soft**: `2026-04-19-site-wide-search` (Orama index) — shared indexing pass is an optimisation, not a blocker.

## Open questions

1. Should `[[wiki-links]]` work across the dev-docs ↔ user-guide boundary, or be namespaced by content type by default? (Currently favouring: global namespace, with `namespace:target` as an optional disambiguator.)
2. Is the graph dev-tools app its own toolbar app, or a tab inside cache-inspector? (Favouring standalone — different mental model.)
3. Backlinks card: collapsible section inside the existing outline, or a new sidebar region? (Favouring inside outline — same chrome weight.)

See subtasks (to be added) for concrete workstreams.
