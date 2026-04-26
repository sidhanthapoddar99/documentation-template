---
title: Site Metadata
description: Configure site name, title, and description for SEO and branding
---

# Site Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Short site name (navbar, footer) |
| `title` | `string` | Yes | Full site title (browser tab) |
| `description` | `string` | Yes | SEO meta description |

## `name`

Short name used in:
- Navbar (when no logo)
- Footer copyright
- Open Graph site name

```yaml
site:
  name: "Acme Docs"
```

## `title`

Full title used in:
- Browser tab/title bar
- SEO title tag
- Home page heading

```yaml
site:
  title: "Acme Documentation"
```

## `description`

Used for:
- Meta description tag
- Open Graph description
- Search engine results

```yaml
site:
  description: "Complete documentation for Acme's developer tools and APIs"
```

Keep under 160 characters for best SEO results.
