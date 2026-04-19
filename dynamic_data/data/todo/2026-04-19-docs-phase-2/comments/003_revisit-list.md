---
author: claude
date: 2026-04-20
---

# Revisit list — 🟡 files

Files marked 🟡 in the progress tracker are functional today but depend on work that hasn't landed yet or catalogues that will drift. This comment tracks what each one needs on the next pass.

# When to tick 🟡 → ✅

Each file flips to ✅ once its full checklist above is cleared. Individual items can stay open even after the file ships — this is a living list, not a blocker.

# List of revisit items

## `05_getting-started/04_data-structure.md`

Cross-links into sections that don't exist yet in the restructured user-guide:

- [ ] `/user-guide/docs/overview` — lives in the new `25_docs/` section (not built yet).
- [ ] `/user-guide/blogs/overview` — new `30_blogs/` section.
- [ ] `/user-guide/issues/overview` — new `35_issues/` section.
- [ ] `/user-guide/custom/overview` — new `40_custom/` section.
- [ ] `/user-guide/themes/overview` — renumbered `45_themes/` section.
- [ ] `/user-guide/configuration/overview` — verify still resolves after the config-paths audit (`subtasks/04_config-paths-docs.md`).

Revisit once those sections land to confirm every link resolves.

## `05_getting-started/05_claude-skills.md`

The catalogue table is accurate today but will drift:

- [ ] Add a row for the planned `issues` skill once `.claude/skills/issues.md` ships (tracked via `subtasks/06_claude-skills-maintenance.md`).
- [ ] Keep the `Skill(...)` permissions block in sync with any new skills.
- [ ] Verify the `/issues/2026-04-19-docs-phase-2` link in the body resolves against the real issues base URL (currently `/todo/` in this project, not `/issues/`).

## `10_configuration/03_site/04_theme.md`

Kept intentionally thin — covers `theme` / `theme_paths` fields in `site.yaml` only, defers everything else to the full Themes section. Two dead pointers to clean up once that section lands:

- [ ] `/user-guide/themes/overview` (intro sentence) — verify the URL once the renumbered `45_themes/` section exists.
- [ ] Same pointer at the bottom of the page ("See Themes section for complete details…").

## `10_configuration/04_navbar.md` and `05_footer.md`

Both reference the dev-toolbar layout-switcher app. The prose-level reference is accurate today, but there's no stable destination URL yet. Things to add once those pages exist:

- [ ] `04_navbar.md` — link "Dev Toolbar Switching" paragraph to the dev-tools layout-switcher doc once it lands (per the plan: `/dev-docs/dev-toolkits/layout-switcher`).
- [ ] `05_footer.md` — same link, same target.
- [ ] Both: consider cross-linking from the navbar/footer authoring sections (whenever those get written in the user-guide) back to these config pages so authors can find the toggle from either direction.


