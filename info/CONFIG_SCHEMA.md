# Configuration Schema

> **Note:** Previous code moved to `old_code/` folder.

This document defines the configuration schema for the documentation framework.

---

## 1. Main Configuration File

Location: `config/site.yaml`

```yaml
# Site metadata
site:
  name: "My Documentation"
  title: "Documentation Site"
  description: "Modern documentation built with Astro"
  logo:
    src: "@data/assets/logo.svg"
    alt: "Logo"

# Pages definition
pages:
  docs_main:
    base_url: "/docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs"

  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/blog_style1"
    data: "@data/blog"

  home:
    base_url: "/"
    type: custom
    layout: "@custom/home"
    data: "@data/pages/home.yaml"
```

---

## 2. Page Definition Schema

```typescript
interface PageConfig {
  // Route prefix (e.g., "/docs", "/blog", "/")
  base_url: string;

  // Page type
  type: 'docs' | 'blog' | 'custom';

  // Layout reference using @ prefix
  // @docs/style_name | @blog/style_name | @custom/template_name
  layout: string;

  // Data source using @ prefix
  // @data/path/to/content
  data: string;
}
```

---

## 3. Navbar Configuration

Location: `config/navbar.yaml`

```yaml
# Navbar style (references layouts/navbar/)
layout: "@navbar/style1"

# Navigation items
items:
  # Simple link
  - label: "Home"
    href: "/"

  # Link to page (uses page's base_url)
  - label: "Documentation"
    page: "docs_main"

  # Dropdown group
  - label: "Resources"
    children:
      - label: "Blog"
        page: "blog"
      - label: "Guides"
        href: "/guides"

  # External link
  - label: "GitHub"
    href: "https://github.com/user/repo"
    external: true
    icon: "github"
```

### Navbar Item Schema

```typescript
interface NavItem {
  label: string;

  // One of these (mutually exclusive):
  href?: string;           // Direct URL
  page?: string;           // Reference to page name
  children?: NavItem[];    // Dropdown items

  // Optional
  external?: boolean;      // Opens in new tab
  icon?: string;           // Icon name
}
```

---

## 4. Footer Configuration

Location: `config/footer.yaml`

```yaml
# Footer style
layout: "@footer/default"

# Copyright (use {year} for dynamic year)
copyright: "© {year} My Company. All rights reserved."

# Footer columns
columns:
  - title: "Product"
    links:
      - label: "Documentation"
        page: "docs_main"
      - label: "Blog"
        page: "blog"

  - title: "Company"
    links:
      - label: "About"
        href: "/about"
      - label: "Contact"
        href: "/contact"

# Social links
social:
  - platform: "github"
    href: "https://github.com/user/repo"
  - platform: "twitter"
    href: "https://twitter.com/user"
```

---

## 5. Docs Settings Schema

Location: At root of each docs folder (e.g., `data/docs/settings.json`)

```json
{
  "sidebar": {
    "collapsed": false,
    "collapsible": true,
    "sort": "position",
    "depth": 3
  },
  "outline": {
    "enabled": true,
    "levels": [2, 3],
    "title": "On this page"
  },
  "pagination": {
    "enabled": true,
    "showPrevNext": true
  }
}
```

### Settings Fields

| Field | Type | Description |
|-------|------|-------------|
| `sidebar.collapsed` | boolean | Start collapsed |
| `sidebar.collapsible` | boolean | Allow collapse |
| `sidebar.sort` | string | `"position"` or `"alphabetical"` |
| `sidebar.depth` | number | Max nesting depth |
| `outline.enabled` | boolean | Show outline |
| `outline.levels` | number[] | Heading levels to include |
| `pagination.enabled` | boolean | Show prev/next |

---

## 6. Type Definitions (TypeScript)

```typescript
// Page types
type PageType = 'docs' | 'blog' | 'custom';

// Layout references
type LayoutRef = `@docs/${string}` | `@blog/${string}` | `@custom/${string}`;

// Data references
type DataRef = `@data/${string}`;

// Page configuration
interface PageConfig {
  base_url: string;
  type: PageType;
  layout: LayoutRef;
  data: DataRef;
}

// Site configuration
interface SiteConfig {
  site: {
    name: string;
    title: string;
    description: string;
    logo?: {
      src: string;
      alt: string;
    };
  };
  pages: Record<string, PageConfig>;
}

// Navbar configuration
interface NavbarConfig {
  layout: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href?: string;
  page?: string;
  children?: NavItem[];
  external?: boolean;
  icon?: string;
}

// Footer configuration
interface FooterConfig {
  layout: string;
  copyright: string;
  columns?: FooterColumn[];
  social?: SocialLink[];
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterLink {
  label: string;
  href?: string;
  page?: string;
}

interface SocialLink {
  platform: string;
  href: string;
}
```

---

## 7. Route Validation Rules

1. **No overlapping routes**
   - ❌ `/docs/api` and `/docs/api/v2`
   - ✅ `/docs` and `/blog`

2. **Root exception**
   - `/` can coexist with any other route

3. **Trailing slashes**
   - Normalized (both `/docs` and `/docs/` treated same)

4. **External links**
   - Not validated (used for navbar items only)

---

## 8. @ Prefix Resolution

| Prefix | Default Resolution | Configurable |
|--------|-------------------|--------------|
| `@docs` | `layouts/docs/` | No |
| `@blog` | `layouts/blogs/` | No |
| `@custom` | `layouts/custom/` | No |
| `@navbar` | `layouts/navbar/` | No |
| `@footer` | `layouts/footer/` | No |
| `@data` | From `DATA_DIR` env | Yes |
| `@mdx` | `mdx_components/` | No |
