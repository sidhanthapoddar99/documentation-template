# Environment Variables Reference

The `.env` file configures paths and server settings for the documentation template.

## Location

The `.env` file should be placed at `docs/.env` (same level as `documentation-template/` folder).

## Complete Reference

```env
# ============================================
# DIRECTORY PATHS
# ============================================
# Paths relative to documentation-template folder

# Configuration files (site.yaml, navbar.yaml, footer.yaml)
CONFIG_DIR=../data/config

# User content (docs, blog, pages)
DATA_DIR=../data/data

# Static assets (logos, favicons, images)
ASSETS_DIR=../data/assets

# Custom themes (optional)
THEMES_DIR=../data/themes

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

### Directory Paths

| Variable | Purpose | Default |
|----------|---------|---------|
| `CONFIG_DIR` | Location of YAML config files | `./dynamic_data/config` |
| `DATA_DIR` | Location of content (docs, blog, pages) | `./dynamic_data/data` |
| `ASSETS_DIR` | Location of static assets | `./dynamic_data/assets` |
| `THEMES_DIR` | Location of custom themes | `./dynamic_data/themes` |

**Path Resolution:**
- Paths are relative to the `documentation-template/` folder
- Use `../` to go up to the `docs/` folder
- Can be absolute paths if needed

**Standard Setup Paths:**
```env
CONFIG_DIR=../data/config
DATA_DIR=../data/data
ASSETS_DIR=../data/assets
THEMES_DIR=../data/themes
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
DATA_DIR=../data/data
ASSETS_DIR=../data/assets
THEMES_DIR=../data/themes
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
DATA_DIR=../data/data
ASSETS_DIR=../data/assets
THEMES_DIR=../data/themes
SITE_URL=https://docs.yourproduct.com
BASE_PATH=
ENABLE_SEARCH=true
ENABLE_DARK_MODE=true
```

### GitHub Pages (Subdirectory)

```env
CONFIG_DIR=../data/config
DATA_DIR=../data/data
ASSETS_DIR=../data/assets
THEMES_DIR=../data/themes
SITE_URL=https://username.github.io
BASE_PATH=/repository-name
ENABLE_SEARCH=true
ENABLE_DARK_MODE=true
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Config not found" | Wrong CONFIG_DIR path | Check path is relative to documentation-template/ |
| Assets not loading | Wrong ASSETS_DIR path | Verify path and check browser console |
| "Address in use" | PORT already taken | Change PORT to different number |
| Can't access from other devices | HOST is false | Set HOST=true |
| Wrong URLs in production | Incorrect SITE_URL | Set correct production URL |
