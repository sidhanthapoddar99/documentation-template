---
author: claude
date: 2026-04-20
---

# Revisit list — 🟡 files

Files marked 🟡 in the progress tracker are functional today but depend on work that hasn't landed yet or catalogues that will drift. This comment tracks what each one needs on the next pass.

# When to tick 🟡 → ✅

Each file flips to ✅ once its full checklist above is cleared. Individual items can stay open even after the file ships — this is a living list, not a blocker.

# List of revisit items

## `05_getting-started/04_data-structure.md` — ✅ cleared 2026-04-21

All target sections have shipped. Final pass resolved the stale `/user-guide/custom/overview` link (section actually shipped as `20_custom-pages/`, URL `/user-guide/custom-pages/overview`).

- [x] `/user-guide/docs/overview` → shipped at `17_docs/`
- [x] `/user-guide/blogs/overview` → shipped at `18_blogs/`
- [x] `/user-guide/issues/overview` → shipped at `19_issues/`
- [x] `/user-guide/custom-pages/overview` → shipped at `20_custom-pages/` (link updated on this page)
- [x] `/user-guide/themes/overview` → shipped at `25_themes/`
- [x] `/user-guide/configuration/overview` → still resolves at `10_configuration/`

## `05_getting-started/05_claude-skills.md` — still 🟡

- [x] ~~Verify the tracker link resolves against the project's actual base URL~~ — fixed 2026-04-21: `/issues/2026-04-19-docs-phase-2` → `/todo/2026-04-19-docs-phase-2` (project mounts its tracker at `/todo/`).
- [ ] Add a row for the planned `issues` skill once `.claude/skills/issues.md` ships (tracked via `subtasks/06_claude-skills-maintenance.md`).
- [ ] Keep the `Skill(...)` permissions block in sync with any new skills.

Stays 🟡 until `.claude/skills/issues.md` ships.

## `15_writing-content/03_asset-embedding.md` — still 🟡

Issues-section describes intended behaviour; the preprocessor wiring for issues doesn't exist yet. Marked with a "not implemented yet" note pointing to `2026-04-19-knowledge-graph-and-wiki-links/subtasks/01_unified-pipeline-and-graph.md`.

- [ ] When phase-3 subtask 01 wires asset-embed into `IssuesParser`, remove the "Not implemented yet" admonition.
- [ ] Also revisit at that point whether the `[[...]]` / `[[[...]]]` split (phase-3 syntax decision) changes the examples on this page — may need to split "wiki link" vs "embed" behaviours across the writing-content section.

## `10_configuration/03_site/04_theme.md` — ✅ cleared 2026-04-21

Both cross-links to `/user-guide/themes/overview` resolve now that `25_themes/` has shipped. No content change needed — just verified.

- [x] Intro sentence pointer to `/user-guide/themes/overview`
- [x] Closing "See Themes section for complete details…" pointer

## `10_configuration/04_navbar.md` and `05_footer.md` — still 🟡

Both reference the dev-toolbar layout-switcher app. The prose-level reference is accurate today, but there's no stable destination URL yet. Things to add once those pages exist:

- [ ] `04_navbar.md` — link "Dev Toolbar Switching" paragraph to the dev-tools layout-switcher doc once it lands (per the plan: `/dev-docs/dev-toolkits/layout-switcher`).
- [ ] `05_footer.md` — same link, same target.
- [ ] Both: consider cross-linking from the navbar/footer authoring sections (whenever those get written in the user-guide) back to these config pages so authors can find the toggle from either direction.

# Summary — 2026-04-21 pass

| File | Before | After | Notes |
|---|---|---|---|
| `05_getting-started/04_data-structure.md` | 🟡 | ✅ | All target sections landed; `/custom/` → `/custom-pages/` link fixed |
| `05_getting-started/05_claude-skills.md` | 🟡 | 🟡 | Tracker URL fixed; skill-row addition still pending |
| `15_writing-content/03_asset-embedding.md` | 🟡 | 🟡 | Phase-3 dependency unresolved |
| `10_configuration/03_site/04_theme.md` | 🟡 | ✅ | Both theme pointers confirmed resolving |
| `10_configuration/04_navbar.md` | 🟡 | 🟡 | Dev-docs layout-switcher page still pending |
| `10_configuration/05_footer.md` | 🟡 | 🟡 | Same |
