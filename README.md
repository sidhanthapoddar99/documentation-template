- [NeuraLabs Documentation](#neuralabs-documentation)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
    - [1. Install Docusaurus](#1-install-docusaurus)
    - [2. Install Dependencies](#2-install-dependencies)
    - [3. Local Development](#3-local-development)
    - [4. Build](#4-build)
    - [5. Deployment](#5-deployment)
      - [Deploy to GitHub Pages](#deploy-to-github-pages)
      - [Deploy to Vercel](#deploy-to-vercel)
      - [Deploy to Netlify](#deploy-to-netlify)
  - [Documentation Structure](#documentation-structure)
  - [Theme System \& Color Management](#theme-system--color-management)
    - [Color Theme Architecture](#color-theme-architecture)
    - [Updating Colors](#updating-colors)
    - [Component Structure](#component-structure)
    - [SVG Icons](#svg-icons)
    - [Using Colors in CSS](#using-colors-in-css)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
  - [Additional Resources](#additional-resources)
  - [Understanding Docusaurus Architecture](#understanding-docusaurus-architecture)
    - [How Docusaurus Works](#how-docusaurus-works)
    - [File Loading Order (Homepage Example)](#file-loading-order-homepage-example)
    - [How the Homepage is Defined](#how-the-homepage-is-defined)
    - [Layout Control: What We Can Customize](#layout-control-what-we-can-customize)
      - [1. **Full Control (Custom Pages)**](#1-full-control-custom-pages)
      - [2. **Partial Control (Docs/Blog)**](#2-partial-control-docsblog)
    - [CSS Control](#css-control)
    - [Headers and Footers](#headers-and-footers)
    - [What Docusaurus Auto-Generates](#what-docusaurus-auto-generates)
    - [What We Define](#what-we-define)
    - [Layout Architecture Summary](#layout-architecture-summary)
    - [Key Concepts](#key-concepts)
  - [Starting a New Project from This Template](#starting-a-new-project-from-this-template)
    - [Quick Start Guide](#quick-start-guide)
    - [Customization Steps](#customization-steps)
  - [Component Synchronization Tool](#component-synchronization-tool)
    - [How It Works](#how-it-works)
    - [Configuration](#configuration)
    - [Basic Usage](#basic-usage)
    - [Interactive Update Process](#interactive-update-process)
    - [Category-Specific Behaviors](#category-specific-behaviors)
      - [Components (Replace Mode)](#components-replace-mode)
      - [Images/Icons (Add-Only Mode)](#imagesicons-add-only-mode)
      - [Theme (Selective Mode)](#theme-selective-mode)
      - [Configuration Files (Merge Mode)](#configuration-files-merge-mode)
    - [Example Workflow](#example-workflow)
    - [Changelog](#changelog)
    - [Best Practices](#best-practices)
    - [Troubleshooting](#troubleshooting-1)


# NeuraLabs Documentation

This documentation is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Prerequisites

- Node.js 18.0 or above
- npm or yarn package manager

## Quick Start

### 1. Install Docusaurus

```bash
cd documentation
npx create-docusaurus@latest . classic --typescript
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Local Development

Start a local development server:

```bash
npm run start
# or
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### 4. Build

Build the documentation for production:

```bash
npm run build
# or
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### 5. Deployment

#### Deploy to GitHub Pages

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

#### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

#### Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `build` folder to Netlify via their UI or CLI.

## Documentation Structure

```
documentation/
├── docs/                     # Documentation pages
│   ├── intro.mdx            # Getting started guide
│   ├── theoretical/         # Theoretical concepts
│   │   ├── _category_.json  # Category configuration
│   │   ├── overview.mdx     # Platform overview
│   │   ├── architecture.mdx # System architecture
│   │   └── ...
│   └── implementation/      # Implementation guides
│       ├── _category_.json
│       ├── 01-database/
│       ├── 02-frontend/
│       ├── 03-backend/
│       ├── 04-hpc-execution/
│       ├── 05-smart-contracts/
│       └── 06-prover-service/
├── blog/                    # Blog posts (optional)
├── src/                     # Custom React components/pages
│   ├── components/
│   ├── pages/
│   └── css/
├── static/                  # Static assets (images, etc.)
├── docusaurus.config.js     # Docusaurus configuration
├── sidebars.js             # Sidebar configuration
└── package.json
```

## Theme System & Color Management

This project uses a centralized color theme system for consistent styling across all components.

### Color Theme Architecture

1. **Centralized Colors** (`src/theme/colors.js`)
   - All colors are defined in a single JavaScript file
   - Supports nested color structures for organization
   - Includes light/dark mode variants
   - Icon filters for SVG images

2. **Color Provider** (`src/theme/colorProvider.js`)
   - Converts JavaScript color definitions to CSS variables
   - Generates theme-specific CSS for light/dark modes
   - Provides semantic color mappings

3. **Generated CSS** (`src/css/generated-colors.css`)
   - Auto-generated CSS file with all color variables
   - DO NOT EDIT MANUALLY - regenerate from colors.js

### Updating Colors

1. Edit `src/theme/colors.js` to modify colors
2. Run the generation script:
   ```bash
   node src/theme/generateColors.js
   ```
3. The CSS will be automatically updated

### Component Structure

Components are organized with their own CSS files:

```
src/elements/
├── Card/
│   ├── Card.js
│   ├── Card.css
│   └── index.js
├── Callout/
│   ├── Callout.js
│   ├── Callout.css
│   └── index.js
└── ... other components
```

### SVG Icons

All SVG icons use pure black (`#000000`) strokes and are inverted in dark mode:
- Light mode: Icons remain black (no filter)
- Dark mode: Icons are inverted to white using `filter: invert(1)`

This is controlled by the `--theme-icon-filter` CSS variable.

### Using Colors in CSS

Reference colors using CSS variables:

```css
/* Use semantic theme variables */
.my-component {
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border-default);
}

/* Or use specific color variables */
.brand-element {
  color: var(--color-brand-primary);
}
```

## Troubleshooting

### Common Issues

1. **Build Errors**: Clear cache and rebuild
```bash
npm run clear
npm run build
```

2. **Missing Dependencies**: Reinstall node_modules
```bash
rm -rf node_modules
npm install
```

3. **Port Already in Use**: Change the port
```bash
npm run start -- --port 3001
```

## Additional Resources

- [Docusaurus Documentation](https://docusaurus.io/docs)
- [Markdown Guide](https://www.markdownguide.org/)
- [MDX Documentation](https://mdxjs.com/)

## Understanding Docusaurus Architecture

### How Docusaurus Works

Docusaurus is a **static site generator** that combines:
- React components for UI
- Markdown/MDX files for content
- A build system that generates static HTML
- A theme system for customization
- Plugins for extended functionality

### File Loading Order (Homepage Example)

When you visit the homepage, files load in this order:

1. **docusaurus.config.js** - Site configuration
2. **src/pages/index.js** - Homepage entry point
3. **src/layouts/HomeLayout.js** - Page-specific layout
4. **src/layouts/BaseLayout.js** - Common layout wrapper
5. **@theme/Layout** - Docusaurus default layout (navbar, footer)
6. **Components** (Hero, Features, etc.) - Actual content

### How the Homepage is Defined

The homepage is created by placing an `index.js` file in `src/pages/`:

```javascript
// src/pages/index.js
export default function Home() {
  return (
    <HomeLayout>
      <Hero />
      <HomeFeatures />
      <Stats />
    </HomeLayout>
  );
}
```

**Key points:**
- Any `.js` file in `src/pages/` becomes a route
- `index.js` → `/` (homepage)
- `about.js` → `/about`
- `pricing.js` → `/pricing`

### Layout Control: What We Can Customize

#### 1. **Full Control (Custom Pages)**
For pages in `src/pages/`, you have complete control:
- HTML structure
- CSS styling
- React components
- Layout choice
- Everything is customizable

#### 2. **Partial Control (Docs/Blog)**
For markdown files in `docs/` or `blog/`:
- **Content**: You write in Markdown/MDX
- **HTML Structure**: Auto-generated by Docusaurus
- **CSS**: You can style via custom CSS
- **Layout**: Can be customized via theme overrides
- **Components**: Can embed React components in MDX

### CSS Control

You have multiple levels of CSS control:

1. **Global CSS** (`src/css/custom.css`)
   - Affects entire site
   - Can override Docusaurus defaults
   - Uses CSS variables for theming

2. **Component CSS** (`src/elements/*/Component.css`)
   - Scoped to specific components
   - Imported directly by components
   - Full control over styling

3. **Theme CSS Variables**
   - Docusaurus provides variables like `--ifm-color-primary`
   - You can override these in custom.css
   - Affects framework components

4. **CSS Modules** (optional)
   - For truly isolated styles
   - Prevents style conflicts

### Headers and Footers

Headers (navbar) and footers are defined in `docusaurus.config.js`:

```javascript
themeConfig: {
  navbar: {
    title: 'NeuraLabs',
    logo: { src: 'img/logo.svg' },
    items: [
      { to: '/docs', label: 'Docs' },
      { to: '/blog', label: 'Blog' }
    ]
  },
  footer: {
    links: [...],
    copyright: '© 2024 NeuraLabs'
  }
}
```

**Customization options:**
- Modify config for content/links
- Override theme components for structure
- Use CSS for styling
- Create custom navbar/footer components

### What Docusaurus Auto-Generates

1. **For Markdown Docs:**
   - Table of contents
   - Previous/Next navigation
   - Breadcrumbs
   - Edit this page links
   - Last updated timestamps
   - Page metadata

2. **For All Pages:**
   - SEO meta tags
   - Social sharing cards
   - Dark/light mode toggle
   - Mobile responsive layout
   - Search functionality (with plugins)

### What We Define

1. **Page Structure:**
   - Layout hierarchy (BaseLayout → HomeLayout → components)
   - Component composition
   - Custom page layouts

2. **Styling:**
   - Color themes
   - Typography
   - Spacing and sizing
   - Component styles
   - Animations

3. **Content:**
   - Page components
   - Markdown documentation
   - Blog posts
   - Static assets

### Layout Architecture Summary

```
┌─────────────────────────────────────┐
│     docusaurus.config.js            │ ← Site configuration
├─────────────────────────────────────┤
│     Docusaurus Theme System         │ ← Provides navbar, footer, base styles
├─────────────────────────────────────┤
│     Our Layout System               │ ← BaseLayout, HomeLayout, etc.
├─────────────────────────────────────┤
│     Page Files                      │ ← index.js, about.js, etc.
├─────────────────────────────────────┤
│     Components                      │ ← Hero, Features, Cards, etc.
└─────────────────────────────────────┘
```

### Key Concepts

1. **Pages vs Docs**: 
   - Pages = Full React control
   - Docs = Markdown with Docusaurus structure

2. **Layouts vs Components**:
   - Layouts = Page structure and wrappers
   - Components = Reusable content pieces

3. **Theme vs Custom**:
   - Theme = Docusaurus defaults
   - Custom = Our overrides and additions

4. **Static Generation**:
   - Build time: React → HTML
   - Runtime: Hydrates to interactive React

This architecture gives you the flexibility to create custom pages while leveraging Docusaurus's powerful documentation features.

## Starting a New Project from This Template

### Quick Start Guide

To create a new documentation project based on this template:

```bash
# 1. Clone the repository
git clone <repository-url> my-new-docs

# 2. Remove the original git history
cd my-new-docs
rm -rf .git

# 3. Initialize a new git repository
git init

# 4. Create initial commit
git add .
git commit -m "Initial commit from NeuraLabs documentation template"

# 5. Install dependencies
npm install

# 6. Start development
npm run start
```

### Customization Steps

1. **Update Project Info**: Edit `docusaurus.config.js` to change:
   - Site title and tagline
   - URL and baseUrl
   - Organization/project name
   - Social links

2. **Update Colors**: Modify `src/theme/colors.js` and regenerate:
   ```bash
   node src/theme/generateColors.js
   ```

3. **Replace Content**: 
   - Clear out example docs in `docs/`
   - Update homepage content in `src/pages/index.js`
   - Replace logos in `static/img/`

## Component Synchronization Tool

This template includes a powerful synchronization tool in the `sync/` directory that allows you to pull updates from the base template while preserving your customizations.

### How It Works

The sync tool:
1. Archives the base repository to a temporary directory
2. Compares files between base and your project
3. Shows what's changed, new, or identical
4. Lets you selectively update components
5. Generates a changelog of all updates
6. Cleans up temporary files
7. Can even update itself!

### Tool Structure

```
sync/
├── index.js           # Main entry point
├── config.js          # Configuration and categories
├── utils.js           # Utility functions
├── git-operations.js  # Git clone and cleanup
├── comparison.js      # File comparison logic
├── prompts.js         # Interactive CLI prompts
├── update-operations.js # File update and merge logic
├── changelog.js       # Changelog generation
└── README.md          # Sync tool documentation
```

### Configuration

Edit the default repository URL in `sync/config.js`:

```javascript
const config = {
  defaultRepo: 'https://github.com/your-org/base-template.git', // Set your base template URL
  // ... other config
};
```

### Basic Usage

```bash
# Using npm scripts (recommended)
npm run sync                                    # Sync from default repository
npm run sync:dry                                # Dry run mode

# With custom parameters (note the -- before arguments)
npm run sync -- --repo=https://github.com/org/repo.git
npm run sync -- --branch=develop
npm run sync -- --repo=https://github.com/org/repo.git --branch=main --dry-run

# Direct node execution (from project root)
node sync                                       # Sync from default repository
node sync --repo=https://github.com/org/repo.git
node sync --branch=develop
node sync --dry-run
```

#### Important Notes on npm Scripts

**Directory handling**: No issues! When using `npm run sync`, npm automatically runs from the project root directory, so all path operations work correctly.

**Parameter passing**: When using npm scripts with custom arguments, you need to use `--` to separate npm's arguments from the script's arguments:

```bash
# ✅ Correct ways to pass arguments:
npm run sync -- --repo=https://github.com/org/repo.git
npm run sync -- --branch=develop --dry-run

# ❌ This won't work:
npm run sync --repo=https://github.com/org/repo.git
```

The `--` tells npm to pass everything after it to the script being run.

#### Quick Usage Examples

1. **Simple sync**: `npm run sync`
2. **Dry run**: `npm run sync:dry`
3. **Custom repo**: `npm run sync -- --repo=https://github.com/org/repo.git`
4. **All options**: `npm run sync -- --repo=https://github.com/org/repo.git --branch=main --dry-run`

### Interactive Update Process

When you run the sync tool, it will:

1. **Show a comparison summary** of all categories:
   ```
   === File Comparison Summary ===
   
   Components:
     ✓ Identical: 15
     ↻ Changed: 3
     + New: 2
     - Deleted: 0
   ```

2. **Ask for confirmation** to proceed with updates

3. **Present update options** for each category:
   - **Components**: Update component files and documentation
   - **Images/Icons**: Add new images (won't overwrite existing)
   - **Theme**: Choose all, selected folders, or none
   - **Colors**: Update the color configuration file
   - **Custom CSS**: Update stylesheets
   - **Config Files**: Merge package.json, update configs
   - **Documentation**: Update README and CLAUDE.md
   - **Sync Tool**: Update the sync tool itself (preserves your config.js)

### Category-Specific Behaviors

#### Components (Replace Mode)
Updates all component files in:
- `docs/component-usage/`
- `docs/docusaurus-guide/`
- `src/components/elements/`

#### Images/Icons (Add-Only Mode)
- Only adds new images to `static/img/`
- Skips existing files
- Excludes logo and favicon files

#### Theme (Selective Mode)
Offers three options:
1. **All**: Update all theme files
2. **Selected**: Choose specific folders (Navbar, DocPage, etc.)
3. **None**: Skip theme updates

Special handling for:
- `generateColors.js` is included in updates
- `colors.js` is a separate category for explicit control

#### Configuration Files (Merge Mode)
- **package.json**: Intelligently merges dependencies and scripts
- **docusaurus.config.js**: Replace mode with confirmation
- **tsconfig.json**: Add-only mode

### Example Workflow

```bash
# 1. Run the sync tool
$ node sync

Component Sync Tool

Using default repository: https://github.com/neuralabs/template.git
Archiving repository...
✓ Repository archived successfully

Comparing files...

=== File Comparison Summary ===

Components:
  ✓ Identical: 20
  ↻ Changed: 5
  + New: 3
  Total: 28 files

Theme:
  ✓ Identical: 10
  ↻ Changed: 2
  + New: 1
  Total: 13 files

Proceed with updates? (y/n): y

# 2. Select what to update
Components
  Changed files: 5
  New files: 3
Update Components? (y/n): y

Theme
  Changed files: 2
  New files: 1
How would you like to update Theme?
  1. all
  2. selected
  3. none
Select option (number): 2

Select theme folders to update:
  1. Navbar
  2. DocPage
  3. generateColors.js
  4. All
  5. None
Select options (comma-separated numbers): 1,3

# 3. Review results
✓ Updates completed
  Replaced: 7 files
  Added: 4 files
  Merged: 1 files
  Skipped: 0 files

✓ Changelog updated
Cleaned up temporary files
```

### Changelog

The tool automatically generates a `CHANGELOG.md` with details of each sync:

```markdown
## Component Sync - 2024-01-15T10:30:00.000Z

### Summary
- Files replaced: 7
- Files added: 4
- Files merged: 1
- Files skipped: 0
- Errors: 0

### Categories Updated

#### Components
**Changed files:**
- src/components/elements/Card/Card.js
- src/components/elements/Card/Card.css
...

**New files:**
- src/components/elements/Timeline/Timeline.js
...
```

### Best Practices

1. **Commit Before Syncing**: Always commit your current changes before running the sync tool
2. **Review Changes**: Use `--dry-run` to preview what will be updated
3. **Selective Updates**: Use the selective options for themes and configs to maintain customizations
4. **Test After Sync**: Run `npm start` to ensure everything works after updates
5. **Check the Changelog**: Review `CHANGELOG.md` to understand what was updated

### Troubleshooting

**Git clone fails:**
- Ensure you have access to the repository
- Check your git credentials
- Verify the repository URL

**Merge conflicts in package.json:**
- The tool will prompt for each script conflict
- Choose whether to keep your version or update

**Missing dependencies after sync:**
- Run `npm install` after syncing
- Check for any peer dependency warnings

**Styling issues after theme updates:**
- Regenerate colors: `node src/theme/generateColors.js`
- Check for CSS variable changes in updated files