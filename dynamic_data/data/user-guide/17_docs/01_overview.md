---
title: Docs Overview
description: Quick introduction to writing documentation
sidebar_position: 1
---

# Writing Documentation

Documentation files are MD or MDX files stored in `DATA_DIR/data/docs/`. This section covers everything you need to know to create well-organized documentation.

## Quick Reference

| Topic | Description |
|-------|-------------|
| [Structure](./structure) | Naming conventions with `XX_` prefix |
| [Folder Settings](./folder-settings) | Configure `settings.json` for each folder |
| [Frontmatter](./frontmatter) | Required and optional metadata fields |
| [Asset Embedding](./asset-embedding) | Detailed asset management for docs |

## Key Rules Summary

1. **All files and folders must have `XX_` prefix** (01-99)
2. **Every folder needs `settings.json`** (except root doc folder)
3. **Every file needs frontmatter** with at least `title`
4. **Assets folder is excluded** from sidebar indexing

## Supported File Types

| Extension | Description |
|-----------|-------------|
| `.md` | Standard Markdown |
| `.mdx` | Markdown with JSX components |

Both formats support frontmatter, code blocks, tables, and all standard Markdown features. MDX additionally supports importing and using React/Astro components.

## Example Structure

```
docs/
├── 01_getting-started/
│   ├── settings.json
│   ├── 01_overview.mdx
│   ├── 02_installation.mdx
│   └── assets/
│       └── diagram.png
│
├── 02_guides/
│   ├── settings.json
│   ├── 01_basics.mdx
│   └── 02_advanced.mdx
│
└── 03_api/
    ├── settings.json
    └── 01_endpoints.mdx
```

## Processing

Docs are processed using the `DocsParser` which:

- Parses `XX_` prefix for ordering
- Resolves assets relative to the file
- Generates clean URLs (prefix stripped)

See [Content Type Parser](/docs/architecture/parser/content-type-parser) for details.
