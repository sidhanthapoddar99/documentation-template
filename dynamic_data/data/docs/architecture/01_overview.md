---
title: Architecture Overview
description: How the documentation system works
---

# Architecture Overview

Understanding the core architecture helps you extend and customize the template effectively.

## System Design

The template follows a clear separation:

```
┌─────────────────────────────────────────────────────────┐
│                    User Space                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Config  │  │   Data   │  │  Theme   │              │
│  │  (YAML)  │  │  (MDX)   │  │  (YAML)  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼─────────────┼─────────────┼─────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                    Loader Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Config  │  │   Data   │  │  Theme   │              │
│  │  Loader  │  │  Loader  │  │  Loader  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼─────────────┼─────────────┼─────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                    Layout Layer                          │
│  ┌──────────────────────────────────────────┐          │
│  │         Dynamic Layout Resolution         │          │
│  │  @docs/style → layouts/docs/styles/style │          │
│  └────────────────────┬─────────────────────┘          │
└───────────────────────┼─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Render Layer                          │
│  ┌──────────────────────────────────────────┐          │
│  │           [...slug].astro                 │          │
│  │    Single entry point for all routes      │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

## Request Flow

When a user visits `/docs/getting-started/overview`:

1. **Route Matching**: `[...slug].astro` catches all routes
2. **Config Lookup**: Find which page config matches `/docs`
3. **Layout Resolution**: Resolve `@docs/doc_style1` to actual component
4. **Data Loading**: Load MDX content from `data/docs/getting-started/`
5. **Rendering**: Layout component renders with content as props

## Core Principles

### 1. Convention Over Configuration

File and folder structure determines behavior:

```
data/docs/
├── getting-started/     # Section in sidebar
│   ├── settings.json    # Section label & behavior
│   ├── 01_overview.mdx  # First item
│   └── 02_install.mdx   # Second item
```

No need to manually configure sidebar entries.

### 2. Strict Validation

The system fails fast with clear errors:

```
[CONFIG ERROR] Docs layout "invalid" does not exist.
  Page: docs
  Expected: src/layouts/docs/styles/invalid/Layout.astro
  Available: doc_style1, doc_style2
```

No silent fallbacks that hide mistakes.

### 3. Modular Components

Layouts are composed of interchangeable components:

```
Layout.astro
├── imports Body from components/body/default/
├── imports Sidebar from components/sidebar/default/
└── imports Outline from components/outline/default/
```

Create new styles by mixing different components.

### 4. Zero Runtime Config

All configuration is resolved at build time:
- No client-side config loading
- No runtime environment checks
- Fully static output

## Key Subsystems

### Config Loader

Reads and validates `site.yaml`:
- Parses YAML configuration
- Resolves path aliases (`@data/`, `@assets/`)
- Validates required fields
- Returns typed configuration objects

### Data Loader

Loads and transforms content:
- Discovers files matching patterns
- Parses MDX frontmatter
- Extracts position from `XX_` prefixes
- Builds sidebar tree structure
- Validates required fields

### Theme Loader

Processes theme customization:
- Reads `colors.yaml`
- Merges with default values
- Generates CSS custom properties
- Supports light/dark modes

### Layout System

Resolves and renders layouts:
- Maps aliases to file paths
- Uses `import.meta.glob` for discovery
- Validates existence at build time
- Passes props to layout components
