---
title: Server vs Static Mode
description: Understanding Astro's rendering modes and how they affect development features
---

# Server vs Static Mode

The layout switcher requires **server mode** to function during development. This page explains the technical reasoning and configuration.

## The Problem

Astro's default **static mode** pre-renders all pages at build time. While this is excellent for production (fast, cacheable HTML), it creates a limitation:

**Query parameters (`?layout=compact`) are not available during static rendering.**

In static mode:
- `Astro.url.searchParams` is empty (params stripped)
- Middleware doesn't intercept page requests
- Pages are served as pre-built HTML

## The Solution

We use **server mode** (`output: 'server'`) which enables:

1. **On-demand rendering** - Pages render per-request
2. **Middleware execution** - Can intercept and modify requests
3. **Query parameter access** - Full URL available including `?layout=`

### Configuration (`astro.config.mjs`)

```javascript
export default defineConfig({
  output: 'server',  // Enables middleware and on-demand rendering
  integrations: [
    mdx(),
    devToolbarIntegration(),
  ],
  // ... rest of config
});
```

## How Middleware Works

With server mode, middleware runs for every request:

```typescript
// src/middleware.ts
export const onRequest = defineMiddleware(async (context, next) => {
  if (import.meta.env.DEV) {
    // context.url has FULL request URL including query params
    const layoutOverride = context.url.searchParams.get('layout');
    if (layoutOverride) {
      context.locals.layoutOverride = layoutOverride;
    }
  }
  return next();
});
```

The middleware:
1. Intercepts the HTTP request
2. Extracts `?layout=` from query string
3. Passes it to the page via `context.locals`
4. Page reads `Astro.locals.layoutOverride` and applies the layout

## Dynamic Props Loading

In static mode, `getStaticPaths()` pre-computes all page props at build time. In server mode, this function is **ignored** - we must compute props on each request.

The page handles both modes:

```typescript
// Check if props came from getStaticPaths (static) or need computing (server)
let { pageType, doc, ... } = Astro.props;

if (!pageType) {
  // Server mode: compute props from URL
  const slug = Astro.params.slug || '';
  const siteConfig = loadSiteConfig();

  // Match URL to page config
  for (const [name, config] of Object.entries(siteConfig.pages)) {
    if (slug.startsWith(config.base_url)) {
      // Load content dynamically
      const content = await loadContent(dataPath, 'docs', { ... });
      // Set pageType, doc, etc.
    }
  }
}
```

## Production Considerations

Server mode means pages render on-demand, which requires:

### Option 1: Server Adapter

For production with server rendering, add an adapter:

```bash
npm install @astrojs/node
```

```javascript
// astro.config.mjs
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
```

### **Option 2: Static Production Build (Currently Implemented)**

If you want static production builds, you can:

1. Use `output: 'static'` for production
2. Accept that layout switcher only works in dev
3. Configure via environment:

```javascript
// astro.config.mjs
export default defineConfig({
  output: process.env.NODE_ENV === 'production' ? 'static' : 'server',
});
```

## Comparison Table

| Feature | Static Mode | Server Mode |
|---------|-------------|-------------|
| Build output | Pre-rendered HTML | On-demand rendering |
| Query params | Not available | Full access |
| Middleware | Limited | Full support |
| Layout switcher | Does not work | Works |
| Performance | Fastest (CDN) | Requires server |
| Hosting | Any static host | Node.js server |

## Debugging

If layout switching isn't working, check the terminal for:

```
[middleware] URL: http://localhost:4321/docs/page?layout=compact | layout: compact
```

If you don't see this log, middleware isn't running (likely static mode).
