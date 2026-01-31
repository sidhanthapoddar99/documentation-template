---
title: Configuration
description: Configure your documentation site
---

# Configuration

All configuration lives in `dynamic_data/config/site.yaml`.

## Site Configuration

```yaml
site:
  name: "My Documentation"
  description: "Documentation for my awesome project"
  url: "https://docs.example.com"
```

| Field | Description |
|-------|-------------|
| `name` | Site name shown in navbar and title |
| `description` | SEO meta description |
| `url` | Production URL for canonical links |

## Pages Configuration

Define what pages exist and how they're rendered:

```yaml
pages:
  docs:
    base_url: "/docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs"

  blog:
    base_url: "/blog"
    type: blog
    layout: "@blogs/blog_style1"
    data: "@data/blog"

  home:
    base_url: "/"
    type: custom
    layout: "@custom/home"
    data: "@data/pages/home.yaml"
```

### Page Properties

| Property | Description |
|----------|-------------|
| `base_url` | URL path for this section |
| `type` | Content type: `docs`, `blog`, or `custom` |
| `layout` | Layout alias (see [Layouts](/docs/layouts/overview)) |
| `data` | Path to content directory or file |

### Path Aliases

| Alias | Resolves To |
|-------|-------------|
| `@docs/style_name` | `src/layouts/docs/styles/style_name/` |
| `@blogs/style_name` | `src/layouts/blogs/styles/style_name/` |
| `@custom/style_name` | `src/layouts/custom/styles/style_name/` |
| `@data/path` | `DATA_DIR/data/path` |
| `@assets/path` | `DATA_DIR/assets/path` |

## Navbar Configuration

```yaml
navbar:
  logo:
    src: "@assets/logo.svg"
    alt: "My Logo"
    href: "/"

  items:
    - label: "Docs"
      href: "/docs"

    - label: "Blog"
      href: "/blog"

    - label: "GitHub"
      href: "https://github.com/user/repo"
      external: true
```

### Dropdown Menus

```yaml
navbar:
  items:
    - label: "Resources"
      items:
        - label: "Documentation"
          href: "/docs"
        - label: "API Reference"
          href: "/api"
        - label: "Examples"
          href: "/examples"
```

## Footer Configuration

```yaml
footer:
  copyright: "© 2024 My Company"

  columns:
    - title: "Product"
      links:
        - label: "Features"
          href: "/features"
        - label: "Pricing"
          href: "/pricing"

    - title: "Resources"
      links:
        - label: "Documentation"
          href: "/docs"
        - label: "Blog"
          href: "/blog"

  social:
    - platform: "github"
      href: "https://github.com/user/repo"
    - platform: "twitter"
      href: "https://twitter.com/user"
```

## Environment Variables

Beyond `DATA_DIR` and `SITE_URL`, you can set:

```env
# Enable features
ENABLE_SEARCH=true
ENABLE_DARK_MODE=true

# External services
GITHUB_REPO=user/repo
GITHUB_BRANCH=main
```

## Validation

The system validates your configuration at build time. You'll see clear error messages if:

- A referenced layout doesn't exist
- A data path is invalid
- Required fields are missing

Example error:

```
[CONFIG ERROR] Docs layout "doc_style99" does not exist.
  Page: docs
  Config: @docs/doc_style99
  Expected: src/layouts/docs/styles/doc_style99/Layout.astro
  Available: doc_style1, doc_style2
```
