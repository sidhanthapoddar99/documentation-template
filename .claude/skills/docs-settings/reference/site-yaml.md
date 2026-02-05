# site.yaml Reference

The `site.yaml` file configures site metadata, theme, logo, and page definitions.

## Location

`docs/data/config/site.yaml`

## Complete Structure

```yaml
# Site Metadata
site:
  name: "Product Name"
  title: "Product Name Documentation"
  description: "Documentation for Product Name"

# Server Configuration
server:
  allowedHosts: true

# Theme
theme: "@theme/minimal"

# Logo and Favicon
logo:
  src: "@assets/logo.svg"
  alt: "Product Name"
  theme:
    dark: "@assets/logo-dark.svg"
    light: "@assets/logo-light.svg"
  favicon: "@assets/favicon.png"

# Page Definitions
pages:
  page-name:
    base_url: "/url-path"
    type: docs | blog | custom
    layout: "@docs/style_name"
    data: "@data/folder-path"
```

## Section Details

### `site` - Site Metadata

```yaml
site:
  name: "Product Name"           # Short name (used in header, title)
  title: "Product Documentation" # Full page title
  description: "Description"     # SEO meta description
```

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Site name displayed in header |
| `title` | Yes | Browser tab title |
| `description` | Yes | SEO meta description |

### `server` - Server Configuration

```yaml
server:
  allowedHosts: true
```

**allowedHosts Options:**
- `true` - Allow all hosts (for tunnels, remote access)
- List of specific hosts:
  ```yaml
  allowedHosts:
    - ".localhost"
    - "127.0.0.1"
    - "my-app.local"
    - ".ngrok.io"
  ```

### `theme` - Theme Configuration

```yaml
theme: "@theme/minimal"
```

**Available Themes:**
- `@theme/default` - Full-featured theme
- `@theme/minimal` - Clean, minimal theme

### `logo` - Logo and Favicon

```yaml
logo:
  src: "@assets/logo.svg"          # Main logo
  alt: "Logo Alt Text"             # Accessibility text
  theme:
    dark: "@assets/logo-dark.svg"  # Logo for dark mode
    light: "@assets/logo-light.svg" # Logo for light mode
  favicon: "@assets/favicon.png"   # Browser favicon
```

| Field | Required | Purpose |
|-------|----------|---------|
| `src` | Yes | Default logo image |
| `alt` | Yes | Alt text for accessibility |
| `theme.dark` | No | Logo for dark mode |
| `theme.light` | No | Logo for light mode |
| `favicon` | No | Browser tab icon |

**Path Alias:** `@assets/` resolves to the ASSETS_DIR folder and becomes `/assets/` URL.

### `pages` - Page Definitions

Each page definition creates a route in your documentation site.

```yaml
pages:
  page-name:              # Unique identifier (used in footer page: references)
    base_url: "/url"      # URL path for this page
    type: docs            # Page type: docs, blog, or custom
    layout: "@docs/style" # Layout to use
    data: "@data/path"    # Content location
```

## Page Types

### Type: `docs`

Documentation with sidebar navigation.

```yaml
pages:
  docs:
    base_url: "/docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs"
```

**Data Path:** Points to a folder containing markdown files with `XX_` prefixes.

**Available Layouts:**
- `@docs/doc_style1` - Standard documentation layout

### Type: `blog`

Blog posts with date-based URLs.

```yaml
pages:
  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/blog_style1"
    data: "@data/blog"
```

**Data Path:** Points to a folder containing `YYYY-MM-DD-slug.md` files.

**Available Layouts:**
- `@blog/blog_style1` - Standard blog layout

### Type: `custom`

Landing pages, about pages, and other custom layouts.

```yaml
pages:
  home:
    base_url: "/"
    type: custom
    layout: "@custom/home"
    data: "@data/pages/home.yaml"

  about:
    base_url: "/about"
    type: custom
    layout: "@custom/info"
    data: "@data/pages/about.yaml"
```

**Data Path:** Points to a YAML file with page-specific data.

**Available Layouts:**
- `@custom/home` - Landing page layout
- `@custom/info` - Information page layout

## Complete Example

```yaml
site:
  name: "My Product"
  title: "My Product Documentation"
  description: "Complete documentation for My Product"

server:
  allowedHosts: true

theme: "@theme/minimal"

logo:
  src: "@assets/logo.svg"
  alt: "My Product"
  theme:
    dark: "@assets/logo-dark.svg"
    light: "@assets/logo-light.svg"
  favicon: "@assets/favicon.png"

pages:
  # Main Documentation
  docs:
    base_url: "/docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs"

  # User Guide
  user-guide:
    base_url: "/user-guide"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/user-guide"

  # PRD
  prd:
    base_url: "/prd"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/prd"

  # Internal Docs
  internal-docs:
    base_url: "/internal-docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/internal-docs"

  # Template Documentation
  doc-template-docs:
    base_url: "/doc-template/docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/doc-template/docs"

  doc-template-components:
    base_url: "/doc-template/components"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/doc-template/components"

  # Roadmap
  roadmap:
    base_url: "/roadmap"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/roadmap"

  # Blog
  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/blog_style1"
    data: "@data/blog"

  # Custom Pages
  home:
    base_url: "/"
    type: custom
    layout: "@custom/home"
    data: "@data/pages/home.yaml"

  about:
    base_url: "/about"
    type: custom
    layout: "@custom/info"
    data: "@data/pages/about.yaml"
```

## Validation Rules

1. **No overlapping base_url** - Each page must have a unique URL (except `/` for home)
2. **Data path must exist** - The folder/file at `data:` path must exist
3. **Layout must exist** - The layout reference must be valid
4. **Type must be valid** - Only `docs`, `blog`, or `custom`

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| 404 on page | `data:` path doesn't exist | Create the folder/file |
| Blank sidebar | No `settings.json` in docs folder | Add settings.json |
| Wrong logo | Incorrect `@assets/` path | Verify file exists in assets folder |
| Page not in navbar | Not added to navbar.yaml | Add item to navbar.yaml |
