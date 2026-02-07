---
title: Directory Paths
description: Configure content, asset, and theme directory paths with @key aliases
---

# Directory Paths

The `paths:` section defines where the system looks for content, assets, and themes. Each key becomes an `@key` alias (e.g., `data` → `@data/...`).

```yaml
paths:
  data: "../data"        # Content (docs, blog, pages)
  assets: "../assets"    # Static assets (logos, images)
  themes: "../themes"    # Custom theme directories
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `data` | `string` | No | Path to content directory. Default: `../data` |
| `assets` | `string` | No | Path to static assets. Default: `../assets` |
| `themes` | `string` | No | Path to themes directory. Default: `../themes` |

**Paths are relative to the config directory** (where `site.yaml` lives). Absolute paths are also supported.

> **How this differs from `.env`:** `CONFIG_DIR` in `.env` is relative to the **project root** (where `.env` lives). Paths in `site.yaml`'s `paths:` section are relative to the **config directory** (where `site.yaml` lives). For example, with `CONFIG_DIR=./dynamic_data/config` and `data: "../data"`, the data directory resolves to `./dynamic_data/data`.

## Multiple Directories

You can define additional directories — each key becomes its own `@key` alias:

```yaml
paths:
  data: "../data"
  assets: "../assets"
  themes: "../themes"
  data2: "/other/project/data"     # @data2/...
  assets2: "/shared/brand-assets"  # @assets2/...
```

Additional directories are automatically categorized:
- Keys starting with `data` or `content` → content category
- Keys starting with `asset` → asset category (served at `/assets/`)
- Keys starting with `theme` → theme category
- `config` → config category

## Reserved Keys

The following keys cannot be used in `paths:` because they conflict with built-in layout aliases: `docs`, `blog`, `custom`, `navbar`, `footer`, `mdx`.

## Default Behavior

If `paths:` is omitted entirely, the system defaults to sibling directories of the config dir (`../data`, `../assets`, `../themes`).
