---
title: Site Configuration
description: Configure site metadata, logo, favicon, and theme in site.yaml
sidebar_position: 3
---

# Site Configuration

The `site.yaml` file defines your site's metadata, logo, favicon, and theme configuration.

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

# Vite server configuration (optional)
server:
  allowedHosts:
    - ".localhost"
    - "127.0.0.1"

# Theme configuration
theme: "@theme/default"  # or "@theme/minimal" for custom theme

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

## Theme Configuration

The `theme` field specifies which theme to use for the site's styling.

```yaml
# Use default built-in theme
theme: "@theme/default"

# Use a custom theme
theme: "@theme/minimal"
```

| Value | Description |
|-------|-------------|
| `@theme/default` | Built-in theme from `src/styles/` |
| `@theme/theme_name` | Custom theme from `THEMES_DIR/theme_name/` |

### Theme Inheritance

Custom themes can inherit from the default theme, only overriding specific variables:

```yaml
# In THEMES_DIR/minimal/theme.yaml
name: "Minimal Theme"
extends: "@theme/default"  # Inherit from default
supports_dark_mode: true
```

See [Themes Documentation](/docs/themes) for complete details on creating and using themes.

## Server Configuration

The `server` block configures Vite's development server settings, particularly for controlling which hosts are allowed to connect.

```yaml
server:
  allowedHosts:
    - ".localhost"
    - "127.0.0.1"
    - "my-app.local"
    - ".ngrok.io"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `allowedHosts` | `string[]` | No | List of hostnames allowed to connect to the dev server |

### `allowedHosts`

Controls which hostnames are permitted to access the development server. This is a security feature from Vite that prevents DNS rebinding attacks when the server is exposed to the network.

```yaml
server:
  allowedHosts:
    # Allow localhost variants
    - ".localhost"
    - "127.0.0.1"

    # Allow custom local domain
    - "my-app.local"

    # Allow ngrok tunnels
    - ".ngrok.io"
    - ".ngrok-free.app"

    # Allow specific subdomain
    - "dev.example.com"
```

**Pattern Syntax:**
- Use `.` prefix for wildcard subdomains: `.ngrok.io` matches `abc123.ngrok.io`
- Exact hostnames: `my-app.local` matches only that hostname
- IP addresses: `127.0.0.1`, `192.168.1.100`

**When to Use:**

Configure `allowedHosts` when:
- Using `HOST=true` in `.env` to enable network access
- Accessing the dev server via custom local domains
- Using tunneling services (ngrok, localtunnel, Cloudflare Tunnel)
- Developing on remote machines

**Related Setting:**

The `HOST` environment variable in `.env` controls whether the server accepts network connections:

```env
# Enable network access (required for allowedHosts to be relevant)
HOST=true
```

See [Environment Variables](./02_env.md#server-settings) for more details.

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

interface ServerConfig {
  allowedHosts?: string[];
}

interface SiteConfig {
  site: SiteMetadata;
  server?: ServerConfig;    // Vite server configuration
  theme?: string;           // Theme alias (e.g., "@theme/default")
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

# Vite server configuration (optional)
server:
  allowedHosts:
    - ".localhost"
    - "127.0.0.1"
    - ".ngrok.io"

# Theme (optional - defaults to @theme/default)
theme: "@theme/default"

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
