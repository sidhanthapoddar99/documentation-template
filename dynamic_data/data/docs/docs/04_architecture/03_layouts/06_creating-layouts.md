---
title: Creating Custom Layouts
description: Step-by-step guide to creating new layout styles
sidebar_position: 6
---

# Creating Custom Layouts

This guide walks through creating a new layout style that integrates with the existing system.

## Quick Start

To add a new docs layout `doc_style3`:

```bash
# 1. Create the folder
mkdir -p src/layouts/docs/styles/doc_style3

# 2. Create Layout.astro
touch src/layouts/docs/styles/doc_style3/Layout.astro

# 3. Reference in site.yaml
# layout: "@docs/doc_style3"
```

That's it — the glob discovery system finds it automatically.

## Step-by-Step: New Docs Layout

### 1. Create the Layout File

**File:** `src/layouts/docs/styles/doc_style3/Layout.astro`

```astro
---
// Import shared components
import Sidebar from '../../components/sidebar/default/Sidebar.astro';
import Body from '../../components/body/default/Body.astro';
import Outline from '../../components/outline/default/Outline.astro';
import Pagination from '../../components/common/Pagination.astro';

// Import hooks
import { buildSidebarTree, getPrevNext } from '@/hooks/useSidebar';
import { loadContentWithSettings } from '@loaders/data';

// Define props interface (must match what [...slug].astro passes)
interface Props {
  title: string;
  description?: string;
  dataPath: string;
  baseUrl: string;
  currentSlug: string;
  content: string;
  headings?: { depth: number; slug: string; text: string }[];
}

const { title, description, dataPath, baseUrl, currentSlug, content, headings } = Astro.props;

// Load sidebar data
const { content: allContent, settings } = await loadContentWithSettings(dataPath);
const sidebarNodes = buildSidebarTree(allContent, baseUrl, dataPath);
const currentPath = `${baseUrl}/${currentSlug}`;
const { prev, next } = getPrevNext(sidebarNodes, currentPath);
---

<div class="docs-layout doc-style3">
  <!-- Your custom structure here -->
  <Sidebar nodes={sidebarNodes} currentPath={currentPath} />

  <div class="main-area">
    <Body title={title} description={description} content={content}>
      <Pagination prev={prev} next={next} />
    </Body>

    {headings && headings.length > 0 && (
      <Outline headings={headings} />
    )}
  </div>
</div>

<style>
  .doc-style3 {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  .main-area {
    display: flex;
    gap: 2rem;
  }
</style>
```

### 2. Update Configuration

**File:** `dynamic_data/config/site.yaml`

```yaml
pages:
  docs:
    base_url: "/docs"
    type: docs
    layout: "@docs/doc_style3"  # ← Use your new layout
    data: "@data/docs"
```

### 3. Build and Test

```bash
npm run build
```

If the layout file is missing or malformed, you'll see a descriptive error.

## Props Reference

### Docs Layout Props

```typescript
interface DocsLayoutProps {
  // Content metadata
  title: string;           // From frontmatter (required)
  description?: string;    // From frontmatter

  // Path information
  dataPath: string;        // Resolved path to docs folder
  baseUrl: string;         // Base URL (e.g., "/docs")
  currentSlug: string;     // Current page slug

  // Rendered content
  content: string;         // HTML from parser pipeline
  headings?: Heading[];    // Extracted headings for TOC
}

interface Heading {
  depth: number;   // 1-6
  slug: string;    // URL-safe ID
  text: string;    // Heading text
}
```

### Blog Layout Props

```typescript
// IndexLayout
interface BlogIndexProps {
  title: string;
  dataPath: string;
  baseUrl: string;
}

// PostLayout
interface BlogPostProps {
  title: string;
  description?: string;
  date: string;
  author?: string;
  tags?: string[];
  content: string;
}
```

### Custom Layout Props

Custom layouts receive whatever data structure is in the YAML/Markdown file:

```typescript
interface CustomLayoutProps {
  dataPath: string;
  baseUrl: string;
  // Plus any data from the source file
}
```

## Using Shared Components

Import from the components folder:

```typescript
// Docs components
import Sidebar from '../../components/sidebar/default/Sidebar.astro';
import Body from '../../components/body/default/Body.astro';
import Outline from '../../components/outline/default/Outline.astro';
import Pagination from '../../components/common/Pagination.astro';

// Or create your own in the same layout folder
import CustomHeader from './CustomHeader.astro';
```

## Creating Custom Components

Add components specific to your layout:

```
src/layouts/docs/styles/doc_style3/
├── Layout.astro
├── CustomHeader.astro    ← Layout-specific component
├── CustomSidebar.astro
└── styles.css            ← Optional separate styles
```

## Creating a New Blog Layout

### IndexLayout

**File:** `src/layouts/blogs/styles/blog_style2/IndexLayout.astro`

```astro
---
import { loadContent } from '@loaders/data';

interface Props {
  title: string;
  dataPath: string;
  baseUrl: string;
}

const { title, dataPath, baseUrl } = Astro.props;
const posts = await loadContent(dataPath, 'blog', { sort: 'date', order: 'desc' });
---

<div class="blog-index style2">
  <h1>{title}</h1>

  <!-- Custom list layout instead of cards -->
  <ul class="post-list">
    {posts.map(post => (
      <li>
        <a href={`${baseUrl}/${post.slug}`}>
          <time>{post.data.date}</time>
          <span>{post.data.title}</span>
        </a>
      </li>
    ))}
  </ul>
</div>
```

### PostLayout

**File:** `src/layouts/blogs/styles/blog_style2/PostLayout.astro`

```astro
---
interface Props {
  title: string;
  description?: string;
  date: string;
  author?: string;
  tags?: string[];
  content: string;
}

const { title, date, author, content, tags } = Astro.props;
---

<article class="blog-post style2">
  <header>
    <h1>{title}</h1>
    <p class="meta">{author} · {date}</p>
  </header>

  <div class="content" set:html={content} />

  {tags && (
    <div class="tags">
      {tags.map(tag => <span class="tag">#{tag}</span>)}
    </div>
  )}
</article>
```

## Creating a Custom Page Layout

**File:** `src/layouts/custom/styles/landing/Layout.astro`

```astro
---
import { loadFile } from '@loaders/data';

interface Props {
  dataPath: string;
  baseUrl: string;
}

const { dataPath } = Astro.props;
const data = await loadFile(dataPath);
---

<div class="landing-page">
  <section class="hero">
    <h1>{data.hero.title}</h1>
    <p>{data.hero.subtitle}</p>
  </section>

  <section class="features">
    {data.features.map(feature => (
      <div class="feature">
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
      </div>
    ))}
  </section>
</div>
```

**Data file:** `dynamic_data/data/pages/landing.yaml`

```yaml
hero:
  title: "My Product"
  subtitle: "The best solution"

features:
  - title: "Fast"
    description: "Lightning quick"
  - title: "Simple"
    description: "Easy to use"
```

## Layout Variants Pattern

For minor variations, use props instead of separate layouts:

```astro
---
interface Props {
  // ... standard props
  variant?: 'default' | 'wide' | 'minimal';
}

const { variant = 'default' } = Astro.props;
---

<div class={`docs-layout ${variant}`}>
  <!-- Content -->
</div>

<style>
  .docs-layout.wide {
    max-width: 1600px;
  }

  .docs-layout.minimal .sidebar {
    display: none;
  }
</style>
```

## Checklist

When creating a new layout:

- [ ] Create folder in correct location (`styles/{name}/`)
- [ ] Create `Layout.astro` (or `IndexLayout.astro`/`PostLayout.astro` for blog)
- [ ] Implement required props interface
- [ ] Import and use shared components or create custom ones
- [ ] Add scoped styles
- [ ] Test with `npm run build`
- [ ] Update `site.yaml` to use new layout
