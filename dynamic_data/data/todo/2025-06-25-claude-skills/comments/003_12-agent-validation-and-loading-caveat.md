---
author: claude
date: 2026-04-25
---

# Skill validation — 12-agent test (6 use cases × with/without)

## Aggregate results

| Test | with-skill | baseline | Winner |
|---|---|---|---|
| U1 closed phase-2 issues | 28.9s · 32.4k · 6 | 27.1s · 26.4k · 6 | tie |
| U2 grep `phase-3` in bodies | 38.2s · 35.8k · 10 | **30.3s · 25.1k · 7** | baseline |
| U3 config validation | **39.5s · 36.5k · 9** | 49.4s · 35.2k · 9 | skill |
| U4 docs convention audit | 21.9s · 31.8k · 5 | 20.6s · 28.3k · 3 | tie |
| U5 blog post plan | **29.4s · 26.0k · 3** | 48.3s · 30.5k · 12 | skill (big) |
| U6 single-issue summary | **28.2s · 33.6k · 7** | 36.4s · 29.3k · 7 | skill |
| **TOTAL** | **186.1s · 196.1k · 40 tools** | 212.1s · 174.8k · 44 tools | **skill** |

Skill **12% faster** overall, **9% fewer tool uses**, **12% more tokens**. **100% correctness on both sides** (12/12).

## Per-task pattern

| Task type | Skill verdict | Why |
|---|---|---|
| Multi-filter scripted query (U1, U6) | Skill wins or ties | Scripts collapse multi-step logic into one call |
| Free-text grep over bodies (U2) | **Baseline wins** | `grep` is `grep`; with-skill agent ran `list.mjs` first then grep — extra step |
| Schema-aware validation (U3) | Skill wins | Reference spells out required fields; baseline had to read `src/loaders/config.ts` to discover the schema |
| Cheap audit on small data (U4) | Tie | `find`/`ls` is fast; loading overhead dominates |
| Planning / orientation (U5) | Skill wins **big** (39% faster) | Stub `blog-layout.md` chained to `writing.md` — answer in 3 reads vs baseline's 4+ user-guide pages |
| End-to-end summary of one entity (U6) | Skill wins | `show.mjs` does the breakdown in one call |

## Important caveat — skill-loading overhead is per-invocation in this test

The "12% more tokens" cost (and the few cases where baseline wins on time) is largely **an artifact of the test harness**, not the skill itself.

Each agent in this test starts cold and reads SKILL.md (~250 lines, ~2.5k tokens) + 1–2 reference files (~5–10k tokens) **for each individual task**. In real-world usage, **the skill is loaded once per conversation and then sits in the prompt cache** — the loading cost amortizes across every subsequent task in that session.

In other words:
- **Per-task test (this one)** — every task pays the full ~10k-token loading cost up front
- **Real-world session** — 10 tasks share that ~10k cost → ~1k loading per task, far below baseline's per-task discovery cost (which has to re-discover the schema for each task)

To validate this, the next test bundles **10 tasks into a single agent** (with-skill + baseline). The expectation: the with-skill agent's **per-task** cost drops dramatically as the loading cost amortizes — and the absolute time + token win grows beyond the 12% measured here.

Results in the next comment.

## What this validates regardless of the per-task overhead

- ✅ **Skill activation 100%** — every with-skill agent read SKILL.md + the right reference (no triage misses)
- ✅ **Correctness 100% on both sides** (12/12)
- ✅ **Helper scripts produced the biggest single-task gains** — `review-queue.mjs`, `show.mjs`, `list.mjs`
- ✅ **Architecture pivot validated** — single umbrella skill outperformed baseline even with stub references for blog/docs/writing
- ⚠️ **One real gap exposed**: free-text body search (U2). Adding a `scripts/issues/grep.mjs <pattern> [--scope open,review]` would close it — promoted to a follow-up

## Real project findings (independently confirmed by test agents)

- `dynamic_data/data/user-guide/30_deployment/` and `35_plugins/` are missing `settings.json` (placeholder folders)
- `dynamic_data/config/site.yaml` page entry `issues-test` references `@data/issues-test`, but that folder doesn't exist (dangling testbed entry — should be deleted from `site.yaml` or recreated)
- 3 issues use `component: "components"` but the tracker vocabulary doesn't list `components` — needs vocab addition or per-issue fix
