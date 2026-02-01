---
title: Layout Components
description: Shared components used across layouts
sidebar_position: 4
---

# Layout Components

Each layout type has a `components/` folder containing reusable building blocks. Layouts compose from these shared components.

## Component Organization

```
src/layouts/
├── docs/
│   └── components/
│       ├── sidebar/default/Sidebar.astro
│       ├── body/default/Body.astro
│       ├── outline/default/Outline.astro
│       └── common/Pagination.astro
│
├── blogs/
│   └── components/
│       ├── body/
│       │   ├── IndexBody.astro
│       │   └── PostBody.astro
│       └── cards/default/PostCard.astro
│
├── custom/
│   └── components/
│       ├── hero/default/Hero.astro
│       ├── features/default/Features.astro
│       └── content/default/Content.astro
│
├── navbar/
│   ├── style1/index.astro
│   └── minimal/index.astro
│
└── footer/
    ├── default/index.astro
    └── minimal/index.astro
```

## Docs Components

### Sidebar

**File:** `src/layouts/docs/components/sidebar/default/Sidebar.astro`

Renders hierarchical navigation tree with collapsible sections.

```astro
---
interface Props {
  nodes: SidebarNode[];    // Mixed: items (root files) + sections (folders)
  currentPath: string;
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
  title: string;
  slug: string;
  href?: string;
  position: number;
  collapsed: boolean;
  collapsible: boolean;
  children: SidebarNode[];
}
---

<aside class="sidebar">
  {nodes.map(node => (
    node.type === 'item' ? (
      <a href={node.href}>{node.title}</a>
    ) : (
      <SidebarSection section={node} currentPath={currentPath} />
    )
  ))}
</aside>
```

**Features:**
- Recursive rendering for nested sections
- Collapsible sections with chevron icons
- Active state highlighting
- Reads `settings.json` for section labels

### Body

**File:** `src/layouts/docs/components/body/default/Body.astro`

Main content wrapper with title and description.

```astro
---
interface Props {
  title: string;
  description?: string;
  content: string;
}
---

<article class="doc-body">
  <header>
    <h1>{title}</h1>
    {description && <p class="description">{description}</p>}
  </header>

  <div class="content" set:html={content} />

  <slot />  <!-- For pagination -->
</article>
```

**Features:**
- Renders title and description from frontmatter
- Injects parsed HTML content
- Slot for additional content (pagination)

### Outline

**File:** `src/layouts/docs/components/outline/default/Outline.astro`

Table of contents with scroll spy.

```astro
---
interface Props {
  headings: Heading[];
  title?: string;
}

interface Heading {
  depth: number;   // 1-6
  slug: string;    // heading-id
  text: string;    // Heading text
}
---

<nav class="outline">
  <h4>{title || 'On this page'}</h4>
  <ul>
    {headings.filter(h => h.depth <= 3).map(heading => (
      <li class={`depth-${heading.depth}`}>
        <a href={`#${heading.slug}`}>{heading.text}</a>
      </li>
    ))}
  </ul>
</nav>
```

**Features:**
- Filters to show only h1-h3 by default
- Indentation based on heading depth
- Scroll spy highlights current section
- Smooth scroll on click

### Pagination

**File:** `src/layouts/docs/components/common/Pagination.astro`

Prev/Next navigation links.

```astro
---
interface Props {
  prev?: { title: string; href: string };
  next?: { title: string; href: string };
}
---

<nav class="pagination">
  {prev && (
    <a href={prev.href} class="prev">
      <span>← Previous</span>
      <span>{prev.title}</span>
    </a>
  )}
  {next && (
    <a href={next.href} class="next">
      <span>Next →</span>
      <span>{next.title}</span>
    </a>
  )}
</nav>
```

## Blog Components

### IndexBody

**File:** `src/layouts/blogs/components/body/IndexBody.astro`

Grid of post cards.

```astro
---
interface Props {
  posts: BlogPost[];
  baseUrl: string;
}
---

<div class="blog-index">
  <div class="post-grid">
    {posts.map(post => (
      <PostCard post={post} baseUrl={baseUrl} />
    ))}
  </div>
</div>
```

### PostBody

**File:** `src/layouts/blogs/components/body/PostBody.astro`

Single post with metadata.

```astro
---
interface Props {
  title: string;
  date: string;
  author?: string;
  tags?: string[];
  content: string;
}
---

<article class="blog-post">
  <header>
    <h1>{title}</h1>
    <div class="meta">
      {author && <span class="author">{author}</span>}
      <time>{formatDate(date)}</time>
    </div>
  </header>

  <div class="content" set:html={content} />

  {tags && (
    <footer class="tags">
      {tags.map(tag => <span class="tag">{tag}</span>)}
    </footer>
  )}
</article>
```

### PostCard

**File:** `src/layouts/blogs/components/cards/default/PostCard.astro`

Card for blog listing.

```astro
---
interface Props {
  post: {
    title: string;
    description?: string;
    date: string;
    slug: string;
    image?: string;
  };
  baseUrl: string;
}
---

<a href={`${baseUrl}/${post.slug}`} class="post-card">
  {post.image && <img src={post.image} alt="" />}
  <div class="content">
    <h3>{post.title}</h3>
    <time>{formatDate(post.date)}</time>
    {post.description && <p>{post.description}</p>}
  </div>
</a>
```

## Custom Components

### Hero

**File:** `src/layouts/custom/components/hero/default/Hero.astro`

Landing page hero section.

```astro
---
interface Props {
  title: string;
  subtitle?: string;
  cta?: {
    label: string;
    href: string;
  };
  image?: string;
}
---

<section class="hero">
  <div class="content">
    <h1>{title}</h1>
    {subtitle && <p>{subtitle}</p>}
    {cta && <a href={cta.href} class="cta-button">{cta.label}</a>}
  </div>
  {image && <img src={image} alt="" />}
</section>
```

### Features

**File:** `src/layouts/custom/components/features/default/Features.astro`

Feature grid section.

```astro
---
interface Props {
  features: {
    icon?: string;
    title: string;
    description: string;
  }[];
}
---

<section class="features">
  <div class="grid">
    {features.map(feature => (
      <div class="feature-card">
        {feature.icon && <span class="icon">{feature.icon}</span>}
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
      </div>
    ))}
  </div>
</section>
```

## Navbar Components

### NavbarStyle1

**File:** `src/layouts/navbar/style1/index.astro`

Full-featured navbar with logo, links, and dropdowns.

```astro
---
import { loadNavbarConfig, getSiteLogo } from '@loaders/config';

const config = loadNavbarConfig();
const logo = getSiteLogo();
---

<nav class="navbar">
  <a href="/" class="logo">
    <img src={logo.src} alt={logo.alt} />
  </a>

  <ul class="nav-items">
    {config.items.map(item => (
      <li>
        {item.children ? (
          <Dropdown item={item} />
        ) : (
          <a href={item.href}>{item.label}</a>
        )}
      </li>
    ))}
  </ul>

  <ThemeToggle />
</nav>
```

### NavbarMinimal

**File:** `src/layouts/navbar/minimal/index.astro`

Simple navbar with logo only.

## Footer Components

### FooterDefault

**File:** `src/layouts/footer/default/index.astro`

Multi-column footer with links and social icons.

```astro
---
import { loadFooterConfig } from '@loaders/config';

const config = loadFooterConfig();
---

<footer class="footer">
  <div class="columns">
    {config.columns.map(column => (
      <div class="column">
        <h4>{column.title}</h4>
        <ul>
          {column.links.map(link => (
            <li><a href={link.href}>{link.label}</a></li>
          ))}
        </ul>
      </div>
    ))}
  </div>

  <div class="bottom">
    <p>{config.copyright}</p>
    {config.social && <SocialLinks links={config.social} />}
  </div>
</footer>
```

## Composition Example

How `doc_style1` composes components:

```astro
---
// doc_style1/Layout.astro
import Sidebar from '../components/sidebar/default/Sidebar.astro';
import Body from '../components/body/default/Body.astro';
import Outline from '../components/outline/default/Outline.astro';
import Pagination from '../components/common/Pagination.astro';

const { content: allContent, settings } = await loadContentWithSettings(dataPath);
const sidebarNodes = buildSidebarTree(allContent, baseUrl, dataPath);
const { prev, next } = getPrevNext(sidebarNodes, currentPath);
---

<div class="docs-layout">
  <Sidebar
    nodes={sidebarNodes}
    currentPath={currentPath}
  />

  <Body title={title} description={description} content={content}>
    <Pagination prev={prev} next={next} />
  </Body>

  <Outline headings={headings} title={settings.outline?.title} />
</div>
```

Different layouts can mix and match components or exclude them entirely.
