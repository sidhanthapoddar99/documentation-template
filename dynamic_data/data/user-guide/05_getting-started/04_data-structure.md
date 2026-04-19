---
title: Data Structure
description: How your content, configuration, and assets are organised in `dynamic_data/`.
---

# Data Structure

This page covers **`dynamic_data/`** — the folder you'll actually edit. Everything else in the repository (inside `src/`) is framework code and doesn't need to be touched to run or author a docs site.

For the internal code layout, see the [dev-docs](/dev-docs/overview/code-structure).

## What the framework actually requires

Only **one path is fixed**: a `.env` at the project root with `CONFIG_DIR` pointing at a folder that contains `site.yaml`. Everything else flows from `site.yaml`'s `paths:` section and can live anywhere on disk.

```
                        REQUIRED CHAIN
                        ══════════════

   .env  (at project root)
     │
     │  CONFIG_DIR=<path-to-config-dir>     ◀── only this line is fixed
     ▼
   <config dir>/
     ├── site.yaml      ◀── framework bootstraps from this file
     ├── navbar.yaml
     └── footer.yaml
           │
           │  paths:    declares every other location
           │            (any alias name, any path on disk)
           │
           ├──▶ @data/     →  content  (docs · blog · issues · custom)
           ├──▶ @assets/   →  static files  (served at /assets/*)
           └──▶ @themes/   →  custom theme packages  (optional)
```

Because `@data/`, `@assets/`, and `@themes/` are pointed wherever `site.yaml` says, the `dynamic_data/` grouping the template ships with is **pure convention**. You could set `CONFIG_DIR=/etc/my-docs/config/`, point `@data/` at `/var/content/`, and the site would build exactly the same way. The default groups everything under one folder because that's easy to reason about in a single repo — nothing more.


## Default structure (as shipped)

```
dynamic_data/
├── config/        # YAML config (site, navbar, footer)       — CONFIG_DIR bootstrap
├── assets/        # Static files served at /assets/*          — @assets alias
├── data/          # All content (docs, blog, issues, custom)  — @data alias
└── themes/        # Custom themes (optional)                  — @themes alias
```

| Directory | Purpose | Accessed via |
|---|---|---|
| `config/` | Site metadata, page definitions, navbar + footer | `CONFIG_DIR` in `.env` |
| `assets/` | Logos, favicons, images served at `/assets/*` | `@assets/` |
| `data/` | Your actual content | `@data/` |
| `themes/` | Optional custom theme packages | `@themes/` |

## 1. YAML configuration -- `config/`

```
config/
├── site.yaml      # Site metadata, paths, theme, pages
├── navbar.yaml    # Navigation bar items
└── footer.yaml    # Footer columns and links
```

See [Configuration](/user-guide/configuration/overview) for field-by-field reference.

## 2. Assets Static files -- `assets/`

Static files served at `/assets/*` URLs.

```
assets/
├── logo.svg
├── logo-dark.svg     # optional dark-mode variant
├── favicon.png
└── images/
```

Referenced in config files via the `@assets/` alias:

```yaml
# site.yaml
logo:
  src: "@assets/logo.svg"
  favicon: "@assets/favicon.png"
```

| Alias | Web URL |
|---|---|
| `@assets/logo.svg` | `/assets/logo.svg` |
| `@assets/images/hero.png` | `/assets/images/hero.png` |

## 3. Data & Content -- `Data`

This is the default starting point — **how you organise content inside `data/` is entirely up to you**. Multiple doc sections, independent issue trackers side by side, any set of custom pages — declare each folder in `site.yaml` (under `paths:` for the alias, and `pages:` for the URL + layout) and the framework renders it.

Here's a richer example showing what a real project might look like:

```
data/
├── doc1/              # docs layout   (e.g. "User Guide")
├── doc2/              # docs layout   (e.g. "Dev Docs")
├── doc3/              # docs layout   (e.g. "API Reference")
│
├── blogs/             # blog layout
│
├── issues/            # folder of independent issue trackers
│   ├── proj1/         #   issues layout — one tracker (each is standalone)
│   └── proj2/         #   issues layout — a separate tracker
│
└── pages/             # custom layouts (YAML-driven)
    ├── home/          #   landing page
    ├── countdown/     #   launch countdown
    └── roadmap/       #   public roadmap
```

Nothing in that tree is hard-coded. Rename folders, drop sections, add new ones, point `@data/` at a completely different path in `site.yaml` — the framework doesn't care, as long as each section is declared. See [Path Aliases](/user-guide/getting-started/aliases) for custom alias declarations.

The file-level structure *inside* each content type is specific to its layout family. Each has its own authoring guide:

| Default folder | URL base | Naming pattern | Layout family | Authoring guide |
|---|---|---|---|---|
| `data/docs/` | `/docs` | `XX_folder/XX_file.md` | `@docs/*` | [Docs section](/user-guide/docs/overview) |
| `data/blog/` | `/blog` | `YYYY-MM-DD-slug.md` | `@blog/*` | [Blogs section](/user-guide/blogs/overview) |
| `data/issues/` | `/issues` | `YYYY-MM-DD-slug/` (folder) | `@issues/*` | [Issues section](/user-guide/issues/overview) |
| `data/pages/` | (per page) | Any `.yaml` / `.md` | `@custom/*` | [Custom section](/user-guide/custom/overview) |


## 4. Themes — custom themes -- `themes/`

```
themes/
└── my-theme/
    ├── theme.yaml       # theme manifest (extends, overrides)
    ├── color.css
    └── font.css
```

Custom themes inherit from the default via `extends: "@theme/default"` in `theme.yaml`. See [Themes](/user-guide/themes/overview).
