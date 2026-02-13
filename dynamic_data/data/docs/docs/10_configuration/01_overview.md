---
title: Configuration Overview
description: Overview of site configuration system
sidebar_position: 1
---

# Configuration Overview

Configuration is centralized in YAML files. The `.env` file only provides `CONFIG_DIR` (bootstrap to locate `site.yaml`). All other directory paths are defined in `site.yaml`'s `paths:` section.

> **Path relativity:** `CONFIG_DIR` in `.env` is relative to the **project root**. Paths in `site.yaml`'s `paths:` section are relative to the **config directory** (where `site.yaml` lives). Absolute paths work in both places.

## Directory Structure

```
dynamic_data/
├── config/           # Configuration files (CONFIG_DIR from .env)
│   ├── site.yaml     # Site metadata, logo, paths, pages
│   ├── navbar.yaml   # Navigation items
│   └── footer.yaml   # Footer configuration
├── assets/           # Static assets (paths.assets in site.yaml)
│   ├── logo.svg
│   └── favicon.png
├── data/             # Content (paths.data in site.yaml)
│   ├── docs/
│   ├── blog/
│   └── pages/
├── themes/           # Custom themes (paths.themes in site.yaml)
└── layouts/          # External layouts (LAYOUT_EXT_DIR from .env, optional)
    └── docs/styles/  # Custom doc layouts, etc.
```

## Configuration Files

| File | Contents |
|------|----------|
| `site.yaml` | Site metadata, directory paths, logo/favicon, and page definitions |
| `navbar.yaml` | Navigation items |
| `footer.yaml` | Footer layout, columns, and social links |

## File Structure Overview

### site.yaml

```yaml
# Site metadata
site:
  name: "My Docs"
  title: "My Documentation"
  description: "Modern documentation built with Astro"

# Directory paths (relative to this config directory, or absolute)
paths:
  data: "../data"
  assets: "../assets"
  themes: "../themes"

# Logo and favicon
logo:
  src: "@assets/logo.svg"
  alt: "Docs"
  theme:
    dark: "logo-dark.svg"
    light: "logo-light.svg"
  favicon: "@assets/favicon.png"

# Page definitions
pages:
  docs:
    base_url: "/docs"
    type: docs
    layout: "@docs/default"
    data: "@data/docs"

  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/default"
    data: "@data/blog"
```

### navbar.yaml

```yaml
# Note: Logo configuration is in site.yaml

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

| Alias | Resolves To | Used For |
|-------|-------------|----------|
| `@docs/style_name` | `src/layouts/docs/style_name/` | Doc layouts |
| `@blog/style_name` | `src/layouts/blogs/style_name/` | Blog layouts |
| `@custom/style_name` | `src/layouts/custom/style_name/` | Custom page layouts |
| `@footer/style_name` | `src/layouts/footer/style_name/` | Footer layouts |
| `@data/path` | `paths.data/path` | Content data |
| `@assets/file` | `paths.assets/file` → `/assets/file` | Static assets |
| `@themes/name` | `paths.themes/name` | Custom themes |

### Assets Alias

The `@assets` alias is special - it resolves to a web URL:

```yaml
logo:
  src: "@assets/logo.svg"    # Becomes /assets/logo.svg
  favicon: "@assets/icon.png" # Becomes /assets/icon.png
```

Assets are served from the `paths.assets` location (configured in `site.yaml`).

## Config Loader

Configuration is loaded by `src/loaders/config.ts`:

```typescript
import {
  loadSiteConfig,
  loadNavbarConfig,
  loadFooterConfig,
  getSiteLogo,
  getFavicon
} from '@loaders/config';

const siteConfig = loadSiteConfig();    // site.yaml
const navbarConfig = loadNavbarConfig(); // navbar.yaml
const footerConfig = loadFooterConfig(); // footer.yaml

// Logo and favicon helpers
const logo = getSiteLogo();
const faviconUrl = getFavicon();
```

### Helper Functions

| Function | Purpose |
|----------|---------|
| `getPages()` | Get all page configurations |
| `getPage(name)` | Get specific page config |
| `getSiteLogo()` | Get logo configuration with resolved URLs |
| `getFavicon()` | Get favicon URL |
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
| Site Metadata & Logo | `site.yaml` | [site.md](./site) |
| Page Definitions | `site.yaml` → `pages:` | [page.md](./page) |
| Navigation | `navbar.yaml` | [navbar.md](./navbar) |
| Footer | `footer.yaml` | [footer.md](./footer) |
