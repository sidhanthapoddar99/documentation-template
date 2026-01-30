# Directory Structure

> **Note:** Previous code moved to `old_code/` folder.

This document defines the complete directory structure for the documentation framework.

---

## 1. Project Root Structure

**Important:** There is no `astro/` subfolder. Everything lives at the root.

```
project/                      # Root = Astro project
├── src/                      # Astro source code
│   ├── layouts/
│   ├── hooks/
│   ├── loaders/
│   ├── modules/
│   ├── mdx_components/
│   ├── pages/
│   └── styles/
│
├── config/                   # Configuration (referenced via $CONFIG_DIR)
│   ├── site.yaml
│   ├── navbar.yaml
│   └── footer.yaml
│
├── data/                     # User content (referenced via $DATA_DIR)
│   ├── docs/
│   ├── blog/
│   ├── pages/
│   └── assets/
│
├── themes/                   # Custom themes (referenced via $THEMES_DIR)
│
├── .env                      # Defines paths/aliases
├── astro.config.mjs
├── package.json
├── tsconfig.json
│
├── info/                     # Architecture docs (dev reference)
└── old_code/                 # Previous implementation
```

---

## 2. Key Principle: Alias-Based References

Even though `config/`, `data/`, etc. are in the same repository, **the code never references them directly**. Instead:

1. Paths are defined in `.env`
2. Code uses loaders that read from `.env`
3. This allows users to point to external folders if needed

```env
# .env
CONFIG_DIR=./config
DATA_DIR=./data
THEMES_DIR=./themes
```

This means a user could do:
```env
# Point to external folders
CONFIG_DIR=../my-site-config
DATA_DIR=/absolute/path/to/content
```

---

## 3. Source Directory (`src/`)

```
src/
├── layouts/                  # Layout packages
│   ├── docs/
│   │   ├── doc_style1/
│   │   │   ├── index.astro       # Entry point
│   │   │   ├── Sidebar.astro
│   │   │   ├── Outline.astro
│   │   │   └── Content.astro
│   │   └── doc_style2/
│   │
│   ├── blogs/
│   │   ├── blog_style1/
│   │   │   ├── blog_index.astro  # Listing page
│   │   │   └── blog_page.astro   # Post page
│   │   └── blog_style2/
│   │
│   ├── custom/
│   │   ├── home/
│   │   │   └── index.astro
│   │   ├── info/
│   │   └── roadmap/
│   │
│   ├── navbar/
│   │   ├── style1/
│   │   ├── style2/
│   │   └── minimal/
│   │
│   └── footer/
│       ├── default/
│       └── minimal/
│
├── hooks/                    # Utility functions
│   ├── useNavigation.ts
│   ├── useSidebar.ts
│   └── useTheme.ts
│
├── loaders/                  # Data & config loading
│   ├── config.ts             # Loads from $CONFIG_DIR
│   ├── content.ts            # Loads from $DATA_DIR
│   ├── data.ts               # Unified data engine
│   ├── paths.ts              # Resolves .env paths
│   └── index.ts
│
├── modules/                  # Feature modules
│   ├── search/
│   ├── analytics/
│   └── ai/
│
├── mdx_components/           # MDX components (@mdx)
│   ├── Card/
│   ├── Callout/
│   ├── CodeBlock/
│   ├── Tabs/
│   └── index.ts
│
├── assets/                   # Framework assets (icons, etc.)
│   └── icons/
│
├── pages/                    # Route handlers
│   ├── index.astro
│   ├── [...slug].astro
│   └── docs/
│       └── [...slug].astro
│
└── styles/                   # Global styles
    └── globals.css
```

---

## 4. Config Directory

Location defined by `$CONFIG_DIR` in `.env` (default: `./config`)

```
config/
├── site.yaml                 # Main site config
│   ├── site metadata
│   └── pages definitions
│
├── navbar.yaml               # Navigation config
│   ├── layout reference
│   └── nav items
│
└── footer.yaml               # Footer config
    ├── layout reference
    ├── columns
    └── social links
```

---

## 5. Data Directory

Location defined by `$DATA_DIR` in `.env` (default: `./data`)

```
data/
├── docs/                     # Documentation content
│   ├── getting-started/
│   │   ├── settings.json     # Section settings
│   │   ├── index.mdx
│   │   └── installation.mdx
│   ├── guides/
│   │   ├── settings.json
│   │   └── *.mdx
│   └── api/
│       └── *.mdx
│
├── blog/                     # Blog posts
│   ├── 2024-01-15-first-post.mdx
│   └── 2024-01-20-second-post.mdx
│
├── pages/                    # Custom page data
│   ├── home.yaml             # Homepage content
│   ├── about.yaml
│   └── roadmap.yaml
│
└── assets/                   # User assets
    ├── images/
    ├── icons/
    └── logos/
        └── logo.svg
```

---

## 6. Environment File

```env
# .env (at project root)

# ============================================
# DIRECTORY PATHS
# ============================================
# These can be relative (to project root) or absolute

# Configuration files
CONFIG_DIR=./config

# User content (docs, blog, pages, assets)
DATA_DIR=./data

# Custom themes (optional)
THEMES_DIR=./themes

# ============================================
# SITE SETTINGS
# ============================================
SITE_URL=http://localhost:4321
BASE_PATH=

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_SEARCH=false
ENABLE_DARK_MODE=true
```

---

## 7. How Loaders Use Paths

```typescript
// src/loaders/paths.ts

// Read from environment
const CONFIG_DIR = import.meta.env.CONFIG_DIR || './config';
const DATA_DIR = import.meta.env.DATA_DIR || './data';

// Resolve to absolute paths
export const configPath = path.resolve(process.cwd(), CONFIG_DIR);
export const dataPath = path.resolve(process.cwd(), DATA_DIR);

// Usage in other loaders
import { configPath, dataPath } from './paths';

export function loadSiteConfig() {
  return loadYaml(path.join(configPath, 'site.yaml'));
}

export function loadContent(subPath: string) {
  return loadFiles(path.join(dataPath, subPath));
}
```

---

## 8. Layout Package Structure

### Docs Layout Package
```
src/layouts/docs/doc_style1/
├── index.astro               # MANDATORY - Entry point
├── Sidebar.astro             # Sidebar component
├── Outline.astro             # Table of contents
├── Content.astro             # Main content wrapper
├── Pagination.astro          # Prev/Next navigation
└── styles.css                # Layout-specific styles
```

### Blog Layout Package
```
src/layouts/blogs/blog_style1/
├── blog_index.astro          # MANDATORY - Listing page
├── blog_page.astro           # MANDATORY - Post page
├── PostCard.astro            # Post preview card
├── Pagination.astro          # Page navigation
└── styles.css
```

### Custom Layout Package
```
src/layouts/custom/home/
├── index.astro               # MANDATORY - Page template
├── Hero.astro                # Hero section
├── Features.astro            # Features grid
└── styles.css
```

---

## 9. File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Layout folders | snake_case | `doc_style1/` |
| Components | PascalCase.astro | `Sidebar.astro` |
| Config files | lowercase.yaml | `site.yaml` |
| MDX content | kebab-case.mdx | `getting-started.mdx` |
| Blog posts | `YYYY-MM-DD-slug.mdx` | `2024-01-15-hello.mdx` |
| Settings | settings.json | `settings.json` |

---

## 10. Required vs Optional Files

### Required (Framework)
```
src/layouts/docs/*/index.astro
src/layouts/blogs/*/blog_index.astro
src/layouts/blogs/*/blog_page.astro
src/layouts/custom/*/index.astro
src/layouts/navbar/*/index.astro
src/layouts/footer/*/index.astro
src/loaders/paths.ts
src/loaders/config.ts
src/loaders/data.ts
```

### Required (User)
```
.env
config/site.yaml
```

### Optional
```
config/navbar.yaml          # Uses default if missing
config/footer.yaml          # Uses default if missing
data/*/settings.json        # Uses defaults if missing
themes/*                    # Only if customizing
```

---

## 11. Flexibility Example

User wants docs in a different location:

```env
# .env
DATA_DIR=/home/user/my-documentation
```

User wants shared config across multiple sites:

```env
# .env
CONFIG_DIR=../shared-config
DATA_DIR=./my-site-data
```

The code doesn't care - it just reads from whatever path `.env` specifies.
