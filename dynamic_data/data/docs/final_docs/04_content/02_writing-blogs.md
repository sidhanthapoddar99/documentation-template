---
title: Writing Blog Posts
description: Create and manage blog content
---

# Writing Blog Posts

Blog posts are MDX files in `DATA_DIR/data/blog/`.

## File Naming

Blog posts use date-based naming:

```
blog/
├── 2024-01-15-hello-world.mdx
├── 2024-01-20-getting-started.mdx
├── 2024-02-01-advanced-features.mdx
└── 2024-02-15-tips-and-tricks.mdx
```

The date in the filename helps organization. The actual publication date comes from frontmatter.

## URL Structure

| Filename | URL |
|----------|-----|
| `2024-01-15-hello-world.mdx` | `/blog/hello-world` |
| `2024-01-20-getting-started.mdx` | `/blog/getting-started` |

The date prefix is stripped from the URL.

## Frontmatter

```mdx
---
title: My Blog Post Title
description: A brief summary of the post
date: 2024-01-15
author: John Doe
tags:
  - tutorial
  - beginner
image: /images/blog/post-cover.jpg
draft: false
---

Your post content here...
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Post title |
| `date` | `string` | Publication date (YYYY-MM-DD) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | `string` | Summary for cards and SEO |
| `author` | `string` | Author name |
| `tags` | `string[]` | Categorization tags |
| `image` | `string` | Cover image URL |
| `draft` | `boolean` | Hide in production |

## Writing Effective Posts

### Start with a Hook

```mdx
---
title: Solving the N+1 Query Problem
---

# Solving the N+1 Query Problem

Have you ever noticed your app slowing down as your database grows?
The culprit might be hiding in your ORM queries.

In this post, we'll identify N+1 queries and fix them for good.
```

### Structure Your Content

```mdx
## The Problem

Explain what you're solving...

## Understanding the Cause

Dive deeper into why this happens...

## The Solution

Present your approach...

### Step 1: Identify

First, we need to find the issue...

### Step 2: Refactor

Now let's fix it...

### Step 3: Verify

Confirm the improvement...

## Results

Show the before/after...

## Conclusion

Summarize key takeaways...
```

### Include Code Examples

````mdx
Here's the problematic code:

```typescript title="bad-example.ts"
// N+1 Query - DON'T DO THIS
const users = await User.findAll();
for (const user of users) {
  const posts = await Post.findAll({ where: { userId: user.id } });
  // This runs a query for EACH user!
}
```

And the optimized version:

```typescript title="good-example.ts"
// Single query with eager loading
const users = await User.findAll({
  include: [{ model: Post }],
});
```
````

### Add Visual Elements

```mdx
## Performance Comparison

| Approach | Queries | Time |
|----------|---------|------|
| N+1 | 101 | 450ms |
| Eager loading | 2 | 45ms |

The difference is dramatic with larger datasets.
```

## Sorting

Posts are automatically sorted by date (newest first):

```typescript
const posts = await loadContent(dataPath, {
  pattern: '*.{md,mdx}',
  sort: 'date',
  order: 'desc',
});
```

## Draft Posts

Mark posts as drafts during development:

```yaml
---
title: Work in Progress
draft: true
---
```

Drafts:
- Appear in development mode
- Hidden in production builds
- Won't show in blog index or feeds

## Tags

Use tags for categorization:

```yaml
---
tags:
  - react
  - performance
  - tutorial
---
```

Tags can be used to:
- Filter posts
- Show related content
- Generate tag pages

## Cover Images

Add visual appeal with cover images:

```yaml
---
image: /images/blog/my-post-cover.jpg
---
```

Image guidelines:
- Recommended size: 1200x630px (social sharing)
- Place in `DATA_DIR/assets/images/blog/`
- Use descriptive filenames

## Author Information

For multi-author blogs:

```yaml
---
author: Jane Smith
author_image: /images/authors/jane.jpg
author_bio: "Senior Engineer at Acme Corp"
---
```

## SEO Optimization

1. **Title**: Clear, descriptive, includes keywords
2. **Description**: 150-160 characters summary
3. **Date**: Helps search engines understand freshness
4. **Structure**: Use headings hierarchically (H2, H3)
5. **Links**: Link to related posts and external resources

## Example Post

````mdx
---
title: Building a REST API with Node.js
description: Learn how to create a production-ready REST API using Express and TypeScript
date: 2024-02-15
author: Alex Johnson
tags:
  - nodejs
  - api
  - typescript
image: /images/blog/rest-api-cover.jpg
---

# Building a REST API with Node.js

REST APIs power most modern web applications. In this guide,
we'll build one from scratch using best practices.

## Prerequisites

- Node.js 18+
- Basic TypeScript knowledge
- A code editor

## Setting Up the Project

```bash
mkdir my-api && cd my-api
npm init -y
npm install express typescript @types/express
```

## Creating the Server

```typescript title="src/index.ts"
import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Adding Routes

...continue with your content...

## Conclusion

You now have a foundation for building REST APIs.
Next, consider adding authentication and database integration.
````
