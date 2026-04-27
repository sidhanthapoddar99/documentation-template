# Writing markdown content — reference

Cross-cutting rules for writing markdown content across all content types (docs, blog, issues, custom pages).

**Canonical source of truth:** the framework's bundled `@root/default-docs/data/user-guide/15_writing-content/` — read those pages when this reference is unclear.

> **Status:** stub. The detailed spec is being authored under `2025-06-25-claude-skills/subtasks/03_writing-skill.md`. For now, this file captures the essentials.

---

## Universal rules

- **Frontmatter `title` is required** on every `.md` file. Builds fail without it.
- **Description** is optional but recommended (used in meta tags + sidebar tooltips).
- **`draft: true`** hides the page from the production build. Works on docs, blog, issues.
- **Don't write MDX** — this project uses pure markdown (`.md`). Custom tags use a remark plugin, not MDX.

## Standard frontmatter

```yaml
---
title: "Page title"
description: "1-2 sentence summary used in <meta> + sidebar tooltips."
draft: false
---
```

Per-content-type extras:
- **docs** — `sidebar_label`, `sidebar_position`
- **blog** — `date` (YYYY-MM-DD), `author`, `tags`
- **issues** — see `issue-layout.md` (different schema, lives in `settings.json`)

## Custom tags

Project-specific markdown extensions live in `astro-doc-code/src/custom-tags/`. Common ones:

```markdown
:::callout{type="info"}
Body of the callout.
:::

:::collapsible{title="Click to expand"}
Hidden content.
:::

:::tabs
- tab: First
  content: ...
- tab: Second
  content: ...
:::
```

For the full list and syntax, read `@root/default-docs/data/user-guide/15_writing-content/` (and grep the framework's `astro-doc-code/src/custom-tags/`).

## Asset embedding

Images and downloadable files live under the project's `assets/` folder and are served from `/assets/`. Reference them with absolute paths:

```markdown
![Logo](/assets/logo.png)
[Download the spec](/assets/specs/api-v1.pdf)
```

## Code blocks

Triple-backtick with language tag for syntax highlighting:

````markdown
```typescript
const x: number = 42;
```
````

For long blocks, the `collapsible` custom tag wraps the block.

## Cross-content-type concerns

- **Drafts** — `draft: true` works on every type
- **Dev-only content** — see `@root/default-docs/data/user-guide/10_configuration/06_dev-mode.md`
- **`XX_` prefix** — used in docs/dev-docs folders (NOT in blog, NOT in issues)

## Cross-references

- `@root/default-docs/data/user-guide/15_writing-content/` (the framework's bundled user-guide) — full section
- `references/docs-layout.md` — docs-specific structure / settings
- `references/blog-layout.md` — blog-specific naming / frontmatter
- `references/issue-layout.md` — issue-specific structure
