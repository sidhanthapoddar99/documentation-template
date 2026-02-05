# Markdown Reference

## Supported Formats

| Extension | Description |
|-----------|-------------|
| `.md` | Standard Markdown |
| `.mdx` | Markdown with JSX components |

## Basic Syntax

### Headings

```markdown
# Page Title (H1) - only one per page
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
[Internal Link](/docs/section/page)
[External Link](https://example.com)
[Anchor Link](#heading-id)
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

---

## Asset Embedding

### Folder Structure

Store assets in an `assets/` folder next to your markdown:

```
01_getting-started/
├── 01_overview.md
└── assets/
    ├── example.py
    └── diagram.png
```

### Embedding Code Files

Use `[[path]]` syntax inside code blocks:

~~~markdown
```python
[[./assets/example.py]]
```
~~~

The file contents replace the `[[path]]` during build.

### Path Resolution

Paths are relative to the current file:

```
docs/
├── 01_getting-started/
│   ├── 01_overview.md      <- [[./assets/code.py]]
│   └── assets/
│       └── code.py         <- Resolved here
```

### Images

Use standard markdown:

```markdown
![Alt text](./assets/diagram.png)
```

Or HTML for more control:

```html
<img src="./assets/diagram.png" alt="Diagram" width="500" />
```

### Escaping

To show literal `[[path]]` without replacement:

```markdown
\[[./assets/example.py]]
```

---

## Custom Tags

### Callouts

```markdown
<callout type="info">
Informational content.
</callout>

<callout type="warning">
Warning message.
</callout>

<callout type="danger">
Danger alert!
</callout>

<callout type="tip">
Helpful tip.
</callout>
```

**Types:** `info`, `warning`, `danger`, `tip`

### Tabs

```markdown
<tabs>
  <tab label="JavaScript">
    ```javascript
    console.log("Hello");
    ```
  </tab>
  <tab label="Python">
    ```python
    print("Hello")
    ```
  </tab>
</tabs>
```

### Collapsible

```markdown
<collapsible title="Click to expand">
Hidden content revealed on click.
</collapsible>
```

---

## Best Practices

1. **One H1 per page** - Match your frontmatter title
2. **Use semantic headings** - Don't skip levels (H2 -> H3, not H2 -> H4)
3. **Keep paragraphs short** - Improve readability
4. **Use code blocks** - For any code, commands, or file paths
5. **Add alt text** - For all images
6. **Link generously** - Help users navigate
7. **Organize assets** - Use subfolders for different types
