---
title: Routing System
description: How URLs map to pages
---

# Routing System

The template uses a single dynamic route to handle all pages.

## Single Entry Point

All routes flow through `src/pages/[...slug].astro`:

```
/                           → [...slug].astro (slug = undefined)
/docs                       → [...slug].astro (slug = ["docs"])
/docs/getting-started       → [...slug].astro (slug = ["docs", "getting-started"])
/docs/getting-started/intro → [...slug].astro (slug = ["docs", "getting-started", "intro"])
/blog                       → [...slug].astro (slug = ["blog"])
/blog/my-post               → [...slug].astro (slug = ["blog", "my-post"])
```

## Route Resolution

### Step 1: Match Page Config

The slug is matched against page configurations:

```yaml
# site.yaml
pages:
  docs:
    base_url: "/docs"      # Matches /docs/*
  blog:
    base_url: "/blog"      # Matches /blog/*
  home:
    base_url: "/"          # Matches / exactly
```

### Step 2: Determine Content Path

For `/docs/getting-started/overview`:

1. Match `docs` page config (base_url: `/docs`)
2. Remaining path: `getting-started/overview`
3. Content path: `data/docs/getting-started/XX_overview.mdx`

### Step 3: Load Layout

Resolve the layout alias:

```yaml
pages:
  docs:
    layout: "@docs/doc_style1"
```

Maps to: `src/layouts/docs/styles/doc_style1/Layout.astro`

### Step 4: Render

Layout receives:
- `content`: The MDX content
- `frontmatter`: Parsed frontmatter
- `sidebar`: Tree structure for navigation
- `pagination`: Previous/next links

## Static Path Generation

At build time, `getStaticPaths()` generates all routes:

```typescript
export async function getStaticPaths() {
  const paths = [];

  // For each page in config
  for (const [name, config] of Object.entries(pagesConfig)) {
    if (config.type === 'docs') {
      // Load all docs and create path for each
      const docs = await loadContent(config.data);
      for (const doc of docs.items) {
        paths.push({
          params: { slug: `docs/${doc.slug}`.split('/') },
          props: { pageConfig: config, content: doc }
        });
      }
    }
    // ... handle blog, custom pages
  }

  return paths;
}
```

## URL Structure

### Documentation URLs

```
File:  data/docs/getting-started/01_overview.mdx
URL:   /docs/getting-started/overview
       └─┬─┘ └───────┬───────┘ └───┬───┘
      base_url    folder      clean slug
```

The `01_` prefix is stripped from the URL.

### Blog URLs

```
File:  data/blog/2024-01-15-my-first-post.mdx
URL:   /blog/my-first-post
       └─┬─┘ └─────┬─────┘
     base_url  clean slug (date stripped)
```

### Custom Page URLs

```
Config: base_url: "/about"
URL:    /about
```

Custom pages have exact URL matching.

## Layout Resolution

Layout aliases are resolved at build time:

```
@docs/doc_style1
  ↓
src/layouts/docs/styles/doc_style1/Layout.astro

@blogs/blog_style1
  ↓
src/layouts/blogs/styles/blog_style1/IndexLayout.astro  (for /blog)
src/layouts/blogs/styles/blog_style1/PostLayout.astro   (for /blog/*)

@custom/home
  ↓
src/layouts/custom/styles/home/Layout.astro
```

### Validation

If a layout doesn't exist:

```
[CONFIG ERROR] Docs layout "nonexistent" does not exist.
  Page: docs
  Config: @docs/nonexistent
  Expected: src/layouts/docs/styles/nonexistent/Layout.astro
  Available: doc_style1, doc_style2
```

## Index Pages

### Documentation Index

`/docs` shows the first doc in the first section:

```
/docs → redirects to /docs/getting-started/overview
```

Or renders a custom index if `index.mdx` exists in `data/docs/`.

### Blog Index

`/blog` renders the blog index layout showing all posts:

```
/blog → IndexLayout.astro (list of posts)
/blog/my-post → PostLayout.astro (single post)
```

## 404 Handling

Unmatched routes fall through to Astro's default 404 handling.

Create `src/pages/404.astro` for a custom 404 page.
