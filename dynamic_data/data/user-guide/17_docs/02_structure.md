---
title: File Structure
description: File and folder naming conventions for documentation
sidebar_position: 2
---

# File & Folder Structure

All documentation files and folders must follow a specific naming convention to ensure proper ordering and URL generation.

## The `XX_` Prefix Rule

**Every file and folder MUST start with a two-digit prefix** from `01` to `99`.

> **Tip:** Leave gaps in numbering to make inserting new pages easier later. Choose your increment based on how many folders you expect — multiples of **5** (05, 10, 15...) for smaller sets, or **3** (03, 06, 09...) or even **2** (02, 04, 06...) for larger ones. This lets you slot new pages between existing ones without renaming everything.

```
docs/
├── 05_getting-started/
│   ├── settings.json
│   ├── 03_overview.md
│   ├── 06_installation.md
│   └── 09_configuration.md
│
├── 10_guides/
│   ├── settings.json
│   ├── 03_basics.md
│   ├── 06_advanced.md
│   └── 09_troubleshooting.md
│
└── 15_api/
    ├── settings.json
    ├── 03_overview.md
    └── 06_endpoints.md
```

## Naming Rules

| Rule | Example | Description |
|------|---------|-------------|
| **Prefix required** | `01_overview.md` | Files must start with `01_` to `99_` |
| **Folders need prefix** | `01_getting-started/` | Subfolders also need prefix |
| **Root folders exempt** | `docs/` | Doc root folders (defined in `site.yaml`) don't need prefix |
| **Position = order** | `01_` before `02_` | Lower numbers appear first in sidebar |
| **Clean URLs** | `01_overview.md` → `/overview` | Prefix is stripped from URL |

## URL Generation

The prefix is automatically stripped when generating URLs:

| File Path | Generated URL |
|-----------|---------------|
| `docs/01_getting-started/01_overview.md` | `/docs/getting-started/overview` |
| `docs/02_guides/05_deployment.md` | `/docs/guides/deployment` |
| `docs/03_api/01_endpoints.md` | `/docs/api/endpoints` |

## Sidebar Ordering

Files and folders are sorted by their numeric prefix:

```
01_overview.md      → Position 1 (first)
02_installation.md  → Position 2
03_configuration.md → Position 3
10_advanced.md      → Position 10
99_appendix.md      → Position 99 (last)
```

## Build Errors

If you forget the prefix, the build will fail with an error:

```
[DOCS ERROR] Files missing required XX_ position prefix:
  - overview.md
  - installation.md

Docs files must be named with a position prefix (01-99).
Examples:
  01_getting-started.md
  02_installation.md
```

## Special Files

Some files don't need the `XX_` prefix:

| File | Purpose |
|------|---------|
| `settings.json` | Folder configuration |
| `assets/` | Asset folder (excluded from indexing) |

## Best Practices

1. **Use descriptive names** - `01_getting-started.md` not `01_gs.md`
2. **Keep names lowercase** - Use hyphens for spaces: `02_api-reference.md`
3. **Leave number gaps** - Start with 01, 05, 10 to allow insertions
4. **Match folder and content** - Folder name should reflect its contents
