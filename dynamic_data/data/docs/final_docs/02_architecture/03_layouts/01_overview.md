---
title: Layout System Overview
description: Understanding the modular layout architecture and shared data pipeline
sidebar_position: 1
---

# Layout System

The layout system (`src/layouts/`) implements a **shared data, different structure** pattern where multiple layouts receive identical data but render it with different visual structures.

## Core Concept

```
┌──────────────────────────────────────────────────────────────────┐
│                     COMMON DATA PIPELINE                         │
│   site.yaml → [..slug].astro → loadContent() → Parser → HTML     │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 │  Same props passed to all layouts
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
   ┌───────────┐           ┌───────────┐           ┌───────────┐
   │doc_style1 │           │doc_style2 │           │doc_style3 │
   │           │           │           │           │           │
   │ Sidebar   │           │           │           │ Sidebar   │
   │ Body      │           │ Body      │           │ Body      │
   │ Outline   │           │ Outline   │           │           │
   └───────────┘           └───────────┘           └───────────┘
    3-column                2-column                2-column
```

All doc layouts receive the **same props**:

```typescript
{
  title: string;
  description: string;
  dataPath: string;      // For loading sidebar/settings
  baseUrl: string;       // For URL generation
  currentSlug: string;   // For active state highlighting
  content: string;       // Rendered HTML from parser
  headings: Heading[];   // For outline/TOC
}
```

The difference is purely **structural** — which components are rendered and how they're arranged.

## Layout Layer in Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          4. LAYOUT LAYER                                │
│                                                                         │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐       │
│   │  BaseLayout     │   │  Layout Styles  │   │  Components     │       │
│   │  (HTML shell)   │   │  @docs/style1   │   │  Sidebar, Body  │       │
│   │                 │   │  @blog/style1   │   │  Outline, etc.  │       │
│   └────────┬────────┘   └────────┬────────┘   └────────┬────────┘       │
│            │                     │                     │                │
│            └─────────────────────┴─────────────────────┘                │
│                                  │                                      │
│                          Composition                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/layouts/
├── BaseLayout.astro              # Root HTML structure (all pages)
│
├── docs/                         # Documentation layouts
│   ├── styles/
│   │   ├── doc_style1/Layout.astro   # 3-column: sidebar + body + outline
│   │   └── doc_style2/Layout.astro   # 2-column: body + outline
│   └── components/               # Shared doc components
│       ├── sidebar/default/
│       ├── body/default/
│       ├── outline/default/
│       └── common/Pagination.astro
│
├── blogs/                        # Blog layouts
│   ├── styles/
│   │   └── blog_style1/
│   │       ├── IndexLayout.astro     # Blog listing page
│   │       └── PostLayout.astro      # Single post page
│   └── components/
│       ├── body/
│       └── cards/
│
├── custom/                       # Custom page layouts
│   ├── styles/
│   │   ├── home/Layout.astro
│   │   └── info/Layout.astro
│   └── components/
│       ├── hero/
│       └── features/
│
├── navbar/                       # Navbar variants
│   ├── style1/index.astro
│   └── minimal/index.astro
│
└── footer/                       # Footer variants
    ├── default/index.astro
    └── minimal/index.astro
```

## Key Principles

### 1. Composition Over Inheritance

Layouts compose from shared components rather than extending base classes:

```astro
<!-- doc_style1/Layout.astro -->
<div class="docs-layout three-column">
  <Sidebar sections={sidebarSections} />
  <Body title={title} content={content}>
    <Pagination prev={prev} next={next} />
  </Body>
  <Outline headings={headings} />
</div>
```

### 2. Automatic Discovery

Layouts are discovered via glob patterns — no manual registry:

```typescript
// In [...slug].astro
const docsLayouts = import.meta.glob('/src/layouts/docs/styles/*/Layout.astro');
const blogLayouts = import.meta.glob('/src/layouts/blogs/styles/*/*.astro');
```

Adding a new layout is just creating a folder with the right file.

### 3. Strict Validation

Missing or invalid layouts throw descriptive errors at build time:

```
[LAYOUT ERROR] Docs layout "doc_style99" does not exist.
  Page: docs
  Config: @docs/doc_style99
  Expected: src/layouts/docs/styles/doc_style99/Layout.astro
  Available: doc_style1, doc_style2
```

### 4. Standardized Paths

All layout types follow a consistent path pattern:

```
src/layouts/{type}/styles/{style}/Layout.astro
```

| Type | Pattern | Example |
|------|---------|---------|
| Docs | `docs/styles/{style}/Layout.astro` | `doc_style1` |
| Blog | `blogs/styles/{style}/*.astro` | `blog_style1` |
| Custom | `custom/styles/{style}/Layout.astro` | `home` |

## Data Flow Summary

```
1. [..slug].astro reads page config from site.yaml
       │
       ▼
2. loadContentWithSettings() loads all content + folder settings
       │
       ▼
3. buildSidebarTree() creates navigation structure
       │
       ▼
4. Layout receives standardized props
       │
       ▼
5. Layout composes components (Sidebar, Body, Outline)
       │
       ▼
6. BaseLayout wraps with Navbar + Footer
       │
       ▼
7. Final HTML output
```
