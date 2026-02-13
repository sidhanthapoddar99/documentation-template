---
title: Site Configuration
description: Configure site metadata, logo, favicon, and theme in site.yaml
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

# Directory paths (relative to this config directory, or absolute)
paths:
  data: "../data"
  assets: "../assets"
  themes: "../themes"

# Vite server configuration (optional)
server:
  allowedHosts: true  # or array of specific hosts

# Theme configuration
theme: "default"          # theme name ("default", "minimal", or custom)
theme_paths:              # directories to scan for user themes
  - "@themes"

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

pages:
  docs:
    base_url: "/docs/final-docs"
    type: docs
    layout: "@docs/default"
    data: "@data/docs/final_docs"

  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/default"
    data: "@data/blog"

  home:
    base_url: "/"
    type: custom
    layout: "@custom/home"
    data: "@data/pages/home.yaml"
```
