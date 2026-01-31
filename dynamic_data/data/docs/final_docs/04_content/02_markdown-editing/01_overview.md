---
title: Markdown Overview
description: Common markdown features for docs and blogs
sidebar_position: 1
---

# Markdown Editing

This section covers markdown features common to both docs and blogs.

## Supported Formats

| Extension | Description |
|-----------|-------------|
| `.md` | Standard Markdown |
| `.mdx` | Markdown with JSX components |

Both formats support frontmatter, code blocks, tables, and all standard Markdown features. MDX additionally supports importing and using React/Astro components.

## Basic Syntax

### Headings

```markdown
# Page Title (H1)
## Main Section (H2)
### Subsection (H3)
#### Minor Heading (H4)
```

**Rule:** Only one H1 per page, and it should match your frontmatter `title`.

### Emphasis

```markdown
*italic* or _italic_
**bold** or __bold__
***bold italic***
~~strikethrough~~
```

### Code

Inline code with backticks:

```markdown
Use the `console.log()` function to print output.
```

Fenced code blocks with language:

````markdown
```javascript
const greeting = "Hello";
console.log(greeting);
```
````

### Links

```markdown
[Internal Link](/docs/getting-started/overview)
[External Link](https://github.com)
[Anchor Link](#headings)
```

### Lists

```markdown
- Item one
- Item two
  - Nested item

1. First step
2. Second step
   1. Sub-step A
```

### Tables

```markdown
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

### Blockquotes

```markdown
> This is a blockquote.

> **Note:** Important information.
```

## Extended Features

Beyond standard markdown, the system provides:

| Feature | Description | Section |
|---------|-------------|---------|
| Asset Embedding | `[[path]]` syntax for file inclusion | [Asset Embedding](./asset-embedding) |
| Custom Tags | Semantic HTML components | [Custom Tags](./custom-tags) |
| Page Outline | Auto-generated table of contents | [Outline](./outline) |

## MDX Components

In `.mdx` files, you can import and use components:

```mdx
import { Callout } from '@/components/Callout';

<Callout type="warning">
  This is a warning callout.
</Callout>
```

## Best Practices

1. **One H1 per page** - Match your frontmatter title
2. **Use semantic headings** - Don't skip levels (H2 → H4)
3. **Keep paragraphs short** - Improve readability
4. **Use code blocks** - For any code, commands, or file paths
5. **Add alt text** - For all images
6. **Link generously** - Help users navigate
