---
title: Path Aliases
description: Complete reference for all path aliases and how to use them
sidebar_position: 5
---

# Path Aliases

Path aliases provide a clean, consistent way to reference files and directories across the framework. Instead of using relative or absolute paths, you can use `@alias/path` syntax.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PATH ALIAS RESOLUTION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   @data/docs/overview.md                                                    │
│        │                                                                    │
│        ▼                                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   Alias Resolver                     │                                  │
│   │   1. Extract prefix (@data)          │                                  │
│   │   2. Look up base path               │                                  │
│   │   3. Append remaining path           │                                  │
│   └──────────────────────────────────────┘                                  │
│        │                                                                    │
│        ▼                                                                    │
│   /path/to/project/dynamic_data/data/docs/overview.md                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Available Aliases

### Content & Data Aliases

| Alias | Resolves To | Configured In |
|-------|-------------|---------------|
| `@data/` | Data directory | `site.yaml` paths section |
| `@assets/` | Assets directory | `site.yaml` paths section |
| `@config/` | Config directory | `CONFIG_DIR` (.env) |
| `@theme/` | Theme directory | `site.yaml` paths section |

### Layout Aliases

| Alias | Resolves To | Usage |
|-------|-------------|-------|
| `@docs/style_name` | `src/layouts/docs/styles/style_name/` | Doc layouts |
| `@blog/style_name` | `src/layouts/blogs/styles/style_name/` | Blog layouts |
| `@custom/style_name` | `src/layouts/custom/styles/style_name/` | Custom page layouts |
| `@navbar/style_name` | `src/layouts/navbar/style_name/` | Navbar layouts |
| `@footer/style_name` | `src/layouts/footer/style_name/` | Footer layouts |

### Theme Aliases

| Alias | Resolves To | Description |
|-------|-------------|-------------|
| `@theme/default` | `src/styles/` | Built-in default theme |
| `@theme/theme_name` | `paths.themes/theme_name/` | Custom theme |

## Usage by Context

### In site.yaml

```yaml
# Layout aliases
pages:
  docs:
    layout: "@docs/doc_style1"    # src/layouts/docs/styles/doc_style1/
    data: "@data/docs/final_docs" # paths.data/docs/final_docs/

  blog:
    layout: "@blog/blog_style1"   # src/layouts/blogs/styles/blog_style1/
    data: "@data/blog"            # paths.data/blog/

# Theme alias
theme: "@theme/minimal"           # paths.themes/minimal/

# Asset aliases
logo:
  src: "@assets/logo.svg"         # paths.assets/logo.svg → /assets/logo.svg
  favicon: "@assets/favicon.png"
```

### In navbar.yaml / footer.yaml

```yaml
# Footer layout alias
layout: "@footer/default"

# Page references (not aliases, but related)
links:
  - label: "Blog"
    page: "blog"  # Resolves to page's base_url
```

### In Markdown/MDX Files

```markdown
<!-- Asset embedding -->
\[[./assets/code.py]]

<!-- Image references -->
![Logo](@assets/logo.svg)
```

### In TypeScript/JavaScript

```typescript
import { resolveAlias, resolveAliasPath } from '@loaders/alias';
import { paths, getThemePath, getDataPath } from '@loaders/paths';

// Resolve an alias to full path info
const resolved = resolveAlias('@docs/doc_style1');
// { type: '@docs', name: 'doc_style1', fullPath: '/path/to/src/layouts/docs/doc_style1' }

// Resolve just the path
const path = resolveAliasPath('@data/docs');
// '/path/to/dynamic_data/data/docs'

// Get theme path
const themePath = getThemePath('minimal');
// '/path/to/dynamic_data/themes/minimal'
```

## Alias Resolution Logic

### Layout Aliases (@docs, @blog, @custom)

```typescript
'@docs/doc_style1'
  → src/layouts/docs/styles/doc_style1/Layout.astro

'@blog/blog_style1'
  → src/layouts/blogs/styles/blog_style1/Layout.astro

'@navbar/style1'
  → src/layouts/navbar/style1/index.astro
```

### Data Aliases (@data)

```typescript
'@data/docs/overview'
  → paths.data/docs/overview

'@data/pages/home.yaml'
  → paths.data/pages/home.yaml
```

### Asset Aliases (@assets)

Asset aliases resolve to **web URLs**, not file paths:

```typescript
'@assets/logo.svg'
  → '/assets/logo.svg' (web URL)

// The actual file is at:
// paths.assets/logo.svg
```

### Theme Aliases (@theme)

```typescript
'@theme/default'
  → src/styles/  (built-in)

'@theme/minimal'
  → paths.themes/minimal/  (custom theme)
```

## Path Configuration

Aliases are configured in two places, each with different path relativity:

| Setting | File | Relative To |
|---------|------|-------------|
| `CONFIG_DIR` | `.env` | **Project root** (where `.env` lives) |
| `paths:` entries | `site.yaml` | **Config directory** (where `site.yaml` lives) |

Absolute paths work in both places.

```yaml
# site.yaml — paths relative to this file's directory
paths:
  data: "../data"       # config dir + ../data → dynamic_data/data
  assets: "../assets"   # config dir + ../assets → dynamic_data/assets
  themes: "../themes"   # config dir + ../themes → dynamic_data/themes
  # data2: "/other/project/data"   # absolute path → used as-is
```

```env
# .env — CONFIG_DIR relative to project root
CONFIG_DIR=./dynamic_data/config   # project root + ./dynamic_data/config
```

For example, with the defaults above the resolution chain is:
```
.env:  CONFIG_DIR = ./dynamic_data/config  →  <project>/dynamic_data/config/
site.yaml:  data = "../data"               →  <project>/dynamic_data/data/
```

| Alias | Configured In | Default |
|-------|---------------|---------|
| `@data` | `site.yaml` paths | `../data` (relative to config dir) |
| `@assets` | `site.yaml` paths | `../assets` (relative to config dir) |
| `@themes` | `site.yaml` paths | `../themes` (relative to config dir) |
| `@config` | `.env` CONFIG_DIR | `./dynamic_data/config` (relative to project root) |

## Error Display Aliases

In error logs and the dev toolbar, absolute paths are converted back to aliases for readability:

```
/Users/.../dynamic_data/data/docs/overview.md
  → @data/docs/overview.md

/Users/.../dynamic_data/config/site.yaml
  → @config/site.yaml

/Users/.../src/layouts/docs/...
  → @src/layouts/docs/...
```

## Best Practices

1. **Always use aliases in configuration files** - Makes config portable
2. **Use @assets for static files** - Ensures correct URL resolution
3. **Use @theme for styling** - Enables theme switching
4. **Check alias resolution** - Use helper functions to verify paths

## TypeScript Interfaces

```typescript
// AliasPrefix is a dynamic string type — any @key defined in
// site.yaml paths: section or the reserved layout aliases:
// '@docs', '@blog', '@custom', '@navbar', '@footer',
// '@data', '@assets', '@theme', etc.
type AliasPrefix = string;

interface ResolvedAlias {
  type: AliasPrefix;
  name: string;
  fullPath: string;
}
```

## Helper Functions

```typescript
import {
  isAliasPath,        // Check if string is an alias
  extractPrefix,      // Get the @prefix
  resolveAlias,       // Full resolution with type info
  resolveAliasPath,   // Just the path string
  resolveLayoutPath,  // Resolve to Layout.astro
  resolveDataPath,    // Resolve @data paths
  resolveAssetUrl,    // Resolve to web URL
  getLayoutType,      // Extract layout type (docs/blog/custom)
  getLayoutName,      // Extract layout name
} from '@loaders/alias';

import {
  paths,              // All resolved paths
  getThemePath,       // Get theme directory path
  getDataPath,        // Get data file path
  getConfigPath,      // Get config file path
  getAssetsPath,      // Get assets file path
  toAliasPath,        // Convert absolute to alias path
} from '@loaders/paths';
```

## Code Location

Alias resolution is implemented in:

```
src/loaders/
├── alias.ts    # Alias resolution logic
└── paths.ts    # Path resolution and toAliasPath()
```
