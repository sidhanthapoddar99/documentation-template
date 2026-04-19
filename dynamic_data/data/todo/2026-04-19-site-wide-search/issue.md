## Goal

A site-wide search that works across **docs, blog, and issues** — full-text, fuzzy, scopeable (global / section-local / filter-scoped), live-updating in a multi-user editable prod, with a graceful fallback for static builds.

Target corpus scale: **~15 MB of markdown / ~4,400 files** (current size × 20 headroom). Target concurrency: **small teams, 1–5 live editors + normal reader traffic, single-instance Node server**.

## Picked engine: Orama

After comparing MiniSearch / Pagefind / Meilisearch / Orama (see `notes/01_engine-analysis.md`), **Orama** wins for this project:

- Runs **in-process** with Astro — no sidecar binary, no Docker, no extra service.
- Updates are a function call on the save hook (sub-ms, not an HTTP POST).
- Native **fuzzy + prefix + BM25** ranking, filters, facets, synonyms.
- Supports **hybrid search** (keyword + vector) if we ever want "RAM" to match "memory" semantically — flag-flip, not a new system.
- Persistence via snapshot plugin; rebuildable from files on cold start.

Meilisearch stays a plausible future migration if we ever horizontally scale past a single app instance. Pagefind is kept as the static-build fallback.

## Scope

- Search the **titles + bodies + frontmatter** of docs, blog posts, issues, subtasks, notes, agent-logs.
- **Three scope modes** on every query: global, section-local (current content type only), filter-scoped (active facet filters applied first).
- Live-update the index on every save (editor + external file watch), debounced.
- Expose a **server-side `/api/search`** — never let the client talk to the engine directly (auth / scoping / swappability).
- Provide an **AI/agent-facing API or skill** so Claude Code / other agents can query the index directly.
- Advanced options: regex, field-restricted queries, fuzzy toggle.
- **Static-build fallback**: same UI, same endpoint shape, backed by Pagefind when there's no Node runtime.

## Non-goals (for this phase)

- Multi-instance / horizontally-scaled prod search. If we get there, Meili takes over.
- Full semantic / embedding-based search as the primary path. Hybrid mode stays opt-in.
- Cross-workspace / multi-site federated search.

See subtasks for the workstreams, and `notes/` for the architecture + scaling analysis that got us here.
