# navbar.yaml Reference

The `navbar.yaml` file configures the navigation menu at the top of the site.

## Location

`docs/data/config/navbar.yaml`

## Complete Structure

```yaml
# Layout style
layout: "@navbar/style1"

# Navigation items
items:
  - label: "Home"
    href: "/"

  - label: "Docs"
    href: "/docs"

  - label: "Dropdown"
    items:
      - label: "Item 1"
        href: "/item-1"
      - label: "Item 2"
        href: "/item-2"

  - label: "External"
    href: "https://github.com/user/repo"
```

## Section Details

### `layout` - Navbar Style

```yaml
layout: "@navbar/style1"
```

**Available Layouts:**
- `@navbar/style1` - Full-featured navbar with dropdowns
- `@navbar/minimal` - Simple navbar

### `items` - Navigation Items

Array of navigation items. Each item can be a link or a dropdown.

#### Simple Link

```yaml
items:
  - label: "Home"
    href: "/"
```

| Field | Required | Purpose |
|-------|----------|---------|
| `label` | Yes | Text displayed in navbar |
| `href` | Yes | URL to navigate to |

#### Dropdown Menu

```yaml
items:
  - label: "Guides"
    items:
      - label: "User Guide"
        href: "/user-guide"
      - label: "PRD"
        href: "/prd"
      - label: "Internal Docs"
        href: "/internal-docs"
```

| Field | Required | Purpose |
|-------|----------|---------|
| `label` | Yes | Dropdown trigger text |
| `items` | Yes | Array of sub-items |

#### External Link

```yaml
items:
  - label: "GitHub"
    href: "https://github.com/user/repo"
```

External links (starting with `http://` or `https://`) open in a new tab.

## Complete Example

```yaml
layout: "@navbar/style1"

items:
  - label: "Home"
    href: "/"

  - label: "Docs"
    href: "/docs"

  - label: "Guides"
    items:
      - label: "User Guide"
        href: "/user-guide"
      - label: "PRD"
        href: "/prd"
      - label: "Internal Docs"
        href: "/internal-docs"

  - label: "Roadmap"
    href: "/roadmap"

  - label: "Blog"
    href: "/blog"

  - label: "About"
    href: "/about"

  - label: "GitHub"
    href: "https://github.com/user/repo"
```

## Item Ordering

Items appear left-to-right in the order defined in the file.

**Recommended Order:**
1. Home
2. Main docs
3. Guides dropdown
4. Roadmap
5. Blog
6. About
7. GitHub (external links last)

## Matching URLs with site.yaml

Navbar `href` values must match `base_url` in site.yaml.

**site.yaml:**
```yaml
pages:
  docs:
    base_url: "/docs"
  user-guide:
    base_url: "/user-guide"
```

**navbar.yaml:**
```yaml
items:
  - label: "Docs"
    href: "/docs"           # Must match base_url
  - label: "User Guide"
    href: "/user-guide"     # Must match base_url
```

## Nested Dropdowns

Currently only single-level dropdowns are supported. Nested dropdowns (dropdowns within dropdowns) are not supported.

```yaml
# This works
items:
  - label: "Guides"
    items:
      - label: "Item 1"
        href: "/item-1"

# This does NOT work (nested dropdown)
items:
  - label: "Guides"
    items:
      - label: "Sub-menu"
        items:               # Nested dropdown not supported
          - label: "Deep Item"
            href: "/deep"
```

## Common Patterns

### Documentation Site

```yaml
items:
  - label: "Home"
    href: "/"
  - label: "Docs"
    href: "/docs"
  - label: "API"
    href: "/api"
  - label: "Blog"
    href: "/blog"
  - label: "GitHub"
    href: "https://github.com/org/repo"
```

### Product Documentation

```yaml
items:
  - label: "Home"
    href: "/"
  - label: "Docs"
    href: "/docs"
  - label: "Guides"
    items:
      - label: "User Guide"
        href: "/user-guide"
      - label: "Admin Guide"
        href: "/admin-guide"
      - label: "Developer Guide"
        href: "/developer-guide"
  - label: "API Reference"
    href: "/api"
  - label: "Changelog"
    href: "/changelog"
  - label: "Support"
    href: "https://support.example.com"
```

### Internal Documentation

```yaml
items:
  - label: "Home"
    href: "/"
  - label: "Docs"
    href: "/docs"
  - label: "Resources"
    items:
      - label: "PRD"
        href: "/prd"
      - label: "Technical Specs"
        href: "/specs"
      - label: "Runbooks"
        href: "/runbooks"
  - label: "Roadmap"
    href: "/roadmap"
  - label: "Team Wiki"
    href: "https://wiki.internal.com"
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Item not appearing | Invalid YAML syntax | Check for missing quotes, colons |
| 404 when clicking | href doesn't match site.yaml | Match base_url exactly |
| Dropdown not working | Missing `items` array | Add items array for dropdown |
| External link not opening | Missing protocol | Use full URL with https:// |
