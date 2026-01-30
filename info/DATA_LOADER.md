# Unified Data Loader

> **Note:** Previous code moved to `old_code/` folder.

This document describes the unified data loading engine that all layouts use.

---

## 1. Principle

**All layouts use the same data loading engine.**

Whether it's docs, blogs, or custom pages - they all call the same loader module. This ensures:
- Consistent data parsing
- Predictable behavior
- Easier maintenance

---

## 2. Data Loader Module

Location: `astro/src/loaders/data.ts`

```typescript
// Unified data loading interface
export interface LoadedContent {
  // Common fields
  id: string;
  slug: string;
  content: string;

  // Frontmatter
  data: {
    title: string;
    description?: string;
    [key: string]: unknown;
  };

  // Metadata
  filePath: string;
  fileType: 'mdx' | 'md' | 'yaml' | 'json';
}

// Main loading function
export async function loadContent(
  dataPath: string,
  options?: LoadOptions
): Promise<LoadedContent[]>;

// Single file loading
export async function loadFile(
  filePath: string
): Promise<LoadedContent>;
```

---

## 3. Supported File Types

| Extension | Type | Use Case |
|-----------|------|----------|
| `.mdx` | MDX | Docs, Blog posts |
| `.md` | Markdown | Simple docs |
| `.yaml` / `.yml` | YAML | Custom page data |
| `.json` | JSON | Custom page data, settings |

---

## 4. Content Loading Flow

```
User Request
    │
    ▼
┌─────────────────┐
│  Route Handler  │  (pages/[...slug].astro)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Layout Index   │  (layouts/docs/style1/index.astro)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Data Loader   │  (loaders/data.ts) ← UNIFIED ENGINE
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   File System   │  (data/docs/*, data/blog/*, etc.)
└─────────────────┘
```

---

## 5. Usage in Layouts

### Docs Layout
```astro
---
// layouts/docs/doc_style1/index.astro
import { loadContent } from '@/loaders/data';

const { dataPath } = Astro.props;
const docs = await loadContent(dataPath, {
  pattern: '**/*.{md,mdx}',
  sort: 'position'
});
---
```

### Blog Layout
```astro
---
// layouts/blogs/blog_style1/blog_index.astro
import { loadContent } from '@/loaders/data';

const { dataPath } = Astro.props;
const posts = await loadContent(dataPath, {
  pattern: '*.mdx',
  sort: 'date',
  order: 'desc'
});
---
```

### Custom Page Layout
```astro
---
// layouts/custom/home/index.astro
import { loadFile } from '@/loaders/data';

const { dataPath } = Astro.props;
const pageData = await loadFile(dataPath);
// pageData.data contains the YAML/JSON content
---
```

---

## 6. Load Options

```typescript
interface LoadOptions {
  // Glob pattern for files
  pattern?: string;  // default: '**/*.{md,mdx}'

  // Sorting
  sort?: 'position' | 'date' | 'title' | 'alphabetical';
  order?: 'asc' | 'desc';

  // Filtering
  filter?: (content: LoadedContent) => boolean;

  // Include drafts
  includeDrafts?: boolean;  // default: false in production

  // Depth limit
  maxDepth?: number;
}
```

---

## 7. Frontmatter Schema

### Docs Frontmatter
```yaml
---
title: "Page Title"           # Required
description: "Description"    # Optional
sidebar_position: 1           # Optional, for ordering
sidebar_label: "Short Label"  # Optional, sidebar display
draft: false                  # Optional, default false
---
```

### Blog Frontmatter
```yaml
---
title: "Post Title"           # Required
description: "Description"    # Optional
date: 2024-01-15              # Required for sorting
author: "Author Name"         # Optional
tags: ["tag1", "tag2"]        # Optional
draft: false                  # Optional
---
```

### Custom Page Data (YAML)
```yaml
# home.yaml
hero:
  title: "Welcome"
  subtitle: "Modern documentation"
  cta:
    label: "Get Started"
    href: "/docs"

features:
  - title: "Fast"
    description: "Built on Astro"
    icon: "lightning"
```

---

## 8. Settings Integration

The data loader also reads `settings.json` from content directories:

```typescript
// loaders/data.ts
export async function loadContentWithSettings(
  dataPath: string
): Promise<{
  content: LoadedContent[];
  settings: ContentSettings;
}>;
```

This allows layouts to access both content and its settings in one call.

---

## 9. Caching

The data loader implements caching for performance:

```typescript
// In development: watch mode, no caching
// In production: full caching

const cache = new Map<string, LoadedContent[]>();

export async function loadContent(path: string) {
  if (import.meta.env.PROD && cache.has(path)) {
    return cache.get(path);
  }
  // ... load and cache
}
```

---

## 10. Error Handling

```typescript
// Errors are thrown with clear messages
throw new DataLoaderError({
  code: 'FILE_NOT_FOUND',
  path: dataPath,
  message: `Content not found at ${dataPath}`
});

// Layouts should handle gracefully
try {
  const content = await loadContent(dataPath);
} catch (error) {
  if (error.code === 'FILE_NOT_FOUND') {
    // Show 404 or empty state
  }
}
```
