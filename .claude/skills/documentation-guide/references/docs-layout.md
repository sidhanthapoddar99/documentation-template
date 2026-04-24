# Docs content type — reference

How to add, organise, and configure pages in a docs section (e.g. `user-guide/`, `dev-docs/`).

**Canonical source of truth:** `dynamic_data/data/user-guide/17_docs/` — read those pages when this reference is unclear.

> **Status:** stub. Detailed spec under `2025-06-25-claude-skills/subtasks/04_docs-layout-skill.md`. For now, this file captures the essentials.

---

## Folder structure

A docs section is a folder under `dynamic_data/data/<section>/`. Both files and subfolders use a 2-digit `XX_` prefix for ordering:

```
user-guide/
├── settings.json                        ← required: section label, position
├── 05_getting-started/
│   ├── settings.json                    ← subfolder label, position, collapsed
│   ├── 01_overview.md
│   ├── 02_installation.md
│   └── 03_aliases.md
├── 10_configuration/
│   ├── settings.json
│   ├── 01_overview.md
│   └── 03_site/
│       ├── settings.json
│       └── ...
└── ...
```

**Prefixes are 01-99.** They control sidebar order. Re-prefix to insert (e.g. squeeze `06_foo.md` between `05_x.md` and `10_y.md`).

## Per-folder `settings.json`

Required in every docs folder. Minimal shape:

```json
{
  "label": "Getting Started",
  "position": 5,
  "collapsed": false
}
```

| Field | Type | Default | Notes |
|---|---|---|---|
| `label` | string | folder name | Sidebar label |
| `position` | number | from prefix | Override prefix-based order |
| `collapsed` | boolean | `false` | Initial sidebar state |
| `nav_hide` | boolean | `false` | Hide from sidebar (page still accessible by URL) |

## Page frontmatter

```yaml
---
title: "Page title"               ← required
description: "Meta tag summary"
sidebar_label: "Short label"      ← override sidebar text (defaults to title)
sidebar_position: 3               ← override prefix-based order
draft: false
---
```

## Routing

URL = section base + nested path (without prefixes):

- `dynamic_data/data/user-guide/05_getting-started/02_installation.md`
- → `/user-guide/getting-started/installation`

The `XX_` prefixes are stripped when building URLs.

## Outline (right rail)

The outline is built from `##` and `###` headings in the page body. Use `#` only for the page title (and prefer the frontmatter `title` over an `<h1>` in body).

## Cross-linking between docs pages

Use relative paths or the resolved URL:

```markdown
See [installation](../getting-started/installation) for setup.
See [installation](/user-guide/getting-started/installation) — also works.
```

## Cross-references

- `dynamic_data/data/user-guide/17_docs/` — full user-guide section
- `references/writing.md` — markdown / frontmatter basics
- `references/settings-layout.md` — registering a new docs section in `site.yaml`
