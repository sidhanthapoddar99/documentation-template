---
title: "Update user-guide skill catalogue + download-skills.{mjs,sh}"
done: false
state: open
---

After the architecture pivot to a single `documentation-guide` skill (see `comments/002_architecture-pivot-and-status.md`), two things need updating in lockstep so a fresh install via the public one-liner produces a working skill.

## 1. User-guide skill catalogue

`dynamic_data/data/user-guide/05_getting-started/05_claude-skills.md` currently lists `docs-guide` and `docs-settings` as separate skills. Replace those rows with a single `documentation-guide` row.

- [ ] **Skill catalogue table** — one row, four columns (Skill / Command / Use for / Triggers on)
- [ ] **Decision tree** — drop the "if both apply, start with /docs-settings then /docs-guide" branch; everything goes through `/documentation-guide` with the skill's internal triage
- [ ] **Task → Skill table** — every task maps to `documentation-guide` now (no more split between writing / configuring)
- [ ] **Installation permissions block** — replace `Skill(docs-guide)` + `Skill(docs-settings)` with `Skill(documentation-guide)` only
- [ ] **Example prompts** — keep the prompts but consolidate under one heading; add a few that exercise the issue-layout and settings-layout references specifically

## 2. `download-skills.mjs` and `download-skills.sh`

Currently download `docs-guide` and `docs-settings`. Switch to:

- [ ] Pull `documentation-guide` only (skill folder name)
- [ ] **Recursively** pull the skill's `references/` and `scripts/` subfolders (current scripts probably only pull `SKILL.md` + a flat reference set)
- [ ] Preserve executable permissions (the `.mjs` files have `#!/usr/bin/env bun` shebangs — chmod +x after download)
- [ ] If the scripts target a public GitHub raw URL, ensure the URL points at the right branch + path (`.claude/skills/documentation-guide/...`)

## Verification

A clean install via the one-liner should produce:
- `.claude/skills/documentation-guide/SKILL.md` exists
- `.claude/skills/documentation-guide/references/{writing,docs-layout,blog-layout,issue-layout,settings-layout}.md` (5 files) exist
- `.claude/skills/documentation-guide/scripts/issues/{_lib,list,show,subtasks,agent-logs,set-state,add-comment,add-agent-log,review-queue}.mjs` (9 files) exist
- `bun .claude/skills/documentation-guide/scripts/issues/list.mjs --help` runs without error
- `.claude/settings.local.json` (if it exists) shows `Skill(documentation-guide)` in the allow list

## Done when

- The user-guide page accurately reflects the single-skill catalogue
- A fresh install via the one-liner produces a working skill with scripts
- A new user can run `bun .claude/skills/documentation-guide/scripts/issues/list.mjs --help` immediately after install

## See also

- `comments/002_architecture-pivot-and-status.md` — full context for the pivot
- `comments/001_five-skill-plan.md` — original 5-skill plan (now superseded)
- `subtasks/02_issues-skill.md` — issue skill spec (now in review)
- `subtasks/06_settings-layout-skill.md` — settings skill spec (now in review)
