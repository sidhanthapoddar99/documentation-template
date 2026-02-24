---
title: Optimization Details
description: Specific optimizations applied to the rendering pipeline and their impact
---

# Optimization Details

This page documents every optimization in the cached rendering path, why it was needed, and its measured impact.

---

## Cached Request Flow

On a warm (cached) request, the server-side rendering path looks like this:

```
Request: /docs/getting-started
         │
         ▼
┌─────────────────────────────────┐
│  [...slug].astro (server mode)  │
│  ├── loadSiteConfig()           │  ◄── Map lookup (~0.01ms)
│  ├── Page matching (linear)     │  ◄── ~5-10 pages (~0.01ms)
│  ├── loadContent()              │  ◄── Map lookup (~0.01ms)
│  ├── getNavbarLayout()          │  ◄── Map lookup (~0.01ms)
│  └── getFooterLayout()          │  ◄── Map lookup (~0.01ms)
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  BaseLayout.astro               │
│  ├── loadSiteConfig()           │  ◄── Map lookup (cached)
│  ├── loadNavbarConfig()         │  ◄── Map lookup (cached)
│  ├── loadFooterConfig()         │  ◄── Map lookup (cached)
│  ├── getTheme()                 │  ◄── Map lookup (cached)
│  ├── getFavicon()               │  ◄── Map lookup (cached)
│  └── getThemeCSS()              │  ◄── Map lookup (cached)
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Layout Component               │
│  ├── loadContentWithSettings()  │  ◄── Map lookup (cached)
│  ├── buildSidebarTree()         │  ◄── Map lookup (cached)
│  └── getPrevNext()              │  ◄── Cheap tree flatten
└─────────────────────────────────┘
         │
         ▼
    Astro renders HTML (~2-5ms)
```

**Total cached response: ~4-8ms**

---

## Optimization 1: Config Caching

### Problem

`loadSiteConfig()` was called **~5 times per request** with zero caching. Each call performed:

1. `fs.existsSync()` - disk stat
2. `fs.readFileSync()` - disk read
3. `yaml.load()` - YAML parsing
4. Path resolution (aliases, theme paths, page data paths)

Same for `loadNavbarConfig()` (~2 calls) and `loadFooterConfig()` (~2 calls).

**Total: 9 YAML disk reads + parses per request.**

### Call Sites

```
[...slug].astro:
  └── loadSiteConfig()          ← 1st call
  └── getNavbarLayout()
      └── loadNavbarConfig()    ← 1st call
  └── getFooterLayout()
      └── loadFooterConfig()    ← 1st call

BaseLayout.astro:
  └── loadSiteConfig()          ← 2nd call
  └── loadNavbarConfig()        ← 2nd call
  └── loadFooterConfig()        ← 2nd call
  └── getTheme()
      └── loadSiteConfig()      ← 3rd call
  └── getFavicon()
      └── loadSiteConfig()      ← 4th call
```

### Solution

All three config loaders now use `cacheManager.getCached()` / `setCache()` with the `'config'` cache. HMR already invalidates this cache when config files change via `onFileChange()`.

```typescript
// src/loaders/config.ts
export function loadSiteConfig(): SiteConfig {
  const cached = cacheManager.getCached<...>('config', 'site');
  if (cached) {
    resolvedThemePaths = cached.themePaths;  // Restore side effect
    return cached.config;
  }
  // ... parse from disk, then cache result
}
```

**Key detail:** `loadSiteConfig()` has a side effect - it sets `resolvedThemePaths` (used by `getThemePaths()` for theme directory scanning). The cached entry stores this alongside the config so the side effect is replayed on cache hits. Without this, `resolveThemeName()` would fail because it can't find any theme directories.

### Impact

| Before | After |
|--------|-------|
| 9 YAML parses/request | 0 (Map lookups) |
| ~5-8ms overhead | <0.1ms |

---

## Optimization 2: Theme Validation Deduplication

### Problem

In dev mode, `loadThemeConfig()` calls `validateTheme()` which internally calls `loadThemeCSS()` to scan for required CSS variables. But `loadThemeConfig()` also calls `loadThemeCSS()` right after validation. This doubled the disk reads for all theme CSS files on every theme cache miss.

```typescript
// Before: CSS loaded twice on cache miss
if (import.meta.env?.DEV) {
  validateTheme(resolved.path, manifest);  // Reads CSS files internally
}
const { css, deps, perFile } = loadThemeCSS(resolved.path, manifest);  // Reads same CSS files again
```

### Solution

Load CSS first, pass it to `validateTheme()` as a parameter:

```typescript
// After: CSS loaded once, shared with validation
const { css, deps, perFile } = loadThemeCSS(resolved.path, manifest);

if (import.meta.env?.DEV) {
  validateTheme(resolved.path, manifest, css);  // Reuses already-loaded CSS
}
```

### Impact

Saves ~5-10ms on theme cache misses in dev mode (when editing theme files). No impact on cached requests since `loadThemeConfig()` result is cached.

---

## Optimization 3: HMR-Trusted Cache (No mtime Checks)

### Problem

An earlier version of `getCached()` checked file mtimes on every cache access to validate freshness. With content directories containing 50-100+ files, this added 10-15ms of `fs.statSync()` calls per cache hit.

### Solution

Since HMR already watches all content, config, and theme directories and calls `onFileChange()` / `onFileAdd()` / `onFileDelete()`, the cache trusts HMR for invalidation and skips mtime validation entirely on reads:

```typescript
// src/loaders/cache-manager.ts
export function getCached<T>(cacheName: CacheName, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) { stats.misses++; return null; }

  // Trust HMR to invalidate - no mtime check needed
  stats.hits++;
  return entry.data;
}
```

### Impact

| Before | After |
|--------|-------|
| 10-15ms mtime checks per cache hit | 0ms |

---

## Optimization 4: Selective Cache Invalidation

### Problem

A naive approach would clear all caches on any file change. This forces full rebuilds even when only a single markdown file was edited.

### Solution

`onFileChange()` detects the file type and only invalidates relevant caches:

| File Changed | Caches Cleared | Caches Preserved |
|-------------|----------------|-------------------|
| `.md` / `.mdx` | content, sidebar | theme, settings, config |
| `settings.json` | sidebar, settings | content, theme, config |
| Theme CSS | theme, combined CSS | content, sidebar, settings, config |
| `site.yaml` | config, theme | content, sidebar, settings |
| `navbar.yaml` / `footer.yaml` | config | content, sidebar, theme, settings |
| Assets (images, etc.) | (none) | All caches preserved |

### Impact

Editing a markdown file only re-parses content and rebuilds the sidebar. Theme CSS, config, and settings remain cached, saving ~10-15ms per HMR cycle.

---

## What's NOT Worth Optimizing

These areas were analyzed and determined to have negligible impact at current performance levels (4-8ms cached):

| Area | Why Not Worth It |
|------|------------------|
| `[...cached]` spread in `loadContent()` | Shallow copy of ~50-100 items is <0.1ms |
| Page lookup loop in `[...slug].astro` | Linear scan over ~5-10 pages is <0.01ms |
| `getPrevNext()` tree flattening | Single tree walk, <0.1ms |
| Map-based slug index for `content.find()` | Linear search over cached array is <0.1ms |
| Further reducing component rendering | Bottleneck is Astro's own render pipeline |

**At 4-8ms server-side, the network round trip (20-100ms+) is the dominant factor in perceived page load time.** Further server-side optimizations yield diminishing returns.
