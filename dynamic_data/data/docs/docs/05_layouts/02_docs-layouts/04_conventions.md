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
└── index.ts          # Optional - exports
```

**Rules:**
- Style folder name uses `snake_case`: `doc_style1`, `minimal_docs`
- Main component must be named `Layout.astro` (exact match)
- All CSS lives in the theme, not in layout folders

### Component Files

```
src/layouts/docs/components/{component}/{variant}/
└── {Component}.astro    # PascalCase component name (no CSS files)
```

**Examples:**
- `sidebar/default/Sidebar.astro`
- `sidebar/modern/Sidebar.astro`
- `body/compact/Body.astro`

Components do not have associated `styles.css` files. All visual styling is defined in the theme's CSS (e.g., `src/styles/docs.css`).

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

## CSS Class Naming

Layouts use BEM-style CSS class names in their HTML. These classes are **defined by the theme** (in `src/styles/docs.css`), not by the layouts themselves. Layouts only apply the class names; the theme provides the visual rules.

```css
/* Block — defined in theme's docs.css */
.docs-layout { }

/* Element */
.docs-layout__sidebar { }

/* Element with modifier */
.docs-layout__sidebar--collapsed { }
```

There are no `--minimal` or other variant modifiers on layout classes. Different visual styles are achieved by switching to a different theme, not by adding CSS modifiers.

### Component-Specific Prefixes

| Component | Prefix | Styled In |
|-----------|--------|-----------|
| Sidebar | `.sidebar-*` | `docs.css` |
| Body | `.docs-*` | `docs.css` |
| Outline | `.outline-*` | `docs.css` |
| Pagination | `.pagination-*` | `docs.css` |

## CSS Variables

CSS variables are defined by the **theme**, not by layouts. Layouts do not define or import any CSS. The theme's `docs.css` uses CSS variables for all configurable values:

```css
/* Defined in the theme's docs.css — NOT in any layout file */
.docs-layout {
  /* Spacing */
  --docs-sidebar-width: 280px;
  --docs-outline-width: 220px;
  --docs-content-max-width: 800px;
  --docs-gap: 2rem;

  /* Colors (inherit from theme globals) */
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}
```

To customize these values, modify them in your theme's CSS files — never add CSS to layout directories.

## Responsive Design

Responsive breakpoints and media queries are defined in the **theme's CSS**, not in layouts. Layouts produce the same HTML structure regardless of screen size — the theme controls how that structure adapts.

### Theme Breakpoints (defined in `docs.css`)

```css
/* Mobile first — defined in theme's docs.css */
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

When building layouts, keep these in mind (the theme handles the CSS, but the HTML structure must support it):

- Sidebar should be toggleable (hidden by default on mobile)
- Outline can be hidden or collapsed on small screens
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
{sidebarNodes.length > 0 ? (
  <Sidebar nodes={sidebarNodes} currentPath={currentPath} />
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

Notice there are no CSS imports. The layout imports only Astro components and data utilities. All styling comes from the theme's `docs.css`.

```astro
---
/**
 * My Custom Docs Layout
 * Based on doc_style1 with custom modifications
 *
 * This layout only handles HTML structure and data processing.
 * All visual styling is provided by the theme's docs.css.
 */
import Sidebar from '../../components/sidebar/default/Sidebar.astro';
import Body from '../../components/body/default/Body.astro';
import Outline from '../../components/outline/default/Outline.astro';
import Pagination from '../../components/common/Pagination.astro';

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
const sidebarNodes = buildSidebarTree(allContent, baseUrl, dataPath);
const currentPath = `${baseUrl}/${currentSlug}`;
const { prev, next } = getPrevNext(sidebarNodes, currentPath);

// Configure features from settings
const outlineEnabled = settings.outline?.enabled !== false;
const outlineLevels = settings.outline?.levels || [2, 3];
const outlineHeadings = headings.filter(h => outlineLevels.includes(h.depth));
const paginationEnabled = settings.pagination?.enabled !== false;
---

<div class="docs-layout">
  <Sidebar nodes={sidebarNodes} currentPath={currentPath} />

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

The key principle: **Layouts = HTML structure + data processing + CSS class names. Theme = ALL visual styling.**
