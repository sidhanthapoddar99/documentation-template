---
title: Load Content Caching
description: Performance optimization for content loading in server mode
---

# Load Content Caching

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
│   │   Process custom tags/embeds for ALL │  ◄── Triggers errors for         │
│   └──────────────────────────────────────┘      missing assets everywhere   │
│                        │                                                    │
│                        ▼                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   Find requested page in results     │                                  │
│   │   Build sidebar from all content     │                                  │
│   └──────────────────────────────────────┘                                  │
│                        │                                                    │
│                        ▼                                                    │
│              Render single page                                             │
│                                                                             │
│   Measured: ~178ms+ per request                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why This Happens

The page handler needs ALL content for:
- **Sidebar navigation** - requires full content tree
- **Pagination** - needs prev/next pages
- **Content lookup** - finds requested doc by slug

```typescript
// src/pages/[...slug].astro (server mode branch)
const content = await loadContent(dataPath, {
  pattern: '**/*.{md,mdx}',  // Loads EVERYTHING
  sort: 'position',
});
allContent = content;  // Used for sidebar, pagination
doc = content.find(d => d.slug === docSlug);  // Find single page
```

---

## The Solution

Cache loaded content in memory with error tracking:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WITH CACHING                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   FIRST REQUEST: /docs/getting-started/overview                             │
│                        │                                                    │
│                        ▼                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   Cache miss → loadContent()         │                                  │
│   │   Read & parse all files             │  ~178ms                          │
│   │   Extract headings (for TOC/outline) │                                  │
│   │   Compute file hashes                │                                  │
│   │   Collect errors during processing   │                                  │
│   │   Store everything in memory cache   │                                  │
│   └──────────────────────────────────────┘                                  │
│                        │                                                    │
│                        ▼                                                    │
│              Render page                                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   SUBSEQUENT REQUESTS: /docs/any/other/page                                 │
│                        │                                                    │
│                        ▼                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   Cache hit → return cached content  │  ~5ms                            │
│   │   No disk I/O                        │                                  │
│   │   No parsing                         │                                  │
│   │   Headings already extracted         │                                  │
│   │   Errors already collected           │                                  │
│   └──────────────────────────────────────┘                                  │
│                        │                                                    │
│                        ▼                                                    │
│              Render page                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Measured Performance

| Metric | Without Cache | With Cache | Improvement |
|--------|---------------|------------|-------------|
| **First request** | ~178ms | ~178ms | Same (cold start) |
| **Subsequent requests** | ~178ms | **~5ms** | **97% faster** |
| **File reads per request** | All files | 0 | 100% reduction |
| **Sidebar tree build** | ~10-16ms | **~1ms** | **90% faster** |
| **settings.json reads** | Per folder | 0 (cached) | 100% reduction |

### Real-World Impact

```
Without cache:  10 page navigations = 10 × 178ms = 1.78 seconds
With cache:     10 page navigations = 178ms + (9 × 5ms) = 223ms
                                                          └── 87% faster overall
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CACHING ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│   │   Page Request  │────▶│  loadContent()  │────▶│  Cache Check    │       │
│   │   [...slug]     │     │  src/loaders/   │     │                 │       │
│   └─────────────────┘     │  data.ts        │     └────────┬────────┘       │
│                           └─────────────────┘              │                │
│                                                            │                │
│                                    ┌───────────────────────┴───────┐        │
│                                    ▼                               ▼        │
│                           ┌─────────────┐                 ┌─────────────┐   │
│                           │ Cache HIT   │                 │ Cache MISS  │   │
│                           │ Return data │                 │ Load files  │   │
│                           │ (~5ms)      │                 │ Parse MD    │   │
│                           └─────────────┘                 │ Collect err │   │
│                                                           │ Store cache │   │
│                                                           │ (~178ms)    │   │
│                                                           └─────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CACHE STRUCTURE (src/loaders/cache.ts)                                    │
│                                                                             │
│   ContentCacheState {                                                       │
│     entries: Map<cacheKey, {                                                │
│       content: LoadedContent[]     // All parsed markdown + headings        │
│       fileHashes: Map<path, hash>  // For cache tracking                    │
│       timestamp: number            // When cached                           │
│     }>                                                                      │
│     errors: ContentError[]         // All errors found                      │
│     warnings: ContentWarning[]     // All warnings found                    │
│   }                                                                         │
│                                                                             │
│   LoadedContent includes:                                                   │
│     content: string        // Rendered HTML                                 │
│     headings: Heading[]    // Extracted for TOC/outline                     │
│     data: {...}            // Frontmatter                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cache Structure

```typescript
// src/loaders/cache.ts

interface ContentCacheState {
  entries: Map<string, CacheEntry>;  // Cached content by path
  errors: ContentError[];            // All errors encountered
  warnings: ContentWarning[];        // Non-fatal issues
  initialized: boolean;              // Cache has been populated
  lastUpdate: number;                // Timestamp of last update
}

interface CacheEntry {
  content: LoadedContent[];          // Parsed markdown + headings
  timestamp: number;                 // When entry was created
  fileHashes: Map<string, string>;   // MD5 hash per file
}

// LoadedContent includes headings extracted during parsing
interface LoadedContent {
  id: string;
  slug: string;
  content: string;                   // Rendered HTML
  headings: Heading[];               // Extracted for TOC/outline
  data: ContentData;                 // Frontmatter
  filePath: string;
  relativePath: string;
}

interface Heading {
  depth: number;    // 1-6 (h1-h6)
  slug: string;     // URL-safe ID
  text: string;     // Heading text
}

interface ContentError {
  file: string;          // 'docs/05_content/03_docs.md'
  line?: number;         // Line number if applicable
  type: ErrorType;       // 'asset-missing' | 'frontmatter' | 'syntax'
  message: string;       // Human-readable description
  suggestion?: string;   // How to fix it
  timestamp: number;     // When error was recorded
}
```

---

## Files Modified

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FILES IMPLEMENTED                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   src/                                                                      │
│   ├── loaders/                                                              │
│   │   ├── cache.ts             ◄── NEW: Cache manager (globalThis shared)   │
│   │   ├── data.ts              ◄── MODIFIED: Integrated caching             │
│   │   └── index.ts             ◄── MODIFIED: Export cache utilities         │
│   │                                                                         │
│   ├── pages/                                                                │
│   │   ├── [...slug].astro      ◄── MODIFIED: Skip api routes                │
│   │   └── api/dev/                                                          │
│   │       └── errors.ts        ◄── NEW: API endpoint for errors             │
│   │                                                                         │
│   ├── parsers/                                                              │
│   │   └── preprocessors/                                                    │
│   │       └── asset-embed.ts   ◄── MODIFIED: Collect asset errors           │
│   │                                                                         │
│   └── dev-toolbar/                                                          │
│       ├── integration.ts       ◄── MODIFIED: HMR reads .env, watches        │
│       │                             add/delete/change events                 │
│       └── error-logger.ts      ◄── NEW: Error panel UI                      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ALSO CACHED:                                                              │
│   └── src/hooks/useSidebar.ts                ◄── Sidebar tree + folder      │
│                                                   settings + folder lookups  │
│                                                   (invalidated on HMR)       │
│                                                                             │
│   UNCHANGED (transparent integration):                                      │
│   ├── src/layouts/docs/components/sidebar/   ◄── No changes needed          │
│   └── src/layouts/navbar/                    ◄── No changes needed          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Watching

HMR reads paths from `.env` and watches all configured directories:

```bash
# .env - Paths can be relative or absolute
DATA_DIR=./dynamic_data/data       # Docs, blog content
CONFIG_DIR=./dynamic_data/config   # Site config, navbar, footer
ASSETS_DIR=./dynamic_data/assets   # Images, logos
THEMES_DIR=./dynamic_data/themes   # Theme CSS and config
```

```typescript
// src/dev-toolbar/integration.ts
// Reads .env directly to get configured paths
const watchPaths = getWatchPaths(); // [DATA_DIR, CONFIG_DIR, ASSETS_DIR, THEMES_DIR]

// Ignore temp/system files
const ignoreExtensions = ['.DS_Store', '.gitkeep', '.tmp', '.swp', '.bak'];
```

**Watched events:**
- File changes (content edits)
- File additions (new docs/assets)
- File deletions (removed files)

### Multi-Level Caching

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MULTI-LEVEL CACHING                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Layout.astro                                                              │
│        │                                                                    │
│        ▼                                                                    │
│   loadContent(dataPath)  ──────▶  Check cache  ──┬──▶  Return cached        │
│        │                               │         │     (5ms)                │
│        │                               ▼         │                          │
│        │                          Cache miss?    │                          │
│        │                               │         │                          │
│        │                               ▼         │                          │
│        │                          Read files  ───┘                          │
│        │                          Store in cache                            │
│        │                          (178ms)                                   │
│        ▼                                                                    │
│   buildSidebarTree()  ─────────▶  Check cache  ──┬──▶  Return cached tree   │
│                                        │         │     (~1ms)               │
│                                        ▼         │                          │
│                                   Cache miss?    │                          │
│                                        │         │                          │
│                                        ▼         │                          │
│                                   Build tree  ───┘                          │
│                                   Cache settings.json                       │
│                                   Cache folder lookups                      │
│                                   Store tree (~10ms)                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sidebar Caching (useSidebar.ts)

The sidebar tree builder has its own cache layer:

```typescript
// Three caches using globalThis for persistence:

1. Sidebar Tree Cache
   - Caches the full SidebarNode[] structure
   - Invalidates when content slugs change
   - Key: dataPath + basePath

2. Folder Settings Cache
   - Caches settings.json per folder
   - Avoids repeated disk reads

3. Folder Lookup Cache
   - Caches directory listings (fs.readdirSync)
   - Maps clean names → actual folder names with XX_ prefix
```

Console output shows cache status:
```
[SIDEBAR CACHE HIT] /path/to/docs:/docs    ← Instant return
[SIDEBAR CACHE MISS] /path/to/docs:/docs   ← Building tree
[SIDEBAR CACHE SET] /path/to/docs:/docs    ← Cached for next request
```

---

## Error Logger Dev Toolbar

A new dev toolbar panel displays all cached errors:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ERROR LOGGER DEV TOOLBAR                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Issues   [3 errors]  [12 warnings]                      [Refresh]  │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │                                                                     │   │
│   │  ┌─ content/03_docs.md ─────────────────────────────────────────┐   │   │
│   │  │  ❌ ASSET-MISSING                                            │   │   │
│   │  │     File not found: ./assets/basics.py                       │   │   │
│   │  │     → Create the file or update the embed path               │   │   │
│   │  └──────────────────────────────────────────────────────────────┘   │   │
│   │                                                                     │   │
│   │  ┌─ getting-started/02_installation.md ─────────────────────────┐   │   │
│   │  │  ⚠ MISSING-DESCRIPTION                                       │   │   │
│   │  │     Missing 'description' in frontmatter                     │   │   │
│   │  │     → Add description for better SEO                         │   │   │
│   │  └──────────────────────────────────────────────────────────────┘   │   │
│   │                                                                     │   │
│   │  Cache: 2 entries | Last update: 4:08:12 PM                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Endpoint

Errors are exposed via `/api/dev/errors`:

```json
{
  "errors": [
    {
      "file": "content/03_docs.md",
      "type": "asset-missing",
      "message": "File not found: ./assets/basics.py",
      "suggestion": "Create the file or update the embed path",
      "timestamp": 1706889600000
    }
  ],
  "warnings": [...],
  "stats": {
    "initialized": true,
    "entryCount": 2,
    "errorCount": 3,
    "warningCount": 12,
    "lastUpdate": 1706889600000
  }
}
```

---

## Trade-offs

### Pros
- **97% faster** subsequent page loads (5ms vs 178ms)
- Reduces disk I/O and CPU usage
- **Headings extracted once** - TOC/outline uses cached headings, no re-parsing
- **Sidebar tree cached** - No repeated tree building or settings.json reads
- Better dev experience when testing layouts
- Centralized error visibility in dev toolbar

### Cons
- Increased memory usage (cached content + sidebar trees)
- First request still takes ~178ms (cold start)
- Cache persists until server restart (no auto-invalidation yet)
