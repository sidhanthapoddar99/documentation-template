---
title: Environment Variables
description: Configure environment variables for your site
sidebar_position: 2
---

# Environment Variables

Environment variables configure the bootstrap path, server settings, and feature flags. These are defined in the `.env` file at the project root.

> **Note:** Directory paths for data, assets, and themes are now configured in `site.yaml`'s `paths:` section, not in `.env`. Only `CONFIG_DIR` remains as the bootstrap to locate `site.yaml`. See [Site Configuration](./site) for details.

## Directory Paths

### Config Bootstrap

The primary directory path in `.env` is `CONFIG_DIR`, which tells the system where to find `site.yaml`:

```env
# Points to the directory containing site.yaml, navbar.yaml, footer.yaml
CONFIG_DIR=./dynamic_data/config
```

| Variable | Default | Description |
|----------|---------|-------------|
| `CONFIG_DIR` | `./dynamic_data/config` | Path to configuration directory (relative to project root, or absolute) |

All other content directory paths (`data`, `assets`, `themes`) are defined in `site.yaml`'s `paths:` section.

> **Path relativity rule:** `CONFIG_DIR` in `.env` is relative to the **project root** (where `.env` lives). Paths in `site.yaml`'s `paths:` section are relative to the **config directory** (where `site.yaml` lives). Absolute paths work in both places.

### External Layouts

Optionally, `LAYOUT_EXT_DIR` points to a directory of custom layout components that extend or override the built-in layouts:

```env
# Optional: External layout directory (mirrors src/layouts/ structure)
LAYOUT_EXT_DIR=./dynamic_data/layouts
```

| Variable | Default | Description |
|----------|---------|-------------|
| `LAYOUT_EXT_DIR` | *(not set)* | Path to external layouts directory (relative to project root, or absolute) |

When set, external layouts are merged with built-in layouts. If an external layout has the same style name as a built-in one, the external version takes priority. When not set, only built-in layouts are available (no overhead).

The external directory mirrors the `src/layouts/` structure:

```
<LAYOUT_EXT_DIR>/
├── docs/styles/<style>/Layout.astro
├── blogs/styles/<style>/IndexLayout.astro + PostLayout.astro
├── custom/styles/<style>/Layout.astro
├── navbar/<style>/index.astro
└── footer/<style>/index.astro
```

> **Important:** External `.astro` files must use Vite aliases for imports (e.g., `@layouts/`, `@loaders/`) instead of relative paths, since they live outside `src/`.

See [Layouts Overview](/docs/final-docs/layouts/overview) for details on creating external layouts.

## Server Settings

Configure the development server:

```env
PORT=3088
HOST=true
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4321` | Port number for the dev server |
| `HOST` | `false` | Enable network access (`true` = listen on all interfaces, `false` = localhost only) |

### `PORT`

The port number for the development server:

```env
# Default Astro port
PORT=4321

# Custom port
PORT=3088
```

### `HOST`

Controls whether the server is accessible from other devices on the network:

```env
# Localhost only (default, more secure)
HOST=false

# Network access (accessible from other devices)
HOST=true
```

When `HOST=true`, the server binds to `0.0.0.0` allowing access from:
- Other devices on your local network
- Docker containers
- Virtual machines
- Remote tunneling services (ngrok, localtunnel)

**Security Note:** When enabling network access, consider using `server.allowedHosts` in `site.yaml` to restrict which hostnames can connect.

## Site Settings

```env
SITE_URL=http://localhost:4321
BASE_PATH=
```

| Variable | Default | Description |
|----------|---------|-------------|
| `SITE_URL` | `http://localhost:4321` | Base URL for the site |
| `BASE_PATH` | `` (empty) | URL path prefix for deployment subdirectories |

### `SITE_URL`

The full URL where your site is hosted:

```env
# Development
SITE_URL=http://localhost:4321

# Production
SITE_URL=https://docs.example.com
```

Used for:
- Canonical link tags
- Sitemap generation
- Open Graph URLs
- RSS feed links

### `BASE_PATH`

For deploying to a subdirectory:

```env
# Root deployment (default)
BASE_PATH=

# Subdirectory deployment
BASE_PATH=/docs
```

If your site is hosted at `https://example.com/docs/`, set:

```env
SITE_URL=https://example.com
BASE_PATH=/docs
```

## Feature Flags

Enable or disable site features:

```env
ENABLE_SEARCH=false
ENABLE_DARK_MODE=true
```

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_SEARCH` | `false` | Enable site search functionality |
| `ENABLE_DARK_MODE` | `true` | Enable dark mode toggle |

## Complete Example

```env
# ============================================
# DIRECTORY PATHS
# ============================================
# Bootstrap: points to the config directory containing site.yaml
# All other paths (data, assets, themes) are defined in site.yaml
CONFIG_DIR=./dynamic_data/config

# Optional: External layout directory (mirrors src/layouts/ structure)
# External layouts merge with built-in; same-name styles override built-in.
# LAYOUT_EXT_DIR=./dynamic_data/layouts

# ============================================
# SERVER SETTINGS
# ============================================
PORT=3088
HOST=true

# ============================================
# SITE SETTINGS
# ============================================
SITE_URL=http://localhost:4321
BASE_PATH=

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_SEARCH=false
ENABLE_DARK_MODE=true
```

## Best Practices

1. **Never commit secrets** - Add `.env` to `.gitignore`
2. **Use `.env.example`** - Document required variables for other developers
3. **Directory paths belong in site.yaml** - Only `CONFIG_DIR` stays in `.env`
4. **Use absolute paths for external config** - When config lives outside the project
