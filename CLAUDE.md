# Project Overview

Astro-based documentation framework with modular layouts, YAML configuration, and live editing via Yjs CRDT.

## Skills

- **`/docs-guide`** — For writing/editing documentation content: frontmatter, markdown, folder structure, `XX_` prefixes, `settings.json`
- **`/docs-settings`** — For site configuration: `site.yaml`, `navbar.yaml`, `footer.yaml`, path aliases, page definitions

## Source Code Structure

```
src/
├── loaders/              # Config, data, and path resolution
│   ├── paths.ts          # Two-phase path init (structural + user paths from site.yaml)
│   ├── alias.ts          # @key → absolute path resolution (@docs, @blog, @issues, @data, etc.)
│   ├── config.ts         # Loads site.yaml, navbar.yaml, footer.yaml; resolves aliases at load time
│   ├── data.ts           # Content loader with mtime caching (requires absolute paths)
│   ├── issues.ts         # Folder-per-item loader for the issues content type (settings.json-driven)
│   ├── theme.ts          # Theme loading, inheritance, CSS merging; resolveThemeName()
│   ├── cache.ts          # Error/warning collection
│   ├── cache-manager.ts  # Unified mtime-based cache with dependency tracking
│   └── index.ts          # Barrel exports
│
├── parsers/              # Modular content parsing pipeline
│   ├── core/             # Base parser logic
│   ├── content-types/    # docs, blog, issues content type handlers
│   ├── preprocessors/    # Frontmatter extraction, custom tag expansion
│   ├── renderers/        # Markdown → HTML (unified/remark/rehype)
│   ├── transformers/     # AST transforms (heading extraction, link rewriting)
│   └── postprocessors/   # Final HTML transforms
│
├── layouts/              # Astro layout components (see "Layouts" section below)
│   ├── BaseLayout.astro  # Root layout: theme CSS injection, dark mode, head meta
│   ├── docs/default/     # Layout.astro + Sidebar, Body, Outline, Pagination
│   ├── docs/compact/     # Layout.astro (imports components from ../default/)
│   ├── blogs/default/    # IndexLayout, PostLayout + IndexBody, PostBody, PostCard
│   ├── issues/default/   # IndexLayout, DetailLayout + parts/ (FilterBar, IssuesTable, …, client.ts)
│   ├── custom/home/      # Layout.astro + Hero, Features
│   ├── custom/info/      # Layout.astro + Content
│   ├── custom/countdown/ # Layout.astro (self-contained)
│   ├── navbar/           # Navbar layout variants (default, minimal)
│   └── footer/           # Footer layout variants (default, minimal)
│
├── pages/
│   ├── [...slug].astro   # Dynamic route: resolves page type → layout component
│   ├── assets/           # Serves files from asset-category directories
│   └── api/dev/          # Dev-only API (themes, editor)
│
├── styles/               # Built-in default theme (theme.yaml + CSS)
├── dev-toolbar/          # Astro dev-toolbar apps + shared server layer
│   ├── server/           # Shared server-side: middleware · editor-store · yjs-sync · presence · metrics
│   ├── editor/           # CodeMirror 6 live editor (mounted at /editor)
│   ├── layout-selector/  # Layout & theme picker toolbar app
│   ├── error-logger/     # Doc errors toolbar app
│   ├── system-metrics/   # CPU / RAM toolbar app (3-dot overflow)
│   ├── cache-inspector/  # Server in-memory cache viewer (3-dot overflow)
│   └── integration.ts    # Astro integration wiring
│
└── custom-tags/          # Custom markdown tags (callouts, tabs, collapsible, etc.)
```

## Data Directory

```
dynamic_data/
├── config/               # YAML configs (site.yaml, navbar.yaml, footer.yaml)
├── assets/               # Static assets (logos, images) → served at /assets/
├── themes/               # Custom themes (each has theme.yaml + CSS files)
└── data/                 # Content
    ├── user-guide/       # User-facing docs: setup, config, content, themes (→ /user-guide)
    │   ├── 05_getting-started/
    │   ├── 10_configuration/
    │   ├── 15_content/
    │   ├── 20_themes/
    │   └── 25_layouts/
    ├── dev-docs/         # Developer docs: architecture, layouts, scripts, tooling (→ /dev-docs)
    │   ├── 05_architecture/
    │   ├── 10_layouts/
    │   ├── 15_scripts/
    │   └── 20_development/
    ├── blog/             # Blog posts (YYYY-MM-DD-slug.md)
    ├── issues/           # Issue tracker (folder-per-issue, YYYY-MM-DD-<slug>/)
    │                     #   settings.json (metadata), issue.md, comments/NNN_*.md, *.md (supporting docs)
    │                     #   Root settings.json declares vocabulary (status, priority, type, …)
    └── pages/            # Custom page data (YAML)
```

## Key Architecture Concepts

**Path resolution**: `site.yaml` `paths:` section defines `@key` aliases (`@data`, `@assets`, `@themes`). User aliases are resolved to absolute paths at config load time. System aliases (`@docs`, `@blog`, `@issues`, `@custom`, `@navbar`, `@footer`) remain as layout references resolved at render time.

**Theme resolution**: `site.yaml` `theme: "name"` specifies the active theme by name. `theme_paths: ["@themes"]` lists directories to scan for user themes. `resolveThemeName()` scans those directories during `loadSiteConfig()` and resolves to an absolute path. Theme inheritance (`extends` in `theme.yaml`) uses `@theme/` aliases resolved at theme load time.

**Theme variable contract**: `src/styles/theme.yaml` declares `required_variables` — a contract every theme (built-in and user) must satisfy. Layouts MUST consume only these variables; inventing names with inline fallbacks (e.g. `var(--color-accent, #7aa2f7)`) is how bugs creep in — the var never resolves, the fallback freezes the value, dark/light mode stops working. See the "Theming" section below.

**Layout resolution**: `[...slug].astro` matches `page.type` (`docs` | `blog` | `issues` | `custom`) to a layout via `import.meta.glob()`. Layout aliases like `@docs/default` map to `src/layouts/docs/default/Layout.astro`. Some content types (blog, issues) have an index+detail split and register both `IndexLayout.astro` and `PostLayout.astro` / `DetailLayout.astro`.

**Content loading**: `data.ts` (docs, blog) and `issues.ts` (issues) require absolute paths (resolved at config load time) and use mtime-based caching with dependency tracking.

## Layouts

A **layout** is a folder under `src/layouts/<type>/<style>/` that renders pages of a given content type. Types are fixed by the routing layer; styles are pluggable (each adds a variant like `default`, `compact`, `minimal`). User themes can ship layouts in `dynamic_data/layouts/<type>/<style>/` which override built-in styles via the `@ext-layouts` alias.

### Layout types

| Type | Routing | Entry file(s) | Notes |
|---|---|---|---|
| `docs` | `/<base>/<slug>` | `Layout.astro` | Single template for list + detail (sidebar-driven) |
| `blog` | `/<base>` + `/<base>/<slug>` | `IndexLayout.astro`, `PostLayout.astro` | Flat files named `YYYY-MM-DD-<slug>.md` |
| `issues` | `/<base>` + `/<base>/<id>` | `IndexLayout.astro`, `DetailLayout.astro` | Folder-per-item (`YYYY-MM-DD-<slug>/`), `settings.json`-driven metadata, vocabulary in root `settings.json`, multi-file support (issue.md + comments/ + supporting *.md) |
| `custom` | `/<base>` | `Layout.astro` | Freeform page (home, about, countdown, …) |

### Conventions for a new layout

1. **Folder**: `src/layouts/<type>/<style>/` (peer of existing styles). Do NOT put new first-class content types under `custom/`.
2. **Required file(s)**: one `Layout.astro` for docs/custom; `IndexLayout.astro` + `PostLayout.astro` (blog) or `DetailLayout.astro` (issues).
3. **Refactor at scale**: keep any single `.astro` or `.ts` file under ~400 lines. Split into `parts/` subcomponents (see `issues/default/parts/` for the pattern — `FilterBar`, `IssuesTable`, `Pagination`, `client.ts`, etc.).
4. **Client logic**: put interactive JS in `parts/client.ts` and load it via `<script>import { init } from './parts/client'; init();</script>`. Pass server data to the client through a `<script type="application/json" id="…-config">` tag, NOT `define:vars` (which breaks when scripts bundle/import local modules).
5. **CSS scoping gotcha**: elements created at runtime via `innerHTML` / `createElement` don't receive Astro's `data-astro-cid-*` attribute, so scoped selectors skip them. For styles that target dynamic nodes, wrap them in `:global(.classname) { … }`.
6. **Register routing**: add globs + a branch in `src/pages/[...slug].astro` (for new types) and add the alias (`@<type>`) in `src/loaders/alias.ts`.

## Theming

**All CSS in layouts MUST consume declared theme variables — no invented names, no hardcoded fallbacks.** The full contract lives in `src/styles/theme.yaml → required_variables`. The cheat sheet:

| Purpose | Use |
|---|---|
| Text colors | `--color-text-primary` / `--color-text-secondary` / `--color-text-muted` |
| Backgrounds | `--color-bg-primary` (page) / `--color-bg-secondary` (cards) / `--color-bg-tertiary` (table headers, subtle tints) |
| Borders | `--color-border-default` / `--color-border-light` |
| Brand/accent | `--color-brand-primary` / `--color-brand-secondary` |
| Status | `--color-success` / `--color-warning` / `--color-error` / `--color-info` |
| Font families | `--font-family-base` / `--font-family-mono` |
| Font sizes (required) | `--font-size-sm` (14px) / `--font-size-base` (16) / `--font-size-lg` (18) / `--font-size-xl` (20) / `--font-size-2xl` (24) |
| Font sizes (default-theme-only) | `--font-size-xs` (12px) — use with `--font-size-sm` fallback: `var(--font-size-xs, var(--font-size-sm))` |
| Spacing | `--spacing-xs/sm/md/lg/xl/2xl` |
| Radius | `--border-radius-sm/md/lg/xl` (plus `--border-radius-full` for pills) |
| Shadows | `--shadow-sm/md/lg/xl` |
| Transitions | `--transition-fast` (150ms) / `--transition-normal` (250ms) |

**Do not** reach for hex codes, arbitrary `rem` font sizes, or invented variable names. If something feels missing from the contract, propose adding it to `theme.yaml` before inventing a private name.

### Where themes live

- **Built-in default theme**: `src/styles/` — `theme.yaml` (contract), `color.css`, `font.css`, `element.css`, `markdown.css`, etc.
- **User themes**: `dynamic_data/themes/<name>/` — each has its own `theme.yaml` (usually `extends: "@theme/default"`) and any CSS overrides.
- **Active theme selector**: `site.yaml → theme: "<name>"`; `theme_paths: ["@themes"]` controls which dirs to scan.

### Typography regulations — two-tier token model

The typography system follows the **primitive / semantic token pattern**. Layouts MUST consume the semantic tokens — never the primitive `--font-size-*` scale directly. The primitives are the palette; the semantic tokens carry intent.

**Layer 1 — primitive scale** (in `src/styles/font.css`, theme-internal):
`--font-size-xs / sm / base / lg / xl / 2xl / 3xl / 4xl / 5xl`. Themes can override these. **Layouts should not reference them.**

**Layer 2 — semantic UI tokens** (for chrome — buttons, cards, tables, badges, forms, nav, footer):

| Tier | Token | Default value | Role |
|---|---|---|---|
| Micro | `--ui-text-micro` | `--font-size-xs` (12px) | Badges, counts, ids, timestamps, field labels |
| Body | `--ui-text-body` | `--font-size-sm` (14px) | Default body, table rows, inputs, descriptions, **card titles** |
| Title | `--ui-text-title` | `--font-size-2xl` (24px) | Page titles, major landmarks |

Three tiers is the whole chrome palette. For card titles, primary buttons, and anything that needs to feel emphasised, **use `--ui-text-body` + `font-weight: 600` + `color: var(--color-text-primary)`** — hierarchy from weight/color, not size. Modern design systems (Polaris, GitHub Primer for chrome, Linear, Notion) all use this pattern. Adding a fourth chrome size tier is almost always a sign you're encoding importance with size when weight/color/position would do better.

**Layer 2 — semantic content tokens** (for rendered markdown / prose — `markdown.css` + any layout embedding prose):

| Token | Default value | Role |
|---|---|---|
| `--content-body` | `--font-size-base` | Body paragraphs |
| `--content-h1` | `--font-size-4xl` | h1 |
| `--content-h2` | `--font-size-2xl` | h2 |
| `--content-h3` | `--font-size-xl` | h3 |
| `--content-h4` | `--font-size-lg` | h4 |
| `--content-h5` | `--font-size-base` | h5 |
| `--content-h6` | `--font-size-sm` | h6 |
| `--content-code` | `0.9em` | Inline `<code>` — em-relative, scales with parent |

**Layer 2 — display tokens** (marketing / landing / countdown surfaces only):

`--display-sm` (`3xl`) / `--display-md` (`4xl`) / `--display-lg` (`5xl`). Only used in `src/layouts/custom/home`, countdown, hero sections. Do NOT use in docs / blog / issues / app chrome. Fluid `clamp()` is also acceptable here for poster-style text.

**Why the split?** Even when values coincide (`--ui-text-title` and `--content-h2` both resolve to 24px today), the *names* carry intent. A future redesign that bumps UI chrome to a denser scale won't accidentally shrink markdown headings. Reviewers don't have to guess whether `--font-size-lg` in a layout means "large-ish UI" or "h4 content".

**Rules for any layout:**

- Consume semantic tokens (`--ui-text-*`, `--content-*`, `--display-*`) — never primitive `--font-size-*` and never raw rem/px.
- If a size isn't on any scale, fold it into the nearest tier rather than inventing a new value.
- Before reaching for a 5th UI chrome size, ask whether color/weight/position would encode the hierarchy better.
- `em` units are OK when the intent is *relative to surrounding text* (e.g. `<code>` inside a heading). That's a conscious relative choice, not a scale violation.
- Custom / marketing layouts (`src/layouts/custom/**`) MAY reach for `--display-*` or fluid `clamp()`. Those are the only places display tiers belong.

## Build Commands

```bash
bun run dev      # Development (Astro dev server + live editor)
bun run build    # Production build
bun run preview  # Preview production build locally
```

## Key Rules

1. **`XX_` prefix required** for all doc files/folders (01-99)
2. **`settings.json` required** in every doc folder
3. **`title` frontmatter required** in every doc file
4. **`theme` field required** in `site.yaml` (throws if missing)
5. **Assets folder** excluded from sidebar (no prefix needed)
6. **No hardcoded colors/fonts/spacing** in layouts — consume the declared theme contract (see "Theming" above)
7. **Split large layout files** at ~400 lines into `parts/` subcomponents; client JS in a single `client.ts`
8. **Issues** use folder-per-item (`YYYY-MM-DD-<slug>/`) with `settings.json` for metadata; vocabulary in the tracker's root `settings.json`
