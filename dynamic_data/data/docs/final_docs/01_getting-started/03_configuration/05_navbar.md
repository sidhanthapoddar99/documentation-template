---
title: Navbar Configuration
description: Configure the navigation bar in navbar.yaml
sidebar_position: 5
---

# Navbar Configuration

The `navbar.yaml` file configures your site's top navigation bar items.

## Location

```
config/navbar.yaml
```

## Structure

```yaml
# Note: Logo configuration has moved to site.yaml

items:
  - label: "Home"
    href: "/"

  - label: "Docs"
    href: "/docs/final-docs"

  - label: "Blog"
    href: "/blog"
```

## Logo Configuration

Logo and favicon configuration has moved to `site.yaml`. See [Site Configuration](./03_site.md) for details.

```yaml
# In site.yaml (not navbar.yaml)
logo:
  src: "@assets/logo.svg"
  alt: "Docs"
  theme:
    dark: "logo-dark.svg"
    light: "logo-light.svg"
  favicon: "@assets/favicon.png"
```

## Navigation Items

### Simple Links

```yaml
items:
  - label: "Home"
    href: "/"

  - label: "Docs"
    href: "/docs/final-docs"

  - label: "Blog"
    href: "/blog"

  - label: "About"
    href: "/about"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | Yes | Display text |
| `href` | `string` | Yes* | Link destination |
| `items` | `array` | No | Dropdown items (replaces `href`) |

### Dropdown Menus

Create dropdown menus with nested `items`:

```yaml
items:
  - label: "Docs"
    items:
      - label: "Layouts"
        href: "/docs/layouts"
      - label: "Components"
        href: "/docs/components"

  - label: "Resources"
    items:
      - label: "Blog"
        href: "/blog"
      - label: "GitHub"
        href: "https://github.com/user/repo"
```

When `items` is present, `href` is ignored (the parent becomes a dropdown trigger).

### External Links

External links (starting with `http`) automatically:
- Open in a new tab
- Have `rel="noopener noreferrer"`

```yaml
items:
  - label: "GitHub"
    href: "https://github.com/user/repo"
```

## TypeScript Interface

```typescript
interface NavItem {
  label: string;
  href?: string;
  items?: NavItem[];
}

interface NavbarConfig {
  items: NavItem[];
}
```

## Loading in Code

```typescript
import { loadNavbarConfig, getSiteLogo } from '@loaders/config';

const navbar = loadNavbarConfig();
const { items } = navbar;

// Logo is now loaded separately from site config
const logo = getSiteLogo();
```

## Default Values

If `navbar.yaml` is missing:

```typescript
{
  items: [],
}
```

## Complete Example

```yaml
# navbar.yaml
items:
  - label: "Home"
    href: "/"

  - label: "Docs"
    href: "/docs/final-docs"

  - label: "Docs"
    items:
      - label: "Layouts"
        href: "/docs/layouts"
      - label: "Components"
        href: "/docs/components"

  - label: "Blog"
    href: "/blog"

  - label: "About"
    href: "/about"

  - label: "GitHub"
    href: "https://github.com/user/repo"
```

## Migration Note

If you're upgrading from a previous version, move your logo configuration from `navbar.yaml` to `site.yaml`:

**Before (navbar.yaml):**
```yaml
logo:
  src: "/logo.svg"
  alt: "Docs"

items:
  # ...
```

**After (site.yaml):**
```yaml
site:
  name: "My Docs"
  # ...

logo:
  src: "@assets/logo.svg"
  alt: "Docs"
  theme:
    dark: "logo-dark.svg"
    light: "logo-light.svg"
  favicon: "@assets/favicon.png"
```

**After (navbar.yaml):**
```yaml
items:
  # ...
```
