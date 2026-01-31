---
title: Configuration Overview
description: Overview of site configuration system
sidebar_position: 1
---

# Configuration Overview

Configuration is split across three YAML files in `CONFIG_DIR` (default: `dynamic_data/config/`).

## Configuration Files

```
config/
├── site.yaml      # Site metadata + page definitions
├── navbar.yaml    # Navigation bar configuration
└── footer.yaml    # Footer configuration
```

| File | Contents |
|------|----------|
| `site.yaml` | Site metadata (`site:`) and page definitions (`pages:`) |
| `navbar.yaml` | Logo and navigation items |
| `footer.yaml` | Footer layout, columns, and social links |

## File Structure Overview

### site.yaml

```yaml
# Site metadata
site:
  name: "My Docs"
  title: "My Documentation"
  description: "Modern documentation built with Astro"

# Page definitions
pages:
  docs:
    base_url: "/docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs"

  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/blog_style1"
    data: "@data/blog"
```

### navbar.yaml

```yaml
logo:
  src: "/logo.svg"
  alt: "Docs"

items:
  - label: "Home"
    href: "/"
  - label: "Docs"
    href: "/docs"
```

### footer.yaml

```yaml
layout: "@footer/default"
copyright: "© {year} My Docs. All rights reserved."

columns:
  - title: "Documentation"
    links:
      - label: "Getting Started"
        href: "/docs/getting-started"

social:
  - platform: "github"
    href: "https://github.com/user/repo"
```

## Path Aliases

Configuration supports path aliases for cleaner references:

| Alias | Resolves To |
|-------|-------------|
| `@docs/style_name` | `src/layouts/docs/styles/style_name/` |
| `@blog/style_name` | `src/layouts/blog/styles/style_name/` |
| `@custom/style_name` | `src/layouts/custom/styles/style_name/` |
| `@footer/style_name` | `src/layouts/footer/styles/style_name/` |
| `@data/path` | `DATA_DIR/data/path` |

## Config Loader

Configuration is loaded by `src/loaders/config.ts`:

```typescript
import { loadSiteConfig, loadNavbarConfig, loadFooterConfig } from '@loaders/config';

const siteConfig = loadSiteConfig();    // site.yaml
const navbarConfig = loadNavbarConfig(); // navbar.yaml
const footerConfig = loadFooterConfig(); // footer.yaml
```

### Helper Functions

| Function | Purpose |
|----------|---------|
| `getPages()` | Get all page configurations |
| `getPage(name)` | Get specific page config |
| `resolvePageUrl(name)` | Convert page name to URL |
| `processCopyright(str)` | Replace `{year}` with current year |
| `validateRoutes(pages)` | Check for overlapping routes |

## Page References

Footer links can reference pages by name instead of hardcoding URLs:

```yaml
# In footer.yaml
links:
  - label: "Blog"
    page: "blog"      # References pages.blog in site.yaml
  - label: "About"
    page: "about"     # References pages.about in site.yaml
```

The `page:` property is resolved to the page's `base_url` at runtime.

## Validation

The system validates configuration at build time:

- Missing required fields
- Invalid layout paths
- Overlapping routes (except `/`)

## Quick Reference

| Section | File | Link |
|---------|------|------|
| Environment | `.env` | [env.md](./env) |
| Site Metadata | `site.yaml` → `site:` | [site.md](./site) |
| Page Definitions | `site.yaml` → `pages:` | [page.md](./page) |
| Navigation | `navbar.yaml` | [navbar.md](./navbar) |
| Footer | `footer.yaml` | [footer.md](./footer) |
