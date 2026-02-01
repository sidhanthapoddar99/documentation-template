---
title: Dynamic Data Structure
description: Understanding the user content and configuration structure
sidebar_position: 3
---

# Dynamic Data Structure

The `dynamic_data/` directory contains all your content, configuration, and assets. This is where you'll spend most of your time.

## Directory Overview

```
dynamic_data/
├── assets/                 # Static assets (ASSETS_DIR)
│   ├── logo.svg
│   ├── favicon.png
│   └── images/
│
├── config/                 # Configuration files (CONFIG_DIR)
│   ├── site.yaml           # Site metadata, logo, pages
│   ├── navbar.yaml         # Navigation items
│   └── footer.yaml         # Footer configuration
│
├── data/                   # Content (DATA_DIR)
│   ├── docs/               # Documentation
│   ├── blog/               # Blog posts
│   └── pages/              # Custom page data
│
└── themes/                 # Custom themes (THEMES_DIR)
    └── theme1/
```

## Assets (`assets/`)

Static files served at `/assets/*` URLs.

```
assets/
├── logo.svg                # Site logo
├── logo-dark.svg           # Dark mode logo variant
├── favicon.png             # Browser favicon
└── images/
    ├── hero.png
    └── feature.svg
```

**Usage in configuration:**

```yaml
# site.yaml
logo:
  src: "@assets/logo.svg"
  favicon: "@assets/favicon.png"
```

**Web URLs:**
- `@assets/logo.svg` → `/assets/logo.svg`
- `@assets/images/hero.png` → `/assets/images/hero.png`

## Config (`config/`)

YAML configuration files for site settings.

```
config/
├── site.yaml               # Site metadata + page definitions
├── navbar.yaml             # Navigation bar items
└── footer.yaml             # Footer columns and links
```

See [Configuration Overview](../configuration/overview) for details.

## Data (`data/`)

Your actual content lives here.

### Documentation (`data/docs/`)

```
data/docs/
├── getting-started/
│   ├── _category_.json     # Folder settings
│   ├── 01_overview.md
│   ├── 02_installation.md
│   └── assets/             # Doc-specific assets
│       └── diagram.mermaid
│
└── guides/
    ├── _category_.json
    ├── 01_basics.md
    └── 02_advanced.md
```

**Key points:**
- Use `XX_` prefix for ordering (e.g., `01_`, `02_`)
- `_category_.json` configures folder display
- Place assets in `assets/` subfolder

### Blog (`data/blog/`)

```
data/blog/
├── 2024-01-15-hello-world.md
├── 2024-01-20-new-feature.md
└── assets/
    └── post-image.png
```

**Key points:**
- Use date prefix for sorting: `YYYY-MM-DD-slug.md`
- URL becomes `/blog/slug`

### Pages (`data/pages/`)

```
data/pages/
├── home.yaml               # Home page data
└── about.yaml              # About page data
```

**Key points:**
- YAML files with page-specific data
- Referenced in `site.yaml` pages config

## File Naming Conventions

### Documentation Files

| Pattern | URL | Example |
|---------|-----|---------|
| `01_overview.md` | `/docs/.../overview` | Number prefix removed |
| `02_install.md` | `/docs/.../install` | Sorted by prefix |

### Blog Posts

| Pattern | URL | Example |
|---------|-----|---------|
| `2024-01-15-hello.md` | `/blog/hello` | Date prefix removed |
| `2024-02-01-update.md` | `/blog/update` | Sorted by date |

## Folder Settings (`_category_.json`)

Configure how folders appear in the sidebar:

```json
{
  "label": "Getting Started",
  "position": 1,
  "collapsed": false,
  "link": {
    "type": "doc",
    "id": "getting-started/overview"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Display name in sidebar |
| `position` | `number` | Sort order |
| `collapsed` | `boolean` | Start collapsed? |
| `link` | `object` | Category link target |

## Environment Configuration

The location of each directory is configurable via `.env`:

```env
CONFIG_DIR=./dynamic_data/config
DATA_DIR=./dynamic_data/data
ASSETS_DIR=./dynamic_data/assets
THEMES_DIR=./dynamic_data/themes/theme1
```

This allows you to:
- Point to content outside the project
- Use absolute paths for shared content
- Separate configuration per environment

## Path Aliases Reference

| Alias | Resolves To | Example |
|-------|-------------|---------|
| `@data/path` | `DATA_DIR/path` | `@data/docs` → `dynamic_data/data/docs` |
| `@assets/file` | `/assets/file` (URL) | `@assets/logo.svg` → `/assets/logo.svg` |
| `@docs/style` | `src/layouts/docs/style` | Layout references |
| `@blog/style` | `src/layouts/blogs/style` | Layout references |
