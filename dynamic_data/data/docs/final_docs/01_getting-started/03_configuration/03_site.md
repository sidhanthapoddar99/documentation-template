---
title: Site Configuration
description: Configure site metadata, logo, and favicon in site.yaml
sidebar_position: 3
---

# Site Configuration

The `site.yaml` file defines your site's metadata, logo, and favicon configuration.

## Location

```
config/site.yaml
```

## Structure

```yaml
# Site metadata
site:
  name: "My Docs"
  title: "My Documentation"
  description: "Modern documentation built with Astro"

# Logo and favicon configuration
logo:
  src: "@assets/logo.svg"
  alt: "Docs"
  theme:
    dark: "logo-dark.svg"
    light: "logo-light.svg"
  favicon: "@assets/favicon.png"
```

## Site Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Short site name (navbar, footer) |
| `title` | `string` | Yes | Full site title (browser tab) |
| `description` | `string` | Yes | SEO meta description |

### `name`

Short name used in:
- Navbar (when no logo)
- Footer copyright
- Open Graph site name

```yaml
site:
  name: "Acme Docs"
```

### `title`

Full title used in:
- Browser tab/title bar
- SEO title tag
- Home page heading

```yaml
site:
  title: "Acme Documentation"
```

### `description`

Used for:
- Meta description tag
- Open Graph description
- Search engine results

```yaml
site:
  description: "Complete documentation for Acme's developer tools and APIs"
```

Keep under 160 characters for best SEO results.

## Logo Configuration

The `logo` block configures the site logo displayed in the navbar and the favicon.

```yaml
logo:
  src: "@assets/logo.svg"
  alt: "Docs"
  theme:
    dark: "logo-dark.svg"
    light: "logo-light.svg"
  favicon: "@assets/favicon.png"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `src` | `string` | No | Path to logo image |
| `alt` | `string` | Yes | Alt text for accessibility |
| `theme` | `object` | No | Theme-specific logo variants |
| `theme.dark` | `string` | No | Filename for dark mode logo |
| `theme.light` | `string` | No | Filename for light mode logo |
| `favicon` | `string` | No | Path to favicon image |

### Asset Paths

Logo and favicon paths support the `@assets` alias:

```yaml
logo:
  src: "@assets/logo.svg"        # Resolves to /assets/logo.svg
  favicon: "@assets/favicon.png" # Resolves to /assets/favicon.png
```

The assets location is configured via `ASSETS_DIR` in `.env`:

```env
# Default location
ASSETS_DIR=./dynamic_data/data/assets

# Or use a custom location
ASSETS_DIR=/var/www/assets
```

See [Environment Variables](./02_env.md) for more details.

You can also use absolute paths:

```yaml
logo:
  src: "/logo.svg"      # Served from public/logo.svg
  favicon: "/icon.png"  # Served from public/icon.png
```

### Theme Variants

Specify different logos for light and dark themes:

```yaml
logo:
  src: "@assets/logo.svg"
  theme:
    dark: "logo-dark.svg"   # Used in dark mode
    light: "logo-light.svg" # Used in light mode
```

If `src` is omitted, the site name is displayed as text instead.

### Favicon

The favicon appears in browser tabs and bookmarks:

```yaml
logo:
  favicon: "@assets/favicon.png"
```

Supported formats: `.png`, `.ico`, `.svg`

If not specified, defaults to `/favicon.svg`.

## TypeScript Interface

```typescript
interface SiteMetadata {
  name: string;
  title: string;
  description: string;
}

interface LogoTheme {
  dark?: string;
  light?: string;
}

interface SiteLogo {
  src?: string;
  alt?: string;
  theme?: LogoTheme;
  favicon?: string;
}

interface SiteConfig {
  site: SiteMetadata;
  logo?: SiteLogo;
  pages: Record<string, PageConfig>;
}
```

## Loading in Code

```typescript
import { loadSiteConfig, getSiteLogo, getFavicon } from '@loaders/config';

// Get full site config
const config = loadSiteConfig();
const { name, title, description } = config.site;

// Get logo configuration
const logo = getSiteLogo();
// logo.src, logo.alt, logo.theme, logo.favicon

// Get favicon URL
const faviconUrl = getFavicon();
```

## Complete Example

```yaml
# site.yaml
site:
  name: "My Docs"
  title: "My Documentation"
  description: "Modern documentation built with Astro"

logo:
  src: "@assets/astro.svg"
  alt: "My Docs"
  theme:
    dark: "astro.svg"
    light: "astro.svg"
  favicon: "@assets/astro.png"

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
```

## Default Values

If `site.yaml` is missing, defaults are used:

```typescript
{
  site: {
    name: 'Documentation',
    title: 'Documentation Site',
    description: 'Modern documentation built with Astro',
  },
  logo: {
    alt: 'Docs',
  },
  pages: {},
}
```
