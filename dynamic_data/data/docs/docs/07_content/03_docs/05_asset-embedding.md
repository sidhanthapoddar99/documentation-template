---
title: Asset Embedding
description: Detailed asset management for documentation
sidebar_position: 5
---

# Asset Embedding for Docs

The `assets` folder stores external files like code snippets and images. This page covers asset management specific to documentation.

For the general `[[path]]` syntax, see [Markdown Asset Embedding](/docs/content/markdown-editing/asset-embedding).

## Assets Folder Structure

Each documentation folder can have its own `assets` folder:

```
docs/
├── 01_getting-started/
│   ├── settings.json
│   ├── 01_overview.mdx
│   ├── 02_installation.mdx
│   └── assets/
│       ├── code/
│       │   ├── example.py
│       │   └── config.yaml
│       └── images/
│           └── diagram.png
```

> The `assets` folder is **excluded from sidebar indexing**.

## Path Resolution

In docs, all asset paths are **relative to the current file**:

```
docs/
├── 01_getting-started/
│   ├── 01_overview.mdx      ← You are here
│   └── assets/
│       └── example.py       ← \[[./assets/example.py]]
```

**Example:**

~~~markdown
````python
\[[./assets/example.py]]
```
~~~

Resolves to: `docs/01_getting-started/assets/example.py`

## Nested Folder Assets

For nested documentation folders, each can have its own assets:

```
docs/
├── 01_getting-started/
│   ├── assets/
│   │   └── intro.py
│   └── 01_basics/
│       ├── 01_overview.mdx
│       └── assets/
│           └── basics.py    ← \[[./assets/basics.py]]
```

From `01_basics/01_overview.mdx`:

~~~markdown
<!-- Access local assets -->
````python
\[[./assets/basics.py]]
```

<!-- Access parent folder assets -->
````python
\[[../assets/intro.py]]
```

~~~

## Code in Fenced Blocks

The most common usage - embedding code inside fenced blocks:

~~~markdown
```python
\[[./assets/example.py]]
```
~~~

The content of `example.py` replaces `\[[./assets/example.py]]`.

## Code in Components

Use with custom components for enhanced display:

```markdown
<CollapsibleCodeBlock language="python" title="example.py">
\[[./assets/example.py]]
</CollapsibleCodeBlock>
```

## Images

For images, use standard markdown or HTML (not `[[path]]`):

```markdown
![Architecture diagram](./assets/images/diagram.png)

<img src="./assets/images/diagram.png" alt="Architecture diagram" />
```

The `[[path]]` syntax is for **file content** only, not image embedding.

## Organizing Assets

### By Type

```
assets/
├── code/
│   ├── example.py
│   └── config.yaml
└── images/
    ├── screenshot.png
    └── diagram.svg
```

### By Feature

```
assets/
├── authentication/
│   ├── login.py
│   └── flow.png
└── database/
    ├── schema.sql
    └── erd.png
```

## MDX Requirement

**Important:** Custom components like `<CollapsibleCodeBlock>` require `.mdx` files.

| Feature | `.md` | `.mdx` |
|---------|-------|--------|
| Standard markdown | Yes | Yes |
| `[[path]]` file embedding | Yes | Yes |
| Fenced code blocks | Yes | Yes |
| Custom JSX components | No | Yes |

## Best Practices

1. **Use `.mdx`** when you need custom components
2. **Organize assets** in subfolders (`code/`, `images/`)
3. **Keep assets close** to the docs that use them
4. **Use descriptive names** - `auth-flow.png` not `img1.png`
5. **Use relative paths** - Always start with `./` for clarity
