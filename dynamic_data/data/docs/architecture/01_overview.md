---
title: Architecture Overview
description: Understanding the core architecture of the documentation framework
---

# Architecture Overview

This documentation framework is built on a modular architecture that separates concerns into distinct layers: configuration, parsing, layouts, and rendering.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Space                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │   Config   │  │    Data    │  │   Theme    │  │  Assets   │  │
│  │   (YAML)   │  │ (MD/MDX)   │  │   (YAML)   │  │  (files)  │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘  │
└────────┼───────────────┼───────────────┼───────────────┼────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Parser Layer                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Modular Parser System                   │   │
│  │  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ Preprocessors │  │   Renderer   │  │Postprocessors│   │   │
│  │  │ (asset embed) │  │   (marked)   │  │ (heading IDs)│   │   │
│  │  └───────────────┘  └──────────────┘  └──────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │  Content-Type Parsers (DocsParser, BlogParser)   │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Layout Layer                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Dynamic Layout Resolution                   │   │
│  │     @docs/style1 → layouts/docs/styles/style1/           │   │
│  │     @blogs/style1 → layouts/blogs/styles/style1/         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Render Layer                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   [...slug].astro                        │   │
│  │             Single entry point for all routes            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

When a user visits `/docs/getting-started/overview`:

1. **Route Matching**: `[...slug].astro` catches the route
2. **Config Lookup**: Find page config matching `/docs` base URL
3. **Parser Selection**: Get appropriate parser (DocsParser for docs)
4. **Content Loading**: Load and parse MDX from `data/docs/getting-started/`
5. **Pipeline Processing**: Run preprocessors → render → postprocessors
6. **Layout Resolution**: Resolve `@docs/doc_style1` to component path
7. **Rendering**: Layout component renders with processed content

## Core Modules

### Loaders (`src/loaders/`)

| Module | Purpose |
|--------|---------|
| `paths.ts` | Path resolution and alias mapping |
| `config.ts` | Site and page configuration loading |
| `data.ts` | Content loading orchestration |
| `alias.ts` | Layout and data path alias resolution |

### Parsers (`src/parsers/`)

| Module | Purpose |
|--------|---------|
| `core/` | Base parser classes and pipeline |
| `preprocessors/` | Run before markdown rendering |
| `renderers/` | Markdown to HTML conversion |
| `transformers/` | Custom tag transformation |
| `postprocessors/` | Run after HTML rendering |
| `content-types/` | DocsParser, BlogParser |

### Custom Tags (`src/custom-tags/`)

| Tag | Purpose |
|-----|---------|
| `<callout>` | Styled admonition boxes |
| `<tabs>` | Tabbed content interfaces |
| `<collapsible>` | Expandable sections |

## Core Principles

### 1. Convention Over Configuration

File structure determines behavior automatically:

```
data/docs/
├── getting-started/
│   ├── settings.json    # Section configuration
│   ├── 01_overview.md   # Position 1
│   └── 02_install.md    # Position 2
```

No manual sidebar configuration required.

### 2. Modular Parser Pipeline

Content flows through a configurable pipeline:

```
    Raw Markdown
         │
         ▼
┌─────────────────┐
│  Preprocessors  │  ← Asset embedding [[path]]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Renderer     │  ← Marked (Markdown → HTML)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Postprocessors  │  ← Heading IDs, external links
└────────┬────────┘
         │
         ▼
   Rendered HTML
```

### 3. Content-Type Specific Parsing

Different content types have different rules:

| Feature | Docs | Blog |
|---------|------|------|
| Naming | `XX_name.md` (position prefix) | `YYYY-MM-DD-name.md` (date) |
| Structure | Nested folders | Flat |
| Assets | `./assets/` relative | `assets/<filename>/` central |

### 4. Strict Validation

The system fails fast with clear error messages:

```
[DOCS ERROR] Files missing required XX_ position prefix:
  - overview.md
  - installation.md

Docs files must be named with a position prefix (01-99).
```

### 5. Zero Runtime Configuration

All configuration resolves at build time:
- No client-side config loading
- No runtime environment checks
- Fully static output

## Directory Structure

```
src/
├── loaders/           # Data and config loading
│   ├── paths.ts       # Path resolution
│   ├── config.ts      # Configuration loading
│   ├── data.ts        # Content loading
│   └── alias.ts       # Alias resolution
│
├── parsers/           # Modular parser system
│   ├── core/          # Pipeline and base parser
│   ├── preprocessors/ # Asset embedding
│   ├── renderers/     # Markdown rendering
│   ├── transformers/  # Custom tag transforms
│   ├── postprocessors/# Heading IDs, links
│   └── content-types/ # Docs/Blog parsers
│
├── custom-tags/       # Custom HTML tag transformers
│   ├── callout.ts
│   ├── tabs.ts
│   └── collapsible.ts
│
├── layouts/           # Layout components
│   ├── docs/          # Documentation layouts
│   ├── blogs/         # Blog layouts
│   └── custom/        # Custom page layouts
│
└── pages/
    └── [...slug].astro # Single route handler
```
