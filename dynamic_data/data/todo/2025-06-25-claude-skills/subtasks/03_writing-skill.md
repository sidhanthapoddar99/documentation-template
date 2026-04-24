---
title: "`docs:writing` skill"
done: false
state: open
---

Cross-cutting authoring skill that covers markdown content itself, independent of content type. Supersedes / expands the existing `docs-guide`.

## Scope

- Markdown basics — syntax, code blocks, tables, links, lists
- Frontmatter essentials — `title`, `description`, `draft`, per-type fields
- Custom tags — callouts, tabs, collapsible, code blocks (the lot that lives under `src/custom-tags/`)
- Asset embedding — images, code snippets, diagrams (when the diagram-as-page work lands)
- Cross-content concerns — `XX_` prefix, per-folder `settings.json` for sidebar labels, draft flags, dev-only content

## Relationship to existing skills

Supersedes `docs-guide`. Decision pending (see `comments/001_five-skill-plan.md`): rename + expand in place, or deprecate and replace.

## Relationship to other new skills

`docs:writing` covers the markdown + frontmatter **basics that span all content types**. The type-specific skills (`docs_layout`, `blog_layout`, `issue_layout`) cover the file / folder / settings shape *for that type*.

## Authoring notes

- Pattern / file shape should follow `02_issues-skill.md` once that lands.
- Needs the namespace + supersession decisions resolved first (see comment 001).
