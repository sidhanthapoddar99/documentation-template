---
title: Project Structure
description: Understanding the directory structure
---

# Project Structure

A detailed breakdown of the project organization.

## Top-Level Structure

```
project/
├── dynamic_data/           # User content & config
├── src/                    # Framework code
├── public/                 # Static assets
├── dist/                   # Build output
├── .env                    # Environment config
├── astro.config.mjs        # Astro configuration
└── package.json
```

## User Directory (`dynamic_data/`)

This is where you'll spend most of your time:

```
dynamic_data/
├── config/
│   └── site.yaml           # All site configuration
│
├── data/
│   ├── docs/               # Documentation content
│   │   ├── getting-started/
│   │   │   ├── settings.json
│   │   │   ├── 01_overview.mdx
│   │   │   └── 02_install.mdx
│   │   └── guides/
│   │       ├── settings.json
│   │       └── 01_basics.mdx
│   │
│   ├── blog/               # Blog posts
│   │   ├── 2024-01-15-hello.mdx
│   │   └── 2024-01-20-update.mdx
│   │
│   └── pages/              # Custom page data
│       ├── home.yaml
│       └── about.yaml
│
├── theme/
│   └── colors.yaml         # Color customization
│
└── assets/
    ├── images/
    └── logos/
```

## Framework Directory (`src/`)

The core framework code (don't modify):

```
src/
├── layouts/
│   ├── docs/
│   │   ├── components/     # Reusable doc components
│   │   │   ├── body/default/
│   │   │   ├── sidebar/default/
│   │   │   └── outline/default/
│   │   └── styles/         # Complete style bundles
│   │       ├── doc_style1/
│   │       └── doc_style2/
│   │
│   ├── blogs/
│   │   ├── components/
│   │   └── styles/
│   │
│   └── custom/
│       ├── components/
│       └── styles/
│
├── loaders/
│   ├── config.ts           # Configuration loader
│   ├── data.ts             # Content loader
│   └── theme.ts            # Theme loader
│
├── pages/
│   └── [...slug].astro     # Dynamic route handler
│
└── styles/
    └── global.css          # Global styles
```

## Key Files Explained

### `config/site.yaml`

Central configuration for your entire site. Controls:
- Site metadata (name, description)
- Page definitions and routing
- Navbar and footer structure

### `data/docs/*/settings.json`

Per-folder settings for documentation sections:

```json
{
  "label": "Getting Started",
  "isCollapsible": true,
  "collapsed": false
}
```

### `theme/colors.yaml`

Customize the color scheme:

```yaml
brand:
  primary: "#3b82f6"
  secondary: "#8b5cf6"

semantic:
  success: "#22c55e"
  warning: "#f59e0b"
  error: "#ef4444"
```

### `src/pages/[...slug].astro`

The single dynamic route that handles all pages. It:
1. Reads configuration
2. Loads appropriate layout
3. Fetches content
4. Renders the page

## File Naming Conventions

### Documentation Files

**Must** use `XX_` prefix for ordering:

```
01_overview.mdx      → /docs/section/overview
02_installation.mdx  → /docs/section/installation
10_advanced.mdx      → /docs/section/advanced
```

### Blog Posts

Use date prefix for sorting:

```
2024-01-15-my-post.mdx  → /blog/my-post
2024-02-01-update.mdx   → /blog/update
```

### Custom Pages

Any name, referenced by path in config:

```
home.yaml    → referenced as @data/pages/home.yaml
about.yaml   → referenced as @data/pages/about.yaml
```
