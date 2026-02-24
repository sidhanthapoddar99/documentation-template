---
title: Layout Resolution
description: How layout references are resolved to component files
sidebar_position: 5
---

# Layout Resolution

Layout resolution is the process of converting a layout reference (like `@docs/default`) into an actual Astro component file path.

## Resolution Flow

```
site.yaml config                    Resolved component path
─────────────────                   ─────────────────────────
@docs/default            ────▶      src/layouts/docs/default/Layout.astro
@blog/default            ────▶      src/layouts/blogs/default/*.astro
@custom/home             ────▶      src/layouts/custom/home/Layout.astro
```

## Path Pattern

All layout types follow a standardized path pattern:

```
src/layouts/{type}/{style}/Layout.astro
```

| Component | Description | Examples |
|-----------|-------------|----------|
| `{type}` | Layout category | `docs`, `blogs`, `custom` |
| `{style}` | Style variant | `default`, `compact`, `home` |

## Resolution in `[...slug].astro`

The dynamic route handler resolves layouts using glob imports:

```typescript
// Auto-discover all available layouts
const builtinDocsLayouts = import.meta.glob(
  '/src/layouts/docs/*/Layout.astro'
);

const builtinBlogIndexLayouts = import.meta.glob(
  '/src/layouts/blogs/*/IndexLayout.astro'
);

const builtinBlogPostLayouts = import.meta.glob(
  '/src/layouts/blogs/*/PostLayout.astro'
);

const builtinCustomLayouts = import.meta.glob(
  '/src/layouts/custom/*/Layout.astro'
);

// Single regex captures the variant folder name for all types
const layoutNamePattern = /\/([^/]+)\/[^/]+\.astro$/;
const docsLayouts = mergeLayouts(builtinDocsLayouts, extDocsLayouts, layoutNamePattern);
```

### Resolution Function

```typescript
function validateAndResolve(layoutAlias: string, variant?: 'index' | 'post') {
  // Parse the reference: "@docs/default"
  const match = layoutAlias.match(/^@(\w+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid layout reference: ${layoutAlias}`);
  }

  const [, type, style] = match;

  // Look up in the merged layout map
  if (type === 'docs') {
    const entry = docsLayouts.byStyle.get(style);

    if (!entry) {
      throw new Error(
        `Docs layout "${style}" does not exist.\n` +
        `Expected: src/layouts/docs/${style}/Layout.astro\n` +
        `Available: ${availableDocsStyles.join(', ')}`
      );
    }

    return entry.loader;
  }
  // ... blog, custom, navbar, footer cases
}
```

## Blog Layout Special Case

Blog pages have two layouts (index and post), resolved based on context:

```typescript
// In [...slug].astro
if (pageType === 'blog-index') {
  const loader = validateAndResolve(layout, 'index');
  LayoutComponent = (await loader()).default;
} else if (pageType === 'blog-post') {
  const loader = validateAndResolve(layout, 'post');
  LayoutComponent = (await loader()).default;
}
```

## Alias Resolution

The `@` prefix is resolved by the alias system:

```typescript
'@docs/default'  → type: 'docs',  style: 'default'
'@blog/default'  → type: 'blog',  style: 'default'
'@custom/home'   → type: 'custom', style: 'home'
```

## Error Handling

The system provides descriptive errors at build time:

### Invalid Format

```
[CONFIG ERROR] Invalid layout format: "docs/default"
  Expected format: @{type}/{style}
  Examples: @docs/default, @blog/default, @custom/home
```

### Unknown Type

```
[CONFIG ERROR] Unknown layout type "pages".
  Valid types: docs, blog, custom
```

### Missing Layout

```
[CONFIG ERROR] Docs layout "doc_style99" does not exist.
  Page: docs
  Config: @docs/doc_style99
  Expected: src/layouts/docs/doc_style99/Layout.astro
  Available: default, compact
```

## Why Glob Imports?

Using `import.meta.glob()` provides:

1. **Automatic Discovery** - New layouts are found without registry updates
2. **Build-Time Validation** - Missing layouts fail at build, not runtime
3. **Code Splitting** - Only used layouts are bundled
4. **Type Safety** - Glob patterns are validated by Vite

## Adding a New Layout

To add a layout that's automatically discovered:

1. Create folder: `src/layouts/docs/doc_style3/`
2. Create file: `Layout.astro`
3. Reference in config: `layout: "@docs/doc_style3"`

No code changes required in the resolution system.

## Full Resolution Example

```yaml
# site.yaml
pages:
  docs:
    base_url: "/docs"
    type: docs
    layout: "@docs/default"
    data: "@data/docs"
```

Resolution steps:

```
1. Read config:     layout: "@docs/default"
                           │
2. Parse reference: type: "docs", style: "default"
                           │
3. Glob lookup:     docsLayouts.byStyle.get("default") → loader
                           │
4. Validate:        entry exists? ✓
                           │
5. Import:          const Layout = await loader()
                           │
6. Render:          <Layout {...props} />
```
