---
title: Asset Embedding
description: How to embed file contents using the [[path]] syntax
sidebar_position: 3
---

# Asset Embedding

The `[[path]]` syntax lets you embed one file's contents into another during preprocessing. The pattern is replaced with the actual file content before the markdown is rendered.

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
2. Resolves the path based on content type (docs, blogs, issues)
3. Reads the file content
4. Replaces the pattern with actual content

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
<collapsible-code-block language="python" title="example.py">
[[./assets/example.py]]
</collapsible-code-block>
```

## Path Resolution

Path resolution differs per content type:

### Docs (Relative Paths)

In docs, paths are relative to the current file:

```
data/docs/
├── 01_getting-started/
│   ├── 01_overview.md      ← [[./assets/code.py]]
│   └── assets/
│       └── code.py         ← Resolved here
```

**Example:**

~~~markdown
<!-- In 01_overview.md -->
```python
[[./assets/code.py]]
```
~~~

Resolves to: `data/docs/01_getting-started/assets/code.py`

### Blogs (Central Assets Folder)

In blogs, paths resolve to a central assets folder named after the post:

```
data/blog/
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

Resolves to: `data/blog/assets/2024-01-15-hello-world/diagram.png`

### Issues (Folder-Relative Paths)

> **Not implemented yet.** The issue parser has an asset-path resolver defined but the `[[path]]` preprocessor is not wired into its pipeline today, so embeds in issue markdown currently render as literal `[[...]]`. This is tracked as part of the phase-3 pipeline standardization — see issue `2026-04-19-knowledge-graph-and-wiki-links`, subtask `01_unified-pipeline-and-graph`. Embedding semantics will also be revisited then (the broader model introduces `[[[target]]]` for embeds distinct from `[[target]]` for wiki links).

The intended behaviour (documented here so the model is clear once wiring lands): paths are relative to the issue folder. Every issue is its own folder, so you can put assets alongside `issue.md`, inside `notes/`, or anywhere within the issue directory:

```
data/issues/
└── 2026-04-19-my-issue/
    ├── issue.md            ← [[./assets/diagram.png]]
    ├── notes/
    │   └── 01_design.md    ← [[../assets/diagram.png]]
    └── assets/
        └── diagram.png     ← Resolved here
```

## Escaping

To show a literal `[[path]]` without replacement, prefix it with a backslash:

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

1. **Organize assets** — use subfolders (`code/`, `images/`)
2. **Keep assets close** — store near the files that use them
3. **Use descriptive names** — `auth-flow.py` not `code1.py`
4. **Always use code blocks** — when embedding code files
