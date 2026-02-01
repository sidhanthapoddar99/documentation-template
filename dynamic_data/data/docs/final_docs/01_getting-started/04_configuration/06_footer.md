---
title: Footer Configuration
description: Configure the site footer in footer.yaml
sidebar_position: 6
---

# Footer Configuration

The `footer.yaml` file configures your site's footer.

## Location

```
config/footer.yaml
```

## Structure

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

## Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `layout` | `string` | Yes | Footer layout alias |
| `copyright` | `string` | Yes | Copyright text |
| `columns` | `array` | No | Link columns |
| `social` | `array` | No | Social media links |

## Layout

Specify which footer layout to use:

```yaml
layout: "@footer/default"
```

Resolves to: `src/layouts/footer/styles/default/Layout.astro`

## Copyright

The copyright text supports a `{year}` placeholder:

```yaml
copyright: "© {year} My Docs. All rights reserved."
```

Rendered as: "© 2024 My Docs. All rights reserved."

The year is replaced dynamically via `processCopyright()`.

## Link Columns

Organize footer links into columns:

```yaml
columns:
  - title: "Documentation"
    links:
      - label: "Getting Started"
        href: "/docs/getting-started"
      - label: "Guides"
        href: "/docs/guides"
      - label: "API Reference"
        href: "/docs/api"

  - title: "Community"
    links:
      - label: "Blog"
        page: "blog"           # Page reference
      - label: "Discord"
        href: "https://discord.gg/example"
      - label: "GitHub"
        href: "https://github.com/user/repo"

  - title: "Company"
    links:
      - label: "About"
        page: "about"          # Page reference
      - label: "Contact"
        href: "/contact"
```

### Column Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | Column heading |
| `links` | `array` | Yes | Array of link objects |

### Link Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | Yes | Display text |
| `href` | `string` | No* | Direct URL |
| `page` | `string` | No* | Page name reference |

*One of `href` or `page` is required.

### Page References

Use `page:` to reference pages defined in `site.yaml`:

```yaml
links:
  - label: "Blog"
    page: "blog"      # Resolves to pages.blog.base_url → "/blog"
  - label: "About"
    page: "about"     # Resolves to pages.about.base_url → "/about"
```

This keeps URLs in sync automatically.

## Social Links

Add social media icons:

```yaml
social:
  - platform: "github"
    href: "https://github.com/user/repo"
  - platform: "twitter"
    href: "https://twitter.com/user"
  - platform: "discord"
    href: "https://discord.gg/example"
```

### Social Link Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | `string` | Yes | Platform identifier |
| `href` | `string` | Yes | Link URL |

### Supported Platforms

| Platform | Icon |
|----------|------|
| `github` | GitHub |
| `twitter` | Twitter/X |
| `discord` | Discord |
| `linkedin` | LinkedIn |
| `youtube` | YouTube |
| `facebook` | Facebook |

## TypeScript Interface

```typescript
interface FooterLink {
  label: string;
  href?: string;
  page?: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  platform: string;
  href: string;
}

interface FooterConfig {
  layout: string;
  copyright: string;
  columns?: FooterColumn[];
  social?: SocialLink[];
}
```

## Loading in Code

```typescript
import { loadFooterConfig, processCopyright, resolvePageUrl } from '@loaders/config';

const footer = loadFooterConfig();

// Process copyright year
const copyright = processCopyright(footer.copyright);

// Resolve page references in links
footer.columns?.forEach(column => {
  column.links.forEach(link => {
    if (link.page) {
      link.href = resolvePageUrl(link.page);
    }
  });
});
```

## Default Values

If `footer.yaml` is missing:

```typescript
{
  layout: '@footer/default',
  copyright: '© {year} All rights reserved.',
  columns: [],
  social: [],
}
```

## Complete Example

```yaml
# footer.yaml
layout: "@footer/default"

copyright: "© {year} My Docs. All rights reserved."

columns:
  - title: "Documentation"
    links:
      - label: "Getting Started"
        href: "/docs/getting-started"
      - label: "Guides"
        href: "/docs/guides"
      - label: "API Reference"
        href: "/docs/api"

  - title: "Community"
    links:
      - label: "Blog"
        page: "blog"
      - label: "Discord"
        href: "https://discord.gg/example"
      - label: "GitHub"
        href: "https://github.com/user/repo"

  - title: "Company"
    links:
      - label: "About"
        page: "about"
      - label: "Contact"
        href: "/contact"

social:
  - platform: "github"
    href: "https://github.com/user/repo"
  - platform: "twitter"
    href: "https://twitter.com/user"
  - platform: "discord"
    href: "https://discord.gg/example"
```
