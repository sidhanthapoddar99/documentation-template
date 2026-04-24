---
author: claude
date: 2026-04-25
---

# Architecture pivot — single `documentation-guide` skill (status + plan)

## What changed (structure)

Decided to merge the 5 originally-planned skills into **one umbrella skill** at `.claude/skills/documentation-guide/` with per-domain reference files. This matches the skill-creator's "domain organization" pattern (one SKILL.md handles triage; per-domain content lives under `references/`).

**Why one skill, not five:**
- Single install + single description → better triggering coverage
- Progressive disclosure — only the relevant reference loads for a given task
- Shared infrastructure (universal conventions, `data/README.md` discipline) lives in `SKILL.md` once, not duplicated 5×
- Cross-cutting work ("add a section + write its first page") naturally pulls multiple references in one skill invocation
- One catalogue row in the user-guide instead of five

**Helper scripts moved into the skill folder.** The 8 `scripts/issues/*.mjs` helpers + shared `_lib.mjs` now live at `.claude/skills/documentation-guide/scripts/issues/`. Self-contained: when shipped via `download-skills.mjs`, the scripts ship with it. The `_lib.mjs` walks up from its own location looking for `dynamic_data/` so the scripts work whether the skill is installed project-local or user-level.

**Old skills deleted.** `.claude/skills/docs-guide/` and `.claude/skills/docs-settings/` are gone; `Skill(documentation-guide)` is in `.claude/settings.local.json` now.

## Current status (what's done)

- ✅ `SKILL.md` — triage table, project orientation, universal conventions, `data/README.md` discipline, helper-scripts pointer
- ✅ `references/issue-layout.md` — full reference (folder/file shape, vocabulary, 4-state lifecycle, AI rules, helper-scripts table, worked example)
- ✅ `references/settings-layout.md` — full reference (site.yaml, navbar.yaml, footer.yaml, paths, themes, worked example for adding a section)
- 🟡 `references/writing.md` — STUB (points at `user-guide/15_writing-content/`)
- 🟡 `references/docs-layout.md` — STUB (points at `user-guide/17_docs/`)
- 🟡 `references/blog-layout.md` — STUB (points at `user-guide/18_blogs/`)
- ✅ `scripts/issues/*.mjs` — 8 CLI tools + `_lib.mjs`; `bun`-or-`node`; path-allow-listed to `dynamic_data/`; surgical frontmatter / JSON mutators (preserves key order + formatting)
- ✅ `dynamic_data/data/README.md` — starter data layout map (every top-level folder + conventions + add-a-section walkthrough)

## Test results — 6 agents, 3 tests × with/without skill

| Test | with-skill | baseline | Verdict |
|---|---|---|---|
| A — review queue | 18.8s · 30.6k tok · 3 tools | 43.7s · 27.2k tok · 12 tools | Skill **2.3× faster, 4× fewer tool calls** (used `review-queue.mjs`) |
| B — add docs section | 55.1s · 34.9k tok · 8 tools | 47.6s · 25.8k tok · 9 tools | Baseline marginally faster — config files self-discoverable |
| C — convention audit | 82.5s · 53.9k tok · 24 tools | 100.7s · 49.1k tok · 21 tools | Skill faster; both correct (baseline found one extra debatable issue) |

**Aggregate:** skill 19% faster overall, 17% more tokens, 17% fewer tool calls. **Correctness 100% in all 6 runs.** Skill activation 100% (all with-skill agents read SKILL.md + appropriate reference).

## Improvement plan (priority order)

1. **Update the user-guide skill catalogue** — `05_getting-started/05_claude-skills.md` still lists `docs-guide` + `docs-settings`. Replace with single `documentation-guide` row + updated decision tree + Task→Skill table + permissions block + example prompts. Tracked under subtask 07.
2. **Update `download-skills.mjs` and `download-skills.sh`** — currently pull `docs-guide` + `docs-settings`; switch to `documentation-guide` and ensure they recursively pull `scripts/` (since helpers now live inside the skill). Tracked under subtask 07.
3. **Flesh out the 3 stub references** — `writing.md`, `docs-layout.md`, `blog-layout.md` are placeholders. Each needs the `issue-layout.md` / `settings-layout.md` treatment. Tracked under existing subtasks 03 / 04 / 05 (now stubs in the umbrella skill, not separate skills).
4. **Progressive disclosure for `settings-layout.md`** — it's ~400 lines (~9k tokens). Test B showed the loading cost cancels the skill's value when the config is self-discoverable. Split into `references/settings/{site,navbar,footer,pages}.md` so SKILL.md → `settings-layout.md` (~150 lines) → drill-down only when needed.
5. **Helper scripts for non-issue domains** — Test A's huge win came from `review-queue.mjs` doing the entire task in one call. Equivalents could exist: `blog/list.mjs --tag X`, `config/add-section.mjs <name>`, `docs/next-prefix.mjs <folder>`. Worth doing once the stub references are fleshed out — they'll surface the patterns worth scripting.

Items 1 + 2 are subtask 07 — starting on those next.
