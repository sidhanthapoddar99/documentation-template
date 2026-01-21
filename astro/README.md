# Astro Documentation Framework

A custom, modular documentation framework built with Astro. Designed for flexibility, performance, and complete control over your documentation site.

## Table of Contents

- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Configuration](#configuration)
- [Rendering Flow](#rendering-flow)
- [Directory Details](#directory-details)
- [Getting Started](#getting-started)

---

## Project Structure

```
/documentation-template/
│
├── docs/                        # Content lives OUTSIDE astro (configurable)
│   ├── getting-started/
│   │   └── index.mdx
│   ├── guides/
│   │   ├── installation.mdx
│   │   └── configuration.mdx
│   └── api/
│       └── reference.mdx
│
├── astro/                       # Astro application
│   ├── src/
│   │   ├── components/          # UI Components
│   │   │   ├── navbar/
│   │   │   │   ├── NavbarStyle1/
│   │   │   │   │   ├── NavbarStyle1.astro
│   │   │   │   │   └── NavbarStyle1.css
│   │   │   │   ├── NavbarStyle2/
│   │   │   │   │   ├── NavbarStyle2.astro
│   │   │   │   │   └── NavbarStyle2.css
│   │   │   │   └── index.ts
│   │   │   ├── footer/
│   │   │   │   ├── FooterDefault/
│   │   │   │   └── index.ts
│   │   │   ├── sidebar/
│   │   │   │   ├── Sidebar.astro
│   │   │   │   ├── SidebarItem.astro
│   │   │   │   └── index.ts
│   │   │   └── outline/
│   │   │       ├── Outline.astro
│   │   │       └── index.ts
│   │   │
│   │   ├── mdx_elements/        # MDX-specific components
│   │   │   ├── Card/
│   │   │   │   ├── Card.astro
│   │   │   │   └── Card.css
│   │   │   ├── CodeBlock/
│   │   │   │   ├── CodeBlock.astro
│   │   │   │   ├── CollapsibleCodeBlock.astro
│   │   │   │   └── CodeBlock.css
│   │   │   ├── Callout/
│   │   │   │   ├── Callout.astro
│   │   │   │   └── Callout.css
│   │   │   ├── Tabs/
│   │   │   │   ├── Tabs.astro
│   │   │   │   └── TabItem.astro
│   │   │   └── index.ts
│   │   │
│   │   ├── theme/               # Centralized styling system
│   │   │   ├── colors.css       # Color variables (light/dark)
│   │   │   ├── text.css         # Typography (fonts, sizes)
│   │   │   ├── text_md.css      # Markdown-specific typography
│   │   │   ├── elements.css     # UI element base styles
│   │   │   └── index.css        # Master import file
│   │   │
│   │   ├── layouts/             # Page layouts
│   │   │   ├── BaseLayout.astro # Root layout (html, head, body)
│   │   │   ├── home/
│   │   │   │   ├── HomeLayout1/
│   │   │   │   │   ├── HomeLayout1.astro
│   │   │   │   │   └── HomeLayout1.css
│   │   │   │   ├── HomeLayout2/
│   │   │   │   └── index.ts
│   │   │   ├── docs/
│   │   │   │   ├── DocsLayout.astro
│   │   │   │   ├── DocsLayout.css
│   │   │   │   └── index.ts
│   │   │   ├── blog/
│   │   │   │   ├── BlogLayout.astro
│   │   │   │   └── index.ts
│   │   │   └── roadmap/
│   │   │       ├── RoadmapLayout.astro
│   │   │       └── index.ts
│   │   │
│   │   ├── modules/             # Feature modules
│   │   │   ├── search/
│   │   │   │   ├── SearchModal.astro
│   │   │   │   ├── search.ts
│   │   │   │   └── index.ts
│   │   │   ├── ai/
│   │   │   │   └── index.ts
│   │   │   └── analytics/
│   │   │       └── index.ts
│   │   │
│   │   └── pages/               # Route definitions
│   │       ├── index.astro          # Homepage
│   │       ├── docs/
│   │       │   └── [...slug].astro  # Dynamic doc routes
│   │       └── blog/
│   │           ├── index.astro
│   │           └── [...slug].astro
│   │
│   ├── public/                  # Static assets
│   │   ├── fonts/
│   │   └── images/
│   │
│   ├── astro.config.mjs         # Astro configuration
│   ├── .env                     # Environment variables (gitignored)
│   ├── .env.example             # Environment template
│   ├── package.json
│   └── tsconfig.json
```

---

## Architecture Overview

### Design Principles

1. **Separation of Content and Code**: Documentation content lives outside the Astro folder, making it easy to manage, version, and migrate.

2. **Modular Components**: Every component has variants (Style1, Style2) allowing easy theming without code changes.

3. **Centralized Theming**: All styles flow through the `theme/` directory with CSS variables for easy customization.

4. **Layout Composition**: Pages are composed of layouts which contain components, creating a clear hierarchy.

### Component Hierarchy

```
BaseLayout (html, head, body, global styles)
└── Navbar (configurable style)
└── PageLayout (home/docs/blog/roadmap)
    ├── Sidebar (for docs)
    ├── Content (MDX rendered)
    └── Outline/TOC (for docs)
└── Footer (configurable style)
```

---

## Configuration

### Environment Variables

The docs path is configured via environment variables. This allows:
- Relative paths (relative to astro folder)
- Absolute paths (anywhere on filesystem)
- Different paths per environment (dev/prod)

#### `.env` File

```bash
# Documentation Content Path
# Can be relative to astro folder or absolute path

# Relative path (recommended for portability)
DOCS_PATH=../docs

# OR absolute path
# DOCS_PATH=/home/user/projects/my-docs

# Site Configuration
SITE_URL=http://localhost:4321
SITE_TITLE=My Documentation
SITE_DESCRIPTION=Documentation for my project

# Feature Flags
ENABLE_SEARCH=true
ENABLE_AI_ASSISTANT=false
ENABLE_ANALYTICS=false

# Analytics (if enabled)
# ANALYTICS_ID=G-XXXXXXXXXX
```

#### Using in Astro Config

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import path from 'path';

const docsPath = process.env.DOCS_PATH || '../docs';
const resolvedDocsPath = path.isAbsolute(docsPath)
  ? docsPath
  : path.resolve(process.cwd(), docsPath);

export default defineConfig({
  site: process.env.SITE_URL,
  // ... config using resolvedDocsPath
});
```

#### Using in Components

```astro
---
// In any .astro file
const docsPath = import.meta.env.DOCS_PATH;
const siteTitle = import.meta.env.SITE_TITLE;
---
```

#### TypeScript Support for Environment Variables

Create `src/env.d.ts` for type safety:

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DOCS_PATH: string;
  readonly SITE_URL: string;
  readonly SITE_TITLE: string;
  readonly SITE_DESCRIPTION: string;
  readonly ENABLE_SEARCH: string;
  readonly ENABLE_AI_ASSISTANT: string;
  readonly ENABLE_ANALYTICS: string;
  readonly ANALYTICS_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## Rendering Flow

### Page Rendering Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  <html>                                                 │
│  <head> (meta, styles, scripts) </head>                 │
│  <body>                                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │  <Navbar style={selectedStyle} />                 │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  <Layout type="docs|home|blog">                   │  │
│  │  ┌──────────┬────────────────────────┬──────────┐ │  │
│  │  │          │                        │          │ │  │
│  │  │ Sidebar  │      Main Content      │ Outline  │ │  │
│  │  │          │      (MDX/Page)        │  (TOC)   │ │  │
│  │  │          │                        │          │ │  │
│  │  └──────────┴────────────────────────┴──────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  <Footer />                                       │  │
│  └───────────────────────────────────────────────────┘  │
│  </body>                                                │
│  </html>                                                │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Request: /docs/guides/installation
                    │
                    ▼
2. Router: pages/docs/[...slug].astro
                    │
                    ▼
3. Load Content: Read from DOCS_PATH/guides/installation.mdx
                    │
                    ▼
4. Parse MDX: Extract frontmatter, headings, content
                    │
                    ▼
5. Build Sidebar: Generate from docs folder structure
                    │
                    ▼
6. Build Outline: Extract h2/h3 headings for TOC
                    │
                    ▼
7. Render: DocsLayout + Sidebar + Content + Outline
                    │
                    ▼
8. Response: Complete HTML page
```

---

## Directory Details

### `/src/components/`

UI components used across the site. Each component type can have multiple style variants.

| Directory | Purpose | Variants |
|-----------|---------|----------|
| `navbar/` | Site navigation | Style1 (minimal), Style2 (full) |
| `footer/` | Site footer | Default, Minimal, Extended |
| `sidebar/` | Docs navigation | Default |
| `outline/` | Table of contents | Default |

### `/src/mdx_elements/`

Components specifically for use within MDX documentation files.

| Component | Purpose |
|-----------|---------|
| `Card` | Content cards with header/body |
| `CodeBlock` | Syntax-highlighted code with copy button |
| `Callout` | Info/warning/danger callouts |
| `Tabs` | Tabbed content sections |

### `/src/theme/`

Centralized styling system using CSS custom properties.

| File | Contents |
|------|----------|
| `colors.css` | Color palette, light/dark mode variables |
| `text.css` | Font families, sizes, weights, line heights |
| `text_md.css` | Markdown element typography (h1-h6, p, lists) |
| `elements.css` | Base element styles (buttons, inputs, etc.) |
| `index.css` | Master file that imports all above |

### `/src/layouts/`

Page layout templates that compose components.

| Layout | Use Case |
|--------|----------|
| `BaseLayout` | Root HTML structure, shared by all pages |
| `home/` | Homepage layouts with hero, features, etc. |
| `docs/` | Documentation with sidebar + TOC |
| `blog/` | Blog post listing and individual posts |
| `roadmap/` | Project roadmap/changelog display |

### `/src/modules/`

Self-contained feature modules.

| Module | Purpose |
|--------|---------|
| `search/` | Full-text search functionality |
| `ai/` | AI assistant integration |
| `analytics/` | Usage tracking |

### `/src/pages/`

Astro routing. File-based routing where each file becomes a route.

| Route | File | Description |
|-------|------|-------------|
| `/` | `index.astro` | Homepage |
| `/docs/*` | `docs/[...slug].astro` | All documentation pages |
| `/blog` | `blog/index.astro` | Blog listing |
| `/blog/*` | `blog/[...slug].astro` | Individual blog posts |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Navigate to astro directory
cd astro

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your docs path
# DOCS_PATH=../docs
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Creating Documentation

1. Create MDX files in your docs directory:

```mdx
---
title: Getting Started
description: Learn how to get started
sidebar_position: 1
---

# Getting Started

Welcome to the documentation!
```

2. Use MDX components:

```mdx
import { Card, Callout, CodeBlock } from '@/mdx_elements';

<Callout type="info">
  This is an informational callout.
</Callout>

<Card title="Quick Start">
  Follow these steps to begin.
</Card>
```

---

## Customization

### Adding a New Navbar Style

1. Create folder: `src/components/navbar/NavbarStyle3/`
2. Create component: `NavbarStyle3.astro`
3. Create styles: `NavbarStyle3.css`
4. Export from: `src/components/navbar/index.ts`
5. Use in layouts by importing the desired style

### Adding New MDX Components

1. Create folder: `src/mdx_elements/MyComponent/`
2. Create component: `MyComponent.astro`
3. Export from: `src/mdx_elements/index.ts`
4. Import in MDX files or add to global MDX components

### Modifying Theme

1. Edit CSS files in `src/theme/`
2. All changes propagate via CSS variables
3. Dark mode: Update `[data-theme="dark"]` selectors in `colors.css`

---

## Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build for production to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run astro ...` | Run Astro CLI commands |

---

## License

MIT
