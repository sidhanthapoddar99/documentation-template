---
title: Logo Configuration
description: Configure site logo, theme variants, and favicon
---

# Logo Configuration

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

## Asset Paths

Logo and favicon paths support the `@assets` alias:

```yaml
logo:
  src: "@assets/logo.svg"        # Resolves to /assets/logo.svg
  favicon: "@assets/favicon.png" # Resolves to /assets/favicon.png
```

The assets location is configured via `paths.assets` in `site.yaml`:

```yaml
# site.yaml
paths:
  assets: "../assets"              # Relative to config dir
  # assets: "/var/www/assets"      # Or use an absolute path
```

You can also use absolute paths:

```yaml
logo:
  src: "/logo.svg"      # Served from public/logo.svg
  favicon: "/icon.png"  # Served from public/icon.png
```

## Theme Variants

Specify different logos for light and dark themes:

```yaml
logo:
  src: "@assets/logo.svg"
  theme:
    dark: "logo-dark.svg"   # Used in dark mode
    light: "logo-light.svg" # Used in light mode
```

If `src` is omitted, the site name is displayed as text instead.

## Favicon

The favicon appears in browser tabs and bookmarks:

```yaml
logo:
  favicon: "@assets/favicon.png"
```

Supported formats: `.png`, `.ico`, `.svg`

If not specified, defaults to `/favicon.svg`.
