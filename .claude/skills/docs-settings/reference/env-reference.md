# Environment Variables Reference

The `.env` file provides the bootstrap path to locate `site.yaml` and configures server settings and feature flags. Directory paths for data, assets, and themes are configured in `site.yaml`'s `paths:` section, not in `.env`.

## Location

The `.env` file should be placed at `docs/.env` (same level as `documentation-template/` folder).

## Complete Reference

```env
# ============================================
# CONFIG BOOTSTRAP
# ============================================
# Points to the directory containing site.yaml, navbar.yaml, footer.yaml
# Relative to the project root (documentation-template/), or absolute
CONFIG_DIR=../data/config

# ============================================
# SERVER SETTINGS
# ============================================

# Development server port
PORT=3088

# Host configuration
# true = allow all hosts (for remote access/tunnels)
# false or 127.0.0.1 = localhost only
HOST=true

# ============================================
# SITE SETTINGS
# ============================================

# Production site URL (used for sitemap, canonical URLs)
SITE_URL=http://localhost:3088

# Base path for deployment (e.g., /docs for github.io/repo/docs)
BASE_PATH=

# ============================================
# FEATURE FLAGS
# ============================================

# Enable search functionality
ENABLE_SEARCH=false

# Enable dark mode toggle
ENABLE_DARK_MODE=true
```

## Variable Details

### Config Bootstrap

| Variable | Purpose | Default |
|----------|---------|---------|
| `CONFIG_DIR` | Location of YAML config files (site.yaml, navbar.yaml, footer.yaml) | `./dynamic_data/config` |

> **Path relativity:** `CONFIG_DIR` is relative to the **project root** (where `.env` / `documentation-template/` lives). All other directory paths (`data`, `assets`, `themes`) are configured in `site.yaml`'s `paths:` section, relative to the **config directory**.

**Standard Setup Path:**
```env
CONFIG_DIR=../data/config
```

### Server Settings

| Variable | Purpose | Values |
|----------|---------|--------|
| `PORT` | Development server port | Number (default: 3088) |
| `HOST` | Network access setting | `true`, `false`, IP address |

**HOST Values:**
- `true` - Allow connections from any host (needed for tunnels like ngrok)
- `false` - Localhost only (127.0.0.1)
- `0.0.0.0` - Same as true
- `127.0.0.1` - Same as false

### Site Settings

| Variable | Purpose | Example |
|----------|---------|---------|
| `SITE_URL` | Production URL | `https://docs.example.com` |
| `BASE_PATH` | URL prefix for deployment | `/docs` (for subdirectory hosting) |

**BASE_PATH Examples:**
- Empty (`BASE_PATH=`) - Site at root: `https://example.com/`
- Subdirectory (`BASE_PATH=/docs`) - Site at: `https://example.com/docs/`

### Feature Flags

| Variable | Purpose | Values |
|----------|---------|--------|
| `ENABLE_SEARCH` | Enable search functionality | `true`, `false` |
| `ENABLE_DARK_MODE` | Enable dark mode toggle | `true`, `false` |

## Common Configurations

### Local Development

```env
CONFIG_DIR=../data/config
PORT=3088
HOST=true
SITE_URL=http://localhost:3088
BASE_PATH=
ENABLE_SEARCH=false
ENABLE_DARK_MODE=true
```

### Production Build

```env
CONFIG_DIR=../data/config
SITE_URL=https://docs.yourproduct.com
BASE_PATH=
ENABLE_SEARCH=true
ENABLE_DARK_MODE=true
```

### GitHub Pages (Subdirectory)

```env
CONFIG_DIR=../data/config
SITE_URL=https://username.github.io
BASE_PATH=/repository-name
ENABLE_SEARCH=true
ENABLE_DARK_MODE=true
```

## Where Are Directory Paths?

Directory paths are configured in `site.yaml`'s `paths:` section, **not** in `.env`:

```yaml
# In site.yaml
paths:
  data: "../data"       # Relative to config dir (where site.yaml lives)
  assets: "../assets"
  themes: "../themes"
```

See [site-yaml.md](./site-yaml.md) for full details on the `paths:` section.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Config not found" | Wrong CONFIG_DIR path | Check path is relative to project root (documentation-template/) |
| Assets not loading | Wrong `paths.assets` in site.yaml | Verify path in site.yaml `paths:` section is relative to config dir |
| "Address in use" | PORT already taken | Change PORT to different number |
| Can't access from other devices | HOST is false | Set HOST=true |
| Wrong URLs in production | Incorrect SITE_URL | Set correct production URL |
