---
title: Components
description: Reusable components for blog layouts
---

# Blog Components

Blog layouts compose from shared components located in `src/layouts/blogs/components/`. These components handle the index grid and individual post rendering.

## Component Directory

```
src/layouts/blogs/components/
├── body/
│   └── default/
│       ├── IndexBody.astro     # Post listing grid
│       ├── PostBody.astro      # Single post content
│       └── styles.css
│
├── cards/
│   └── default/
│       ├── PostCard.astro      # Individual post card
│       └── styles.css
│
└── common/
    └── index-styles.css        # Shared index styles
```

## IndexBody

The IndexBody component renders the blog index page with a grid of post cards.

**File:** `src/layouts/blogs/components/body/default/IndexBody.astro`

### Props

```typescript
interface Props {
  dataPath: string;           // Path to blog folder
  postsPerPage?: number;      // Max posts to show (default: 10)
}
```

### Internal Logic

IndexBody loads posts internally:

```astro
---
import PostCard from '../../cards/default/PostCard.astro';
import { loadContent } from '@loaders/data';

interface Props {
  dataPath: string;
  postsPerPage?: number;
}

const { dataPath, postsPerPage = 10 } = Astro.props;

const posts = await loadContent(dataPath, {
  pattern: '*.{md,mdx}',
  sort: 'date',
  order: 'desc',
});
---

<div class="blog-index">
  <header class="blog-index__header">
    <h1>Blog</h1>
    <p>Latest posts and updates</p>
  </header>

  <div class="blog-index__grid">
    {posts.slice(0, postsPerPage).map(post => (
      <PostCard
        title={post.data.title}
        description={post.data.description}
        date={post.data.date}
        author={post.data.author}
        tags={post.data.tags}
        href={`/blog/${post.slug}`}
        image={post.data.image}
      />
    ))}
  </div>
</div>
```

### Usage in Layout

```astro
---
// IndexLayout.astro
import IndexBody from '../../components/body/default/IndexBody.astro';

interface Props {
  dataPath: string;
  postsPerPage?: number;
}

const props = Astro.props;
---

<IndexBody {...props} />
```

### Customization

The grid layout is CSS-based:

```css
.blog-index__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}
```

## PostBody

The PostBody component renders a single blog post with metadata.

**File:** `src/layouts/blogs/components/body/default/PostBody.astro`

### Props

```typescript
interface Props {
  title: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  content: string;
}
```

### Structure

```astro
---
interface Props {
  title: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  content: string;
}

const { title, description, date, author, tags, content } = Astro.props;

const formattedDate = date
  ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  : null;
---

<article class="blog-post">
  <header class="blog-post__header">
    <h1 class="blog-post__title">{title}</h1>

    <div class="blog-post__meta">
      {author && <span class="blog-post__author">{author}</span>}
      {formattedDate && <time>{formattedDate}</time>}
    </div>
  </header>

  <div class="blog-post__content">
    <Fragment set:html={content} />
  </div>

  {tags && tags.length > 0 && (
    <footer class="blog-post__tags">
      {tags.map(tag => <span class="tag">{tag}</span>)}
    </footer>
  )}
</article>
```

### Usage in Layout

```astro
---
// PostLayout.astro
import PostBody from '../../components/body/default/PostBody.astro';

interface Props {
  title: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  content: string;
}

const props = Astro.props;
---

<PostBody {...props} />
```

## PostCard

The PostCard component renders an individual post preview card.

**File:** `src/layouts/blogs/components/cards/default/PostCard.astro`

### Props

```typescript
interface Props {
  title: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  href: string;
  image?: string;
}
```

### Structure

```astro
---
interface Props {
  title: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  href: string;
  image?: string;
}

const { title, description, date, author, tags, href, image } = Astro.props;

const formattedDate = date
  ? new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  : null;
---

<a href={href} class="post-card">
  {image && (
    <div class="post-card__image">
      <img src={image} alt="" loading="lazy" />
    </div>
  )}

  <div class="post-card__content">
    <h3 class="post-card__title">{title}</h3>

    <div class="post-card__meta">
      {formattedDate && <time>{formattedDate}</time>}
      {author && <span>by {author}</span>}
    </div>

    {description && (
      <p class="post-card__description">{description}</p>
    )}

    {tags && tags.length > 0 && (
      <div class="post-card__tags">
        {tags.slice(0, 3).map(tag => (
          <span class="tag">{tag}</span>
        ))}
      </div>
    )}
  </div>
</a>
```

### Styling

```css
.post-card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-secondary);
  transition: transform 0.2s, box-shadow 0.2s;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-card__image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.post-card__content {
  padding: 1.5rem;
}
```

## Creating Custom Components

### Custom Card Style

Create a new card variant:

```bash
mkdir -p src/layouts/blogs/components/cards/compact/
```

```astro
---
// cards/compact/PostCard.astro
interface Props {
  title: string;
  date?: string;
  href: string;
}

const { title, date, href } = Astro.props;
---

<a href={href} class="compact-card">
  <span class="compact-card__title">{title}</span>
  {date && <time>{date}</time>}
</a>

<style>
  .compact-card {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);
  }
</style>
```

### Using in Layout

```astro
---
// Your custom IndexLayout
import PostCard from '../../components/cards/compact/PostCard.astro';
---
```

## Component Composition Example

A full blog layout style composition:

```astro
---
// blog_style2/IndexLayout.astro
import { loadContent } from '@loaders/data';

// Use compact cards
import PostCard from '../../components/cards/compact/PostCard.astro';

// Custom styles
import './index-styles.css';

interface Props {
  dataPath: string;
}

const { dataPath } = Astro.props;

const posts = await loadContent(dataPath, {
  pattern: '*.{md,mdx}',
  sort: 'date',
  order: 'desc',
});
---

<div class="blog-list-style">
  <h1>Blog</h1>

  <ul class="post-list">
    {posts.map(post => (
      <li>
        <PostCard
          title={post.data.title}
          date={post.data.date}
          href={`/blog/${post.slug}`}
        />
      </li>
    ))}
  </ul>
</div>
```

## Style Imports

When using components, import their styles:

```astro
---
import IndexBody from '../../components/body/default/IndexBody.astro';

// Import component styles
import '../../components/common/index-styles.css';
import '../../components/cards/default/styles.css';
---
```

Or import all styles in a central location:

```css
/* blog_style1/styles.css */
@import '../../components/common/index-styles.css';
@import '../../components/cards/default/styles.css';
@import '../../components/body/default/styles.css';
```
