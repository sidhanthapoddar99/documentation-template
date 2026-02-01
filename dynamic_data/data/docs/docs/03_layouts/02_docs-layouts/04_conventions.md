---
title: Conventions
description: Best practices and conventions for docs layouts
---

# Docs Layout Conventions

Follow these conventions when creating or customizing docs layouts.

## File Naming

### Layout Files

```
src/layouts/docs/styles/{style_name}/
├── Layout.astro      # Required - main entry point
├── layout.css        # Optional - layout-specific styles
└── index.ts          # Optional - exports
```

**Rules:**
- Style folder name uses `snake_case`: `doc_style1`, `minimal_docs`
- Main component must be named `Layout.astro` (exact match)
- CSS file is optional but recommended for layout-specific styles

### Component Files

```
src/layouts/docs/components/{component}/{variant}/
├── {Component}.astro    # PascalCase component name
└── styles.css           # Associated styles
```

**Examples:**
- `sidebar/default/Sidebar.astro`
- `sidebar/modern/Sidebar.astro`
- `body/compact/Body.astro`

## Props Interface

All docs layouts must implement this exact interface:

```typescript
interface Props {
  title: string;
  description?: string;
  dataPath: string;
  baseUrl: string;
  currentSlug: string;
  content: string;
  headings?: { depth: number; slug: string; text: string }[];
}
```

**Do not:**
- Add required props not passed by the route handler
- Rename existing props
- Change prop types

**You can:**
- Ignore props you don't need
- Set defaults for optional props

## Style Import Order

Import styles in this order for proper cascade:

```astro
---
// 1. Component styles (reusable)
import '../../components/sidebar/default/styles.css';
import '../../components/body/default/styles.css';
import '../../components/outline/default/styles.css';
import '../../components/common/styles.css';

// 2. Layout-specific styles (overrides)
import './layout.css';
---
```

## CSS Class Naming

Use BEM-style naming for layout and component classes:

```css
/* Block */
.docs-layout { }

/* Block with modifier */
.docs-layout--minimal { }

/* Element */
.docs-layout__sidebar { }

/* Element with modifier */
.docs-layout__sidebar--collapsed { }
```

### Component-Specific Prefixes

| Component | Prefix |
|-----------|--------|
| Sidebar | `.sidebar-*` |
| Body | `.docs-*` |
| Outline | `.outline-*` |
| Pagination | `.pagination-*` |

## CSS Variables

Use CSS variables for themeable values:

```css
.docs-layout {
  /* Spacing */
  --docs-sidebar-width: 280px;
  --docs-outline-width: 220px;
  --docs-content-max-width: 800px;
  --docs-gap: 2rem;

  /* Colors (inherit from globals) */
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}
```

## Responsive Design

### Breakpoints

```css
/* Mobile first */
.docs-layout {
  display: block;  /* Stack on mobile */
}

/* Tablet */
@media (min-width: 768px) {
  .docs-layout {
    display: grid;
    grid-template-columns: 1fr 220px;  /* Body + Outline */
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .docs-layout {
    grid-template-columns: 280px 1fr 220px;  /* Sidebar + Body + Outline */
  }
}
```

### Mobile Considerations

- Hide sidebar by default, show via hamburger menu
- Hide outline or move to collapsible section
- Ensure touch targets are at least 44px
- Test pagination on narrow screens

## Loading Data

### Always Use Error Handling

```typescript
let allContent: LoadedContent[] = [];
let settings: ContentSettings = {};

try {
  const result = await loadContentWithSettings(dataPath);
  allContent = result.content;
  settings = result.settings;
} catch (error) {
  console.error('Error loading docs content:', error);
}
```

### Check for Empty States

```astro
{sidebarSections.length > 0 ? (
  <Sidebar sections={sidebarSections} currentPath={currentPath} />
) : (
  <div class="sidebar-empty">No navigation available</div>
)}
```

## Accessibility

### Semantic HTML

```astro
<!-- Good -->
<nav class="sidebar" aria-label="Documentation navigation">
<main class="docs-content">
<article class="docs-article">

<!-- Avoid -->
<div class="sidebar">
<div class="docs-content">
<div class="docs-article">
```

### ARIA Labels

```astro
<nav class="outline" aria-label="Table of contents">
<nav class="pagination" aria-label="Page navigation">
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:

```astro
<button
  class="sidebar-toggle"
  aria-expanded={isExpanded}
  aria-controls="sidebar-section-1"
>
```

## Performance

### Lazy Load Heavy Components

```astro
{/* Only render outline if there are headings */}
{outlineHeadings.length > 0 && (
  <Outline headings={outlineHeadings} />
)}
```

### Minimize Client JavaScript

Docs layouts should work without JavaScript when possible:

```astro
<!-- Use CSS for collapse instead of JS -->
<details class="sidebar-section">
  <summary>Section Title</summary>
  <ul>...</ul>
</details>
```

## Testing Checklist

Before shipping a new layout:

- [ ] Renders correctly with minimal content (1 page)
- [ ] Renders correctly with large content (50+ pages)
- [ ] Sidebar navigation works
- [ ] Current page is highlighted
- [ ] Outline links jump to correct sections
- [ ] Pagination shows correct prev/next
- [ ] Responsive: works on mobile, tablet, desktop
- [ ] Dark mode: colors work in both themes
- [ ] Keyboard: all interactive elements accessible
- [ ] Print: content is printable

## Example: Complete Layout

```astro
---
/**
 * My Custom Docs Layout
 * Based on doc_style1 with custom modifications
 */
import Sidebar from '../../components/sidebar/default/Sidebar.astro';
import Body from '../../components/body/default/Body.astro';
import Outline from '../../components/outline/default/Outline.astro';
import Pagination from '../../components/common/Pagination.astro';

import '../../components/sidebar/default/styles.css';
import '../../components/body/default/styles.css';
import '../../components/outline/default/styles.css';
import '../../components/common/styles.css';
import './layout.css';

import { loadContentWithSettings, type LoadedContent, type ContentSettings } from '@loaders/data';
import { buildSidebarTree, getPrevNext } from '@/hooks/useSidebar';

interface Props {
  title: string;
  description?: string;
  dataPath: string;
  baseUrl: string;
  currentSlug: string;
  content: string;
  headings?: { depth: number; slug: string; text: string }[];
}

const { title, description, dataPath, baseUrl, currentSlug, content, headings = [] } = Astro.props;

// Load data with error handling
let allContent: LoadedContent[] = [];
let settings: ContentSettings = {};

try {
  const result = await loadContentWithSettings(dataPath);
  allContent = result.content;
  settings = result.settings;
} catch (error) {
  console.error('Error loading docs content:', error);
}

// Build navigation
const sidebarSections = buildSidebarTree(allContent, baseUrl, dataPath);
const currentPath = `${baseUrl}/${currentSlug}`;
const { prev, next } = getPrevNext(sidebarSections, currentPath);

// Configure features from settings
const outlineEnabled = settings.outline?.enabled !== false;
const outlineLevels = settings.outline?.levels || [2, 3];
const outlineHeadings = headings.filter(h => outlineLevels.includes(h.depth));
const paginationEnabled = settings.pagination?.enabled !== false;
---

<div class="docs-layout">
  <Sidebar sections={sidebarSections} currentPath={currentPath} />

  <Body title={title} description={description} content={content}>
    {paginationEnabled && (prev || next) && (
      <Pagination prev={prev} next={next} />
    )}
  </Body>

  {outlineEnabled && outlineHeadings.length > 0 && (
    <Outline headings={outlineHeadings} title={settings.outline?.title} />
  )}
</div>
```
