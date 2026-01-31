---
title: Assets
description: Embed code, images, and videos in documentation
---

# Assets

The `assets` folder stores external files like code snippets and images. Use `[[path]]` syntax to insert file contents.

## Assets Folder Structure

```
docs/
├── 01_getting-started/
│   ├── settings.json
│   ├── 01_overview.mdx
│   └── assets/
│       ├── example.py
│       ├── config.yaml
│       └── diagram.png
```

> The `assets` folder is **excluded from sidebar indexing**.

## The `[[path]]` Syntax

`[[path]]` simply inserts the raw file content. Use it inside code blocks or components:

### Code in Fenced Blocks

~~~markdown
```python
[[./assets/example.py]]
```
~~~

### Code in Custom Components

```markdown
<CollapsibleCodeBlock language="python" title="example.py">
[[./assets/example.py]]
</CollapsibleCodeBlock>
```

### Images

Use standard HTML or markdown - `[[path]]` is for file **content** only:

```markdown
<img src="./assets/diagram.png" alt="Architecture diagram" />

![Alt text](./assets/diagram.png)
```

## Escaping

To show literal `[[path]]` without replacement, use backslash:

```markdown
\[[./assets/example.py]]
```

Renders as: \[[./assets/example.py]]

## Live Demo

Here's the example Python file:

```python
[[./assets/code/example.py]]
```

## MDX Required for Components

**Important:** Custom components like `<CollapsibleCodeBlock>` require `.mdx` files. Plain `.md` files cannot use JSX components.

| Feature | `.md` | `.mdx` |
|---------|-------|--------|
| Standard markdown | ✓ | ✓ |
| `[[path]]` file embedding | ✓ | ✓ |
| Fenced code blocks | ✓ | ✓ |
| Custom JSX components | ✗ | ✓ |

## Best Practices

1. **Use `.mdx`** when you need custom components
2. **Organize assets** in subfolders (`code/`, `images/`)
3. **Keep assets close** to the docs that use them
4. **Use descriptive names** - `auth-flow.png` not `img1.png`
