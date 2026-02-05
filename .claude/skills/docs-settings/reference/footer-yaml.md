# footer.yaml Reference

The `footer.yaml` file configures the site footer with link columns, copyright, and social links.

## Location

`docs/data/config/footer.yaml`

## Complete Structure

```yaml
# Footer layout style
layout: "@footer/default"

# Copyright notice
copyright: "© {year} Company Name. All rights reserved."

# Link columns
columns:
  - title: "Column Title"
    links:
      - label: "Link Text"
        href: "/path"
      - label: "Page Link"
        page: "page-name"

# Social media links
social:
  - platform: "github"
    href: "https://github.com/user/repo"
```

## Section Details

### `layout` - Footer Style

```yaml
layout: "@footer/default"
```

**Available Layouts:**
- `@footer/default` - Standard footer with columns and social links

### `copyright` - Copyright Notice

```yaml
copyright: "© {year} Company Name. All rights reserved."
```

**Dynamic Year:** Use `{year}` placeholder to insert the current year automatically.

### `columns` - Link Columns

Array of columns, each with a title and list of links.

```yaml
columns:
  - title: "Documentation"
    links:
      - label: "Getting Started"
        href: "/docs"
      - label: "User Guide"
        href: "/user-guide"
      - label: "API Reference"
        href: "/api"

  - title: "Resources"
    links:
      - label: "Blog"
        page: "blog"
      - label: "Roadmap"
        href: "/roadmap"

  - title: "Company"
    links:
      - label: "About"
        page: "about"
      - label: "Contact"
        href: "mailto:hello@example.com"
```

#### Link Types

**Direct href:**
```yaml
- label: "Getting Started"
  href: "/docs/getting-started"
```

**Page reference:** References a page defined in site.yaml. Automatically resolves to the page's base_url.
```yaml
- label: "Blog"
  page: "blog"    # References pages.blog in site.yaml
```

**External link:**
```yaml
- label: "GitHub"
  href: "https://github.com/user/repo"
```

**Email link:**
```yaml
- label: "Contact"
  href: "mailto:support@example.com"
```

### `social` - Social Media Links

```yaml
social:
  - platform: "github"
    href: "https://github.com/user/repo"
  - platform: "twitter"
    href: "https://twitter.com/username"
  - platform: "discord"
    href: "https://discord.gg/invite"
  - platform: "linkedin"
    href: "https://linkedin.com/company/name"
```

**Supported Platforms:**
- `github`
- `twitter` / `x`
- `discord`
- `linkedin`
- `youtube`
- `facebook`
- `instagram`
- `mastodon`
- `reddit`
- `slack`

Each platform displays its icon automatically.

## Complete Example

```yaml
layout: "@footer/default"

copyright: "© {year} My Product. All rights reserved."

columns:
  - title: "Documentation"
    links:
      - label: "Getting Started"
        href: "/docs"
      - label: "User Guide"
        href: "/user-guide"
      - label: "PRD"
        href: "/prd"
      - label: "Roadmap"
        href: "/roadmap"

  - title: "Resources"
    links:
      - label: "Blog"
        page: "blog"
      - label: "Template Docs"
        href: "/doc-template/docs"
      - label: "Components"
        href: "/doc-template/components"

  - title: "Company"
    links:
      - label: "About"
        page: "about"
      - label: "GitHub"
        href: "https://github.com/user/repo"
      - label: "Contact"
        href: "mailto:hello@example.com"

social:
  - platform: "github"
    href: "https://github.com/user/repo"
  - platform: "twitter"
    href: "https://twitter.com/username"
  - platform: "discord"
    href: "https://discord.gg/invite"
```

## Column Layout

**Recommended:** 2-4 columns for optimal layout.

**Typical Structure:**
1. **Documentation** - Links to main docs sections
2. **Resources** - Blog, changelog, external resources
3. **Company** - About, contact, legal pages

## Using Page References

Page references (`page:`) are resolved from site.yaml:

**site.yaml:**
```yaml
pages:
  blog:
    base_url: "/blog"
  about:
    base_url: "/about"
```

**footer.yaml:**
```yaml
links:
  - label: "Blog"
    page: "blog"      # Resolves to /blog
  - label: "About"
    page: "about"     # Resolves to /about
```

**Benefit:** If you change the `base_url` in site.yaml, footer links update automatically.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Link not working | href typo | Check URL matches site.yaml base_url |
| Page reference broken | Invalid page name | Verify page exists in site.yaml pages |
| Social icon missing | Invalid platform name | Use supported platform name |
| Year not showing | Missing {year} placeholder | Add {year} in copyright string |
| Columns misaligned | Too many columns | Keep to 2-4 columns |

## Minimal Footer

For a simple footer:

```yaml
layout: "@footer/default"

copyright: "© {year} My Product"

columns:
  - title: "Links"
    links:
      - label: "Docs"
        href: "/docs"
      - label: "About"
        href: "/about"

social:
  - platform: "github"
    href: "https://github.com/user/repo"
```
