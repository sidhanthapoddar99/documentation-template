---
title: Pages Configuration
description: Define pages and their layouts in site.yaml
sidebar_position: 4
---

# Pages Configuration

The `pages:` block in `site.yaml` defines all pages on your site.

## Location

```
config/site.yaml → pages:
```

## Structure

```yaml
# site.yaml
site:
  # ... site metadata

pages:
  docs:
    base_url: "/docs/final-docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs/final_docs"

  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/blog_style1"
    data: "@data/blog"

  home:
    base_url: "/"
    type: custom
    layout: "@custom/home"
    data: "@data/pages/home.yaml"
```

## Page Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `base_url` | `string` | Yes | URL path for this section |
| `type` | `string` | Yes | Content type: `docs`, `blog`, or `custom` |
| `layout` | `string` | Yes | Layout alias to use |
| `data` | `string` | Yes | Path to content directory or file |

## Page Types

### `type: docs`

Documentation pages with sidebar navigation:

```yaml
docs:
  base_url: "/docs/final-docs"
  type: docs
  layout: "@docs/doc_style1"
  data: "@data/docs/final_docs"
```

- Uses `XX_` prefix for ordering
- Generates sidebar from folder structure
- Supports nested folders

### `type: blog`

Blog posts with date-based ordering:

```yaml
blog:
  base_url: "/blog"
  type: blog
  layout: "@blog/blog_style1"
  data: "@data/blog"
```

- Uses `YYYY-MM-DD-slug` naming
- Automatic chronological sorting
- Generates blog index page

### `type: custom`

Custom pages with YAML data:

```yaml
home:
  base_url: "/"
  type: custom
  layout: "@custom/home"
  data: "@data/pages/home.yaml"
```

- Single YAML data file
- Complete design control

## Layout Aliases

| Alias Pattern | Resolves To |
|---------------|-------------|
| `@docs/style_name` | `src/layouts/docs/styles/style_name/Layout.astro` |
| `@blog/style_name` | `src/layouts/blog/styles/style_name/Layout.astro` |
| `@custom/style_name` | `src/layouts/custom/styles/style_name/Layout.astro` |

## Data Aliases

| Alias Pattern | Resolves To |
|---------------|-------------|
| `@data/path` | `paths.data/path` |
| `@data/file.yaml` | `paths.data/file.yaml` |

## Multiple Documentation Sections

You can define multiple independent doc sections:

```yaml
pages:
  docs:
    base_url: "/docs/final-docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs/final_docs"

  layouts:
    base_url: "/docs/layouts"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs/layouts"

  components:
    base_url: "/docs/components"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs/components"
```

Each section:
- Has its own URL path
- Has its own sidebar
- Can use different layouts
- Is independent in navigation

## Page References

Other configs can reference pages by name:

```yaml
# In footer.yaml
links:
  - label: "Blog"
    page: "blog"    # Resolves to "/blog"
  - label: "About"
    page: "about"   # Resolves to "/about"
```

## TypeScript Interface

```typescript
type PageType = 'docs' | 'blog' | 'custom';

interface PageConfig {
  base_url: string;
  type: PageType;
  layout: string;
  data: string;
}

interface SiteConfig {
  site: SiteMetadata;
  pages: Record<string, PageConfig>;
}
```

## Helper Functions

```typescript
import { getPages, getPage, resolvePageUrl } from '@loaders/config';

// Get all pages
const pages = getPages();

// Get specific page
const blogConfig = getPage('blog');

// Resolve page name to URL
const blogUrl = resolvePageUrl('blog'); // "/blog"
```

## Route Validation

The system validates routes at build time:

```typescript
import { validateRoutes, getPages } from '@loaders/config';

const errors = validateRoutes(getPages());
// Returns errors for overlapping routes (except /)
```

Example error:
```
Overlapping routes: "docs" (/docs) and "api" (/docs/api)
```
