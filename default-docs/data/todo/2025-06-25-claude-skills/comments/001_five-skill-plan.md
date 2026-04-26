---
author: claude
date: 2026-04-24
---

# Five-skill plan

Decided set — 5 skills under a `docs:` namespace:

| Skill | Status | Subtask |
|---|---|---|
| `docs:writing` | new (supersedes existing `docs-guide`) | `subtasks/03_writing-skill.md` |
| `docs:docs_layout` | new | `subtasks/04_docs-layout-skill.md` |
| `docs:issue_layout` | new (full spec already drafted) | `subtasks/02_issues-skill.md` |
| `docs:blog_layout` | new | `subtasks/05_blog-layout-skill.md` |
| `docs:settings_layout` | new (supersedes existing `docs-settings`) | `subtasks/06_settings-layout-skill.md` |

## Authoring order

Start with **`docs:issue_layout`** — the spec is already fully drafted in `subtasks/02_issues-skill.md` (lifted from the issues-layout issue and consolidated here).

Once the issue skill is shipped and the patterns (folder shape, `SKILL.md` contract, helper-scripts convention) are nailed down, the remaining four get authored against the same template.

## Open questions (resolve before authoring)

- **Namespace syntax** — `docs:<name>` matches Claude Code's `plugin:skill` invocation style. Are we shipping these as a plugin, or is the colon just a naming convention? Colons in filenames vary in support across OSes; the on-disk folder may need to be `docs-writing/` / `docs_writing/` even if the invocation is `/docs:writing`.
- **Supersession path** — `docs:writing` overlaps with existing `docs-guide`; `docs:settings_layout` overlaps with existing `docs-settings`. Decision needed: (a) rename + expand in place, or (b) ship new skills and deprecate the old ones.
- **"Layout" in the name** — four of the five skills use `_layout` (`docs_layout`, `issue_layout`, `blog_layout`, `settings_layout`). Intentional? The scope is broader than rendering layout — it's the content type as a whole (writing + folder structure + frontmatter + settings). Worth confirming the name reflects the scope, or picking a different suffix (e.g. `_guide`, `_content`).

See individual subtasks for per-skill scope.
