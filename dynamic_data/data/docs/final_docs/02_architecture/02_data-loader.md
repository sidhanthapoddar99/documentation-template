---
title: Parser System
description: How the modular parser system processes content
---

# Parser System

The parser system (`src/parsers/`) is a modular architecture for processing markdown content through configurable pipelines.

## Architecture Overview

```
┌───────────────────────────────────────────────────────────┐
│                    Processing Pipeline                    │
│                                                           │
│  ┌────────────┐    ┌────────────┐    ┌────────────────┐   │
│  │  Preproc.  │ -> │  Renderer  │ -> │  Postproc.     │   │
│  │            │    │  (Marked)  │    │                │   │
│  │ - Assets   │    │            │    │ - Heading IDs  │   │
│  │ - Code     │    │  MD → HTML │    │ - Ext. Links   │   │
│  └────────────┘    └────────────┘    └────────────────┘   │
│                                                           │
└───────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
     ┌─────────────┐                ┌─────────────┐
     │ DocsParser  │                │ BlogParser  │
     │             │                │             │
     │ XX_ prefix  │                │ Date prefix │
     │ Nested dirs │                │ Flat struct │
     │ Rel. assets │                │ Central     │
     └─────────────┘                └─────────────┘
```

## Core Components

### Processing Pipeline

The pipeline orchestrates content transformation:

```typescript
import { ProcessingPipeline } from '@parsers/core';

const pipeline = new ProcessingPipeline();

// Add processors
pipeline
  .addPreprocessor(assetEmbedPreprocessor)
  .addPostprocessor(headingIdsPostprocessor)
  .addPostprocessor(externalLinksPostprocessor);

// Process content
const html = await pipeline.process(rawMarkdown, context, render);
```

### Content-Type Parsers

#### DocsParser

Handles documentation with position-based ordering:

```typescript
import { DocsParser } from '@parsers/content-types';

const parser = new DocsParser();

// Filename parsing
parser.parseFilename('01_overview');
// → { position: 1, cleanName: 'overview' }

// Asset resolution (relative to file)
parser.getAssetPath('/docs/guide/intro.md', './assets/diagram.png');
// → /docs/guide/assets/diagram.png
```

**Docs Naming Convention:**
```
01_overview.md     → position: 1, slug: "overview"
02_installation.md → position: 2, slug: "installation"
10_advanced.md     → position: 10, slug: "advanced"
```

#### BlogParser

Handles blog posts with date-based naming:

```typescript
import { BlogParser } from '@parsers/content-types';

const parser = new BlogParser();

// Filename parsing
parser.parseFilename('2024-01-15-hello-world');
// → { date: '2024-01-15', slug: 'hello-world' }

// Asset resolution (central assets folder)
parser.getAssetPath('/blog/2024-01-15-hello-world.md', 'cover.jpg');
// → /blog/assets/2024-01-15-hello-world/cover.jpg
```

**Blog Naming Convention:**
```
2024-01-15-hello-world.md → date: "2024-01-15", slug: "hello-world"
2024-02-20-my-journey.md  → date: "2024-02-20", slug: "my-journey"
```

## Preprocessors

Preprocessors run before markdown rendering.

### Asset Embed Preprocessor

Embeds file contents using `[[path]]` syntax:

```markdown
# Code Example

```python
[[./assets/example.py]]
```
```

The `[[./assets/example.py]]` is replaced with the actual file content.

**Features:**
- Protects code blocks from accidental processing
- Supports escaped syntax: `\[[path]]` shows literal `[[path]]`
- Blog-specific resolution: `[[cover.jpg]]` → `assets/<filename>/cover.jpg`

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

## Postprocessors

Postprocessors run after HTML rendering.

### Heading IDs

Automatically adds IDs to headings for anchor links:

```html
<!-- Input -->
<h2>Getting Started</h2>

<!-- Output -->
<h2 id="getting-started">Getting Started</h2>
```

### External Links

Adds security attributes to external links:

```html
<!-- Input -->
<a href="https://example.com">Link</a>

<!-- Output -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>
```

## Data Loader Integration

The data loader (`src/loaders/data.ts`) uses the parser system:

```typescript
import { loadContent } from '@loaders/data';

// Load docs with DocsParser
const docs = await loadContent('docs', 'docs', {
  pattern: '**/*.{md,mdx}',
  sort: 'position',
  requirePositionPrefix: true,
});

// Load blog with BlogParser
const posts = await loadContent('blog', 'blog', {
  pattern: '*.md',
  sort: 'date',
  order: 'desc',
});
```

### LoadContent Options

| Option | Type | Description |
|--------|------|-------------|
| `pattern` | `string` | Glob pattern for files |
| `sort` | `'position' \| 'date' \| 'title'` | Sort method |
| `order` | `'asc' \| 'desc'` | Sort direction |
| `includeDrafts` | `boolean` | Include draft content |
| `requirePositionPrefix` | `boolean` | Enforce `XX_` prefix (docs) |

### Return Type

```typescript
interface LoadedContent {
  id: string;           // Unique identifier
  slug: string;         // URL path
  content: string;      // Rendered HTML
  data: {
    title: string;
    description?: string;
    sidebar_position?: number;
    date?: string;
    tags?: string[];
    draft?: boolean;
  };
  filePath: string;
  relativePath: string;
  fileType: 'md' | 'mdx';
}
```

## Frontmatter Schema

### Docs Frontmatter

```yaml
---
title: Page Title           # Required
description: SEO description
sidebar_label: Sidebar Text  # Override sidebar display
sidebar_position: 1         # Override XX_ position
draft: false                # Hide in production
tags: [guide, tutorial]
---
```

### Blog Frontmatter

```yaml
---
title: Post Title           # Required
description: Post summary
date: 2024-01-15           # Override filename date
author: John Doe
tags: [news, update]
draft: false
image: cover.jpg           # Featured image
---
```

## Error Handling

### Missing Position Prefix

```
[DOCS ERROR] Files missing required XX_ position prefix:
  - overview.md
  - installation.md

Docs files must be named with a position prefix (01-99).
Examples:
  01_getting-started.md
  02_installation.md
```

### File Not Found

```
[PARSER ERROR] Content file not found: /path/to/missing.md
  Code: FILE_NOT_FOUND
```

### Directory Not Found

```
[PARSER ERROR] Content directory not found: /path/to/missing/
  Code: DIR_NOT_FOUND
```

## Creating Custom Parsers

Extend `BaseContentParser` for custom content types:

```typescript
import { BaseContentParser } from '@parsers/core';
import type { FrontmatterSchema, ParsedDocsFilename } from '@parsers/types';

class CustomParser extends BaseContentParser {
  constructor() {
    super('page');

    // Configure pipeline
    this.pipeline
      .addPreprocessor(myPreprocessor)
      .addPostprocessor(myPostprocessor);
  }

  parseFilename(filename: string): ParsedDocsFilename {
    // Custom filename parsing logic
    return { position: null, cleanName: filename };
  }

  getAssetPath(filePath: string, assetPath: string): string {
    // Custom asset resolution
    return path.resolve(path.dirname(filePath), assetPath);
  }

  getFrontmatterSchema(): FrontmatterSchema {
    return {
      required: ['title'],
      optional: ['description', 'layout'],
    };
  }

  generateSlug(relativePath: string): string {
    // Custom slug generation
    return relativePath.replace(/\.md$/, '');
  }
}
```

## Caching

Content is cached during production builds:

- **Development**: No caching, files re-parsed on each request
- **Production**: Content cached after first parse

Cache invalidation happens automatically when files change during development.
