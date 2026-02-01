---
title: Conventions
description: Best practices and conventions for blog layouts
---

# Blog Layout Conventions

Follow these conventions when creating or customizing blog layouts.

## File Naming

### Layout Files

```
src/layouts/blogs/styles/{style_name}/
├── IndexLayout.astro    # Required - post listing
├── PostLayout.astro     # Required - single post
├── styles.css           # Optional - shared styles
└── index.ts             # Optional - exports
```

**Rules:**
- Style folder uses `snake_case`: `blog_style1`, `minimal_blog`
- Must have both `IndexLayout.astro` and `PostLayout.astro`
- File names are exact (PascalCase with "Layout" suffix)

### Component Files

```
src/layouts/blogs/components/{component}/{variant}/
├── {Component}.astro    # PascalCase component name
└── styles.css           # Associated styles
```

## Props Interfaces

### IndexLayout Required Interface

```typescript
interface Props {
  dataPath: string;
  postsPerPage?: number;
}
```

### PostLayout Required Interface

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

**Do not:**
- Add required props not passed by the route handler
- Rename existing props

## Content Loading

### Always Load in IndexLayout

IndexLayout should load posts internally:

```typescript
const posts = await loadContent(dataPath, {
  pattern: '*.{md,mdx}',
  sort: 'date',
  order: 'desc',
});
```

### Error Handling

```typescript
let posts: LoadedContent[] = [];

try {
  posts = await loadContent(dataPath, {
    pattern: '*.{md,mdx}',
    sort: 'date',
    order: 'desc',
  });
} catch (error) {
  console.error('Error loading blog posts:', error);
}
```

### Empty State

```astro
{posts.length > 0 ? (
  <div class="post-grid">
    {posts.map(post => <PostCard {...} />)}
  </div>
) : (
  <div class="empty-state">
    <p>No posts yet. Check back soon!</p>
  </div>
)}
```

## Date Handling

### Display Format

Use consistent date formatting:

```typescript
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
```

### Semantic HTML

Always use `<time>` with `datetime` attribute:

```astro
<time datetime={date}>
  {formatDate(date)}
</time>
```

### Sort Order

Blog posts should default to newest first:

```typescript
const posts = await loadContent(dataPath, {
  sort: 'date',
  order: 'desc',    // Newest first
});
```

## Card Design

### Required Elements

Post cards should include at minimum:
- Title (linked)
- Date
- Description or excerpt

### Optional Elements

- Featured image
- Author
- Tags (limit to 3-4 visible)
- Read time

### Accessibility

```astro
<a href={href} class="post-card">
  {image && <img src={image} alt="" />}  <!-- Decorative, empty alt -->
  <h3>{title}</h3>  <!-- Title provides context -->
</a>
```

### Hover States

```css
.post-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.post-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

## Grid Layout

### Responsive Grid

```css
.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

@media (max-width: 640px) {
  .post-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
```

### Consistent Card Heights

```css
.post-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.post-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.post-card__description {
  flex: 1;
}
```

## Post Page

### Content Width

Limit content width for readability:

```css
.blog-post {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 1rem;
}
```

### Typography

```css
.blog-post__content {
  font-size: 1.125rem;
  line-height: 1.75;
}

.blog-post__content h2 {
  margin-top: 2rem;
}

.blog-post__content p {
  margin-bottom: 1.5rem;
}
```

### Images

```css
.blog-post__content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 2rem 0;
}
```

## Tags

### Display Limit

Show limited tags on cards:

```astro
{tags && tags.length > 0 && (
  <div class="tags">
    {tags.slice(0, 3).map(tag => (
      <span class="tag">{tag}</span>
    ))}
    {tags.length > 3 && (
      <span class="tag-more">+{tags.length - 3}</span>
    )}
  </div>
)}
```

### Tag Styling

```css
.tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  color: var(--color-text-secondary);
}
```

## Metadata Section

### Post Header

```astro
<header class="blog-post__header">
  <h1>{title}</h1>

  <div class="blog-post__meta">
    {author && (
      <span class="meta-item">
        <span class="meta-label">By</span>
        <span class="meta-value">{author}</span>
      </span>
    )}

    {date && (
      <span class="meta-item">
        <time datetime={date}>{formatDate(date)}</time>
      </span>
    )}
  </div>
</header>
```

### Separator

```css
.blog-post__meta {
  display: flex;
  gap: 1rem;
  color: var(--color-text-secondary);
}

.meta-item:not(:last-child)::after {
  content: '·';
  margin-left: 1rem;
}
```

## Testing Checklist

Before shipping a blog layout:

- [ ] Index shows posts sorted by date (newest first)
- [ ] Cards display all metadata correctly
- [ ] Post pages render content properly
- [ ] Tags display on both index and post
- [ ] Dates format correctly
- [ ] Images load with proper sizing
- [ ] Responsive: cards stack on mobile
- [ ] Empty state shows when no posts
- [ ] Draft posts hidden in production
- [ ] Links work (card click, tag links)

## Example: Complete Blog Layout

```
src/layouts/blogs/styles/blog_style2/
├── IndexLayout.astro
├── PostLayout.astro
└── styles.css
```

**IndexLayout.astro:**

```astro
---
import { loadContent, type LoadedContent } from '@loaders/data';
import PostCard from '../../components/cards/default/PostCard.astro';
import '../../components/cards/default/styles.css';
import './styles.css';

interface Props {
  dataPath: string;
  postsPerPage?: number;
}

const { dataPath, postsPerPage = 12 } = Astro.props;

let posts: LoadedContent[] = [];
try {
  posts = await loadContent(dataPath, {
    pattern: '*.{md,mdx}',
    sort: 'date',
    order: 'desc',
  });
} catch (error) {
  console.error('Error loading posts:', error);
}
---

<div class="blog-index">
  <header>
    <h1>Blog</h1>
  </header>

  {posts.length > 0 ? (
    <div class="post-grid">
      {posts.slice(0, postsPerPage).map(post => (
        <PostCard
          title={post.data.title}
          description={post.data.description}
          date={post.data.date as string}
          href={`/blog/${post.slug}`}
          image={post.data.image as string}
          tags={post.data.tags as string[]}
        />
      ))}
    </div>
  ) : (
    <p class="empty">No posts yet.</p>
  )}
</div>
```

**PostLayout.astro:**

```astro
---
import PostBody from '../../components/body/default/PostBody.astro';
import './styles.css';

interface Props {
  title: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  content: string;
}
---

<PostBody {...Astro.props} />
```
