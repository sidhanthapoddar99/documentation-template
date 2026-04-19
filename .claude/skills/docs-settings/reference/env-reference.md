# Environment Variables Reference

The `.env` file provides the bootstrap path to locate `site.yaml` and configures server settings. Directory paths for data, assets, and themes are configured in `site.yaml`'s `paths:` section, not in `.env`.

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

## Common Configurations

### Local Development

```env
CONFIG_DIR=../data/config
PORT=3088
HOST=true
```

### Production Build

```env
CONFIG_DIR=../data/config
PORT=3088
HOST=false
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
