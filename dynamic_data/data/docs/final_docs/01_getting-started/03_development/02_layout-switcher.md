---
title: Layout & Theme Switcher
description: Dev toolbar for switching layouts and themes during development
---

# Layout & Theme Switcher

The framework includes a custom dev toolbar app for rapid layout iteration. This is a **development-only** feature that allows you to preview different layouts without modifying configuration files.

## Accessing the Selector

1. Start the dev server (`npm run start`)
2. Navigate to any docs or blog page
3. Click the **grid icon** in the dev toolbar
4. Select a layout or theme

## Layout Selector

When on `/docs/*` pages:
- Switch between `doc_style1`, `doc_style2`, etc.
- Preview different sidebar configurations
- Compare layout variants side-by-side (open in multiple tabs)

When on `/blog/*` pages:
- Switch between `blog_style1`, `blog_style2`, etc.
- Preview different post card layouts
- Test index vs post layouts

## Theme Selector

Toggle between themes globally:

| Theme | Behavior |
|-------|----------|
| **Light** | Force light mode |
| **Dark** | Force dark mode |
| **System** | Follow OS preference |

Theme selection persists in localStorage across sessions.

## URL-Based Layout Override

You can also override layouts via URL query parameter:

```
/docs/overview?layout=doc_style2
/blog?layout=blog_style2
```

This is useful for:
- Sharing specific layout previews with team members
- Testing layouts without opening the toolbar
- Bookmarking layout comparisons

## How It Works

The layout switcher operates through several components working together:

### 1. Dev Toolbar Integration (`src/dev-toolbar/integration.ts`)

Registers the custom app with Astro's dev toolbar:

```typescript
export function devToolbarIntegration(): AstroIntegration {
  return {
    name: 'dev-toolbar-layout-selector',
    hooks: {
      'astro:config:setup': ({ addDevToolbarApp }) => {
        addDevToolbarApp({
          id: 'layout-theme-selector',
          name: 'Layout & Theme',
          icon: `<svg>...</svg>`,
          entrypoint: './src/dev-toolbar/layout-selector.ts',
        });
      },
    },
  };
}
```

### 2. Layout Selector UI (`src/dev-toolbar/layout-selector.ts`)

The client-side code that:
- Renders layout/theme options in the toolbar panel
- Detects current page type (docs, blog, custom)
- Adds `?layout=` query parameter to URL on selection
- Triggers page reload with new layout

### 3. Middleware (`src/middleware.ts`)

Captures the `layout` query parameter from the HTTP request:

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  if (import.meta.env.DEV) {
    const layoutOverride = context.url.searchParams.get('layout');
    if (layoutOverride) {
      context.locals.layoutOverride = layoutOverride;
    }
  }
  return next();
});
```

### 4. Page Handler (`src/pages/[...slug].astro`)

Reads the layout override and applies it:

```typescript
const layoutOverride = isDev ? Astro.locals.layoutOverride : null;

let layout = configLayout;
if (layoutOverride && isDev) {
  if (pageType === 'docs') {
    layout = `@docs/${layoutOverride}`;
  }
  // ... similar for blog, custom
}
```

## Available Layouts

Layouts are auto-discovered via glob patterns:

```typescript
const docsLayouts = import.meta.glob('/src/layouts/docs/styles/*/Layout.astro');
```

Any folder in `src/layouts/docs/styles/` with a `Layout.astro` file becomes available for switching.

### Current Doc Layouts

| Layout | Description |
|--------|-------------|
| `doc_style1` | Full layout with sidebar, body, and outline |
| `doc_style2` | Minimal layout without sidebar |

### Adding New Layouts

1. Create folder: `src/layouts/docs/styles/doc_style3/`
2. Add `Layout.astro` with your design
3. The layout appears automatically in the dev toolbar
