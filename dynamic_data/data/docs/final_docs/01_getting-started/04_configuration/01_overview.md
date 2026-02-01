---
title: Configuration Overview
description: Overview of site configuration system
sidebar_position: 1
---

# Configuration Overview

Configuration is split across environment variables and YAML files.

## Directory Structure

```
dynamic_data/
├── config/           # Configuration files (CONFIG_DIR)
│   ├── site.yaml     # Site metadata, logo, pages
│   ├── navbar.yaml   # Navigation items
│   └── footer.yaml   # Footer configuration
├── assets/           # Static assets (ASSETS_DIR)
│   ├── logo.svg
│   └── favicon.png
└── data/             # Content (DATA_DIR)
    ├── docs/
    ├── blog/
    └── pages/
```

## Configuration Files

| File | Contents |
|------|----------|
| `site.yaml` | Site metadata, logo/favicon, and page definitions |
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
| `@data/path` | `DATA_DIR/path` | Content data |
| `@assets/file` | `ASSETS_DIR/file` → `/assets/file` | Static assets |

### Assets Alias

The `@assets` alias is special - it resolves to a web URL:

```yaml
logo:
  src: "@assets/logo.svg"    # Becomes /assets/logo.svg
  favicon: "@assets/icon.png" # Becomes /assets/icon.png
```

Assets are served from the `ASSETS_DIR` location (configured in `.env`).

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
