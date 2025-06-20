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