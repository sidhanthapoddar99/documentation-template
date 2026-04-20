---
title: Content Overview
description: Understanding the three types of content in the documentation system
sidebar_position: 1
---

# Content Overview

The documentation system supports three types of content, each with its own structure, processing, and use case.

## Content Types

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CONTENT TYPES                                 │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│        DOCS         │        BLOGS        │       CUSTOM PAGES          │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ • XX_ prefix naming │ • Date prefix naming│ • YAML data files           │
│ • Nested folders    │ • Flat structure    │ • Custom Astro layouts      │
│ • Sidebar navigation│ • Chronological list│ • Flexible structure        │
│ • Position ordering │ • Date ordering     │ • No sidebar                │
└─────────────────────┴─────────────────────┴─────────────────────────────┘
```

## Comparison

| Feature | Docs | Blogs | Custom Pages |
|---------|------|-------|--------------|
| **Location** | `data/docs/` | `data/blog/` | `data/pages/` |
| **Format** | `.md` / `.mdx` | `.md` / `.mdx` | `.yaml` |
| **Naming** | `XX_name.md` | `YYYY-MM-DD-slug.md` | `name.yaml` |
| **Structure** | Nested folders | Flat | Single file |
| **Ordering** | By position (01-99) | By date | Manual |
| **Sidebar** | Yes | No | No |
| **URL** | `/docs/path/slug` | `/blog/slug` | Configurable |

## Docs

Documentation pages with hierarchical organization and sidebar navigation.

**Best for:**
- Technical documentation
- Guides and tutorials
- API references
- Product documentation

**Key features:**
- Position-based ordering with `XX_` prefix
- Nested folder support
- Automatic sidebar generation
- `settings.json` for folder configuration

```
data/docs/
├── 01_getting-started/
│   ├── settings.json
│   ├── 01_overview.md
│   └── 02_installation.md
└── 02_guides/
    ├── settings.json
    └── 01_basics.md
```

## Blogs

Date-ordered posts for news, updates, and articles.

**Best for:**
- Company news
- Release announcements
- Technical articles
- Tutorials and how-tos

**Key features:**
- Date-based naming (`YYYY-MM-DD-slug.md`)
- Automatic chronological sorting
- Tags for categorization
- Author information
- Draft support

```
data/blog/
├── 2024-01-15-hello-world.md
├── 2024-02-01-new-feature.md
└── 2024-02-15-tips-and-tricks.md
```

## Custom Pages

Unique pages with custom layouts using YAML data.

**Best for:**
- Landing pages
- About pages
- Team pages
- Marketing pages

**Key features:**
- YAML data format
- Custom Astro layouts
- Complete design flexibility
- Component composition

```
data/pages/
├── home.yaml
├── about.yaml
└── pricing.yaml
```

## Choosing the Right Type

| Use Case | Recommended Type |
|----------|------------------|
| Technical docs, guides | **Docs** |
| News, announcements | **Blogs** |
| Landing page, marketing | **Custom Pages** |
| API reference | **Docs** |
| Release notes | **Blogs** |
| Team/About page | **Custom Pages** |

## Common Features

All content types share:

- **Markdown support** - Standard markdown syntax
- **Asset embedding** - `[[path]]` syntax for file inclusion
- **Custom tags** - Semantic HTML components
- **Frontmatter** - YAML metadata at the top

## Processing Pipeline

All markdown content goes through the same processing pipeline:

```
Raw Content → Preprocessors → Renderer → Postprocessors → Final HTML
```

See the [Parser System](/docs/architecture/parser/overview) for details on how content is processed.
