---
title: Asset Embedding
description: How to embed file contents using the [[path]] syntax
sidebar_position: 2
---

# Asset Embedding

The `[[path]]` syntax allows you to embed file contents directly into your markdown. The content is replaced during preprocessing.

## How It Works

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  Markdown   │     │  Preprocessor   │     │   Output    │
│             │ ──▶ │                 │ ──▶ │             │
│ [[path]]    │     │ Reads file      │     │ File content│
│             │     │ Replaces syntax │     │ inserted    │
└─────────────┘     └─────────────────┘     └─────────────┘
```

The preprocessor:
1. Scans for `[[path]]` patterns
2. Resolves the path based on content type (docs vs blogs)
3. Reads the file content
4. Replaces the pattern with actual content

See [Pre-processing](/docs/architecture/parser/pre-processing) for technical details.

## Basic Usage

### In Code Blocks

Embed code files inside fenced code blocks:

~~~markdown
```python
[[./assets/example.py]]
```
~~~

The `[[./assets/example.py]]` is replaced with the file's contents.

### In Components

Use with custom components:

```markdown
<CollapsibleCodeBlock language="python" title="example.py">
[[./assets/example.py]]
</CollapsibleCodeBlock>
```

## Path Resolution

Path resolution differs between docs and blogs:

### Docs (Relative Paths)

In docs, paths are relative to the current file:

```
docs/
├── 01_getting-started/
│   ├── 01_overview.md      ← [[./assets/code.py]]
│   └── assets/
│       └── code.py         ← Resolved here
```

**Example:**

```markdown
<!-- In 01_overview.md -->
```python
[[./assets/code.py]]
```
```

Resolves to: `docs/01_getting-started/assets/code.py`

### Blogs (Central Assets)

In blogs, paths resolve to a central assets folder named after the post:

```
blog/
├── 2024-01-15-hello-world.md   ← [[diagram.png]]
└── assets/
    └── 2024-01-15-hello-world/
        └── diagram.png          ← Resolved here
```

**Example:**

```markdown
<!-- In 2024-01-15-hello-world.md -->
[[diagram.png]]
```

Resolves to: `blog/assets/2024-01-15-hello-world/diagram.png`

## Escaping

To show literal `[[path]]` without replacement, use backslash:

```markdown
\[[./assets/example.py]]
```

Renders as: `[[./assets/example.py]]`

## Supported Content

The `[[path]]` syntax embeds **file content** only:

| Use Case | Syntax |
|----------|--------|
| Code files | `[[./assets/code.py]]` inside code block |
| Text snippets | `[[./assets/snippet.txt]]` |
| Config files | `[[./assets/config.yaml]]` inside code block |

For images, use standard markdown or HTML:

```markdown
![Alt text](./assets/diagram.png)
<img src="./assets/diagram.png" alt="Diagram" />
```

## Best Practices

1. **Organize assets** - Use subfolders (`code/`, `images/`)
2. **Keep assets close** - Store near the files that use them
3. **Use descriptive names** - `auth-flow.py` not `code1.py`
4. **Always use code blocks** - When embedding code files
