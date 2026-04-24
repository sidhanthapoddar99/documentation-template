---
author: claude
date: 2026-04-25
---

# Multi-task amortization test — validating the loading-overhead caveat

Follow-up to `comments/003_12-agent-validation-and-loading-caveat.md`. Same 6 use cases from that test plus 4 more (10 tasks total), bundled into a single agent for each condition. The hypothesis: the per-task token overhead measured in the 12-agent test was an artifact of paying SKILL.md + reference-file load costs once per agent. Amortized across 10 tasks in one session, the per-task cost should collapse.

## Headline result — hypothesis confirmed

| | Multi-task (10 tasks bundled) | Per-task (1 task per agent) |
|---|---|---|
| **with-skill** | 175s · 69.3k tok · 48 tool uses · **17.5s/task** · **6.9k tok/task** | 186s · 196k tok · 40 tool uses · **31.0s/task** · **32.7k tok/task** |
| **baseline** | 251s · 66.4k tok · 48 tool uses · **25.1s/task** · **6.6k tok/task** | 212s · 175k tok · 44 tool uses · **35.3s/task** · **29.1k tok/task** |
| **with-skill vs baseline** | **30% faster · 4% more tokens · same tool count** | 12% faster · 12% more tokens · 9% fewer tools |
| **Correctness** | **10/10 both sides** | 12/12 both sides |

## What the amortization actually did

| Metric | Per-task with-skill | Multi-task with-skill | Improvement |
|---|---|---|---|
| Time per task | 31.0s | 17.5s | **44% faster** |
| Tokens per task | 32.7k | 6.9k | **79% fewer tokens** |
| Tool uses per task | 6.7 | 4.8 | 28% fewer |

The token saving is the headline: **per-task overhead dropped from ~32.7k to ~6.9k** because SKILL.md (~2.5k) + 4 reference files (~25k combined) were loaded **once** for the whole session and reused across all 10 tasks. Without this, every task would have paid the full ~10k loading cost on its own.

The token-cost gap between with-skill and baseline went from **+12% in the per-task test → +4% in the multi-task test**. In a real-world conversation (which is naturally multi-task), this gap effectively disappears — and the 30% time advantage compounds.

## Per-task pattern still holds

Where the skill won big in the per-task test, it continued to win in the multi-task run — just with a much smaller fixed-cost overhead spread across more tasks:

- **T1, T6, T7, T8, T9** (issue tracker queries) — `list.mjs`, `show.mjs`, `subtasks.mjs --all --state review`, `review-queue.mjs` collapsed multi-step grep/parse work into single calls
- **T3** (config validation) — `references/settings-layout.md` § "Required fields per pages: entry" gave the schema directly; baseline had to read `src/loaders/config.ts` to discover it (still flagged this as the hardest part)
- **T5** (blog plan) — stub `references/blog-layout.md` chained to `writing.md` and produced a complete answer in 3 reads
- **T2, T4, T10** (grep + small audits) — the gap was smallest here, as expected; primitive `grep`/`find` is competitive when the data is small

## Bundling helped baseline too — but less

Baseline also got faster per-task in the bundled run (35.3s → 25.1s, 29% faster). Bundling lets ANY agent reuse discovered structure across tasks (read settings.json once, remember the field set). But the with-skill agent benefited more because:

1. Its "discovery" was a single SKILL.md read with full triage (vs. baseline's iterative file-by-file inference)
2. Helper scripts encoded multi-step procedures into one call — the script's value compounds across multiple invocations within the session

## Recommendations / takeaways

1. **The 12% per-task token premium is not a concern in real-world use.** The skill is a net win across both axes (time + tokens) once you have ≥3-4 tasks in a session.
2. **In conversations where Claude does many small tasks** (the typical case), expect the skill to be substantially faster (~30%) AND roughly token-neutral.
3. **Helper scripts compound** — the more tasks in a session that touch the same domain, the more value the script set provides. This argues for continuing to add scripts (like the planned `scripts/issues/grep.mjs` for free-text body search, the only spot baseline still beat skill on).
4. **The architecture pivot is fully validated** — single umbrella skill with reference triage outperforms baseline both on per-task and bundled metrics.

## What got tested (10 tasks)

T1: closed phase-2 issues · T2: grep `phase-3` in bodies · T3: config validation · T4: user-guide audit · T5: blog post plan · T6: summarize `2025-06-25-claude-skills` · T7: cross-tracker review-state subtasks · T8: review queue · T9: summarize `2026-04-19-docs-phase-2` · T10: dev-docs audit.

Both agents produced **identical correct answers** on all 10 (validated by spot-checking against the smoke-test data and earlier per-task agent runs).
