---
title: "Profile cold-load and record baseline"
done: true
---

## Why

We kept hearing "the editor feels slow" without numbers. No baseline, no way to tell if any fix actually moved the needle.

## What I did

Ran the Chrome perf trace on a fresh load against three representative docs:

| Doc | Size | Cold TTI | Main-thread busy |
|---|---|---|---|
| `user-guide/index.md` | 4 KB | 180ms | 90ms |
| `dev-docs/architecture.md` | 42 KB | 410ms | 260ms |
| `blog/performance-notes.md` | 412 KB | 1.9s | 1.4s |

Traces committed under `agent-log/001_initial-triage.md`.

## Takeaway

Cold load scales ~linearly with file size because the full AST is rebuilt on
mount. Anything over ~150KB is user-visible jank. That's the line we need to
beat.

## Acceptance

- [x] Baseline numbers recorded
- [x] Three representative docs profiled
- [x] Shared with the team in `agent-log/`
