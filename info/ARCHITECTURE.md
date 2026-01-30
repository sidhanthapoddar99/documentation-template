# Astro Documentation Framework Architecture

> **Note:** Previous code moved to `old_code/` folder.

## Overview

This document describes the architecture for the Astro-based documentation framework.

---

## 1. Page Structure (Fixed)

Every page follows this fixed HTML structure:

```
┌─────────────────────────────────────┐
│           Top Navbar                │  ← Same component for all routes
├─────────────────────────────────────┤
│                                     │
│           Main Body                 │  ← Varies by route type
│    (docs | blog | custom)           │
│                                     │
├─────────────────────────────────────┤
│             Footer                  │  ← Same component for all routes
└─────────────────────────────────────┘
```

- **Top Navbar**: Consistent across all routes (same element)
- **Main Body**: Depends on route type (docs, blog, custom)
- **Footer**: Consistent across all routes (same element)

---

## 2. Project Structure

**Important:** No `astro/` subfolder. The project root IS the Astro project.

```
project/                      # Root = Astro project
├── src/                      # Source code
├── config/                   # Config (via $CONFIG_DIR)
├── data/                     # Content (via $DATA_DIR)
├── themes/                   # Themes (via $THEMES_DIR)
├── .env                      # Path definitions
├── astro.config.mjs
└── package.json
```

### Key Principle: Alias-Based References

Even though `config/` and `data/` are in the repo, **the code references them via `.env` aliases**:

```env
CONFIG_DIR=./config
DATA_DIR=./data
```

This allows users to point to external locations:
```env
CONFIG_DIR=../shared-config
DATA_DIR=/absolute/path/to/content
```

---

## 3. Main Body Categories

There are 3 categories of main body content:

### 3.1 Docs
- Standard documentation pages
- Contains: Sidebar + Main Content Area + Outline
- Structure is provided as a complete package (user selects whole style)
- Sidebar auto-generated from folder structure
- Behavior controlled by `settings.json` at doc root (sorting, collapsing, etc.)

### 3.2 Blogs
- Blog index pages and individual blog posts
- Contains: Blog listing + Blog post pages
- Also provided as complete packages

### 3.3 Custom Pages
- Astro custom pages (home, info, roadmap, etc.)
- Data can be: YAML, JSON, or MDX (depends on layout)
- Fully flexible based on layout chosen

---

## 4. Layout Organization

Layouts are organized as **packages** - users select a complete style, not individual components.

```
src/layouts/
├── docs/
│   ├── doc_style1/
│   │   ├── index.astro          # Entry point (MANDATORY)
│   │   ├── Sidebar.astro        # Internal component
│   │   ├── Outline.astro        # Internal component
│   │   └── Content.astro        # Internal component
│   └── doc_style2/
│       └── index.astro          # Entry point (MANDATORY)
│
├── blogs/
│   ├── blog_style1/
│   │   ├── blog_index.astro     # Blog listing (MANDATORY)
│   │   ├── blog_page.astro      # Individual post (MANDATORY)
│   │   └── (additional files)
│   └── blog_style2/
│
├── custom/
│   ├── home/
│   │   └── index.astro          # Accepts YAML/JSON data
│   ├── info/
│   └── roadmap/
│
├── navbar/
│   ├── style1/
│   ├── style2/
│   └── minimal/
│
└── footer/
    ├── default/
    └── minimal/
```

### Mandatory Files per Layout Type:
| Type | Required Files |
|------|----------------|
| docs | `index.astro` |
| blogs | `blog_index.astro`, `blog_page.astro` |
| custom | `index.astro` |
| navbar | `index.astro` |
| footer | `index.astro` |

---

## 5. Route Types

Three types of routes:

| Type | Description | URL Prefix |
|------|-------------|------------|
| `docs` | Documentation pages | `/docs` (recommended) |
| `blog` | Blog pages | `/blog` (recommended) |
| `custom` | Custom pages | Any (e.g., `/`, `/about`) |

### Route Validation Rules:
- No overlapping routes allowed
- Exception: `/` (blank route) can coexist with other routes
- Example conflict: `/docs/api` and `/docs/api/v2` cannot both exist

---

## 6. Page Configuration

Pages are defined in `config/site.yaml`:

```yaml
pages:
  main_docs:
    base_url: "/docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs"

  company_blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/blog_style1"
    data: "@data/blog"

  homepage:
    base_url: "/"
    type: custom
    layout: "@custom/home"
    data: "@data/pages/home.yaml"

  about:
    base_url: "/about"
    type: custom
    layout: "@custom/info"
    data: "@data/pages/about.yaml"
```

### Configuration Fields:
| Field | Description |
|-------|-------------|
| `base_url` | Route prefix for this page/section |
| `type` | One of: `docs`, `blog`, `custom` |
| `layout` | Reference to layout using @ prefix |
| `data` | Reference to data source using @ prefix |

---

## 7. @ Prefix System (Aliases)

The `@` prefix system provides clean references:

| Alias | Resolves To |
|-------|-------------|
| `@docs` | `src/layouts/docs/` |
| `@blog` | `src/layouts/blogs/` |
| `@custom` | `src/layouts/custom/` |
| `@navbar` | `src/layouts/navbar/` |
| `@footer` | `src/layouts/footer/` |
| `@data` | `$DATA_DIR` (from .env) |
| `@mdx` | `src/mdx_components/` |

Example usage:
- `@docs/doc_style1` → `src/layouts/docs/doc_style1/`
- `@data/blog` → `$DATA_DIR/blog/`

---

## 8. Source Directory Structure

```
src/
├── layouts/           # Layout packages (docs, blogs, custom, navbar, footer)
├── hooks/             # Utility functions and hooks
├── loaders/           # Data & config loading modules
├── modules/           # Feature modules (search, analytics, etc.)
├── mdx_components/    # MDX components (imported as @mdx)
├── pages/             # Route handlers
├── assets/            # Framework assets
└── styles/            # Global styles
```

---

## 9. Data Loading

**Important:** All layouts use the same data loading engine.

- Docs and blogs have their own presentation structure
- But they all use the unified data loader module
- This ensures consistency in how data is parsed

```typescript
// src/loaders/data.ts - Single engine for all data loading
export function loadContent(dataPath: string) {
  // Unified loading for docs, blogs, custom
  // Returns normalized content structure
}
```

---

## 10. Docs Settings

Each doc section can have a `settings.json` at its root:

```json
{
  "sidebar": {
    "collapsed": false,
    "sort": "position",
    "depth": 3
  },
  "outline": {
    "levels": [2, 3]
  }
}
```

This controls:
- Sidebar behavior (collapsing, sorting, depth)
- Outline levels
- Other presentation options

The layout/template reads these settings and applies them.

---

## 11. Environment Configuration

`.env` file defines paths (at project root):

```env
# Directory paths
CONFIG_DIR=./config
DATA_DIR=./data
THEMES_DIR=./themes

# Site settings
SITE_URL=http://localhost:4321

# Feature flags
ENABLE_SEARCH=false
ENABLE_DARK_MODE=true
```

---

## 12. Navbar Configuration

Navbar structure defined in `config/navbar.yaml`:

```yaml
layout: "@navbar/style1"
items:
  - label: "Home"
    href: "/"
  - label: "Docs"
    page: "main_docs"
  - label: "Blog"
    page: "company_blog"
  - label: "GitHub"
    href: "https://github.com/..."
    external: true
```

---

## 13. Summary

| Component | Description |
|-----------|-------------|
| **Navbar** | Same for all routes, configurable style |
| **Footer** | Same for all routes, configurable style |
| **Main Body** | Varies by type (docs/blog/custom) |
| **Layouts** | Complete packages, not mix-and-match |
| **Data Loading** | Single unified engine |
| **Configuration** | YAML with @ prefix references |
| **Paths** | All external dirs via .env aliases |

---

## 14. Open Questions

1. **Navbar styles** - How many variants needed?
2. **Footer styles** - How many variants needed?
3. **Blog pagination** - Handled in `blog_index.astro`?
4. **Theme customization** - Depth of CSS variable system?

---

## 15. Next Steps

1. Define detailed TypeScript interfaces for configuration
2. Create layout package structure
3. Implement unified data loader
4. Build navbar/footer variants
5. Create example layouts for each type
