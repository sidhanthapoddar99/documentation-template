---
title: Data Loader
description: How content loading works
---

# Data Loader

The data loader (`src/loaders/data.ts`) is responsible for discovering, parsing, and organizing content.

## Core Functions

### `loadContent()`

Loads multiple content files from a directory:

```typescript
const content = await loadContent(dataPath, {
  pattern: '**/*.{md,mdx}',
  sort: 'position',
  requirePositionPrefix: true,
});
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `pattern` | `string` | Glob pattern for files |
| `sort` | `'position' \| 'date' \| 'title'` | Sort order |
| `order` | `'asc' \| 'desc'` | Sort direction |
| `requirePositionPrefix` | `boolean` | Enforce `XX_` prefix |

**Returns:**

```typescript
{
  items: ContentItem[],
  tree: SidebarTree,
  flatList: ContentItem[],
}
```

### `loadFile()`

Loads a single file (YAML or MDX):

```typescript
const page = await loadFile('@data/pages/home.yaml');
// Returns: { data: { hero: {...}, features: [...] } }
```

## Position Prefix System

Documentation files **must** use `XX_` prefix for ordering:

```
01_overview.mdx     → position: 1, slug: "overview"
02_installation.mdx → position: 2, slug: "installation"
10_advanced.mdx     → position: 10, slug: "advanced"
```

### How It Works

1. **Extract**: Parse `XX_` from filename
2. **Clean**: Remove prefix for URL slug
3. **Sort**: Order by extracted number
4. **Validate**: Error if prefix missing (when required)

### Validation Error

If a doc file is missing the prefix:

```
[DOCS ERROR] Files missing required XX_ position prefix:
  - overview.mdx
  - installation.mdx

Docs files must be named with a position prefix (01-99).
Examples:
  01_getting-started.mdx
  02_installation.mdx
```

## Sidebar Tree Building

The loader builds a nested tree structure for the sidebar:

### Input Structure

```
docs/
├── getting-started/
│   ├── settings.json     # { "label": "Getting Started" }
│   ├── 01_overview.mdx
│   └── 02_install.mdx
└── guides/
    ├── settings.json     # { "label": "Guides" }
    └── 01_basics.mdx
```

### Output Tree

```typescript
{
  tree: [
    {
      type: 'section',
      label: 'Getting Started',
      isCollapsible: true,
      collapsed: false,
      children: [
        { type: 'doc', title: 'Overview', slug: 'getting-started/overview', position: 1 },
        { type: 'doc', title: 'Installation', slug: 'getting-started/install', position: 2 },
      ]
    },
    {
      type: 'section',
      label: 'Guides',
      children: [
        { type: 'doc', title: 'Basics', slug: 'guides/basics', position: 1 },
      ]
    }
  ]
}
```

## Frontmatter Parsing

Each MDX file's frontmatter is parsed and validated:

```mdx
---
title: Page Title
description: SEO description
draft: false
---
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Page title (required) |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `description` | `string` | `""` | Meta description |
| `draft` | `boolean` | `false` | Hide in production |
| `sidebar_label` | `string` | `title` | Override sidebar text |

## Path Alias Resolution

The loader resolves path aliases:

```typescript
resolveAlias('@data/docs')
// → /absolute/path/to/dynamic_data/data/docs

resolveAlias('@assets/logo.svg')
// → /absolute/path/to/dynamic_data/assets/logo.svg
```

| Alias | Resolves To |
|-------|-------------|
| `@data/` | `DATA_DIR/data/` |
| `@assets/` | `DATA_DIR/assets/` |
| `@config/` | `DATA_DIR/config/` |
| `@theme/` | `DATA_DIR/theme/` |

## Error Handling

The loader provides detailed errors:

### File Not Found

```
[DATA ERROR] Path not found: /path/to/missing/folder
  Resolved from: @data/missing
```

### Invalid Frontmatter

```
[PARSE ERROR] Invalid frontmatter in: 01_overview.mdx
  Line 3: Expected string for 'title', got number
```

### Missing Required Field

```
[VALIDATION ERROR] Missing required field 'title'
  File: 01_overview.mdx
```

## Caching

Content is cached during development for performance. The cache invalidates when:
- A file is modified
- A file is added or deleted
- `settings.json` changes

In production builds, there's no caching—content is loaded once during build.
