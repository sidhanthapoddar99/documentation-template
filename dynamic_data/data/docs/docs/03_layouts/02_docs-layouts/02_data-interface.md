---
title: Data Interface
description: What data docs layouts receive and how to use it
---

# Data Interface

Docs layouts receive processed content, not raw markdown. Understanding this interface is essential for creating or customizing layouts.

## What Layouts Receive

The layout receives **three types of data** with different sources:

| Data | Received As | Source | Layout Responsibility |
|------|-------------|--------|----------------------|
| **Current page content** | Rendered HTML string (`content`) | Route handler (pre-processed) | Just inject with `set:html` |
| **Outline/TOC headings** | Array of heading objects (`headings`) | Route handler (pre-extracted) | Filter and render |
| **Sidebar/navigation** | Path to data folder (`dataPath`) | Route handler passes path | Load and build tree |

```
Route Handler ([...slug].astro)
─────────────────────────────────
1. Loads current page markdown
2. Runs parser pipeline → HTML
3. Extracts headings during parsing
4. Passes to layout:
   • content: "<h1>...</h1>"           ← Already rendered HTML
   • headings: [{depth, slug, text}]   ← Already extracted array
   • dataPath: "/path/to/docs"         ← Just a path string
   • title, description, etc.
            │
            ▼
Layout (doc_style1)
───────────────────
• Page content: Just render it (already HTML)
• Outline: Filter headings array, render links
• Sidebar: Must load data using dataPath, then build tree
```

**Summary:**
- **Content & Headings** → Pre-processed by route handler, layout just renders
- **Sidebar** → Layout must load and build (route handler only passes path)

## Props Interface

Every docs layout receives these props:

```typescript
interface DocsLayoutProps {
  // Content metadata (from frontmatter)
  title: string;              // Page title (required)
  description?: string;       // Page description

  // Path information
  dataPath: string;           // Absolute path to docs folder
  baseUrl: string;            // Base URL (e.g., "/docs")
  currentSlug: string;        // Current page slug

  // Rendered content
  content: string;            // HTML string (processed markdown)
  headings?: Heading[];       // Extracted headings for TOC
}

interface Heading {
  depth: number;    // 1-6 (h1-h6)
  slug: string;     // URL-safe ID (e.g., "getting-started")
  text: string;     // Heading text content
}
```

## Content Processing Pipeline

The `content` prop contains **fully processed HTML**, not raw markdown:

```
Raw Markdown                    Processed HTML (content prop)
─────────────                   ────────────────────────────
# Hello World                   <h1 id="hello-world">Hello World</h1>

Some **bold** text.        →    <p>Some <strong>bold</strong> text.</p>

\[[./assets/code.py]]            <pre><code>print("hello")</code></pre>
```

### What's Already Done

By the time content reaches the layout:

| Processing | Status | Example |
|------------|--------|---------|
| Markdown → HTML | ✅ Done | `**bold**` → `<strong>bold</strong>` |
| Heading IDs | ✅ Done | `<h2>` → `<h2 id="slug">` |
| Asset embedding | ✅ Done | `\[[./code.py]]` → `<pre><code>...</code></pre>` |
| External links | ✅ Done | `<a>` gets `target="_blank"` |
| Custom tags | ✅ Done | `<callout>` → styled HTML |
| Code highlighting | ✅ Done | Syntax highlighted |

### Rendering Content

Use Astro's `set:html` directive to render the HTML string:

```astro
---
const { content } = Astro.props;
---

<div class="content">
  <Fragment set:html={content} />
</div>
```

**Important:** Never use `{content}` directly — it will escape the HTML.

## Headings Array

The `headings` prop is an array of extracted headings for building table of contents:

```typescript
// Example headings array
[
  { depth: 2, slug: "installation", text: "Installation" },
  { depth: 3, slug: "prerequisites", text: "Prerequisites" },
  { depth: 3, slug: "npm-install", text: "NPM Install" },
  { depth: 2, slug: "configuration", text: "Configuration" },
]
```

### Building Outline/TOC

```astro
---
const { headings = [] } = Astro.props;

// Filter to show only h2 and h3
const tocHeadings = headings.filter(h => h.depth >= 2 && h.depth <= 3);
---

<nav class="toc">
  <ul>
    {tocHeadings.map(heading => (
      <li class={`depth-${heading.depth}`}>
        <a href={`#${heading.slug}`}>{heading.text}</a>
      </li>
    ))}
  </ul>
</nav>
```

## Path Information

### dataPath

Absolute filesystem path to the docs content folder:

```typescript
const { dataPath } = Astro.props;
// "/Users/.../dynamic_data/data/docs"
```

Used to:
- Load all content for sidebar building
- Load folder settings
- Resolve relative asset paths

### baseUrl

The URL prefix for docs pages:

```typescript
const { baseUrl } = Astro.props;
// "/docs"
```

Used to:
- Build navigation links
- Determine current page state
- Generate pagination URLs

### currentSlug

The slug of the current page (without base URL):

```typescript
const { currentSlug } = Astro.props;
// "getting-started/overview"
```

Used to:
- Highlight current page in sidebar
- Build current URL: `${baseUrl}/${currentSlug}`

## Loading Additional Data

Layouts can load additional data using loaders:

### Loading Sidebar Content

```typescript
import { loadContentWithSettings } from '@loaders/data';

const { dataPath } = Astro.props;
const { content, settings } = await loadContentWithSettings(dataPath);

// content: Array of all docs in the folder
// settings: Object from settings.json
```

### Building Sidebar Tree

```typescript
import { buildSidebarTree, getPrevNext } from '@/hooks/useSidebar';

const sidebarSections = buildSidebarTree(content, baseUrl, dataPath);
const { prev, next } = getPrevNext(sidebarSections, currentPath);
```

## Example: Full Layout Implementation

```astro
---
import { loadContentWithSettings } from '@loaders/data';
import { buildSidebarTree, getPrevNext } from '@/hooks/useSidebar';

import Sidebar from '../../components/sidebar/default/Sidebar.astro';
import Body from '../../components/body/default/Body.astro';
import Outline from '../../components/outline/default/Outline.astro';
import Pagination from '../../components/common/Pagination.astro';

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

// Load sidebar data
const { content: allContent, settings } = await loadContentWithSettings(dataPath);
const sidebarSections = buildSidebarTree(allContent, baseUrl, dataPath);

// Pagination
const currentPath = `${baseUrl}/${currentSlug}`;
const { prev, next } = getPrevNext(sidebarSections, currentPath);

// Filter headings for outline
const outlineHeadings = headings.filter(h => h.depth >= 2 && h.depth <= 3);
---

<div class="docs-layout">
  <Sidebar sections={sidebarSections} currentPath={currentPath} />

  <Body title={title} description={description} content={content}>
    <Pagination prev={prev} next={next} />
  </Body>

  {outlineHeadings.length > 0 && (
    <Outline headings={outlineHeadings} />
  )}
</div>
```

## Type Definitions

For TypeScript support, import types from loaders:

```typescript
import type { LoadedContent, ContentSettings } from '@loaders/data';

// LoadedContent shape:
interface LoadedContent {
  id: string;
  slug: string;
  content: string;
  data: {
    title: string;
    description?: string;
    sidebar_label?: string;
    sidebar_position?: number;
    draft?: boolean;
  };
  filePath: string;
  relativePath: string;
}
```
