---
title: "Step 2.2: Renderer"
description: The markdown to HTML rendering stage using Marked
sidebar_position: 5
---

# Renderer

**Folder:** `src/parsers/renderers/`

The renderer converts preprocessed markdown into HTML using the Marked library.

## Role in the Pipeline

```
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  PREPROCESSORS  │     │    RENDERERS    │     │ POSTPROCESSORS  │
│                 │ ──▶ │  (YOU ARE HERE) │ ──▶ │                 │
│                 │     │  • marked.ts    │     │                 │
│                 │     │   (MD → HTML)   │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Renderer Files

| File | Purpose |
|------|---------|
| `marked.ts` | Markdown renderer using Marked library |
| `index.ts` | Module exports |

## Overview

```
Preprocessed Markdown
         │
         ▼
┌─────────────────┐
│     Marked      │
│                 │
│  - Parsing      │
│  - Tokenizing   │
│  - Rendering    │
└────────┬────────┘
         │
         ▼
    Raw HTML
```

## Configuration

The renderer is configured with sensible defaults:

```typescript
import { marked } from 'marked';

marked.setOptions({
  gfm: true,           // GitHub Flavored Markdown
  breaks: false,       // Require blank line for new paragraph
  pedantic: false,     // Don't be overly strict
});
```

## Usage

```typescript
import { createMarkdownRenderer, renderMarkdown } from '@parsers/renderers';

// Create a renderer instance
const render = createMarkdownRenderer();
const html = render(markdownContent);

// Or use the convenience function
const html = renderMarkdown(markdownContent);

// Use default renderer
import { defaultRenderer } from '@parsers/renderers';
const html = defaultRenderer(markdownContent);
```

## Supported Syntax

### GitHub Flavored Markdown

| Feature | Syntax |
|---------|--------|
| Tables | `\| col \| col \|` |
| Strikethrough | `~~text~~` |
| Task Lists | `- [x] item` |
| Autolinks | `https://example.com` |
| Fenced Code | ` ``` ` |

### Standard Markdown

- **Headings**: `# H1` through `###### H6`
- **Emphasis**: `*italic*`, `**bold**`, `***bold italic***`
- **Lists**: Ordered and unordered
- **Links**: `[text](url)` and `[text][ref]`
- **Images**: `![alt](src)`
- **Blockquotes**: `> quote`
- **Code**: Inline `` `code` `` and fenced blocks

## Code Block Handling

Fenced code blocks are rendered with language classes:

```markdown
```javascript
const x = 1;
```
```

Renders to:

```html
<pre><code class="language-javascript">const x = 1;
</code></pre>
```

## Custom Renderer Extensions

Extend the renderer for custom behavior:

```typescript
import { marked } from 'marked';

const renderer = new marked.Renderer();

// Custom heading renderer
renderer.heading = (text, level) => {
  const slug = text.toLowerCase().replace(/\s+/g, '-');
  return `<h${level} id="${slug}">${text}</h${level}>`;
};

// Custom link renderer
renderer.link = (href, title, text) => {
  const isExternal = href.startsWith('http');
  const attrs = isExternal ? ' target="_blank" rel="noopener"' : '';
  return `<a href="${href}"${attrs}>${text}</a>`;
};

marked.use({ renderer });
```

## Creating Custom Marked Instance

```typescript
import { createMarkedInstance } from '@parsers/renderers';

const customMarked = createMarkedInstance({
  gfm: true,
  breaks: true,  // Enable line breaks
});
```

## Performance

The Marked library is chosen for its:

- **Speed**: One of the fastest markdown parsers
- **Compliance**: Full CommonMark + GFM support
- **Extensibility**: Easy to customize
- **Lightweight**: Minimal dependencies
