---
title: Why Caching
description: Understanding the performance problem caching solves
---

# Why Caching

## The Problem

In server mode, every page request triggers a full content reload:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WITHOUT CACHING                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Request: /docs/getting-started/overview                                   │
│                        │                                                    │
│                        ▼                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │        loadContent()                 │                                  │
│   │   pattern: '**/*.{md,mdx}'           │                                  │
│   └──────────────────────────────────────┘                                  │
│                        │                                                    │
│                        ▼                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │     Read ALL markdown files          │  ◄── Disk I/O (slow)             │
│   │     from dynamic_data/data/docs/     │                                  │
│   └──────────────────────────────────────┘                                  │
│                        │                                                    │
│                        ▼                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   Parse ALL frontmatter & content    │  ◄── CPU (repeated work)         │
│   │   Extract headings for TOC/outline   │                                  │
│   └──────────────────────────────────────┘                                  │
│                        │                                                    │
│                        ▼                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   Build sidebar tree from content    │  ◄── Tree construction           │
│   │   Read settings.json for each folder │      + filesystem reads          │
│   └──────────────────────────────────────┘                                  │
│                        │                                                    │
│                        ▼                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   Load theme CSS files               │  ◄── More disk I/O               │
│   │   Resolve theme inheritance          │                                  │
│   └──────────────────────────────────────┘                                  │
│                        │                                                    │
│                        ▼                                                    │
│              Render single page                                             │
│                                                                             │
│   Total: ~150-200ms per request                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Why Full Content Load?

The page handler needs ALL content for several features:

### 1. Sidebar Navigation
Requires the full content tree to build navigation structure.

```typescript
// Layout needs all docs for sidebar
const allContent = await loadContent(dataPath, 'docs');
const sidebarNodes = buildSidebarTree(allContent, baseUrl, dataPath);
```

### 2. Pagination
Previous/next links require knowing adjacent pages.

```typescript
// Need full list to find prev/next
const { prev, next } = getPrevNext(sidebarNodes, currentPath);
```

### 3. Content Lookup
Finding the requested document by slug.

```typescript
// Find single page from all content
const doc = allContent.find(d => d.slug === docSlug);
```

---

## The Cost

### Per-Request Work (Without Caching)

| Operation | Time | Impact |
|-----------|------|--------|
| Glob all files | ~20-30ms | Disk I/O |
| Parse markdown | ~50-100ms | CPU intensive |
| Extract headings | ~10-20ms | Per file |
| Build sidebar tree | ~10-15ms | Filesystem reads |
| Load theme CSS | ~5-10ms | Disk I/O |
| **Total** | **~150-200ms** | **Every request** |

### Real-World Impact

```
10 page navigations without cache:
  10 × 150ms = 1.5 seconds of processing

With 50 docs and 5 themes:
  50 files parsed × 10 requests = 500 parse operations
  All completely redundant after first load
```

---

## What Needs Caching

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CACHEABLE COMPONENTS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. CONTENT                                                                │
│      ├── Parsed markdown (HTML)                                             │
│      ├── Extracted headings (for TOC/outline)                               │
│      ├── Frontmatter data                                                   │
│      └── File metadata (slug, path)                                         │
│                                                                             │
│   2. SIDEBAR                                                                │
│      ├── Tree structure (sections + items)                                  │
│      ├── Folder settings (collapsed, collapsible)                           │
│      └── Position ordering                                                  │
│                                                                             │
│   3. THEME                                                                  │
│      ├── Theme configuration (manifest)                                     │
│      ├── CSS content                                                        │
│      └── Combined CSS (with inheritance)                                    │
│                                                                             │
│   4. SETTINGS                                                               │
│      ├── Content directory settings                                         │
│      └── Sidebar/outline/pagination config                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cache Invalidation Challenge

The challenge is knowing WHEN to invalidate:

| Change Type | What to Invalidate |
|-------------|-------------------|
| Edit `.md` file | Content + Sidebar |
| Add/delete `.md` file | Content + Sidebar |
| Edit `settings.json` | Sidebar + Settings |
| Edit theme CSS | Theme only |
| Edit `site.yaml` | Config + Theme |

**Solution:** Selective invalidation based on file type, handled by HMR.

---

## Performance Target

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WITH CACHING                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   FIRST REQUEST (cold)                                                      │
│   └── Full load: ~150-200ms (unavoidable)                                   │
│                                                                             │
│   SUBSEQUENT REQUESTS (warm)                                                │
│   └── Cache hit: ~5ms (97% faster)                                          │
│                                                                             │
│   10 page navigations:                                                      │
│   └── 150ms + (9 × 5ms) = 195ms total                                       │
│       vs 1,500ms without cache                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

See [Unified Cache System](./02_unified-cache-system.md) for the implementation.
