---
title: Layouts Overview
description: Understanding the layout system and how to use different layouts
---

# Layouts Overview

Layouts define how your content is displayed. The framework provides layouts for documentation, blogs, and custom pages — each with different visual structures while using the same underlying data pipeline.

## What is a Layout?

A layout is an Astro component that receives processed content and renders it with a specific structure. For example:

- **default**: Shows sidebar navigation + content body + table of contents
- **compact**: Shows content body + table of contents (no sidebar)
- **default** (blog): Shows post cards on index, full post content on detail pages

```
Content (Markdown)  →  Parser Pipeline  →  Layout  →  Final HTML
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                              default             compact
                              (3 columns)         (2 columns)
```

## Layout Types

The framework organizes layouts by content type:

| Type | Location | Used For |
|------|----------|----------|
| **Docs** | `src/layouts/docs/` | Documentation pages |
| **Blogs** | `src/layouts/blogs/` | Blog posts and listings |
| **Custom** | `src/layouts/custom/` | Landing pages, info pages |

## Directory Structure

Each layout variant is a folder that owns its own components. Layouts contain only Astro components — no CSS files. All styling is provided by the theme (`src/styles/`).

```
src/layouts/
├── BaseLayout.astro          # Root HTML wrapper (all pages)
│                             # Injects theme CSS via <style id="theme-styles">
│
├── docs/
│   ├── default/              # Full layout (sidebar + body + outline)
│   │   ├── Layout.astro
│   │   ├── Sidebar.astro
│   │   ├── Body.astro
│   │   ├── Outline.astro
│   │   └── Pagination.astro
│   └── compact/              # Compact layout (body + outline, no sidebar)
│       └── Layout.astro      # imports Body/Outline/Pagination from ../default/
│
├── blogs/
│   └── default/              # Index + Post layouts + all blog components
│       ├── IndexLayout.astro
│       ├── PostLayout.astro
│       ├── IndexBody.astro
│       ├── PostBody.astro
│       └── PostCard.astro
│
├── custom/
│   ├── home/                 # Landing page (hero + features)
│   │   ├── Layout.astro
│   │   ├── Hero.astro
│   │   └── Features.astro
│   ├── info/                 # Simple content page
│   │   ├── Layout.astro
│   │   └── Content.astro
│   └── countdown/            # Countdown timer page
│       └── Layout.astro
│
├── navbar/                   # Navigation variants
│   ├── default/index.astro
│   └── minimal/index.astro
│
└── footer/                   # Footer variants
    ├── default/index.astro
    └── minimal/index.astro
```

The theme provides visual styling for navbar, footer, docs, and blog layouts through CSS files like `docs.css`, `navbar.css`, `footer.css`, and `blogs.css` in `src/styles/`. Custom page layouts (`home`, `info`, `countdown`) define their own styles using scoped `<style>` blocks within each component.

## Setting Layouts in Configuration

Layouts are configured in `site.yaml` using the `layout` field:

```yaml
# dynamic_data/config/site.yaml
pages:
  docs:
    base_url: "/docs"
    type: docs
    layout: "@docs/default"      # ← Layout reference
    data: "@data/docs"

  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/default"
    data: "@data/blog"

  home:
    base_url: "/"
    type: custom
    layout: "@custom/home"
    data: "@data/pages/home.yaml"
```

### Layout Reference Format

```
@{type}/{style_name}
```

| Reference | Resolves To |
|-----------|-------------|
| `@docs/default` | `src/layouts/docs/default/Layout.astro` |
| `@blog/default` | `src/layouts/blogs/default/*.astro` |
| `@custom/home` | `src/layouts/custom/home/Layout.astro` |

## Dev Toolbar: Layout Switcher

During development, you can switch layouts without modifying configuration files.

### Using the Dev Toolbar

1. Start the dev server: `bun run start`
2. Navigate to any docs or blog page
3. Click the **grid icon** in Astro's dev toolbar (bottom of screen)
4. Select a different layout

The page reloads with the new layout instantly.

## Data Flow

All layouts receive **processed HTML content**, not raw markdown:

```
1. User requests /docs/overview
           │
2. Route handler loads markdown file
           │
3. Parser pipeline processes content:
   • Preprocessors (asset embedding)
   • Renderer (markdown → HTML)
   • Postprocessors (heading IDs, links)
           │
4. Layout receives:
   • title, description (from frontmatter)
   • content (rendered HTML string)
   • headings (extracted for TOC)
   • dataPath, baseUrl, currentSlug
           │
5. Layout renders structure around content
```

## Available Layouts

### Documentation Layouts

| Layout | Description |
|--------|-------------|
| `default` | Full layout: sidebar + body + outline |
| `compact` | Minimal layout: body + outline (no sidebar) |

### Blog Layouts

| Layout | Description |
|--------|-------------|
| `default` | Standard blog with post cards and full post pages |

### Custom Layouts

| Layout | Description |
|--------|-------------|
| `home` | Landing page with hero section and features grid |
| `info` | Simple content page for about/contact pages |
| `countdown` | Countdown timer to a target date |

## External Layouts

You can add custom layouts **without modifying the framework's `src/` directory** by setting the `LAYOUT_EXT_DIR` environment variable.

### Setup

1. Create a layouts directory (e.g., `dynamic_data/layouts/`)
2. Set `LAYOUT_EXT_DIR` in `.env`:

```env
LAYOUT_EXT_DIR=./dynamic_data/layouts
```

3. Mirror the `src/layouts/` structure for the layouts you want to add:

```
dynamic_data/layouts/
├── docs/my-layout/
│   └── Layout.astro
├── blogs/my-blog-style/
│   ├── IndexLayout.astro
│   └── PostLayout.astro
├── custom/my-page/
│   └── Layout.astro
├── navbar/my-navbar/
│   └── index.astro
└── footer/my-footer/
    └── index.astro
```

### Import Rules

External `.astro` files live outside `src/`, so **relative imports won't work**. Use Vite aliases instead:

```astro
---
// Use @layouts/ to import built-in components from another variant
import Body from '@layouts/docs/default/Body.astro';
import Outline from '@layouts/docs/default/Outline.astro';
import Pagination from '@layouts/docs/default/Pagination.astro';

// Use @loaders/ for data loading
import { loadContentWithSettings } from '@loaders/data';
---
```

Available aliases: `@layouts/`, `@loaders/`, `@parsers/`, `@styles/`, `@modules/`, `@hooks/`, `@custom-tags/`.

### Merge Behavior

| Scenario | Result |
|----------|--------|
| New style name | Added alongside built-in layouts |
| Same style name as built-in | External layout **overrides** built-in |
| `LAYOUT_EXT_DIR` not set | Only built-in layouts (zero overhead) |
| Directory doesn't exist | Startup error with clear message |

### Limitations

- `BaseLayout.astro` cannot be overridden (it's the root HTML wrapper)
- Adding or removing layout directories requires a dev server restart (Vite glob limitation)
- Modifying existing external `.astro` files triggers normal HMR/full-reload

## Creating New Layouts

### Built-in Layout (in `src/`)

1. **Create the folder**: `src/layouts/docs/my_layout/`
2. **Add Layout.astro**: Implement the required props interface
3. **Import components**: Use `./` for same-folder, `../default/` for shared components
4. **Use theme CSS classes**: Apply the correct CSS class names so the theme can style the layout
5. **Reference in config**: `layout: "@docs/my_layout"`

### External Layout (outside `src/`)

1. **Set `LAYOUT_EXT_DIR`** in `.env` (if not already set)
2. **Create the folder**: `<LAYOUT_EXT_DIR>/docs/my_layout/`
3. **Add Layout.astro**: Implement the required props interface
4. **Use Vite aliases for imports**: `@layouts/`, `@loaders/`, etc. (no relative imports)
5. **Restart dev server** to pick up the new directory
6. **Reference in config**: `layout: "@docs/my_layout"`

Both are automatically discovered — no registration needed.

See the [Docs Layouts](./docs-layouts/overview), [Blog Layouts](./blog-layouts/overview), and [Custom Layouts](./custom-layouts/overview) sections for detailed guides.
