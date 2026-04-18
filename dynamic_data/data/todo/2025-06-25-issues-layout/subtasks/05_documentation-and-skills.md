---
title: "Documentation & skills"
done: false
---

Two recent architectural changes landed without end-user documentation: the **typography token contract** and the **issues content type**. `CLAUDE.md` covers both for AI collaborators; humans don't have a guide yet. Plus a Claude skill to teach the assistant how to navigate the issue tracker.

## User guide (`dynamic_data/data/user-guide/`)

- [ ] `20_themes/` — "Typography contract" page (3 UI tiers, 7 content tokens, 3 display tokens; rule: consume semantic, never primitive)
- [ ] `15_content/` (or top-level) — "Issue tracker" page: folder naming, `settings.json`, multi-file model (`issue.md` + `comments/` + `subtasks/` + `notes/` + `agent-log/`), filters & list view, `draft: true` flag
- [ ] Update any existing docs / screenshots that reference the old `todo/` folder layout

## Dev docs (`dynamic_data/data/dev-docs/`)

- [ ] `20_themes/` (or equivalent) — "Token layers" page (primitive / semantic split, why it exists, how to add a custom tier)
- [ ] `10_layouts/` — "Issues layout" page (first-class peer of docs / blog, `parts/` split pattern, `<script type="application/json">` config pattern, `:global()` gotcha for JS-rendered elements)
- [ ] `15_scripts/` (or similar) — brief note on the `loadIssues()` cache (mtime-summed signature, `invalidateIssuesCache()` escape hatch)

## Claude skill

- [ ] `.claude/skills/issues.md` — teach Claude how to traverse, read, and update the issue tracker (folder layout, frontmatter conventions, subtask checkbox endpoint)

## Done when

- `/user-guide` has a typography page and an issues-tracker page
- `/dev-docs` has token-layers, issues-layout, and cache pages
- `.claude/skills/issues.md` exists
- Cross-links: typography page → `src/styles/theme.yaml`; issues-layout page → the issues-restructure design note

## Out of scope

- Rewriting existing docs to reflect the new token contract — covered by the codebase-refactoring issue.
