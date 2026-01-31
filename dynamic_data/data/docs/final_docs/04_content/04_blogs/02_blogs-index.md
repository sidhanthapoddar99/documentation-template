---
title: Blog Index
description: How the blog listing page works
sidebar_position: 2
---

# Blog Index

The blog index is the main listing page that displays all published posts.

## Default Behavior

Posts are automatically:

- **Sorted by date** - Newest first
- **Filtered** - Drafts hidden in production
- **Paginated** - If configured

## Sorting

Posts are sorted by the `date` field (newest first):

```typescript
const posts = await loadContent(dataPath, {
  pattern: '*.{md,mdx}',
  sort: 'date',
  order: 'desc',
});
```

The date comes from:
1. Frontmatter `date` field (if present)
2. Filename date prefix (fallback)

## Draft Handling

| Environment | Drafts Visible |
|-------------|----------------|
| Development | Yes |
| Production | No |

Mark a post as draft:

```yaml
---
title: Work in Progress
draft: true
---
```

## Filtering by Tags

Posts can be filtered using tags:

```yaml
---
tags:
  - tutorial
  - react
  - beginner
---
```

Tags enable:
- Tag-based filtering on the blog index
- Related posts suggestions
- Tag archive pages

## Post Cards

Each post in the index typically displays:

| Field | Source |
|-------|--------|
| Title | `title` frontmatter |
| Description | `description` frontmatter |
| Date | `date` frontmatter or filename |
| Cover Image | `image` frontmatter |
| Author | `author` frontmatter |
| Tags | `tags` frontmatter |

## Example Post Card Data

```yaml
---
title: Building a REST API with Node.js
description: Learn how to create a production-ready REST API
date: 2024-02-15
author: Alex Johnson
tags:
  - nodejs
  - api
image: /images/blog/rest-api-cover.jpg
---
```

## Customizing the Index

The blog index layout can be customized in:
- `src/layouts/blog/` - Layout components
- `site.yaml` - Configuration options

## RSS Feed

If enabled, an RSS feed is generated at `/blog/rss.xml` containing:
- Post title and description
- Publication date
- Full content or excerpt
- Author information
