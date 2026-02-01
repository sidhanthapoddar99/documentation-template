# Project Overview

Astro-based documentation framework with modular layouts and YAML configuration.

## Directory Structure

```
dynamic_data/
├── assets/           # Static assets (ASSETS_DIR) - logos, images
├── config/           # Configuration (CONFIG_DIR)
│   ├── site.yaml     # Site metadata, logo, pages
│   ├── navbar.yaml   # Navigation items
│   └── footer.yaml   # Footer config
└── data/             # Content (DATA_DIR)
    ├── docs/         # Documentation
    ├── blog/         # Blog posts
    └── pages/        # Custom page data
```

## Documentation File Structure

### Naming Convention (REQUIRED)

**All doc files and folders MUST use `XX_` prefix (01-99):**

```
docs/
├── 01_getting-started/
│   ├── settings.json        ← Folder config (required)
│   ├── 01_overview.md
│   ├── 02_installation.md
│   └── assets/              ← Assets folder (no prefix needed)
│
├── 02_guides/
│   ├── settings.json
│   ├── 01_basics.md
│   └── 02_advanced.md
```

- Prefix determines sidebar order
- Prefix stripped from URLs: `01_overview.md` → `/docs/.../overview`
- Build fails if prefix missing

### Folder Settings (`settings.json`)

Every doc folder (except root) needs `settings.json`:

```json
{
  "label": "Getting Started",
  "isCollapsible": true,
  "collapsed": false
}
```

### Frontmatter (Required)

Every doc file needs frontmatter:

```yaml
---
title: Page Title          # Required
description: SEO text      # Optional
sidebar_label: Short Name  # Optional - overrides title in sidebar
draft: true                # Optional - hide in production
tags: [api, guide]         # Optional
---
```

## Blog Posts

Use date prefix: `YYYY-MM-DD-slug.md`

```
blog/
├── 2024-01-15-hello-world.md
└── 2024-02-01-new-feature.md
```

URL: `2024-01-15-hello-world.md` → `/blog/hello-world`

## Configuration

### site.yaml

```yaml
site:
  name: "My Docs"
  title: "My Documentation"
  description: "Built with Astro"

logo:
  src: "@assets/logo.svg"
  alt: "Logo"
  favicon: "@assets/favicon.png"

pages:
  docs:
    base_url: "/docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs"
```

### Path Aliases

| Alias | Usage |
|-------|-------|
| `@data/path` | Content data paths |
| `@assets/file` | Static assets → `/assets/file` URL |
| `@docs/style` | Doc layout reference |
| `@blog/style` | Blog layout reference |

## Build Commands

```bash
npm run start    # Development
npm run build    # Production build
```

## Key Rules

1. **XX_ prefix required** for all doc files/folders
2. **settings.json required** in every doc folder
3. **title frontmatter required** in every doc file
4. **Assets folder** excluded from sidebar (no prefix needed)
