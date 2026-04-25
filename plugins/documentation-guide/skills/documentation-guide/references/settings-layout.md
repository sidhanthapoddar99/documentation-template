# Site-level settings — reference

Site chrome, routing, theming, aliases. Everything *above* the per-content-type layer.

**Canonical source of truth:** `dynamic_data/data/user-guide/05_getting-started/`, `10_configuration/`, `16_layout-system/`, `20_custom-pages/`, `25_themes/` — read those when this reference is unclear or when you need depth this file doesn't cover.

---

## 1. Project structure (for new installs)

```
<project-root>/                            ← OR a docs/ subfolder of a larger project
├── data/                                  ← USER-EDITABLE layer
│   ├── assets/                            ← static assets served at /assets/
│   ├── config/                            ← site.yaml, navbar.yaml, footer.yaml
│   ├── data/                              ← all content (docs, blog, issues, custom)
│   │   └── README.md                      ← MAP of every top-level data folder (see SKILL.md)
│   ├── layouts/                           ← OPTIONAL — only when shipping custom layouts
│   └── themes/                            ← OPTIONAL — only when shipping custom themes
└── documentation-template/                ← framework code
    └── .env                               ← CONFIG_DIR=../data/config
```

Clone the framework code with:
```bash
git clone https://github.com/sidhanthapoddar99/documentation-template.git
```

---

## 2. `.env` — the bootstrap layer

The framework reads exactly one thing from `.env`: where to find `config/`. Everything else lives in the YAML files inside that config dir.

```bash
CONFIG_DIR=../data/config            # REQUIRED — path to the folder containing site.yaml
LAYOUT_EXT_DIR=../data/layouts       # OPTIONAL — only when shipping custom layout styles
PORT=3088                            # dev server port
HOST=true                            # bind to all interfaces (for LAN access)
```

**Path is relative to the framework code directory** (`documentation-template/`). `../data/config` is the typical layout when `data/` and `documentation-template/` are siblings.

---

## 3. `site.yaml` — the main config file

Everything site-wide. The full schema (taken from a working example):

```yaml
# 3a. Site identity
site:
  name: "My Docs"
  title: "My Documentation"
  description: "Modern documentation built with Astro"

# 3b. Vite dev server
server:
  allowedHosts: true                       # true | array of host patterns
  # Example: allowedHosts: [".localhost", "127.0.0.1", "my-app.local", ".ngrok.io"]

# 3c. Path aliases — each key becomes an @key alias
paths:
  data: "../data"                          # @data/...
  assets: "../assets"                      # @assets/...
  themes: "../themes"                      # @themes/...
  # User-defined aliases work the same way:
  # data2: "/other/project/data"

# 3d. Theme
theme: "full-width"                        # active theme name (folder name under @themes)
theme_paths:                               # where to scan for custom themes
  - "@themes"

# 3e. Logo + favicon
logo:
  src: "@assets/astro-dark.svg"            # default
  alt: "Docs"
  theme:                                   # optional dark/light variants
    dark: "@assets/astro-dark.svg"
    light: "@assets/astro-light.svg"
  favicon: "@assets/astro.png"

# 3f. Live editor (dev toolbar)
editor:
  autosave_interval: 10000                 # ms
  presence:
    ping_interval: 5000
    stale_threshold: 30000
    cursor_throttle: 100
    content_debounce: 150
    render_interval: 5000
    sse_keepalive: 15000
    sse_reconnect: 2000

# 3g. Pages — see §4 below (the most important block)
pages:
  user-guide:
    base_url: "/user-guide"
    type: docs
    layout: "@docs/default"
    data: "@data/user-guide"
  # … more entries …
```

**Field-by-field cheatsheet:**

| Block | Field | Type | Notes |
|---|---|---|---|
| `site` | `name` / `title` / `description` | string | Site identity, used in `<title>` + meta tags |
| `server` | `allowedHosts` | `true` or `string[]` | Vite host whitelist for dev server |
| `paths` | `<key>: <path>` | object | Each becomes `@<key>` — relative to config dir or absolute |
| top-level | `theme` | string | Folder name of the active theme |
| top-level | `theme_paths` | `string[]` | Dirs to scan for theme folders |
| `logo` | `src`, `alt`, `theme.dark`, `theme.light`, `favicon` | strings | All accept `@<alias>/...` paths |
| `editor` | nested timing knobs | numbers (ms) | Defaults are sane; tune only if you have a reason |
| top-level | `pages` | object (keyed) | **Routes — see §4** |

---

## 4. `pages:` — routing & content-type binding

This is the heart of `site.yaml`. **`pages` is an object, not an array** — each key is the route's internal id; the value binds a URL prefix to a content type, layout, and data source.

```yaml
pages:
  # Docs section — sidebar-driven, uses XX_ prefix folders
  user-guide:
    base_url: "/user-guide"
    type: docs
    layout: "@docs/default"                # or @docs/compact, or a custom @ext-layouts alias
    data: "@data/user-guide"               # FOLDER

  # Issues tracker — folder-per-item
  todo:
    base_url: "/todo"
    type: issues
    layout: "@issues/default"
    data: "@data/todo"                     # FOLDER (with root settings.json declaring vocabulary)

  # Blog — flat YYYY-MM-DD-<slug>.md files
  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/default"
    data: "@data/blog"                     # FOLDER

  # Custom page — single YAML file backing a layout
  home:
    base_url: "/"
    type: custom
    layout: "@custom/home"                 # @custom/home | @custom/info | @custom/countdown | custom layouts
    data: "@data/pages/home.yaml"          # FILE (YAML)

  about:
    base_url: "/about"
    type: custom
    layout: "@custom/info"
    data: "@data/pages/about.yaml"
```

**Required fields per `pages:` entry:**

| Field | Type | Notes |
|---|---|---|
| `base_url` | string | URL prefix; `/` for the homepage |
| `type` | enum | `docs` \| `issues` \| `blog` \| `custom` |
| `layout` | string | `@<type>/<style>` — see "Layout" section below |
| `data` | string | Folder for `docs` / `issues` / `blog`; YAML file for `custom` |

**Choosing a layout** — every type has a `default` style; some have alternatives:

| Type | Available styles | Located at |
|---|---|---|
| `docs` | `@docs/default`, `@docs/compact` | `src/layouts/docs/<style>/` |
| `blog` | `@blog/default` | `src/layouts/blogs/<style>/` |
| `issues` | `@issues/default` | `src/layouts/issues/<style>/` |
| `custom` | `@custom/home`, `@custom/info`, `@custom/countdown`, plus user-shipped ones | `src/layouts/custom/<style>/` |

User-shipped layouts under `dynamic_data/layouts/<type>/<style>/` are picked up automatically when `LAYOUT_EXT_DIR` is set; they override built-in styles of the same name.

---

## 5. `navbar.yaml` — top-level navigation

```yaml
layout: "@navbar/default"                  # or @navbar/minimal
# layout: "@navbar/minimal"                # tighter, no logo block

items:
  - label: "Home"
    href: "/"
  - label: "User Guide"
    href: "/user-guide"
  - label: "Blog"
    href: "/blog"
  - label: "GitHub"
    href: "https://github.com/sidhanthapoddar99/documentation-template"
```

| Field | Type | Notes |
|---|---|---|
| `layout` | string | `@navbar/default` (full-featured) or `@navbar/minimal` |
| `items` | `array` | Top-level nav items — flat list; order matters |
| `items[].label` | string | Display text |
| `items[].href` | string | Internal path (`/user-guide`) or external URL |

**Grouping** — the default navbar layout is a flat list. For dropdown groups (e.g. "Resources ▾" expanding to multiple links), check the layout source under `src/layouts/navbar/<style>/` to see what nested item shape it accepts. Some layouts support `items[].children: [...]`. If the layout you've chosen doesn't, either pick a different layout or build a custom one.

**External links** — any `href` starting with `http://` or `https://` is treated as external (opens in new tab, may render an external icon).

**Logo** — lives in `site.yaml` under `logo:`, NOT here. The navbar layout reads it from there.

---

## 6. `footer.yaml` — site footer

```yaml
layout: "@footer/default"

copyright: "© {year} My Docs. All rights reserved."   # {year} is auto-substituted

columns:
  - title: "Documentation"
    links:
      - label: "Getting Started"
        href: "/docs/getting-started"
      - label: "API Reference"
        href: "/docs/api"

  - title: "Community"
    links:
      - label: "Blog"
        page: "blog"                       # ← resolves to the page's base_url
      - label: "Discord"
        href: "https://discord.gg/example"

social:
  - platform: "github"
    href: "https://github.com/user/repo"
  - platform: "twitter"
    href: "https://twitter.com/user"
  - platform: "discord"
    href: "https://discord.gg/example"
```

| Field | Type | Notes |
|---|---|---|
| `layout` | string | `@footer/default` (or a minimal variant if shipped) |
| `copyright` | string | Supports `{year}` token (substituted at render) |
| `columns` | array | **Each column is a grouping** — `title` + `links[]` |
| `columns[].links[].label` | string | Display text |
| `columns[].links[].href` | string | Direct URL (internal or external) |
| `columns[].links[].page` | string | **Page id** — resolves to that page's `base_url` (single source of truth; survives URL renames) |
| `social` | array | Auto-rendered with platform icons |
| `social[].platform` | string | `github`, `twitter`, `discord`, etc. (icons live in the layout) |
| `social[].href` | string | The social profile URL |

**`href` vs `page`** — prefer `page:` for any link to one of your own routes. If you ever change `base_url:` for that page in `site.yaml`, footer links update automatically.

**Grouping** — each column IS a group. Use 3-4 columns max; more becomes visually noisy on narrow viewports.

---

## 7. Path aliases — built-in vs user-defined

**Built-in aliases (always available):**

| Alias | Resolves to | Used when |
|---|---|---|
| `@docs/<style>` | `src/layouts/docs/<style>/` | `pages[].layout` for docs |
| `@blog/<style>` | `src/layouts/blogs/<style>/` | `pages[].layout` for blog |
| `@issues/<style>` | `src/layouts/issues/<style>/` | `pages[].layout` for issues |
| `@custom/<style>` | `src/layouts/custom/<style>/` | `pages[].layout` for custom |
| `@navbar/<style>` | `src/layouts/navbar/<style>/` | `navbar.yaml → layout` |
| `@footer/<style>` | `src/layouts/footer/<style>/` | `footer.yaml → layout` |
| `@ext-layouts` | `LAYOUT_EXT_DIR` from `.env` | for user-shipped layouts (overrides built-ins by name) |
| `@theme/<name>` | a theme folder | inside `theme.yaml → extends:` |

**User-defined aliases** — declared in `site.yaml → paths:`:

```yaml
paths:
  data: "../data"           # → @data/<sub>
  assets: "../assets"       # → @assets/<sub>
  themes: "../themes"       # → @themes/<sub>
  # Add your own:
  shared: "../shared"       # → @shared/<sub>
```

These are resolved at config load (paths become absolute), then used wherever the YAML accepts a path-like string (`pages[].data`, `logo.src`, etc.).

---

## 8. Themes

The full theme contract (46 required CSS variables) lives in `dynamic_data/data/user-guide/25_themes/` — **read it before doing any theme work**. Don't invent variable names. Don't hardcode colours / fonts / spacing.

Quick orientation:

| What | Where |
|---|---|
| Built-in default theme | `src/styles/` (read-only — don't edit) |
| Built-in `full-width` theme | `src/themes/full-width/` |
| User themes | `dynamic_data/themes/<name>/theme.yaml` (usually `extends: "@theme/default"`) |
| Active theme selector | `site.yaml → theme: "<name>"` |
| Theme discovery | `site.yaml → theme_paths: ["@themes"]` |

**For any non-trivial theme work, read `dynamic_data/data/user-guide/25_themes/` first. The skill doesn't duplicate the theme contract.**

---

## 9. Worked example — adding a new section

**Goal:** add a "Tutorials" section served at `/tutorials/`.

```bash
# 1. Create the folder + root settings.json (sidebar label)
mkdir -p dynamic_data/data/tutorials
cat > dynamic_data/data/tutorials/settings.json <<'EOF'
{
  "label": "Tutorials",
  "position": 17
}
EOF

# 2. Add a starter page
cat > dynamic_data/data/tutorials/01_overview.md <<'EOF'
---
title: Tutorials Overview
description: Hands-on tutorials for common workflows.
---

# Tutorials

…
EOF
```

```yaml
# 3. Register the route in site.yaml under pages:
pages:
  # … existing entries …
  tutorials:
    base_url: "/tutorials"
    type: docs
    layout: "@docs/default"
    data: "@data/tutorials"
```

```yaml
# 4. Add a navbar entry (navbar.yaml)
items:
  # … existing entries …
  - label: "Tutorials"
    href: "/tutorials"
```

```markdown
<!-- 5. Update dynamic_data/data/README.md so future agents see the new folder -->
| `tutorials/` | Hands-on workflow walkthroughs | XX_ docs | `/tutorials/…` | `@docs/default` |
```

Restart the dev server (`bun run dev`) — the new route is live.

---

## 10. Common patterns

- **Multiple trackers** — register more than one `type: issues` page, each pointing at a different folder (e.g. `todo/` for active, `archive/` for resolved). Each gets its own vocabulary file.
- **Same layout, different content** — same `layout: "@docs/default"`, different `data:` paths. Cheap to scale.
- **Per-section theming** — not currently supported via `pages:`. Themes are site-wide.
- **Subpath deployment** — set `base:` (top-level in `site.yaml`) to the subpath; all routes shift accordingly. Used when serving at `app.com/docs`.

---

## 11. Validate

The plugin ships **`docs-check-config`** (on your `PATH` after install) — runs presence + structural checks against `site.yaml` / `navbar.yaml` / `footer.yaml` so you don't have to eyeball each.

```bash
# Default: checks dynamic_data/config/
docs-check-config

# Or point at any config dir
docs-check-config dynamic_data/config
```

What it checks:
- All three files exist (`site.yaml` is hard-required; `navbar.yaml` / `footer.yaml` warned)
- `site.yaml` has the required top-level keys (`site`, `paths`, `theme`, `pages`)
- Each `pages:` entry has the required fields (`base_url`, `type`, `layout`, `data`)
- Each page's `data:` path resolves on disk (after `@alias` substitution)
- `footer.yaml` `page:` references resolve to a registered page in `site.yaml`

Uses regex over the YAML text — no YAML library dependency. Catches the common breakage; for deeper schema validation, run the dev server and watch its startup warnings. Exit code `0` = clean, `1` = errors found.

---

## 12. Cross-references

- `dynamic_data/data/README.md` — map of every top-level data folder (read this first for orientation)
- `dynamic_data/data/user-guide/05_getting-started/` — installation, aliases, structure
- `dynamic_data/data/user-guide/10_configuration/` — every config file in microscopic detail (per-field reference)
- `dynamic_data/data/user-guide/16_layout-system/` — picking + customising layouts
- `dynamic_data/data/user-guide/20_custom-pages/` — custom page definitions + creating custom layouts
- `dynamic_data/data/user-guide/25_themes/` — theme contract + creation walkthroughs
- `references/writing.md` — markdown content authoring (per-content-type concerns are NOT in this file)
- `references/docs-layout.md` / `blog-layout.md` / `issue-layout.md` — per-content-type structure
