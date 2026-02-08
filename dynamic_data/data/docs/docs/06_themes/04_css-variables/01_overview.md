---
title: CSS Variables Overview
description: Theme CSS architecture — what lives in the theme, what lives in layouts, and how breakpoints work
---

# CSS Variables Overview

All CSS lives inside the theme folder. A theme is a self-contained set of CSS files that controls every visual aspect of the site — colors, fonts, spacing, component styling, page structure, and responsive behavior.

**One theme = one visual style.** A single theme defines CSS for one navbar look, one footer look, one docs layout, and so on. There are no variant suffixes (no `--minimal`, no `--alt`) within a theme. If you want a different visual style, you create a different theme.

Layout components (`.astro` files) contain only HTML structure, data handling, and JavaScript. No CSS. No `<style>` blocks.

---

## Theme vs Layout

| | Theme (CSS files) | Layout (.astro components) |
|--|-------------------|---------------------------|
| **What it is** | How things look and where they're positioned | What things exist and how they get data |
| **Contains** | CSS variables, selectors, media queries | HTML structure, props, imports, `<script>` |
| **Examples** | Navbar is sticky, 64px tall, has a border-bottom | Navbar shows a logo, 3 links, and a theme toggle |
| | Sidebar is 280px wide, collapses at 1024px | Sidebar renders a tree of links from `settings.json` |
| | Dropdown menu appears on hover with a shadow | Dropdown items come from `navbar.yaml` |
| | Footer has a grid of columns | Footer loads columns and social links from `footer.yaml` |
| | Blog cards have 16:9 images with hover zoom | Blog index fetches posts and passes them to cards |
| **Changes when** | You switch themes | You switch layout variants (default → compact) |

### The Rule

> **If it's a `var()`, a selector, a `@media` query, or a visual property — it's in the theme.**
>
> **If it's an HTML element, a data source, a prop, or a `<script>` — it's in the layout.**

### One Theme, One Style

A theme defines exactly one visual style per component:

- **One navbar style** — there is no "navbar variant" within a single theme
- **One footer style** — no "minimal footer" living alongside a "default footer" in the same CSS
- **One docs layout style** — how sidebar, content, and outline look in this theme

If you want a visually different navbar (e.g., flat links only, no dropdowns), create a separate theme that extends the default and overrides `navbar.css`. Do not add variant selectors within the same theme.

The only exception is doc layout classes (`default` vs `compact`), which are handled via layout-specific CSS classes. This is a temporary arrangement that will be rethought.

---

## Theme CSS Files

Every theme lives in a single folder and contains these CSS files:

| File | Purpose | Defines |
|------|---------|---------|
| `color.css` | Color palette (light + dark mode) | `--color-bg-*`, `--color-text-*`, `--color-brand-*`, `--color-border-*`, status colors |
| `font.css` | Typography system | `--font-family-*`, `--font-size-*`, `--font-weight-*`, `--line-height-*`, `--letter-spacing-*` |
| `element.css` | Dimensions, spacing, decorations | `--spacing-*`, `--border-radius-*`, `--shadow-*`, `--transition-*`, `--z-index-*`, `--opacity-*`, layout dimensions (`--navbar-height`, `--sidebar-width`, etc.) |
| `breakpoints.css` | Breakpoint scale reference | Documented convention only (no actual CSS rules) — pixel values for `@media` queries |
| `reset.css` | Browser normalization + page structure | Box-sizing, margin resets, font inheritance, `body` flex column, `.main-content` flex fill |
| `markdown.css` | Rendered content styling | Scoped rules under `.markdown-content` — headings, code, tables, lists, blockquotes |
| `navbar.css` | Navbar styling | Sticky positioning, link styles, dropdown appearance, mobile menu, theme toggle |
| `footer.css` | Footer styling | Column grid, link styles, social icons, copyright |
| `docs.css` | Documentation page styling | `.docs-layout` container, sidebar, content area, outline panel, pagination |
| `blogs.css` | Blog page styling | Index grid, post cards, post body |
| `custom.css` | Custom page styling | Hero sections, feature grids, info pages, countdown |

Each file defines one style for its component. `navbar.css` does not contain multiple navbar variants — it contains the navbar style for this theme.

### index.css

The entry point that imports all theme files in the correct order:

```css
/* src/styles/index.css */
@import './color.css';        /* 1. Variables: colors */
@import './font.css';         /* 2. Variables: typography */
@import './element.css';      /* 3. Variables: spacing, dimensions, decorations */
@import './breakpoints.css';  /* 4. Breakpoint scale (reference only) */
@import './reset.css';        /* 5. Browser normalization + page structure */
@import './markdown.css';     /* 6. Rendered content styles */
@import './navbar.css';       /* 7. Navbar */
@import './footer.css';       /* 8. Footer */
@import './docs.css';         /* 9. Documentation pages */
@import './blogs.css';        /* 10. Blog pages */
@import './custom.css';       /* 11. Custom pages */
```

Order matters: variables must be defined before they are used. Variable files come first, then component styles that consume them.

### globals.css

A backwards-compatibility wrapper that imports `index.css`:

```css
@import './index.css';
```

---

## What Stays in Layout Components

Layout `.astro` files handle:

- **HTML structure** — What elements to render, in what order
- **Data loading** — Importing configs, fetching content, processing props
- **Conditional rendering** — Show sidebar or not, show outline or not, show logo or not
- **JavaScript** — Mobile menu toggle, theme toggle, scroll behavior, collapse/expand
- **CSS classes** — Attaching the right class names so theme CSS can target them
- **Slots** — Where child content goes

```astro
---
// Layout concern: WHAT to render and WHERE data comes from
import { loadNavbarConfig } from '@loaders/config';
const items = navbarConfig.items || [];
---

<!-- Layout concern: HTML structure -->
<nav class="navbar">
  <a href="/" class="navbar__logo">
    {logo.src ? <img src={logo.src} /> : <span>{logo.alt}</span>}
  </a>
  <div class="navbar__links">
    {items.map(item => <a href={item.href}>{item.label}</a>)}
  </div>
</nav>

<!-- Layout concern: behavior -->
<script>
  // Toggle mobile menu, toggle theme
</script>

<!-- NO <style> block — all CSS is in the theme -->
```

Layouts attach CSS classes (`.navbar`, `.navbar__links`, `.navbar__logo`), but never define what those classes look like. The theme CSS handles all visual properties.

---

## Breakpoints

CSS custom properties **cannot** be used in `@media` query conditions:

```css
/* This does NOT work */
@media (max-width: var(--breakpoint-md)) { ... }
```

Breakpoints are **settings** — fixed values that theme CSS files use consistently. They are defined as a convention in `breakpoints.css` and documented here so that all theme CSS files use the same values.

### Breakpoint Scale

| Name | Value | Typical Use |
|------|-------|-------------|
| `xs` | `480px` | Small phones |
| `sm` | `640px` | Large phones / small tablets — titles downsize, pagination stacks, footer stacks, hero CTA stacks |
| `md` | `768px` | Tablets — navbar switches to mobile menu |
| `lg` | `1024px` | Small desktops — sidebar hides, content goes full width |
| `xl` | `1280px` | Desktops — outline panel hides |
| `2xl` | `1536px` | Large desktops |
| `3xl` | `1920px` | Full HD monitors |
| `4k` | `2560px` | 4K displays |

### Usage in Theme CSS

Theme CSS files use these values directly in `@media` queries:

```css
/* Outline hides on screens narrower than xl (1280px) */
@media (max-width: 1280px) {
  .outline { display: none; }
}

/* Sidebar hides below lg (1024px) */
@media (max-width: 1024px) {
  .sidebar { display: none; }
}

/* Navbar switches to mobile below md (768px) */
@media (max-width: 768px) {
  .navbar__links { display: none; }
  .navbar__mobile-toggle { display: flex; }
}

/* Stack elements on small screens below sm (640px) */
@media (max-width: 640px) {
  .pagination { flex-direction: column; }
  .footer__bottom { flex-direction: column; }
}
```

When creating a custom theme, use the same breakpoint values to maintain consistency across all components. A theme can choose different breakpoints, but all its CSS files should use the same set.

---

## How Theme CSS Reaches the Page

```
site.yaml → theme: "@theme/minimal"
                │
                ▼
    loadSiteConfig() resolves to absolute path
                │
                ▼
    getThemeCSS() loads theme.yaml manifest
    → resolves inheritance (extends: "@theme/default")
    → concatenates parent CSS + child CSS
                │
                ▼
    BaseLayout.astro injects combined CSS:
    <style id="theme-styles">{themeCSS}</style>
```

Custom themes override specific variables. Unlisted variables inherit from the parent theme via CSS cascade.

---

## Required Variables

When creating a standalone theme (`extends: null`), these variables **must** be defined:

| Category | Required Variables |
|----------|-------------------|
| Colors | `--color-bg-primary`, `--color-bg-secondary`, `--color-text-primary`, `--color-brand-primary` |
| Fonts | `--font-family-base`, `--font-family-mono`, `--font-size-base` |
| Elements | `--spacing-md`, `--border-radius-md` |

Themes that extend `@theme/default` inherit all variables and only need to override what they change.

---

## Dark Mode

All color variables are defined twice — in `:root` for light mode and `[data-theme="dark"]` for dark mode:

```css
:root {
  --color-bg-primary: #ffffff;
}

[data-theme="dark"] {
  --color-bg-primary: #1a1a2e;
}
```

The `data-theme` attribute is set on `<html>` by the theme toggle script. Non-color variables (fonts, spacing, dimensions) typically don't change between modes.

---

## Variable Reference Pages

**Theme variable definitions:**

- [Color Variables](./color-variables) — Backgrounds, text, borders, brand, status colors
- [Font Variables](./font-variables) — Families, sizes, weights, line heights, letter spacing
- [Element Variables](./element-variables) — Spacing, dimensions, borders, shadows, transitions, z-index, opacity

**Theme component styles** (consume the variables above):

- [Markdown Styles](./markdown-styles) — Content rendering rules scoped to `.markdown-content`
- [Navbar Styles](./navbar-styles) — Navigation bar, dropdowns, mobile menu, theme toggle
- [Footer Styles](./footer-styles) — Footer columns, social links, copyright
- [Docs Styles](./docs-styles) — Docs layout container, sidebar, content area, outline panel, pagination
- [Blog Styles](./blog-styles) — Index grid, post cards, post body
- [Custom Page Styles](./custom-page-styles) — Hero sections, feature grids, info pages
