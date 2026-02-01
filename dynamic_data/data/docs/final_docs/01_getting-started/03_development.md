---
title: Development
description: Development experience features and tools
---

# Development

The framework provides an enhanced development experience with fast hot reload, built-in dev tools, and custom utilities for layout iteration.

## Starting Development Server

```bash
npm run start
```

This launches Astro's dev server at `http://localhost:4321` with:

- **Instant hot reload** - Changes reflect immediately without full page refresh
- **Fast HMR** - Hot Module Replacement for styles and components
- **Error overlay** - Clear error messages with stack traces
- **Dev toolbar** - Built-in development utilities (bottom of page)

## Hot Reload

Astro's development server provides near-instant feedback:

| Change Type | Reload Speed |
|-------------|--------------|
| Markdown content | ~50ms |
| Component changes | ~100ms |
| Style changes | Instant (HMR) |
| Configuration | Auto restart |

The dev server watches all files in `dynamic_data/` and `src/`, automatically rebuilding only what changed.

## Astro Dev Toolbar

The dev toolbar appears at the bottom of every page during development. Click the Astro logo to expand it.

### Built-in Tools

| Tool | Purpose |
|------|---------|
| **Inspect** | Highlight component islands, view hydration status |
| **Audit** | Accessibility checks, performance hints |
| **Settings** | Toggle verbose logging, disable toolbar |

## Layout & Theme Selector

The framework includes a custom dev toolbar app for rapid layout iteration.

### Accessing the Selector

1. Start the dev server (`npm run start`)
2. Navigate to any docs or blog page
3. Click the **grid icon** in the dev toolbar
4. Select a layout or theme

### Layout Selector

When on `/docs/*` pages:
- Switch between `doc_style1`, `doc_style2`, etc.
- Preview different sidebar configurations
- Compare layout variants side-by-side (open in multiple tabs)

When on `/blog/*` pages:
- Switch between `blog_style1`, `blog_style2`, etc.
- Preview different post card layouts
- Test index vs post layouts

### Theme Selector

Toggle between themes globally:

| Theme | Behavior |
|-------|----------|
| **Light** | Force light mode |
| **Dark** | Force dark mode |
| **System** | Follow OS preference |

Theme selection persists in localStorage across sessions.

### URL-Based Layout Override

You can also override layouts via URL query parameter:

```
/docs/overview?layout=doc_style2
/blog?layout=blog_style2
```

This is useful for:
- Sharing specific layout previews with team members
- Testing layouts without opening the toolbar
- Bookmarking layout comparisons

## Development Workflow Tips

### 1. Content Iteration

Edit markdown files and see changes instantly:

```bash
# Terminal 1: Dev server
npm run start

# Terminal 2: Edit content
code dynamic_data/data/docs/
```

### 2. Layout Development

When creating new layouts:

1. Copy an existing layout folder in `src/layouts/*/styles/`
2. Rename to your new style (e.g., `doc_style3`)
3. Use the dev toolbar to switch between layouts
4. Iterate on styles with instant HMR

### 3. Configuration Changes

Most YAML config changes apply without restart:

- `navbar.yaml` - Navigation items
- `footer.yaml` - Footer content
- `site.yaml` - Some fields require restart

### 4. Debugging

The dev server provides detailed error messages:

- **Build errors** - Shown in terminal with file paths
- **Runtime errors** - Displayed in browser overlay
- **Component errors** - Stack traces with source maps

## Production Build

When ready to deploy:

```bash
npm run build
```

This generates a static site in `dist/` with:
- Optimized assets
- Minified HTML/CSS/JS
- Pre-rendered pages
