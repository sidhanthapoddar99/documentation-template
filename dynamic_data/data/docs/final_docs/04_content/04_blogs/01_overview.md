---
title: Blogs Overview
description: Quick introduction to writing blog posts
sidebar_position: 1
---

# Writing Blog Posts

Blog posts are MD or MDX files stored in `DATA_DIR/data/blog/`. This section covers everything you need to know to create and manage blog content.

## Quick Reference

| Topic | Description |
|-------|-------------|
| [Blog Index](./blogs-index) | How the blog listing page works |
| [Structure](./structure) | Date-based file naming |
| [Frontmatter](./frontmatter) | Required and optional metadata |
| [Asset Embedding](./asset-embedding) | Central asset management |

## Key Features

- **Date-based naming** - `YYYY-MM-DD-slug.md`
- **Automatic sorting** - Newest posts first
- **Tags** - Categorize and filter posts
- **Drafts** - Hide work-in-progress posts
- **Author info** - Support for multi-author blogs

## Example Structure

```
blog/
├── 2024-01-15-hello-world.md
├── 2024-02-01-new-feature.md
├── 2024-02-15-tips-and-tricks.md
└── assets/
    ├── 2024-01-15-hello-world/
    │   └── cover.jpg
    └── 2024-02-01-new-feature/
        └── diagram.png
```

## URL Generation

The date prefix is stripped from URLs:

| Filename | URL |
|----------|-----|
| `2024-01-15-hello-world.md` | `/blog/hello-world` |
| `2024-02-01-new-feature.md` | `/blog/new-feature` |

## Processing

Blogs are processed using the `BlogParser` which:

- Parses date from filename
- Resolves assets to central `assets/<slug>/` folder
- Generates clean URLs (date stripped)

See [Content Type Parser](/docs/architecture/parser/content-type-parser) for details.

## Best Practices

1. **Use meaningful slugs** - `getting-started-with-api` not `post1`
2. **Set accurate dates** - Frontmatter `date` overrides filename
3. **Add descriptions** - For SEO and card previews
4. **Use tags consistently** - Create a tag taxonomy
5. **Include cover images** - Better visual appeal
