---
title: File Structure
description: File and folder naming conventions for documentation
---

# File & Folder Structure

All documentation files and folders must follow a specific naming convention to ensure proper ordering and URL generation.

## The `XX_` Prefix Rule

**Every file and folder MUST start with a two-digit prefix** from `01` to `99`.

```
docs/
├── 01_getting-started/
│   ├── settings.json
│   ├── 01_overview.mdx
│   ├── 02_installation.mdx
│   └── 03_configuration.mdx
│
├── 02_guides/
│   ├── settings.json
│   ├── 01_basics.mdx
│   ├── 02_advanced.mdx
│   └── 10_troubleshooting.mdx
│
└── 03_api/
    ├── settings.json
    ├── 01_overview.mdx
    └── 02_endpoints.mdx
```

## Naming Rules

| Rule | Example | Description |
|------|---------|-------------|
| **Prefix required** | `01_overview.mdx` | Files must start with `01_` to `99_` |
| **Folders need prefix** | `01_getting-started/` | Subfolders also need prefix |
| **Root folders exempt** | `docs/` | Doc root folders (defined in `site.yaml`) don't need prefix |
| **Position = order** | `01_` before `02_` | Lower numbers appear first in sidebar |
| **Clean URLs** | `01_overview.mdx` → `/overview` | Prefix is stripped from URL |

## URL Generation

The prefix is automatically stripped when generating URLs:

| File Path | Generated URL |
|-----------|---------------|
| `docs/01_getting-started/01_overview.mdx` | `/docs/getting-started/overview` |
| `docs/02_guides/05_deployment.mdx` | `/docs/guides/deployment` |
| `docs/03_api/01_endpoints.mdx` | `/docs/api/endpoints` |

## Sidebar Ordering

Files and folders are sorted by their numeric prefix:

```
01_overview.mdx      → Position 1 (first)
02_installation.mdx  → Position 2
03_configuration.mdx → Position 3
10_advanced.mdx      → Position 10
99_appendix.mdx      → Position 99 (last)
```

> **Tip:** Leave gaps in numbering (01, 05, 10, 15...) to make inserting new pages easier later.

## Build Errors

If you forget the prefix, the build will fail with an error:

```
[DOCS ERROR] Files missing required XX_ position prefix:
  - overview.mdx
  - installation.mdx

Docs files must be named with a position prefix (01-99).
Examples:
  01_getting-started.mdx
  02_installation.mdx
```

## Best Practices

1. **Use descriptive names** - `01_getting-started.mdx` not `01_gs.mdx`
2. **Keep names lowercase** - Use hyphens for spaces: `02_api-reference.mdx`
3. **Leave number gaps** - Start with 01, 05, 10 to allow insertions
4. **Match folder and content** - Folder name should reflect its contents

## Special Files

Some files don't need the `XX_` prefix:

| File | Purpose |
|------|---------|
| `settings.json` | Folder configuration |
| `assets/` | Asset folder (excluded from indexing) |
