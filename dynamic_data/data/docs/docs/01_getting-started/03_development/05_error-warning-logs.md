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
│  ⚠ Errors & Warnings (7)                                           [Clear]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ 05_content/03_docs.md ───────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  ❌ ASSET MISSING                                          line 45    │  │
│  │     File not found: assets/basics.py                                  │  │
│  │     → Create the file or update the embed path                        │  │
│  │                                                                       │  │
│  │  ❌ ASSET MISSING                                          line 52    │  │
│  │     File not found: assets/example.py                                 │  │
│  │     → Create the file or update the embed path                        │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ 02_architecture/02_parser.md ────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  ❌ ASSET MISSING                                          line 78    │  │
│  │     File not found: assets/example.py                                 │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ 01_getting-started/02_installation.md ───────────────────────────────┐  │
│  │                                                                       │  │
│  │  ⚠ WARNING                                                            │  │
│  │     Missing 'description' in frontmatter                              │  │
│  │     → Add description for better SEO                                  │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

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
When available, the exact line number is shown so you can jump directly to the problem.

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

## Differences from Terminal Logs

| Terminal Logs | Error Logger Panel |
|---------------|-------------------|
| Shows errors as they occur | Shows all errors at once |
| Scrolls away quickly | Persistent, searchable |
| Raw format | Grouped by file |
| No suggestions | Includes fix suggestions |
| Repeats on each request | Cached, shows once |
