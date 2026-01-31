---
title: Navbar Configuration
description: Configure the navigation bar in navbar.yaml
sidebar_position: 5
---

# Navbar Configuration

The `navbar.yaml` file configures your site's top navigation bar.

## Location

```
config/navbar.yaml
```

## Structure

```yaml
logo:
  src: "/logo.svg"
  alt: "Docs"

items:
  - label: "Home"
    href: "/"

  - label: "Docs"
    href: "/docs/final-docs"

  - label: "Blog"
    href: "/blog"
```

## Logo Configuration

```yaml
logo:
  src: "/logo.svg"
  alt: "Docs"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `src` | `string` | No | Path to logo image |
| `alt` | `string` | Yes | Alt text for accessibility |

If `src` is omitted, the site name is displayed instead.

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

interface NavbarLogo {
  src?: string;
  alt?: string;
}

interface NavbarConfig {
  logo?: NavbarLogo;
  items: NavItem[];
}
```

## Loading in Code

```typescript
import { loadNavbarConfig } from '@loaders/config';

const navbar = loadNavbarConfig();
const { logo, items } = navbar;
```

## Default Values

If `navbar.yaml` is missing:

```typescript
{
  logo: { alt: 'Docs' },
  items: [],
}
```

## Complete Example

```yaml
# navbar.yaml
logo:
  src: "/logo.svg"
  alt: "Docs"

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
