---
title: Error & Warning Logs
description: Dev toolbar for viewing document errors and warnings
---

# Error & Warning Logs

The framework includes a dev toolbar panel that displays all errors and warnings from your documentation in one place.

## Accessing the Error Logger

1. Start the dev server (`npm run start`)
2. Click the **warning icon** in the dev toolbar
3. View all errors grouped by file

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEV TOOLBAR                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [Astro]  [Inspect]  [Audit]  [Layout]  [⚠ Errors (7)]                     │
│                                              │                              │
│                                              └── Click to open panel        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Error Panel Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Issues  [3 errors] [2 warnings]                      [Copy All] [Refresh]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ @data/docs/05_content/03_docs.md ───────────────────────────────────┐   │
│  │                                                                      │   │
│  │  ❌ ASSET-MISSING                              line 45         [📋]  │   │
│  │     File not found: ./assets/basics.py                               │   │
│  │     → Create the file or update the embed path                       │   │
│  │                                                                      │   │
│  │  ❌ ASSET-MISSING                              line 52         [📋]  │   │
│  │     File not found: ./assets/example.py                              │   │
│  │     → Create the file or update the embed path                       │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─ @data/docs/01_getting-started/02_installation.md ───────────────────┐   │
│  │                                                                      │   │
│  │  ⚠ MISSING-DESCRIPTION                                        [📋]  │   │
│  │     Missing 'description' in frontmatter                             │   │
│  │     → Add description for better SEO                                 │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Cache: 2 entries | Last update: 4:08:12 PM                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Path Format

File paths use alias notation for clarity:

| Alias | Maps To |
|-------|---------|
| `@data/` | `dynamic_data/data/` (or `paths.data` in site.yaml) |
| `@config/` | `dynamic_data/config/` (or `CONFIG_DIR` in .env) |
| `@assets/` | `dynamic_data/assets/` (or `paths.assets` in site.yaml) |

## Error Types

| Type | Icon | Description |
|------|------|-------------|
| **asset-missing** | ❌ | Referenced file doesn't exist |
| **frontmatter** | ❌ | Invalid or missing required frontmatter |
| **syntax** | ❌ | Markdown/MDX syntax error |
| **warning** | ⚠ | Non-fatal issue (missing optional fields) |

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ERROR COLLECTION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Server Start                                                              │
│        │                                                                    │
│        ▼                                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   First page request triggers        │                                  │
│   │   loadContent() for all docs         │                                  │
│   └──────────────────────────────────────┘                                  │
│        │                                                                    │
│        ▼                                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   For each markdown file:            │                                  │
│   │   • Parse frontmatter                │                                  │
│   │   • Process custom tags              │                                  │
│   │   • Validate asset embeds            │                                  │
│   │   • Collect any errors               │                                  │
│   └──────────────────────────────────────┘                                  │
│        │                                                                    │
│        ▼                                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   Store in cache:                    │                                  │
│   │   • content[]                        │                                  │
│   │   • errors[]    ◄── Available to     │                                  │
│   │   • warnings[]      dev toolbar      │                                  │
│   └──────────────────────────────────────┘                                  │
│        │                                                                    │
│        ▼                                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   Dev toolbar fetches errors from    │                                  │
│   │   /api/dev/errors endpoint           │                                  │
│   │   Displays grouped by file           │                                  │
│   └──────────────────────────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Features

### Grouped by File
Errors are organized by source file, making it easy to fix issues one file at a time.

### Line Numbers
When available, the exact line number is shown (accounting for frontmatter) so you can jump directly to the problem.

### Copy Functionality

**Copy All** - Click to copy all errors as a JSON array:
```json
[
  {
    "file": "@data/docs/05_content/03_docs.md",
    "line": 45,
    "type": "asset-missing",
    "message": "File not found: ./assets/basics.py",
    "suggestion": "Create the file or update the embed path",
    "timestamp": 1706889600000
  }
]
```

**Copy Individual** - Each error has a copy button [📋] to copy that single error as JSON.

### Suggestions
Each error includes a suggested fix:

| Error | Suggestion |
|-------|------------|
| Asset missing | Create the file or update the embed path |
| Missing title | Add `title: "Page Title"` to frontmatter |
| Invalid date | Use format `YYYY-MM-DD` |

### Badge Count
The toolbar icon shows the total error count, so you can see at a glance if there are issues.

### Auto-Updates
When you fix an error and save, the panel updates automatically (via HMR).

## Common Errors & Fixes

### 1. Asset Missing

```
❌ File not found: assets/example.py
```

**Cause:** An `@embed` or asset reference points to a non-existent file.

**Fix:**
```markdown
<!-- Check the path is correct -->
@embed(./assets/example.py)    ✓ Relative to current file
@embed(assets/example.py)      ✓ Also works
@embed(/assets/example.py)     ✗ Absolute paths may fail
```

### 2. Missing Frontmatter Title

```
❌ Missing required 'title' in frontmatter
```

**Cause:** Every doc file needs a `title` field.

**Fix:**
```yaml
---
title: My Page Title    # Required
description: Optional   # Recommended for SEO
---
```

### 3. Invalid Position Prefix

```
❌ File missing XX_ position prefix
```

**Cause:** Doc files must start with a number prefix for ordering.

**Fix:**
```
✗ overview.md
✓ 01_overview.md
```

### 4. Settings.json Missing

```
⚠ Folder missing settings.json
```

**Cause:** Doc folders need a `settings.json` for sidebar labels.

**Fix:**
```json
{
  "label": "Getting Started",
  "isCollapsible": true,
  "collapsed": false
}
```

## Suppressing Warnings

For intentional warnings you want to ignore, add to frontmatter:

```yaml
---
title: Draft Page
suppress_warnings:
  - missing-description
  - draft-mode
---
```

## Code Location

The error logger is implemented in:

```
src/
├── loaders/
│   ├── data.ts           # Error collection during parsing
│   └── cache.ts          # Error storage in cache
│
├── pages/
│   └── api/dev/
│       └── errors.ts     # API endpoint for fetching errors
│
└── dev-toolbar/
    ├── integration.ts    # Registers error logger app
    └── error-logger.ts   # UI implementation
```

## API Endpoint

Errors are available via `/api/dev/errors` (dev mode only):

```json
{
  "errors": [
    {
      "file": "@data/docs/05_content/03_docs.md",
      "line": 45,
      "type": "asset-missing",
      "message": "File not found: ./assets/basics.py",
      "suggestion": "Create the file or update the embed path",
      "timestamp": 1706889600000
    }
  ],
  "warnings": [],
  "stats": {
    "initialized": true,
    "entryCount": 2,
    "errorCount": 1,
    "warningCount": 0,
    "lastUpdate": 1706889600000
  }
}
```

## Differences from Terminal Logs

| Terminal Logs | Error Logger Panel |
|---------------|-------------------|
| Shows errors as they occur | Shows all errors at once |
| Scrolls away quickly | Persistent, copyable |
| Raw format | Grouped by file with alias paths |
| No suggestions | Includes fix suggestions |
| Repeats on each request | Cached, shows once |
| No line numbers | Accurate line numbers (with frontmatter offset) |
