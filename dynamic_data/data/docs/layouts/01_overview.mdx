---
title: Layouts Overview
description: Understanding the layout system
---

# Layouts Overview

Layouts control how content is rendered. The system provides pre-built layouts and supports creating custom ones.

## Layout Types

| Type | Purpose | Index Layout | Post Layout |
|------|---------|--------------|-------------|
| `docs` | Documentation | N/A | `Layout.astro` |
| `blogs` | Blog posts | `IndexLayout.astro` | `PostLayout.astro` |
| `custom` | Custom pages | N/A | `Layout.astro` |

## Directory Structure

```
src/layouts/
├── docs/
│   ├── components/           # Shared components
│   │   ├── body/
│   │   │   └── default/
│   │   │       ├── Body.astro
│   │   │       └── styles.css
│   │   ├── sidebar/
│   │   │   └── default/
│   │   │       ├── Sidebar.astro
│   │   │       └── styles.css
│   │   ├── outline/
│   │   │   └── default/
│   │   │       ├── Outline.astro
│   │   │       └── styles.css
│   │   └── common/
│   │       ├── Pagination.astro
│   │       └── styles.css
│   │
│   └── styles/               # Complete style bundles
│       ├── doc_style1/
│       │   ├── Layout.astro
│       │   ├── layout.css
│       │   └── index.ts
│       └── doc_style2/
│           └── ...
│
├── blogs/
│   ├── components/
│   └── styles/
│
└── custom/
    ├── components/
    └── styles/
```

## Components vs Styles

### Components (`components/`)

Reusable building blocks:
- **body/**: Main content area renderers
- **sidebar/**: Navigation sidebar variations
- **outline/**: Table of contents styles
- **common/**: Shared utilities (pagination, breadcrumbs)

Each component folder can have multiple variants:

```
sidebar/
├── default/      # Standard sidebar
├── minimal/      # Compact sidebar
└── floating/     # Floating sidebar
```

### Styles (`styles/`)

Complete layout bundles that compose components:

```astro
// doc_style1/Layout.astro
---
import Body from '../../components/body/default/Body.astro';
import Sidebar from '../../components/sidebar/default/Sidebar.astro';
import Outline from '../../components/outline/default/Outline.astro';
import './layout.css';
---

<div class="doc-layout">
  <Sidebar {tree} {currentSlug} />
  <Body {content} {frontmatter} />
  <Outline {headings} />
</div>
```

## Using Layouts

Reference layouts in `site.yaml`:

```yaml
pages:
  docs:
    layout: "@docs/doc_style1"

  blog:
    layout: "@blogs/blog_style1"

  home:
    layout: "@custom/home"
```

### Alias Format

```
@{type}/{style_name}

@docs/doc_style1    → src/layouts/docs/styles/doc_style1/
@blogs/blog_style1  → src/layouts/blogs/styles/blog_style1/
@custom/home        → src/layouts/custom/styles/home/
```

## Available Layouts

### Documentation Layouts

| Layout | Description |
|--------|-------------|
| `@docs/doc_style1` | Classic three-column (sidebar, content, outline) |
| `@docs/doc_style2` | Two-column (sidebar, content) |

### Blog Layouts

| Layout | Description |
|--------|-------------|
| `@blogs/blog_style1` | Card grid index, clean post layout |

### Custom Layouts

| Layout | Description |
|--------|-------------|
| `@custom/home` | Hero + features landing page |
| `@custom/info` | Simple content page |

## Layout Props

Each layout receives specific props:

### Docs Layout

```typescript
interface DocsLayoutProps {
  content: MDXContent;        // Rendered MDX
  frontmatter: Frontmatter;   // Page metadata
  tree: SidebarTree;          // Navigation tree
  currentSlug: string;        // Active page slug
  headings: Heading[];        // For outline
  pagination: {               // Prev/next links
    prev?: NavItem;
    next?: NavItem;
  };
}
```

### Blog Layouts

**IndexLayout:**

```typescript
interface BlogIndexProps {
  posts: BlogPost[];          // All posts
  pagination: Pagination;     // Page info
}
```

**PostLayout:**

```typescript
interface BlogPostProps {
  content: MDXContent;
  frontmatter: BlogFrontmatter;
  relatedPosts?: BlogPost[];
}
```

### Custom Layout

```typescript
interface CustomLayoutProps {
  data: any;                  // From YAML data file
}
```
