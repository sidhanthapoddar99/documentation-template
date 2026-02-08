# Directory Structure Reference

## Overview

The documentation setup separates the template (framework code) from user content (your docs).

```
<project-root>/
└── docs/                           # Documentation root
    ├── README.md                   # Setup instructions
    ├── .env                        # Environment configuration
    ├── documentation-template/     # Git clone - DO NOT MODIFY
    │   ├── src/                    # Framework source code
    │   ├── package.json
    │   └── .env.copy               # Template for .env
    └── data/                       # YOUR CONTENT - EDIT THIS
        ├── assets/                 # Static assets
        ├── config/                 # YAML configuration
        ├── themes/                 # Custom themes
        └── data/                   # Documentation content
```

## Critical Rule

**NEVER modify files inside `documentation-template/`**

This folder is a git clone of the template repository. All your customizations go in `data/`.

## Folder Details

### `docs/.env`

Environment configuration that tells the template where to find your content.

```env
CONFIG_DIR=../data/config
DATA_DIR=../data/data
ASSETS_DIR=../data/assets
THEMES_DIR=../data/themes
```

Paths are relative to `documentation-template/` folder.

### `docs/data/assets/`

Static files served at `/assets/` URL.

```
assets/
├── logo.svg           # Site logo
├── logo-dark.svg      # Dark theme logo
├── logo-light.svg     # Light theme logo
├── favicon.png        # Browser favicon
└── images/            # Other images
    └── screenshot.png
```

Referenced in config as `@assets/filename`.

### `docs/data/config/`

YAML configuration files.

```
config/
├── site.yaml      # Site metadata, pages, theme
├── navbar.yaml    # Navigation menu
└── footer.yaml    # Footer layout
```

### `docs/data/themes/`

Custom theme overrides (optional).

```
themes/
└── my-theme/
    ├── theme.yaml     # Theme metadata
    └── styles.css     # Custom CSS
```

### `docs/data/data/`

All documentation content.

```
data/
├── docs/              # Main documentation (/docs)
│   ├── settings.json
│   └── 01_intro.md
│
├── user-guide/        # User guide (/user-guide)
│   ├── settings.json
│   └── 01_placeholder.md
│
├── prd/               # PRD (/prd)
│   ├── settings.json
│   └── 01_placeholder.md
│
├── internal-docs/     # Internal docs (/internal-docs)
│   ├── settings.json
│   └── 01_placeholder.md
│
├── doc-template/      # Template's own docs
│   ├── docs/          # Template documentation
│   └── components/    # Component reference
│
├── roadmap/           # Roadmap (/roadmap)
│   ├── settings.json
│   └── 01_overview.md
│
├── blog/              # Blog posts (/blog)
│   └── YYYY-MM-DD-slug.md
│
└── pages/             # Custom pages
    ├── home.yaml      # Landing page (/)
    └── about.yaml     # About page (/about)
```

## Naming Conventions

### Documentation Files

**Prefix Rule:** All doc files and folders MUST use `XX_` prefix.

| Pattern | Example | Result |
|---------|---------|--------|
| Folder | `01_getting-started/` | Sidebar order: 1 |
| File | `01_overview.md` | URL: `/docs/getting-started/overview` |
| Subfolder | `02_guides/` | Sidebar order: 2 |

**Exceptions (no prefix needed):**
- `settings.json` - Folder configuration
- `assets/` - Asset folders within docs

### Blog Files

Date-based naming: `YYYY-MM-DD-slug.md`

| File | URL |
|------|-----|
| `2024-01-15-hello-world.md` | `/blog/hello-world` |
| `2024-02-01-new-feature.md` | `/blog/new-feature` |

### Custom Pages

Simple naming: `name.yaml`

| File | URL (depends on site.yaml) |
|------|----------------------------|
| `home.yaml` | `/` |
| `about.yaml` | `/about` |

## Required Files

### For Each Docs Folder

Every documentation folder needs `settings.json`:

```json
{
  "label": "Section Name",
  "isCollapsible": true,
  "collapsed": false
}
```

### For Each Markdown File

Every markdown file needs frontmatter:

```yaml
---
title: Page Title
description: SEO description
---
```

## Path Aliases

Used in configuration files:

| Alias | Resolves To | Example |
|-------|-------------|---------|
| `@data/path` | `DATA_DIR/path` | `@data/docs` → `data/data/docs` |
| `@assets/file` | `ASSETS_DIR/file` → `/assets/file` | `@assets/logo.svg` |
| `@docs/style` | `src/layouts/docs/style/` | `@docs/default` |
| `@blog/style` | `src/layouts/blogs/style/` | `@blog/default` |
| `@custom/style` | `src/layouts/custom/style/` | `@custom/home` |
| `@footer/style` | `src/layouts/footer/style/` | `@footer/default` |
| `@navbar/style` | `src/layouts/navbar/style/` | `@navbar/default` |
| `@theme/name` | Theme reference | `@theme/minimal` |
