---
title: Site Configuration
description: Configure site metadata in site.yaml
sidebar_position: 3
---

# Site Configuration

The `site:` block in `site.yaml` defines your site's metadata.

## Location

```
config/site.yaml
```

## Structure

```yaml
site:
  name: "My Docs"
  title: "My Documentation"
  description: "Modern documentation built with Astro"
```

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Short site name (navbar, footer) |
| `title` | `string` | Yes | Full site title (browser tab) |
| `description` | `string` | Yes | SEO meta description |

## Field Details

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

## TypeScript Interface

```typescript
interface SiteMetadata {
  name: string;
  title: string;
  description: string;
}
```

## Loading in Code

```typescript
import { loadSiteConfig } from '@loaders/config';

const config = loadSiteConfig();
const { name, title, description } = config.site;
```

## Example

```yaml
# site.yaml
site:
  name: "My Docs"
  title: "My Documentation"
  description: "Modern documentation built with Astro"

pages:
  # ... page definitions
```

## Default Values

If `site.yaml` is missing, defaults are used:

```typescript
{
  name: 'Documentation',
  title: 'Documentation Site',
  description: 'Modern documentation built with Astro',
}
```
