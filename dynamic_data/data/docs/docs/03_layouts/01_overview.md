---
title: Layouts Overview
description: Understanding the layout system and how to use different layouts
---

# Layouts Overview

Layouts define how your content is displayed. The framework provides layouts for documentation, blogs, and custom pages — each with different visual structures while using the same underlying data pipeline.

## What is a Layout?

A layout is an Astro component that receives processed content and renders it with a specific structure. For example:

- **doc_style1**: Shows sidebar navigation + content body + table of contents
- **doc_style2**: Shows content body + table of contents (no sidebar)
- **blog_style1**: Shows post cards on index, full post content on detail pages

```
Content (Markdown)  →  Parser Pipeline  →  Layout  →  Final HTML
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                              doc_style1          doc_style2
                              (3 columns)         (2 columns)
```

## Layout Types

The framework organizes layouts by content type:

| Type | Location | Used For |
|------|----------|----------|
| **Docs** | `src/layouts/docs/styles/` | Documentation pages |
| **Blogs** | `src/layouts/blogs/styles/` | Blog posts and listings |
| **Custom** | `src/layouts/custom/styles/` | Landing pages, info pages |

## Directory Structure

```
src/layouts/
├── BaseLayout.astro          # Root HTML wrapper (all pages)
│
├── docs/
│   ├── styles/               # Layout variants
│   │   ├── doc_style1/       # Full layout (sidebar + body + outline)
│   │   └── doc_style2/       # Minimal layout (body + outline)
│   └── components/           # Shared components
│       ├── sidebar/
│       ├── body/
│       ├── outline/
│       └── common/
│
├── blogs/
│   ├── styles/
│   │   └── blog_style1/      # Index + Post layouts
│   └── components/
│       ├── body/
│       └── cards/
│
├── custom/
│   ├── styles/
│   │   ├── home/             # Landing page (hero + features)
│   │   └── info/             # Simple content page
│   └── components/
│       ├── hero/
│       ├── features/
│       └── content/
│
├── navbar/                   # Navigation variants
│   ├── style1/
│   └── minimal/
│
└── footer/                   # Footer variants
    ├── default/
    └── minimal/
```

## Setting Layouts in Configuration

Layouts are configured in `site.yaml` using the `layout` field:

```yaml
# dynamic_data/config/site.yaml
pages:
  docs:
    base_url: "/docs"
    type: docs
    layout: "@docs/doc_style1"      # ← Layout reference
    data: "@data/docs"

  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/blog_style1"
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
| `@docs/doc_style1` | `src/layouts/docs/styles/doc_style1/Layout.astro` |
| `@blog/blog_style1` | `src/layouts/blogs/styles/blog_style1/*.astro` |
| `@custom/home` | `src/layouts/custom/styles/home/Layout.astro` |

## Dev Toolbar: Layout Switcher

During development, you can switch layouts without modifying configuration files.

### Using the Dev Toolbar

1. Start the dev server: `npm run start`
2. Navigate to any docs or blog page
3. Click the **grid icon** in Astro's dev toolbar (bottom of screen)
4. Select a different layout

The page reloads with the new layout instantly.

### URL-Based Override

You can also switch layouts via URL query parameter:

```
/docs/overview?layout=doc_style2
/blog?layout=blog_style2
```

This is useful for:
- Sharing layout previews with team members
- Bookmarking specific layout configurations
- Testing without opening the toolbar

### How It Works

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Dev Toolbar     │────▶│  ?layout=...     │────▶│  Middleware      │
│  (click button)  │     │  (URL param)     │     │  (captures)      │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                                                           ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Page renders    │◀────│  Layout resolved │◀────│  [...slug].astro │
│  with new layout │     │  from override   │     │  (reads locals)  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

The layout switcher:
1. Adds `?layout=style_name` to the URL
2. Middleware captures the parameter and stores it in `Astro.locals`
3. The page handler reads the override and uses it instead of config

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
| `doc_style1` | Full layout: sidebar + body + outline |
| `doc_style2` | Minimal layout: body + outline (no sidebar) |

### Blog Layouts

| Layout | Description |
|--------|-------------|
| `blog_style1` | Standard blog with post cards and full post pages |

### Custom Layouts

| Layout | Description |
|--------|-------------|
| `home` | Landing page with hero section and features grid |
| `info` | Simple content page for about/contact pages |

## Creating New Layouts

To add a new layout:

1. **Create the folder**: `src/layouts/docs/styles/my_layout/`
2. **Add Layout.astro**: Implement the required props interface
3. **Import components**: Use existing or create new components
4. **Reference in config**: `layout: "@docs/my_layout"`

The layout is automatically discovered — no registration needed.

See the [Docs Layouts](./docs-layouts/overview), [Blog Layouts](./blog-layouts/overview), and [Custom Layouts](./custom-layouts/overview) sections for detailed guides.
