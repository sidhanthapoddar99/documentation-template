---
title: "Engine analysis — Orama vs Meilisearch vs Pagefind vs MiniSearch"
description: "Why Orama for this project, why Meilisearch is the escape hatch, why Pagefind is the static fallback."
sidebar_label: Engine Analysis
---

# Engine analysis

Context: we need search across ~15 MB of markdown (4,400 files at 20× current corpus), with **live edits in prod** via a Yjs-backed CMS, running on a **single Node instance** serving 1–5 concurrent editors + reader traffic.

## The candidates

| Engine | Deploy | Live updates | Fuzzy | Synonyms | Hybrid (kw+vec) | Scale ceiling | Note |
|---|---|---|---|---|---|---|---|
| **MiniSearch** | npm package | In-memory | Yes | Manual | No | ~10 MB before client payload hurts | Ships whole index to browser — fails at 15 MB |
| **Pagefind** | Build step | **No** (build-time only) | Yes | Via metadata | No | Huge (sharded) | Static sites only |
| **Meilisearch** | Binary / Docker sidecar | HTTP POST (~ms) | Yes (great defaults) | Yes | No | Millions | Adds a process. Shines for multi-instance prod |
| **Orama** | npm package, in-process | Function call (sub-ms) | Yes | Yes | **Yes (native)** | Hundreds of thousands in-mem | Younger ecosystem |

## Why not MiniSearch

Ships the entire index to every page-load. At 15 MB of raw text that's ~6–10 MB of index on the wire. Unacceptable for cold-start performance on slow networks. Fine for tiny sites; wrong for this one.

## Why not Pagefind (as primary)

Pagefind is great, but it's a **build-time** indexer. Live editing in prod means content changes constantly, not just on deploy. Pagefind's index would be stale between builds.

It IS the right fallback for static deploys (see subtask 09).

## Why not Meilisearch (for now)

Meili is excellent, but adds operational surface:
- A separate process to run, monitor, back up.
- An HTTP hop on every index update.
- RAM footprint ~200–300 MB idle (vs Orama's ~50–80 MB inside the existing Node process).

Meili pulls ahead **only when you horizontally scale**. With multiple app servers, Orama's per-process in-memory index becomes a distributed-state headache; Meili as a shared service fixes it cleanly.

**Escape hatch**: if we ever scale past a single app instance, swapping Orama → Meili behind the same `/api/search` endpoint is a contained change. Same query semantics, same result shape.

## Why Orama

At our scale + architecture:
- **No new process**. Import, init, done.
- **In-process updates** are function calls, not HTTP — zero network cost on every save.
- **Native fuzzy + prefix + BM25** out of the box.
- **Synonyms** via config, not a separate service.
- **Hybrid (keyword + vector)** native if we ever want semantic search for terms like "RAM" → "memory". Flag-flip, not a new system.
- Persistence via the `@orama/plugin-data-persistence` snapshot plugin; rebuildable from files on cold start.

### Honest caveats

- Orama is younger (~3 yrs) than Meili (~5 yrs). Core is solid but some corners (edge cases in persistence, very-large-index memory profiling) have less production mileage.
- Multi-instance is painful. If we ever need it, migrate.

At 15 MB corpus / 4.4k docs / single-instance / 1–5 editors — **Orama is comfortably inside its sweet spot**.

## Decision tree (for future-us)

```
Are we still single Node instance?
├── Yes → Orama
└── No → Are we building for a CDN/static host with no runtime?
         ├── Yes → Pagefind
         └── No (multi-instance app) → Meilisearch
```

Static-build target always uses Pagefind regardless of the above — see subtask 09.
