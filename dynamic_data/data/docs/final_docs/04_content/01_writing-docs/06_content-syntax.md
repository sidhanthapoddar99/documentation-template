---
title: Content Syntax
description: Markdown and MDX content writing guide
---

# Content Syntax

This guide covers all the Markdown and MDX syntax you can use in your documentation files.

## Headings

Use headings to structure your content:

```markdown
# Page Title (H1)

Only one H1 per page - should match frontmatter title.

## Main Section (H2)

Appears in the page outline.

### Subsection (H3)

Also appears in outline.

#### Minor Heading (H4)

Not shown in outline.
```

> **Rule:** Only one H1 per page, and it should match your frontmatter `title`.

## Code Blocks

### Basic Code Block

````markdown
```javascript
const greeting = "Hello";
console.log(greeting);
```
````

### With Title

````markdown
```typescript title="example.ts"
interface User {
  name: string;
  email: string;
}
```
````

### With Line Highlighting

Highlight specific lines:

````markdown
```javascript {2,4-6}
function example() {
  const highlighted = true;  // line 2 highlighted
  const normal = false;
  return {                   // lines 4-6 highlighted
    highlighted,
    normal,
  };
}
```
````

### Inline Code

Use backticks for inline code:

```markdown
Use the `console.log()` function to print output.
```

## Tables

Create tables with pipes and dashes:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

Alignment:

```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| A    |   B    |     C |
```

## Lists

### Unordered Lists

```markdown
- Item one
- Item two
  - Nested item
  - Another nested
- Item three
```

### Ordered Lists

```markdown
1. First step
2. Second step
3. Third step
   1. Sub-step A
   2. Sub-step B
```

### Task Lists

```markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task
```

## Blockquotes

```markdown
> This is a blockquote.
> It can span multiple lines.

> **Note:** Important information here.

> **Warning:** Be careful about this.

> **Tip:** Helpful suggestion.
```

## Links

### Internal Links

Link to other documentation pages:

```markdown
[Installation Guide](/docs/getting-started/installation)
```

### External Links

```markdown
[GitHub](https://github.com)
```

### Anchor Links

Link to a heading on the same page:

```markdown
[See Code Blocks](#code-blocks)
```

## Images

### Basic Image

```markdown
![Alt text](/images/screenshot.png)
```

### Image with Caption

```markdown
<figure>
  <img src="/images/diagram.png" alt="Architecture diagram" />
  <figcaption>System architecture overview</figcaption>
</figure>
```

### Using Assets Syntax

```markdown
[[img, ./assets/images/diagram.png]]
```

## Emphasis

```markdown
*italic* or _italic_

**bold** or __bold__

***bold italic***

~~strikethrough~~
```

## Horizontal Rule

```markdown
---
```

## Escape Characters

Use backslash to escape special characters:

```markdown
\* Not a list item
\# Not a heading
\[Not a link\]
```

## MDX-Specific Features

MDX allows you to use JSX components in your Markdown:

### Import Components

```mdx
import { Callout } from '@/components/Callout';

<Callout type="warning">
  This is a warning callout.
</Callout>
```

### Inline Expressions

```mdx
The current year is {new Date().getFullYear()}.
```

## Best Practices

1. **One H1 per page** - Match your frontmatter title
2. **Use semantic headings** - Don't skip levels (H2 → H4)
3. **Keep paragraphs short** - Improve readability
4. **Use code blocks** - For any code, commands, or file paths
5. **Add alt text** - For all images
6. **Link generously** - Help users navigate
7. **Be consistent** - Use the same patterns throughout
