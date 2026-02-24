---
title: Docs Layouts Overview
description: Understanding documentation layouts and their structure
---

# Docs Layouts

Documentation layouts are designed for hierarchical content with navigation. They support sidebar navigation, table of contents, and prev/next pagination.

## Available Layouts

| Layout | Structure | Best For |
|--------|-----------|----------|
| `default` | Sidebar + Body + Outline | Full documentation sites |
| `compact` | Body + Outline | Simple docs, single-page guides |

## Visual Structure

### default (Full Layout)

```
┌──────────────────────────────────────────────────────────────────┐
│                           Navbar                                  │
├───────────────┬──────────────────────────────┬───────────────────┤
│               │                              │                   │
│   Sidebar     │         Body                 │     Outline       │
│               │                              │                   │
│  • Section 1  │   Title                      │  On this page     │
│    • Page     │   Description                │  • Heading 1      │
│    • Page     │                              │  • Heading 2      │
│  • Section 2  │   Content...                 │    • Subheading   │
│    • Page     │                              │  • Heading 3      │
│               │   ─────────────────────      │                   │
│               │   ← Prev        Next →       │                   │
│               │                              │                   │
├───────────────┴──────────────────────────────┴───────────────────┤
│                           Footer                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Components used:**
- `Sidebar` — Hierarchical navigation tree
- `Body` — Main content area with title/description
- `Outline` — Table of contents (right sidebar)
- `Pagination` — Prev/Next links

### compact (Minimal Layout)

```
┌──────────────────────────────────────────────────────────────────┐
│                           Navbar                                  │
├──────────────────────────────────────────────┬───────────────────┤
│                                              │                   │
│              Body                            │     Outline       │
│                                              │                   │
│   Title                                      │  On this page     │
│   Description                                │  • Heading 1      │
│                                              │  • Heading 2      │
│   Content...                                 │  • Heading 3      │
│                                              │                   │
│   ─────────────────────                      │                   │
│   ← Prev        Next →                       │                   │
│                                              │                   │
├──────────────────────────────────────────────┴───────────────────┤
│                           Footer                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Components used:**
- `Body` — Main content area (wider without sidebar)
- `Outline` — Table of contents
- `Pagination` — Prev/Next links

## File Location

Docs layout directories contain only Astro components. All CSS is provided by the theme's `docs.css` file in `src/styles/`.

```
src/layouts/docs/
├── default/                  # Owns all doc components
│   ├── Layout.astro
│   ├── Sidebar.astro
│   ├── Body.astro
│   ├── Outline.astro
│   └── Pagination.astro
└── compact/                  # Imports shared components from ../default/
    └── Layout.astro
```

The theme (`src/styles/docs.css`) defines all visual styles for these components, including the `.docs-layout` container, sidebar width, outline positioning, and responsive breakpoints. Layouts only render HTML with the correct CSS class names.

## Routing

Docs layouts are used when:

1. Page type is `docs` in `site.yaml`
2. URL matches the `base_url` pattern

```yaml
# site.yaml
pages:
  docs:
    base_url: "/docs"
    type: docs                    # ← Triggers docs layout
    layout: "@docs/default"
    data: "@data/docs"
```

**URL patterns:**
- `/docs` → Redirects to first page
- `/docs/getting-started` → Single doc page
- `/docs/guides/advanced` → Nested doc page

## Features

### Sidebar Navigation

The sidebar shows a hierarchical tree built from your folder structure:

```
data/docs/
├── 01_getting-started/       → "Getting Started" section
│   ├── 01_overview.md        →   • Overview
│   └── 02_installation.md    →   • Installation
└── 02_guides/                → "Guides" section
    ├── 01_basics.md          →   • Basics
    └── 02_advanced.md        →   • Advanced
```

- Sections are collapsible
- Current page is highlighted
- Uses `settings.json` for section labels

### Table of Contents (Outline)

Automatically generated from headings in the current page:

- Shows h2 and h3 by default
- Configurable via `settings.json`
- Highlights current section on scroll

### Pagination

Prev/Next navigation at the bottom of each page:

- Follows sidebar order
- Respects folder hierarchy
- Can be disabled in settings

## Configuration

### Folder Settings

Control sidebar behavior with `settings.json` in your docs folder:

```json
{
  "sidebar": {
    "title": "Documentation"
  },
  "outline": {
    "enabled": true,
    "title": "On this page",
    "levels": [2, 3]
  },
  "pagination": {
    "enabled": true
  }
}
```

### Page Frontmatter

Each doc page supports:

```yaml
---
title: Page Title              # Required - shown in body and sidebar
description: Brief summary     # Optional - shown below title
sidebar_label: Short Name      # Optional - overrides title in sidebar
draft: true                    # Optional - hides in production
---
```

## When to Use Each Layout

| Use Case | Recommended Layout |
|----------|-------------------|
| Full documentation site | `default` |
| API reference with TOC | `default` |
| Simple guide/tutorial | `compact` |
| Single-page documentation | `compact` |
| FAQ or changelog | `compact` |
