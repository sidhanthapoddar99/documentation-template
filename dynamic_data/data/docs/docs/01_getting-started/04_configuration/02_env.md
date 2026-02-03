---
title: Environment Variables
description: Configure environment variables for your site
sidebar_position: 2
---

# Environment Variables

Environment variables configure directory paths, site settings, and feature flags. These are defined in the `.env` file at the project root.

## Directory Paths

Configure where the system looks for configuration and content:

```env
# Configuration files (site.yaml, navbar.yaml, footer.yaml)
CONFIG_DIR=./dynamic_data/config

# User content (docs, blog, pages)
DATA_DIR=./dynamic_data/data

# Static assets (logos, favicons, images)
ASSETS_DIR=./dynamic_data/assets

# Custom themes directory (contains multiple theme folders)
THEMES_DIR=./dynamic_data/themes
```

| Variable | Default | Description |
|----------|---------|-------------|
| `CONFIG_DIR` | `./dynamic_data/config` | Path to configuration files |
| `DATA_DIR` | `./dynamic_data/data` | Path to content (docs, blog, pages) |
| `ASSETS_DIR` | `./dynamic_data/assets` | Path to static assets (logos, images) |
| `THEMES_DIR` | `./dynamic_data/themes` | Path to themes directory (contains theme folders) |

### Path Types

Paths can be:
- **Relative** - Relative to project root (e.g., `./dynamic_data/config`)
- **Absolute** - Full system path (e.g., `/var/www/data`)

This allows pointing to external folders outside your project.

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
CONFIG_DIR=./dynamic_data/config
DATA_DIR=./dynamic_data/data
ASSETS_DIR=./dynamic_data/assets
THEMES_DIR=./dynamic_data/themes

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

## Development vs Production

Use different values for different environments:

**Development:**

```env
CONFIG_DIR=./dynamic_data/config
DATA_DIR=./dynamic_data/data
ASSETS_DIR=./dynamic_data/assets
SITE_URL=http://localhost:4321
ENABLE_SEARCH=false
```

**Production:**

```env
CONFIG_DIR=/var/www/config
DATA_DIR=/var/www/data
ASSETS_DIR=/var/www/assets
SITE_URL=https://docs.example.com
ENABLE_SEARCH=true
```

## Best Practices

1. **Never commit secrets** - Add `.env` to `.gitignore`
2. **Use `.env.example`** - Document required variables for other developers
3. **Use relative paths for portability** - `./dynamic_data` works across machines
4. **Use absolute paths for external data** - When content lives outside the project
