---
title: Site Configuration
description: Configure site metadata, logo, favicon, and theme in site.yaml
sidebar_position: 3
---

# Site Configuration

The `site.yaml` file defines your site's metadata, logo, favicon, and theme configuration.

## Location

```
config/site.yaml
```

## Structure

```yaml
# Site metadata
site:
  name: "My Docs"
  title: "My Documentation"
  description: "Modern documentation built with Astro"

# Vite server configuration (optional)
server:
  allowedHosts: true  # or array of specific hosts

# Theme configuration
theme: "@theme/default"  # or "@theme/minimal" for custom theme

# Logo and favicon configuration
logo:
  src: "@assets/logo.svg"
  alt: "Docs"
  theme:
    dark: "logo-dark.svg"
    light: "logo-light.svg"
  favicon: "@assets/favicon.png"

# Editor configuration (required for dev toolbar live editor)
editor:
  autosave_interval: 10000  # milliseconds (minimum: 1000)
  presence:
    ping_interval: 5000       # How often clients ping the server (ms)
    stale_threshold: 30000    # Remove users with no heartbeat after this (ms)
    cursor_throttle: 100      # Min interval between cursor broadcasts (ms)
    content_debounce: 150     # Debounce for raw text diff sync (ms)
    render_interval: 5000     # Interval for rendered preview updates (ms)
    sse_keepalive: 15000      # SSE keepalive comment interval (ms)
    sse_reconnect: 2000       # SSE auto-reconnect delay on disconnect (ms)
```

## Site Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Short site name (navbar, footer) |
| `title` | `string` | Yes | Full site title (browser tab) |
| `description` | `string` | Yes | SEO meta description |

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

## Theme Configuration

The `theme` field specifies which theme to use for the site's styling.

```yaml
# Use default built-in theme
theme: "@theme/default"

# Use a custom theme
theme: "@theme/minimal"
```

| Value | Description |
|-------|-------------|
| `@theme/default` | Built-in theme from `src/styles/` |
| `@theme/theme_name` | Custom theme from `THEMES_DIR/theme_name/` |

### Theme Inheritance

Custom themes can inherit from the default theme, only overriding specific variables:

```yaml
# In THEMES_DIR/minimal/theme.yaml
name: "Minimal Theme"
extends: "@theme/default"  # Inherit from default
supports_dark_mode: true
```

See [Themes Documentation](/docs/themes) for complete details on creating and using themes.

## Server Configuration

The `server` block configures Vite's development server settings, particularly for controlling which hosts are allowed to connect.

```yaml
server:
  allowedHosts: true  # Allow all hosts
```

Or with specific hosts:

```yaml
server:
  allowedHosts:
    - ".localhost"
    - "127.0.0.1"
    - "my-app.local"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `allowedHosts` | `true` \| `string[]` | No | Allow all hosts (`true`) or list of specific hostnames |

### `allowedHosts`

Controls which hostnames are permitted to access the development server. This is a security feature from Vite that prevents DNS rebinding attacks when the server is exposed to the network.

**Option 1: Allow all hosts (convenient for development)**

```yaml
server:
  allowedHosts: true
```

**Option 2: Specific hosts only (more secure)**

```yaml
server:
  allowedHosts:
    # Allow localhost variants
    - ".localhost"
    - "127.0.0.1"

    # Allow custom local domain
    - "my-app.local"

    # Allow ngrok tunnels
    - ".ngrok.io"
    - ".ngrok-free.app"

    # Allow specific subdomain
    - "dev.example.com"
```

**Pattern Syntax (when using array):**
- Use `.` prefix for wildcard subdomains: `.ngrok.io` matches `abc123.ngrok.io`
- Exact hostnames: `my-app.local` matches only that hostname
- IP addresses: `127.0.0.1`, `192.168.1.100`

**When to Use:**

Configure `allowedHosts` when:
- Using `HOST=true` in `.env` to enable network access
- Accessing the dev server via custom local domains
- Using tunneling services (ngrok, localtunnel, Cloudflare Tunnel)
- Developing on remote machines

**Related Setting:**

The `HOST` environment variable in `.env` controls whether the server accepts network connections:

```env
# Enable network access (required for allowedHosts to be relevant)
HOST=true
```

See [Environment Variables](./02_env.md#server-settings) for more details.

## Editor Configuration

The `editor` block configures the live documentation editor in the dev toolbar. The `autosave_interval` field is **required** — the dev server will throw an error if it's missing. The `presence` sub-block is optional.

```yaml
editor:
  autosave_interval: 10000  # Auto-save interval in milliseconds
  presence:
    ping_interval: 5000       # How often clients ping the server (ms)
    stale_threshold: 30000    # Remove users with no heartbeat after this (ms)
    cursor_throttle: 100      # Min interval between cursor broadcasts (ms)
    content_debounce: 150     # Debounce for raw text diff sync (ms)
    render_interval: 5000     # Interval for rendered preview updates (ms)
    sse_keepalive: 15000      # SSE keepalive comment interval (ms)
    sse_reconnect: 2000       # SSE auto-reconnect delay on disconnect (ms)
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `autosave_interval` | `number` | Yes | Interval in ms for auto-saving edited documents. Minimum: `1000` |
| `presence` | `object` | No | Multi-user presence and editor timing configuration |
| `presence.ping_interval` | `number` | No | Client ping frequency in ms. Default: `5000`. Minimum: `1000` |
| `presence.stale_threshold` | `number` | No | Remove silent users after this ms. Default: `30000`. Minimum: `5000` |
| `presence.cursor_throttle` | `number` | No | Min ms between cursor position sends. Default: `100`. Minimum: `16` |
| `presence.content_debounce` | `number` | No | Debounce for raw text diff sync in ms. Default: `150`. Minimum: `50` |
| `presence.render_interval` | `number` | No | Server render interval in ms. Default: `5000`. Minimum: `1000` |
| `presence.sse_keepalive` | `number` | No | SSE keepalive comment interval in ms. Default: `15000`. Minimum: `5000` |
| `presence.sse_reconnect` | `number` | No | SSE auto-reconnect delay in ms. Default: `2000`. Minimum: `500` |

### `autosave_interval`

Controls how frequently the live editor auto-saves changes to disk while you're editing. During editing, changes are held in memory and periodically flushed to disk at this interval.

```yaml
editor:
  autosave_interval: 10000  # Save every 10 seconds
```

- **Minimum value**: `1000` (1 second)
- **Recommended**: `10000` (10 seconds) — balances responsiveness with disk I/O
- **Lower values**: More frequent saves, more disk writes
- **Higher values**: Fewer saves, more data at risk if the server crashes

If this field is missing or invalid, the dev server will fail to start with a clear error message explaining what to add.

### `presence`

Controls timing for multi-user presence awareness, live cursor tracking, and editor synchronization. All fields are optional — sensible defaults are used when omitted. The server sends timing values (`pingInterval`, `cursorThrottle`, `renderInterval`) to editor clients via WebSocket on connect.

```yaml
editor:
  presence:
    ping_interval: 5000       # Clients ping every 5 seconds
    stale_threshold: 30000    # Remove users after 30 seconds of silence
    cursor_throttle: 100      # Send cursor updates at most every 100ms
    content_debounce: 150     # Debounce raw text diffs at 150ms
    render_interval: 5000     # Re-render preview every 5 seconds
    sse_keepalive: 15000      # SSE keepalive every 15 seconds
    sse_reconnect: 2000       # SSE reconnect after 2 seconds
```

- **`ping_interval`** — How often each editor client pings the server (via WebSocket) for latency measurement and heartbeat. Lower values give more responsive latency readings but more traffic.
- **`stale_threshold`** — How long to wait before removing a user who stops sending heartbeats (e.g. crashed tab, lost network). The cleanup check runs at 1/3 of this interval.
- **`cursor_throttle`** — Minimum delay between cursor position broadcasts from the client. Lower values give smoother remote cursors but more traffic.
- **`content_debounce`** — Debounce interval for raw text diff synchronization. Controls how quickly local edits are computed and sent to the Yjs CRDT.
- **`render_interval`** — How often the server re-renders the document and pushes preview updates to editor clients. Only triggers when content has changed since the last render.
- **`sse_keepalive`** — Interval for SSE keepalive comments. Also updates `lastSeen` timestamps to prevent stale removal for non-editing users (those browsing without an open editor).
- **`sse_reconnect`** — How long the client waits before reconnecting the SSE stream after a disconnect.

## Logo Configuration

The `logo` block configures the site logo displayed in the navbar and the favicon.

```yaml
logo:
  src: "@assets/logo.svg"
  alt: "Docs"
  theme:
    dark: "logo-dark.svg"
    light: "logo-light.svg"
  favicon: "@assets/favicon.png"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `src` | `string` | No | Path to logo image |
| `alt` | `string` | Yes | Alt text for accessibility |
| `theme` | `object` | No | Theme-specific logo variants |
| `theme.dark` | `string` | No | Filename for dark mode logo |
| `theme.light` | `string` | No | Filename for light mode logo |
| `favicon` | `string` | No | Path to favicon image |

### Asset Paths

Logo and favicon paths support the `@assets` alias:

```yaml
logo:
  src: "@assets/logo.svg"        # Resolves to /assets/logo.svg
  favicon: "@assets/favicon.png" # Resolves to /assets/favicon.png
```

The assets location is configured via `ASSETS_DIR` in `.env`:

```env
# Default location
ASSETS_DIR=./dynamic_data/data/assets

# Or use a custom location
ASSETS_DIR=/var/www/assets
```

See [Environment Variables](./02_env.md) for more details.

You can also use absolute paths:

```yaml
logo:
  src: "/logo.svg"      # Served from public/logo.svg
  favicon: "/icon.png"  # Served from public/icon.png
```

### Theme Variants

Specify different logos for light and dark themes:

```yaml
logo:
  src: "@assets/logo.svg"
  theme:
    dark: "logo-dark.svg"   # Used in dark mode
    light: "logo-light.svg" # Used in light mode
```

If `src` is omitted, the site name is displayed as text instead.

### Favicon

The favicon appears in browser tabs and bookmarks:

```yaml
logo:
  favicon: "@assets/favicon.png"
```

Supported formats: `.png`, `.ico`, `.svg`

If not specified, defaults to `/favicon.svg`.

## TypeScript Interface

```typescript
interface SiteMetadata {
  name: string;
  title: string;
  description: string;
}

interface LogoTheme {
  dark?: string;
  light?: string;
}

interface SiteLogo {
  src?: string;
  alt?: string;
  theme?: LogoTheme;
  favicon?: string;
}

interface ServerConfig {
  allowedHosts?: true | string[];
}

interface PresenceSettings {
  ping_interval?: number;    // Client ping frequency (ms, default: 5000)
  stale_threshold?: number;  // Remove silent users after (ms, default: 30000)
  cursor_throttle?: number;  // Min interval between cursor sends (ms, default: 100)
  content_debounce?: number; // Debounce for raw text diff sync (ms, default: 150)
  render_interval?: number;  // Server render interval (ms, default: 5000)
  sse_keepalive?: number;    // SSE keepalive comment interval (ms, default: 15000)
  sse_reconnect?: number;    // SSE auto-reconnect delay (ms, default: 2000)
}

interface EditorSettings {
  autosave_interval: number;    // Auto-save interval in milliseconds
  presence?: PresenceSettings;  // Multi-user presence timing (optional)
}

interface SiteConfig {
  site: SiteMetadata;
  server?: ServerConfig;    // Vite server configuration
  theme?: string;           // Theme alias (e.g., "@theme/default")
  logo?: SiteLogo;
  editor: EditorSettings;   // Required — must be in site.yaml
  pages: Record<string, PageConfig>;
}
```

## Loading in Code

```typescript
import { loadSiteConfig, getSiteLogo, getFavicon } from '@loaders/config';

// Get full site config
const config = loadSiteConfig();
const { name, title, description } = config.site;

// Get logo configuration
const logo = getSiteLogo();
// logo.src, logo.alt, logo.theme, logo.favicon

// Get favicon URL
const faviconUrl = getFavicon();
```

## Complete Example

```yaml
# site.yaml
site:
  name: "My Docs"
  title: "My Documentation"
  description: "Modern documentation built with Astro"

# Vite server configuration (optional)
server:
  allowedHosts: true  # or use array: [".localhost", "127.0.0.1"]

# Theme (optional - defaults to @theme/default)
theme: "@theme/default"

logo:
  src: "@assets/astro.svg"
  alt: "My Docs"
  theme:
    dark: "astro.svg"
    light: "astro.svg"
  favicon: "@assets/astro.png"

# Editor configuration (required)
editor:
  autosave_interval: 10000  # 10 seconds
  presence:
    ping_interval: 5000
    stale_threshold: 30000
    cursor_throttle: 100
    content_debounce: 150
    render_interval: 5000
    sse_keepalive: 15000
    sse_reconnect: 2000

pages:
  docs:
    base_url: "/docs/final-docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs/final_docs"

  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/blog_style1"
    data: "@data/blog"
```

## Default Values

If `site.yaml` is missing, defaults are used:

```typescript
{
  site: {
    name: 'Documentation',
    title: 'Documentation Site',
    description: 'Modern documentation built with Astro',
  },
  logo: {
    alt: 'Docs',
  },
  editor: {
    autosave_interval: 10000,
    presence: {
      ping_interval: 5000,
      stale_threshold: 30000,
      cursor_throttle: 100,
      content_debounce: 150,
      render_interval: 5000,
      sse_keepalive: 15000,
      sse_reconnect: 2000,
    },
  },
  pages: {},
}
```
