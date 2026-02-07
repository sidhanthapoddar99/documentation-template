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

# Editor Configuration (required for dev toolbar live editor)
editor:
  autosave_interval: 10000  # milliseconds (minimum: 1000)
  presence:
    ping_interval: 5000       # Client ping frequency via WebSocket (ms)
    stale_threshold: 30000    # Remove users with no heartbeat after this (ms)
    cursor_throttle: 100      # Min interval between cursor broadcasts (ms)
    content_debounce: 150     # Debounce for raw text diff sync (ms)
    render_interval: 5000     # Interval for rendered preview updates (ms)
    sse_keepalive: 15000      # SSE keepalive comment interval (ms)
    sse_reconnect: 2000       # SSE auto-reconnect delay on disconnect (ms)

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

### `editor` - Live Editor Configuration

The `editor` block configures the dev toolbar's live editor. `autosave_interval` is **required** — the dev server fails to start without it. The `presence` sub-block is optional (sensible defaults used).

```yaml
editor:
  autosave_interval: 10000  # Required. Auto-save interval in ms (min: 1000)
  presence:
    ping_interval: 5000       # Client ping frequency via WS (ms, default: 5000, min: 1000)
    stale_threshold: 30000    # Remove silent users after (ms, default: 30000, min: 5000)
    cursor_throttle: 100      # Min ms between cursor sends (default: 100, min: 16)
    content_debounce: 150     # Text diff debounce (ms, default: 150, min: 50)
    render_interval: 5000     # Preview re-render interval (ms, default: 5000, min: 1000)
    sse_keepalive: 15000      # SSE keepalive interval (ms, default: 15000, min: 5000)
    sse_reconnect: 2000       # SSE reconnect delay (ms, default: 2000, min: 500)
```

| Field | Required | Purpose |
|-------|----------|---------|
| `autosave_interval` | Yes | How often dirty documents are flushed to disk (ms) |
| `presence.ping_interval` | No | Client→server ping frequency for latency measurement |
| `presence.stale_threshold` | No | Duration before removing a user with no heartbeat |
| `presence.cursor_throttle` | No | Minimum delay between cursor position broadcasts |
| `presence.content_debounce` | No | Debounce for raw text diff sync to Yjs CRDT |
| `presence.render_interval` | No | How often the server re-renders and pushes preview updates |
| `presence.sse_keepalive` | No | SSE keepalive comment interval (also updates lastSeen) |
| `presence.sse_reconnect` | No | Client SSE reconnect delay after disconnect |

Timing values (`pingInterval`, `cursorThrottle`, `renderInterval`) are sent to editor clients via WebSocket `MSG_CONFIG` on connect.

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

editor:
  autosave_interval: 10000
  presence:
    ping_interval: 5000
    stale_threshold: 30000
    cursor_throttle: 100
    content_debounce: 150
    render_interval: 5000
    sse_keepalive: 15000
    sse_reconnect: 2000

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
