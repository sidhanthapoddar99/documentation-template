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
@docs/default            ────▶      src/layouts/docs/styles/default/Layout.astro
@blog/default            ────▶      src/layouts/blogs/styles/default/*.astro
@custom/home             ────▶      src/layouts/custom/styles/home/Layout.astro
```

## Path Pattern

All layout types follow a standardized path pattern:

```
src/layouts/{type}/styles/{style}/Layout.astro
```

| Component | Description | Examples |
|-----------|-------------|----------|
| `{type}` | Layout category | `docs`, `blogs`, `custom` |
| `{style}` | Style variant | `default`, `compact`, `home` |

## Resolution in `[...slug].astro`

The dynamic route handler resolves layouts using glob imports:

```typescript
// Auto-discover all available layouts
const docsLayouts = import.meta.glob(
  '/src/layouts/docs/styles/*/Layout.astro'
);

const blogIndexLayouts = import.meta.glob(
  '/src/layouts/blogs/styles/*/IndexLayout.astro'
);

const blogPostLayouts = import.meta.glob(
  '/src/layouts/blogs/styles/*/PostLayout.astro'
);

const customLayouts = import.meta.glob(
  '/src/layouts/custom/styles/*/Layout.astro'
);
```

### Resolution Function

```typescript
function resolveLayout(layoutRef: string, pageType: string) {
  // Parse the reference: "@docs/default"
  const match = layoutRef.match(/^@(\w+)\/(\w+)$/);
  if (!match) {
    throw new Error(`Invalid layout reference: ${layoutRef}`);
  }

  const [, type, style] = match;

  // Map type to layout collection
  const layoutMap = {
    docs: docsLayouts,
    blog: blogIndexLayouts,  // or blogPostLayouts based on context
    custom: customLayouts,
  };

  const layouts = layoutMap[type];
  if (!layouts) {
    throw new Error(`Unknown layout type: ${type}`);
  }

  // Build expected path
  const expectedPath = `/src/layouts/${type}/styles/${style}/Layout.astro`;

  // Check if layout exists
  if (!layouts[expectedPath]) {
    const available = Object.keys(layouts)
      .map(p => p.match(/styles\/(\w+)\//)?.[1])
      .filter(Boolean);

    throw new Error(
      `Layout "${style}" not found for type "${type}". ` +
      `Available: ${available.join(', ')}`
    );
  }

  return layouts[expectedPath];
}
```

## Blog Layout Special Case

Blog pages have two layouts (index and post), resolved based on context:

```typescript
// In [...slug].astro getStaticPaths()
if (pageConfig.type === 'blog') {
  const posts = await loadContent(dataPath, 'blog');

  // Index page uses IndexLayout
  paths.push({
    params: { slug: baseUrl },
    props: {
      layout: resolveLayout(pageConfig.layout, 'blog-index'),
      // ...
    }
  });

  // Each post uses PostLayout
  for (const post of posts) {
    paths.push({
      params: { slug: `${baseUrl}/${post.slug}` },
      props: {
        layout: resolveLayout(pageConfig.layout, 'blog-post'),
        // ...
      }
    });
  }
}
```

## Alias Resolution

The `@` prefix is resolved by the alias system:

```typescript
// src/loaders/alias.ts
export function getLayoutType(layoutRef: string): string | null {
  const match = layoutRef.match(/^@(\w+)\//);
  return match ? match[1] : null;
}

// Mapping
'@docs/default'  → type: 'docs',  style: 'default'
'@blog/default' → type: 'blog',  style: 'default'
'@custom/home'      → type: 'custom', style: 'home'
```

## Error Handling

The system provides descriptive errors at build time:

### Invalid Format

```
[LAYOUT ERROR] Invalid layout reference format.
  Value: "docs/default"
  Expected: "@type/style" (e.g., "@docs/default")
```

### Unknown Type

```
[LAYOUT ERROR] Unknown layout type "pages".
  Valid types: docs, blog, custom
```

### Missing Layout

```
[LAYOUT ERROR] Docs layout "doc_style99" does not exist.
  Page: docs
  Config: @docs/doc_style99
  Expected: src/layouts/docs/styles/doc_style99/Layout.astro
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

1. Create folder: `src/layouts/docs/styles/doc_style3/`
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
3. Build path:      /src/layouts/docs/styles/default/Layout.astro
                           │
4. Glob lookup:     docsLayouts[path] → Component
                           │
5. Validate:        Component exists? ✓
                           │
6. Import:          const Layout = await docsLayouts[path]()
                           │
7. Render:          <Layout {...props} />
```
