---
title: "`docs:docs_layout` skill"
done: false
state: open
---

New skill covering the `docs` content type's file / folder / settings shape (not the markdown content itself — that's `docs:writing`).

## Scope

- Docs folder structure — nested sections, `XX_` prefixes, depth discipline
- Per-folder `settings.json` — label, position, collapsed, nav-hide
- Frontmatter fields specific to docs (`title`, `description`, `sidebar_label`, `sidebar_position`, `draft`)
- Sidebar generation model — which files appear, in what order, under what label
- Outline (right-rail) heading discipline — `##`/`###` vs `#`
- Cross-linking between docs pages (relative paths, `[link](../other-section/page)`)

## Relationship to other skills

- `docs:writing` — markdown / frontmatter basics that span all types
- `docs:docs_layout` — docs-specific folder, settings, sidebar

## Authoring notes

- Follow the pattern established by `02_issues-skill.md`.
- Needs namespace decision (see comment 001).
