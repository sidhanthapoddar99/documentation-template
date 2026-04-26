---
title: "Scaling & system requirements — can one Node instance handle 1–5 editors?"
description: "Resource budget, concurrency analysis, and why a single-instance Node server is more than enough for small-team live editing."
sidebar_label: Scaling Analysis
---

# Scaling & system requirements

**TL;DR: a single modest Node server (≤1 GB RAM, 1–2 vCPUs) handles this workload with ~10× headroom.** Below is the math.

## Target workload

- **Corpus**: ~15 MB of markdown / ~4,400 files (current × 20).
- **Concurrent live editors**: 1–5, each editing via Yjs over WebSocket.
- **Reader traffic**: normal small-team CMS — let's say up to ~50 page-views / minute at peak.
- **Single Node process** hosting Astro SSR + Yjs server + Orama search + live-editor backend.

## Per-editor load

| Component | Per editor | 5 editors |
|---|---|---|
| Yjs WebSocket | 1 connection, 10–100 B / keystroke CRDT deltas | ~500 KB RAM + negligible CPU |
| Presence SSE | 1 connection, cursor pings every 100–500 ms | trivial |
| Save → parse → index | debounced ~500 ms, single-file reparse <10 ms + Orama `update(id, doc)` sub-ms | a few ms every few seconds |
| Search queries (editor sometimes searching) | <10 ms per query @ 15 MB index | trivial |

## Reader load

| Action | Cost |
|---|---|
| SSR a doc / blog / issue page | Astro-dependent, ~10–50 ms per page |
| Search query | <10 ms (Orama) |
| Static asset fetch | nginx / CDN tier, negligible |

At ~50 pageviews/min = <1 req/s average, nowhere near saturating a single Node process. Astro SSR starts to feel pressure in the hundreds of req/s range.

## Resource budget

| Bucket | Budget | Notes |
|---|---|---|
| Orama index (15 MB corpus) | ~50–80 MB RAM | Index is 2–4× raw text for fuzzy/prefix tables |
| Astro SSR + Yjs server | ~150–300 MB RAM | Typical Node + framework overhead |
| Yjs rooms × 5 editors | ~few MB | Y.Doc state stays small |
| OS + kernel | ~100 MB | |
| **Total resident** | **~500 MB** | Fits on a $5–10/month VPS |

CPU: save/index/search workloads are all <10 ms bursts. Sustained CPU dominated by SSR, which caps at probably 100 req/s on 1 vCPU — 2–3 orders of magnitude more than this workload needs.

## Why this scale is easy for a single instance

1. **Yjs deltas are tiny.** A keystroke is bytes. Even 5 editors typing fast together generate kilobytes/second, not megabytes/second.
2. **Orama is in-process.** No network hop, no serialization cost on update — just a function call. The "extra latency per save" is <1 ms.
3. **Reader traffic is the real cost**, but at small-team scale readers are few and cache-friendly.
4. **Search queries are dominated by index traversal time**, not I/O. 15 MB fits in L3/RAM easily.

## Where single-instance breaks down

This design is fine up to roughly:
- **~50 concurrent editors** (Yjs server becomes the bottleneck — one process managing that many rooms starts to matter).
- **~200–500 req/s sustained** (Astro SSR saturates one vCPU).
- **Zero-downtime deploy requirement** (can't do rolling restarts of a single instance without dropping connections).

Past any of those thresholds: split Yjs onto its own server, move search to Meilisearch, run app servers behind a load balancer. Not this phase's problem.

## Failure modes & mitigations

| Risk | Mitigation |
|---|---|
| Process crash drops all editors | `systemd` / `pm2` auto-restart + Yjs clients auto-reconnect |
| Y.Doc state lost on crash since last save | Persist Y.Doc updates (LevelDB-backed Yjs, 1 package); editors resume where they left off |
| Memory creep over weeks | Scheduled weekly restart; usually not needed |
| Orama snapshot corruption | Rebuild from files is safe + idempotent, ~seconds |
| Index drift (external file edits during server downtime) | On boot, mtime-check each file vs last-indexed; reindex deltas |

## Benchmark targets (for validation in subtask 02)

- Cold-start bulk index: <30 s for 4,400 docs on a $5 VPS.
- Per-save index update (debounced): <5 ms.
- Search query p95: <20 ms.
- Memory after 24 h with 5 editors + 10k searches: <600 MB resident.

If any of these slip by >2×, revisit the engine choice.

## One more consideration: the blog / CMS use case

If the project evolves into a multi-tenant blog platform with dozens of parallel editors across independent sites, the shape above no longer holds. That's a different product. This phase targets **small-team collaborative docs** (1–5 live editors), and at that scale the single-instance Orama story is clean.
