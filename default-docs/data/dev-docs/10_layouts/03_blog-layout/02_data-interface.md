---
title: Data Interface
description: What data blog layouts receive and how to use it
---

# Data Interface

Blog layouts receive different data depending on the view type. IndexLayout gets minimal props and loads posts itself, while PostLayout receives the full processed post.

## What Layouts Receive

| Layout | Data Type | Received As | Layout Responsibility |
|--------|-----------|-------------|----------------------|
| **IndexLayout** | Post listing | Path only (`dataPath`) | Load all posts, render cards |
| **PostLayout** | Single post | Rendered HTML (`content`) | Just display it |

```
Route Handler ([...slug].astro)
─────────────────────────────────
For /blog (index):
  • Passes dataPath only
  • Layout loads and renders posts

For /blog/hello-world (post):
  • Loads markdown, runs parser → HTML
  • Passes content as rendered HTML
            │
            ▼
IndexLayout                      PostLayout
───────────                      ──────────
• Receives: dataPath             • Receives: content (HTML)
• Must: loadContent(dataPath)    • Just: set:html={content}
• Must: Render post cards        • Already processed
```

**Key point:** IndexLayout must load posts itself. PostLayout receives pre-rendered HTML.

## IndexLayout Props

The index layout receives minimal props and loads content internally:

```typescript
interface IndexLayoutProps {
  dataPath: string;         // Path to blog folder
  postsPerPage?: number;    // Optional pagination limit
}
```

### Loading Posts

IndexLayout loads posts using the data loader:

```typescript
import { loadContent } from '@loaders/data';

const { dataPath, postsPerPage = 10 } = Astro.props;

const posts = await loadContent(dataPath, 'blog', {
  pattern: '*.{md,mdx}',
  sort: 'date',
  order: 'desc',
});

// posts is an array of LoadedContent (includes headings)
```

### Post Array Structure

Each post in the array has this shape:

```typescript
interface LoadedContent {
  id: string;            // Unique identifier
  slug: string;          // URL slug (e.g., "hello-world")
  content: string;       // Rendered HTML (full post)
  headings: Heading[];   // Extracted headings (for TOC on long posts)
  data: {
    title: string;       // Post title
    description?: string; // Excerpt/summary
    date?: string;       // Publication date
    author?: string;     // Author name
    tags?: string[];     // Tag array
    image?: string;      // Featured image
    draft?: boolean;     // Draft status
  };
  filePath: string;      // Absolute file path
  relativePath: string;  // Relative path
}

interface Heading {
  depth: number;    // 1-6 (h1-h6)
  slug: string;     // URL-safe ID
  text: string;     // Heading text
}
```

### Example IndexLayout

```astro
---
import PostCard from '../../components/cards/default/PostCard.astro';
import { loadContent } from '@loaders/data';

interface Props {
  dataPath: string;
  postsPerPage?: number;
}

const { dataPath, postsPerPage = 10 } = Astro.props;

const posts = await loadContent(dataPath, 'blog', {
  pattern: '*.{md,mdx}',
  sort: 'date',
  order: 'desc',
});
---

<div class="blog-index">
  <h1>Blog</h1>

  <div class="post-grid">
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

## PostLayout Props

Post layouts receive the full processed post data:

```typescript
interface PostLayoutProps {
  // Content metadata (from frontmatter)
  title: string;              // Required
  description?: string;       // Optional summary

  // Post-specific fields
  date?: string;              // Publication date
  author?: string;            // Author name
  tags?: string[];            // Tag array

  // Rendered content
  content: string;            // HTML string (processed markdown)
}
```

### Content is Pre-Processed

Like docs, the `content` prop is **fully processed HTML**:

```
Raw Markdown                    content prop (HTML)
─────────────                   ───────────────────
# Introduction                  <h1>Introduction</h1>

Some **bold** text.        →    <p>Some <strong>bold</strong> text.</p>

```javascript                   <pre><code class="language-javascript">
console.log('hi');              console.log('hi');
```                             </code></pre>
```

### Example PostLayout

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

// Format date for display
const formattedDate = date
  ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  : null;
---

<article class="blog-post">
  <header>
    <h1>{title}</h1>

    <div class="meta">
      {author && <span class="author">By {author}</span>}
      {formattedDate && <time datetime={date}>{formattedDate}</time>}
    </div>

    {description && <p class="summary">{description}</p>}
  </header>

  <div class="content">
    <Fragment set:html={content} />
  </div>

  {tags && tags.length > 0 && (
    <footer class="tags">
      {tags.map(tag => (
        <span class="tag">{tag}</span>
      ))}
    </footer>
  )}
</article>
```

## Frontmatter to Props Mapping

| Frontmatter | Props | Type | Notes |
|-------------|-------|------|-------|
| `title` | `title` | string | Required |
| `description` | `description` | string | Optional |
| `date` | `date` | string | ISO format or filename date |
| `author` | `author` | string | Optional |
| `tags` | `tags` | string[] | Optional array |
| `image` | (via data) | string | For IndexLayout cards |
| `draft` | (filtered) | boolean | Hidden in production |

## Date Handling

Dates can come from two sources:

### 1. Filename (Default)

```
2024-01-15-hello-world.md → date: "2024-01-15"
```

### 2. Frontmatter (Override)

```yaml
---
title: Hello World
date: 2024-01-20    # Overrides filename date
---
```

### Formatting Dates

```typescript
// In your layout
const formattedDate = new Date(date).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
// "January 15, 2024"
```

## Working with Tags

### Displaying Tags

```astro
{tags && tags.length > 0 && (
  <div class="tags">
    {tags.map(tag => (
      <a href={`/blog/tags/${tag}`} class="tag">
        {tag}
      </a>
    ))}
  </div>
)}
```

### Getting All Tags (IndexLayout)

```typescript
// Collect all unique tags from posts
const allTags = [...new Set(
  posts.flatMap(post => post.data.tags || [])
)].sort();
```

## Featured Images

### In Post Data

```yaml
---
title: My Post
image: ./assets/cover.jpg
---
```

### Displaying in Card

```astro
<PostCard
  title={post.data.title}
  image={post.data.image}   <!-- Passed to card -->
  href={`/blog/${post.slug}`}
/>
```

### In PostCard Component

```astro
---
interface Props {
  title: string;
  image?: string;
  href: string;
  // ...
}

const { title, image, href } = Astro.props;
---

<a href={href} class="post-card">
  {image && (
    <div class="card-image">
      <img src={image} alt="" loading="lazy" />
    </div>
  )}
  <h3>{title}</h3>
</a>
```

## Type Definitions

For TypeScript, import types:

```typescript
import type { LoadedContent, Heading } from '@loaders/data';

// Then use in your components
const posts: LoadedContent[] = await loadContent(dataPath, 'blog', options);

// Access headings for TOC (on long posts)
const headings: Heading[] = post.headings;
```
