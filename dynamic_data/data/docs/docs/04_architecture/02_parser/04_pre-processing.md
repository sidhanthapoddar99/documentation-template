---
title: "Step 2.1: Pre-processing"
description: Preprocessors that transform content before markdown rendering
sidebar_position: 4
---

# Pre-processing

**Folder:** `src/parsers/preprocessors/`

Preprocessors run **before** markdown rendering, transforming the raw content.

## Role in the Pipeline

```
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  PREPROCESSORS  │     │    RENDERERS    │     │ POSTPROCESSORS  │
│  (YOU ARE HERE) │ ──▶ │                 │ ──▶ │                 │
│ • code-protect  │     │                 │     │                 │
│ • asset-embed   │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Available Preprocessors

| File | Preprocessor | Purpose |
|------|--------------|---------|
| `code-protect.ts` | Code Block Protection | Protects code blocks from processing |
| `asset-embed.ts` | Asset Embed | Embeds file contents using `[[path]]` syntax |

## Asset Embed Preprocessor

Embeds file contents using `[[path]]` syntax:

```markdown
# Code Example

```python
\[[./assets/example.py]]
```
```

The `\[[./assets/example.py]]` is replaced with the actual file content.

### Features

| Feature | Description |
|---------|-------------|
| **Code Block Protection** | Protects code blocks from accidental processing |
| **Escaped Syntax** | `\[[path]]` shows literal `[[path]]` |
| **Blog Resolution** | `[[cover.jpg]]` → `assets/<filename>/cover.jpg` |

### Configuration

```typescript
import { createAssetEmbedPreprocessor } from '@parsers/preprocessors';

// Default (docs-style relative paths)
const docsPreprocessor = createAssetEmbedPreprocessor();

// Blog-style (central assets folder)
import { createBlogAssetResolver } from '@parsers/preprocessors';
const blogPreprocessor = createAssetEmbedPreprocessor({
  resolvePath: createBlogAssetResolver(),
});
```

## Code Block Protection

The `code-protect.ts` module provides utilities to protect code blocks during preprocessing:

```typescript
import { protectCodeBlocks, processInsideCodeBlocks } from '@parsers/preprocessors';

// Protect code blocks before processing
const { content, restore } = protectCodeBlocks(rawContent);

// Process the content (code blocks are replaced with placeholders)
const processed = await someTransformation(content);

// Restore code blocks
const final = restore(processed);
```

## How It Works

1. **Scan** - Finds all `[[path]]` patterns in the content
2. **Resolve** - Determines the full file path based on context
3. **Read** - Loads the file contents
4. **Replace** - Substitutes the pattern with actual content

## Path Resolution

### Docs Mode (Default)

Paths are resolved relative to the current file:

```
/docs/guide/intro.md
  └── \[[./assets/code.py]]
      → /docs/guide/assets/code.py
```

### Blog Mode

Paths are resolved to a central assets folder:

```
/blog/2024-01-15-hello.md
  └── [[diagram.png]]
      → /blog/assets/2024-01-15-hello/diagram.png
```

## Custom Preprocessors

Create custom preprocessors by implementing the `Processor` interface:

```typescript
import type { Processor, ProcessContext } from '@parsers/types';

const myPreprocessor: Processor = {
  name: 'my-preprocessor',
  async process(content: string, context: ProcessContext): Promise<string> {
    // Transform content here
    return transformedContent;
  }
};

// Add to pipeline
pipeline.addPreprocessor(myPreprocessor);
```

## Processing Order

Preprocessors run in the order they are added:

```typescript
pipeline
  .addPreprocessor(codeProtectPreprocessor)  // 1st - protect code blocks
  .addPreprocessor(assetEmbedPreprocessor);  // 2nd - embed assets
```

Order matters when processors depend on each other.
