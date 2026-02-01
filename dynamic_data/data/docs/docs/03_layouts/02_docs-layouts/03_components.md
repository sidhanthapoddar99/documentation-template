---
title: Components
description: Reusable components for docs layouts
---

# Docs Components

Docs layouts compose from shared components located in `src/layouts/docs/components/`. These components can be mixed and matched to create different layout styles.

## Component Directory

```
src/layouts/docs/components/
├── sidebar/
│   └── default/
│       ├── Sidebar.astro     # Main sidebar component
│       └── styles.css
│
├── body/
│   └── default/
│       ├── Body.astro        # Main content area
│       └── styles.css
│
├── outline/
│   └── default/
│       ├── Outline.astro     # Table of contents
│       └── styles.css
│
└── common/
    ├── Pagination.astro      # Prev/Next navigation
    └── styles.css
```

## Sidebar

The sidebar renders hierarchical navigation from your docs structure.

**File:** `src/layouts/docs/components/sidebar/default/Sidebar.astro`

### Props

```typescript
interface Props {
  nodes: SidebarNode[];    // Mixed: items (root files) + sections (folders)
  currentPath: string;     // Current page URL
}

type SidebarNode = SidebarItem | SidebarSection;

interface SidebarItem {
  type: 'item';
  title: string;
  href: string;
  slug: string;
  position: number;
}

interface SidebarSection {
  type: 'section';
  title: string;                // Section display name
  slug: string;                 // URL slug
  href?: string;                // Optional link target
  position: number;             // Sort order
  collapsed: boolean;           // Initial state
  collapsible: boolean;         // Can collapse?
  children: SidebarNode[];
}
```

### Usage

```astro
---
import Sidebar from '../../components/sidebar/default/Sidebar.astro';
import { buildSidebarTree } from '@/hooks/useSidebar';

const sidebarNodes = buildSidebarTree(content, baseUrl, dataPath);
const currentPath = `${baseUrl}/${currentSlug}`;
---

<Sidebar nodes={sidebarNodes} currentPath={currentPath} />
```

### Features

- **Recursive rendering**: Supports nested sections of any depth
- **Collapsible sections**: Sections can be collapsed/expanded
- **Active state**: Current page and parent sections highlighted
- **Keyboard navigation**: Accessible with keyboard

### Customization

Override styles in your layout's CSS:

```css
/* Custom sidebar width */
.sidebar {
  width: 300px;
}

/* Custom active state */
.sidebar-item--active {
  background: var(--color-primary);
  color: white;
}
```

## Body

The body component renders the main content area with title, description, and content.

**File:** `src/layouts/docs/components/body/default/Body.astro`

### Props

```typescript
interface Props {
  title: string;          // Page title
  description?: string;   // Optional description
  content: string;        // Rendered HTML
}
```

### Usage

```astro
---
import Body from '../../components/body/default/Body.astro';
---

<Body title={title} description={description} content={content}>
  <!-- Slot for pagination or other footer content -->
  <Pagination prev={prev} next={next} />
</Body>
```

### Structure

```html
<main class="docs-content">
  <article class="docs-article">
    <header class="docs-header">
      <h1 class="docs-title">Title</h1>
      <p class="docs-description">Description</p>
    </header>

    <div class="docs-body">
      <!-- content HTML inserted here -->
    </div>

    <slot />  <!-- Pagination goes here -->
  </article>
</main>
```

### Slot

The body component has a default slot for additional content below the main body:

```astro
<Body title={title} content={content}>
  <Pagination prev={prev} next={next} />
  <Feedback />  <!-- Custom component -->
</Body>
```

## Outline

The outline component renders a table of contents from headings.

**File:** `src/layouts/docs/components/outline/default/Outline.astro`

### Props

```typescript
interface Props {
  headings: Heading[];    // Array of headings
  title?: string;         // Optional title (default: "On this page")
}

interface Heading {
  depth: number;          // 1-6
  slug: string;           // ID for linking
  text: string;           // Display text
}
```

### Usage

```astro
---
import Outline from '../../components/outline/default/Outline.astro';

// Filter headings (typically h2 and h3)
const outlineHeadings = headings.filter(h => h.depth >= 2 && h.depth <= 3);
---

{outlineHeadings.length > 0 && (
  <Outline headings={outlineHeadings} title="On this page" />
)}
```

### Features

- **Scroll spy**: Highlights current section as you scroll
- **Smooth scroll**: Clicking jumps to section smoothly
- **Indentation**: Nested headings are indented
- **Sticky positioning**: Stays visible while scrolling

### Filtering Headings

Control which headings appear via settings:

```typescript
const outlineLevels = settings.outline?.levels || [2, 3];
const outlineHeadings = headings.filter(h => outlineLevels.includes(h.depth));
```

## Pagination

The pagination component renders prev/next navigation links.

**File:** `src/layouts/docs/components/common/Pagination.astro`

### Props

```typescript
interface Props {
  prev?: NavigationItem | null;
  next?: NavigationItem | null;
}

interface NavigationItem {
  title: string;    // Display text
  href: string;     // Link URL
}
```

### Usage

```astro
---
import Pagination from '../../components/common/Pagination.astro';
import { getPrevNext } from '@/hooks/useSidebar';

const { prev, next } = getPrevNext(sidebarSections, currentPath);
---

{(prev || next) && (
  <Pagination prev={prev} next={next} />
)}
```

### Structure

```html
<nav class="pagination">
  <a href="/docs/previous" class="pagination__link pagination__link--prev">
    <span class="pagination__direction">← Previous</span>
    <span class="pagination__title">Previous Page Title</span>
  </a>

  <a href="/docs/next" class="pagination__link pagination__link--next">
    <span class="pagination__direction">Next →</span>
    <span class="pagination__title">Next Page Title</span>
  </a>
</nav>
```

## Creating Custom Components

You can create custom component variants:

### 1. Create Component Folder

```bash
mkdir -p src/layouts/docs/components/sidebar/modern/
```

### 2. Create Component

```astro
---
// src/layouts/docs/components/sidebar/modern/Sidebar.astro
interface Props {
  nodes: SidebarNode[];    // Mixed: items (root files) + sections (folders)
  currentPath: string;
}

const { nodes, currentPath } = Astro.props;
---

<nav class="modern-sidebar">
  <!-- Your custom implementation -->
</nav>

<style>
  .modern-sidebar {
    /* Your styles */
  }
</style>
```

### 3. Use in Layout

```astro
---
// In your layout
import Sidebar from '../../components/sidebar/modern/Sidebar.astro';
---
```

## Component Composition Example

Here's how `doc_style1` composes components:

```astro
---
import Sidebar from '../../components/sidebar/default/Sidebar.astro';
import Body from '../../components/body/default/Body.astro';
import Outline from '../../components/outline/default/Outline.astro';
import Pagination from '../../components/common/Pagination.astro';

// Import styles
import '../../components/sidebar/default/styles.css';
import '../../components/body/default/styles.css';
import '../../components/outline/default/styles.css';
import '../../components/common/styles.css';
import './layout.css';

// ... props and data loading ...
---

<div class="docs-layout">
  <Sidebar nodes={sidebarNodes} currentPath={currentPath} />

  <Body title={title} description={description} content={content}>
    {paginationEnabled && <Pagination prev={prev} next={next} />}
  </Body>

  {outlineEnabled && <Outline headings={outlineHeadings} />}
</div>
```

The layout CSS handles the grid arrangement:

```css
/* layout.css */
.docs-layout {
  display: grid;
  grid-template-columns: 280px 1fr 220px;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}
```
