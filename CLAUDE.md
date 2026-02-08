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
│   ├── alias.ts          # @key → absolute path resolution (@docs, @blog, @data, etc.)
│   ├── config.ts         # Loads site.yaml, navbar.yaml, footer.yaml; resolves aliases at load time
│   ├── data.ts           # Content loader with mtime caching (requires absolute paths)
│   ├── theme.ts          # Theme loading, inheritance, CSS merging; resolveThemeName()
│   ├── cache.ts          # Error/warning collection
│   ├── cache-manager.ts  # Unified mtime-based cache with dependency tracking
│   └── index.ts          # Barrel exports
│
├── parsers/              # Modular content parsing pipeline
│   ├── core/             # Base parser logic
│   ├── content-types/    # docs, blog content type handlers
│   ├── preprocessors/    # Frontmatter extraction, custom tag expansion
│   ├── renderers/        # Markdown → HTML (unified/remark/rehype)
│   ├── transformers/     # AST transforms (heading extraction, link rewriting)
│   └── postprocessors/   # Final HTML transforms
│
├── layouts/              # Astro layout components
│   ├── BaseLayout.astro  # Root layout: theme CSS injection, dark mode, head meta
│   ├── docs/styles/      # default, compact
│   ├── blogs/styles/     # default
│   ├── custom/styles/    # home, info, countdown
│   ├── navbar/           # Navbar layout variants
│   └── footer/           # Footer layout variants
│
├── pages/
│   ├── [...slug].astro   # Dynamic route: resolves page type → layout component
│   ├── assets/           # Serves files from asset-category directories
│   └── api/dev/          # Dev-only API (themes, editor)
│
├── styles/               # Built-in default theme (theme.yaml + CSS)
├── dev-toolbar/          # Live editor (Yjs CRDT sync, presence, SSE)
│   ├── editor/           # Server-side: yjs-sync.ts, server.ts, middleware.ts, presence.ts
│   ├── editor-app.ts     # Client-side: textarea ↔ Y.Text sync
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
    ├── docs/             # Documentation (XX_ prefix required)
    ├── blog/             # Blog posts (YYYY-MM-DD-slug.md)
    └── pages/            # Custom page data (YAML)
```

## Key Architecture Concepts

**Path resolution**: `site.yaml` `paths:` section defines `@key` aliases (`@data`, `@assets`, `@theme`). User aliases (`@data`, `@assets`, `@theme`) are resolved to absolute paths at config load time. System aliases (`@docs`, `@blog`, `@navbar`, `@footer`) remain as layout references resolved at render time.

**Theme resolution**: `site.yaml` `theme: "@theme/name"` is resolved to an absolute path by `resolveThemeName()` during `loadSiteConfig()`. Theme inheritance (`extends` in `theme.yaml`) still uses `@theme/` aliases resolved at theme load time.

**Layout resolution**: `[...slug].astro` matches page type to layout via `import.meta.glob()`. Layout aliases like `@docs/default` map to `src/layouts/docs/styles/default/Layout.astro`.

**Content loading**: `data.ts` requires absolute paths (resolved at config load time). Uses mtime-based caching with dependency tracking.

## Build Commands

```bash
bun run start    # Development
bun run build    # Production build
```

## Key Rules

1. **`XX_` prefix required** for all doc files/folders (01-99)
2. **`settings.json` required** in every doc folder
3. **`title` frontmatter required** in every doc file
4. **`theme` field required** in `site.yaml` (throws if missing)
5. **Assets folder** excluded from sidebar (no prefix needed)
6. **No hardcoded colors/fonts/spacing** in layouts — use theme CSS variables
