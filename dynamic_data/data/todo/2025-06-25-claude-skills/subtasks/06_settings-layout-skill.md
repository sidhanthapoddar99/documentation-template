---
title: "`docs:settings_layout` skill"
done: false
state: open
---

Site-level configuration skill. Supersedes / expands the existing `docs-settings`. Covers everything *above* the per-content-type layer — the site chrome, routing, theming, aliases.

## Scope

- `site.yaml` — all fields (site metadata, paths, theme, base, server, editor, page definitions)
- `navbar.yaml` — items, dropdowns, icons, external links, theme toggle
- `footer.yaml` — columns, bottom row, compact variants
- `.env` — runtime environment vars (dev vs prod, API keys)
- Path aliases — `@docs`, `@blog`, `@issues`, `@data`, `@assets`, `@themes`, plus user-defined
- Theme selection — `theme:` field, `theme_paths:` discovery, extends chain
- Adding a new section — wiring a content-type into the right layout + section label
- Custom page definitions — `pages:` block in `site.yaml`

## Out of scope

- Per-content-type structure — handled by `docs:docs_layout`, `docs:blog_layout`, `docs:issue_layout`
- Writing markdown — handled by `docs:writing`
- Creating a whole new layout — if we later add a `/layout-builder` skill, that's separate

## Relationship to existing skills

Supersedes `docs-settings`. Decision pending (see `comments/001_five-skill-plan.md`): rename + expand in place, or deprecate and replace.

## Authoring notes

- Follow the pattern established by `02_issues-skill.md`.
- Needs namespace + supersession decisions (see comment 001).
