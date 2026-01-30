# Implementation Instructions

This document contains the complete implementation tasks for the Astro documentation framework.

---

## Phase 1: Project Setup

### Task 1.1: Initialize Astro Project
- [ ] Create `package.json` with Astro and dependencies (bun as package manager)
- [ ] Create `astro.config.mjs` with MDX integration
- [ ] Create `tsconfig.json` with path aliases
- [ ] Create `.env` file with default paths

### Task 1.2: Create Directory Structure
- [ ] Create `src/` directory structure:
  - `src/layouts/` (docs, blogs, custom, navbar, footer)
  - `src/loaders/`
  - `src/hooks/`
  - `src/modules/`
  - `src/mdx_components/`
  - `src/pages/`
  - `src/styles/`
  - `src/assets/`
- [ ] Create `config/` directory with sample configs
- [ ] Create `data/` directory with sample content
- [ ] Create `themes/` directory (empty)

---

## Phase 2: Core Loaders

### Task 2.1: Path Resolver (`src/loaders/paths.ts`)
- [ ] Read paths from `.env` (CONFIG_DIR, DATA_DIR, THEMES_DIR)
- [ ] Export resolved absolute paths
- [ ] Handle default values

### Task 2.2: Config Loader (`src/loaders/config.ts`)
- [ ] Load `site.yaml` - main site configuration
- [ ] Load `navbar.yaml` - navigation configuration
- [ ] Load `footer.yaml` - footer configuration
- [ ] Validate configuration against schema
- [ ] Export typed configuration objects

### Task 2.3: Unified Data Loader (`src/loaders/data.ts`)
- [ ] Implement `LoadedContent` interface
- [ ] Implement `loadContent()` for directories (docs, blog)
- [ ] Implement `loadFile()` for single files (custom pages)
- [ ] Support file types: .mdx, .md, .yaml, .json
- [ ] Implement sorting options (position, date, alphabetical)
- [ ] Implement filtering (drafts, custom filters)
- [ ] Implement caching for production

### Task 2.4: Alias Resolver (`src/loaders/alias.ts`)
- [ ] Resolve `@docs/` to `src/layouts/docs/`
- [ ] Resolve `@blog/` to `src/layouts/blogs/`
- [ ] Resolve `@custom/` to `src/layouts/custom/`
- [ ] Resolve `@navbar/` to `src/layouts/navbar/`
- [ ] Resolve `@footer/` to `src/layouts/footer/`
- [ ] Resolve `@data/` to `$DATA_DIR`
- [ ] Resolve `@mdx/` to `src/mdx_components/`

---

## Phase 3: Base Layouts

### Task 3.1: Base Layout (`src/layouts/BaseLayout.astro`)
- [ ] Fixed structure: Navbar → slot → Footer
- [ ] Load navbar and footer configs
- [ ] Pass site metadata to head
- [ ] Include global styles

### Task 3.2: Navbar Layouts
- [ ] Create `src/layouts/navbar/style1/index.astro`
  - Desktop horizontal navigation
  - Dropdown menus for children
  - External link indicators
  - Mobile hamburger menu
- [ ] Create `src/layouts/navbar/minimal/index.astro`
  - Simple logo + links
  - No dropdowns
- [ ] Styles for both variants

### Task 3.3: Footer Layouts
- [ ] Create `src/layouts/footer/default/index.astro`
  - Multi-column layout
  - Social links
  - Copyright with dynamic year
- [ ] Create `src/layouts/footer/minimal/index.astro`
  - Single line copyright
  - Minimal links

---

## Phase 4: Docs Layout Package

### Task 4.1: Docs Layout Structure (`src/layouts/docs/doc_style1/`)
- [ ] Create `index.astro` - Entry point
  - Three-column layout: Sidebar | Content | Outline
  - Load content using data loader
  - Read settings.json for configuration
- [ ] Create `Sidebar.astro`
  - Auto-generate from folder structure
  - Support collapsible sections
  - Active item highlighting
  - Respect sort order from settings
- [ ] Create `Content.astro`
  - MDX rendering
  - MDX components injection
  - Code highlighting
- [ ] Create `Outline.astro`
  - Table of contents from headings
  - Configurable heading levels
  - Scroll spy active state
- [ ] Create `Pagination.astro`
  - Previous/Next navigation
  - Based on sidebar order
- [ ] Create `styles.css`
  - Responsive design
  - Dark mode support

### Task 4.2: Docs Settings Support
- [ ] Load `settings.json` from doc root
- [ ] Apply sidebar configuration
- [ ] Apply outline configuration
- [ ] Apply pagination settings

---

## Phase 5: Blog Layout Package

### Task 5.1: Blog Layout Structure (`src/layouts/blogs/blog_style1/`)
- [ ] Create `blog_index.astro` - Listing page
  - Post cards grid/list
  - Pagination
  - Optional category/tag filtering
- [ ] Create `blog_page.astro` - Individual post
  - Title, date, author
  - Content rendering
  - Tags display
  - Related posts (optional)
- [ ] Create `PostCard.astro`
  - Thumbnail, title, excerpt
  - Date and author
  - Read more link
- [ ] Create `styles.css`

---

## Phase 6: Custom Page Layouts

### Task 6.1: Home Layout (`src/layouts/custom/home/`)
- [ ] Create `index.astro`
  - Accept YAML/JSON data
  - Hero section
  - Features grid
  - CTA sections
- [ ] Create supporting components (Hero.astro, Features.astro)
- [ ] Create `styles.css`

### Task 6.2: Generic Info Layout (`src/layouts/custom/info/`)
- [ ] Create `index.astro`
  - Simple page with title and content
  - Accept YAML with markdown content

---

## Phase 7: MDX Components

### Task 7.1: Core Components (`src/mdx_components/`)
- [ ] Create `Card/` component
  - Reference: `old_code/docusaurus/src/components/elements/Card/`
  - Card, CardHeader, CardTitle, CardDescription
- [ ] Create `Callout/` component
  - Reference: `old_code/docusaurus/src/components/elements/Callout/`
  - Types: info, warning, error, success, tip
- [ ] Create `CodeBlock/` component
  - Reference: `old_code/docusaurus/src/components/elements/CodeBlock/`
  - Collapsible, line numbers, file names
- [ ] Create `Tabs/` component
  - Tab groups with content switching
- [ ] Create `Features/` component
  - Reference: `old_code/docusaurus/src/components/elements/Features/`

### Task 7.2: Visualization Components
- [ ] Create `CustomMermaid/` component
  - Reference: `old_code/docusaurus/src/components/elements/visualizations/CustomMermaid/`
- [ ] Create `GraphViz/` component
  - Reference: `old_code/docusaurus/src/components/elements/visualizations/GraphViz/`

### Task 7.3: MDX Provider
- [ ] Create `src/mdx_components/index.ts` - Export all components
- [ ] Configure MDX integration in Astro config

---

## Phase 8: Route Handlers

### Task 8.1: Dynamic Route Generation (`src/pages/`)
- [ ] Create route handler that reads `site.yaml`
- [ ] Generate routes for each page definition
- [ ] Handle nested routes for docs
- [ ] Validate no overlapping routes (except `/`)

### Task 8.2: Route Types
- [ ] Docs routes: `[...slug].astro` under docs base
- [ ] Blog routes: Index + individual posts
- [ ] Custom routes: Single pages

---

## Phase 9: Hooks & Utilities

### Task 9.1: Navigation Hook (`src/hooks/useNavigation.ts`)
- [ ] Reference: `old_code/astro/src/hooks/useNavigation.ts`
- [ ] Get current path
- [ ] Check if path is active
- [ ] Breadcrumb generation

### Task 9.2: Sidebar Hook (`src/hooks/useSidebar.ts`)
- [ ] Reference: `old_code/astro/src/hooks/useSidebar.ts`
- [ ] Build sidebar tree from content
- [ ] Handle collapse state

### Task 9.3: Theme Hook (`src/hooks/useTheme.ts`)
- [ ] Reference: `old_code/astro/src/hooks/useTheme.ts`
- [ ] Light/dark mode toggle
- [ ] Persist preference

---

## Phase 10: Styling

### Task 10.1: Global Styles (`src/styles/`)
- [ ] Create `globals.css` - Reset and base styles
- [ ] Create CSS variables for theming
- [ ] Dark mode variables
- [ ] Responsive breakpoints

### Task 10.2: Theme Support
- [ ] Reference: `old_code/astro/src/theme/presets/`
- [ ] Create default theme
- [ ] Support custom themes from `themes/` directory

---

## Phase 11: Sample Content

### Task 11.1: Sample Configuration
- [ ] Create `config/site.yaml` with example pages
- [ ] Create `config/navbar.yaml` with example items
- [ ] Create `config/footer.yaml` with example columns

### Task 11.2: Sample Docs
- [ ] Create `data/docs/getting-started/` with sample MDX
- [ ] Create `data/docs/guides/` with sample MDX
- [ ] Include `settings.json` in each section

### Task 11.3: Sample Blog
- [ ] Create sample blog posts in `data/blog/`
- [ ] Different dates and tags

### Task 11.4: Sample Custom Pages
- [ ] Create `data/pages/home.yaml`
- [ ] Create `data/pages/about.yaml`

---

## Phase 12: Testing & Documentation

### Task 12.1: Test Scenarios
- [ ] Build project successfully
- [ ] All routes render
- [ ] Navigation works
- [ ] Dark mode toggle works
- [ ] MDX components render
- [ ] Sidebar navigation works
- [ ] Outline scroll spy works

### Task 12.2: Screenshots
- [ ] Take screenshot of home page
- [ ] Take screenshot of docs page
- [ ] Take screenshot of blog page
- [ ] Take screenshot of dark mode

---

## Completion Criteria

All tasks must be checked off before outputting `<promise>ASTRO DOCS COMPLETE</promise>`.

Key validation points:
1. `bun run build` completes without errors
2. `bun run dev` starts server successfully
3. All page types render correctly (docs, blog, custom)
4. Navigation between pages works
5. MDX components render in docs
6. Dark mode toggle works
7. Responsive design works

---

## Reference Files

Use these for component patterns:
- `old_code/docusaurus/src/components/elements/` - MDX component patterns
- `old_code/astro/src/layouts/` - Layout structure patterns
- `old_code/astro/src/hooks/` - Hook implementations
- `old_code/astro/src/components/` - Navbar, footer, sidebar patterns
