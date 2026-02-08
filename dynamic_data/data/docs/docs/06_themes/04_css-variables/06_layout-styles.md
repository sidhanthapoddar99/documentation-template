---
title: Layout Styles
description: Theme CSS for page structure, content flow, and responsive arrangement
---

# Layout Styles

Layout styles are **theme CSS** that defines the page structure — how navbar, content, and footer are stacked, and how the docs layout container is sized.

These styles live in the theme's `layout.css` file, not in layout `.astro` components.

**Theme file:** `layout.css`

---

## BaseLayout Structure

The root page structure uses a flex column to push the footer to the bottom:

| Selector | Property | Value | Purpose |
|----------|----------|-------|---------|
| `body` | `min-height` | `100vh` | Full viewport height |
| | `display` | `flex` | Vertical flex container |
| | `flex-direction` | `column` | Stack: navbar → content → footer |
| `.main-content` | `flex` | `1` | Content fills remaining space |

This ensures the footer stays at the bottom even on short pages.

---

## Docs Layout Container

### doc_style1 — Three-column

The primary docs layout. Used by `src/layouts/docs/styles/doc_style1/`.

```
┌──────────────────────────────────────────────────────┐
│                     Navbar                            │
├───────────┬──────────────────────────┬────────────────┤
│  Sidebar  │      Content Area       │    Outline     │
│  280px    │      flex: 1 (≤900px)   │    220px       │
│  sticky   │                          │    sticky      │
└───────────┴──────────────────────────┴────────────────┘
```

| Selector | Property | Value |
|----------|----------|-------|
| `.docs-layout` | `display` | `flex` |
| | `max-width` | `1600px` |
| | `margin` | `0 auto` |

### doc_style2 — Centered content (temporary)

A centered layout without sidebar. This is handled via the `.docs-layout--minimal` class applied by the doc_style2 layout component.

> **TODO:** Doc layout variants are being rethought. The current approach uses layout-specific CSS classes within the theme, which is a temporary arrangement. In the future, different doc layouts may be handled entirely through separate themes or a cleaner abstraction.

```
┌──────────────────────────────────────────────────────┐
│                     Navbar                            │
├──────────────────────────────────────────────────────┤
│              Content Area (≤800px)                    │
│                  centered                             │
└──────────────────────────────────────────────────────┘
```

| Selector | Property | Value |
|----------|----------|-------|
| `.docs-layout--minimal` | `display` | `flex` |
| | `max-width` | `--max-width-content` |
| | `margin` | `0 auto` |
| | `justify-content` | `center` |
| `.docs-layout--minimal .docs-content` | `max-width` | `800px` |

---

## Content Area

| Selector | Property | Variable |
|----------|----------|----------|
| `.docs-content` | `flex` | `1` |
| | `min-width` | `0` |
| | `padding` | `var(--spacing-xl) var(--spacing-2xl)` |
| | `max-width` | `900px` |

---

## Responsive Behavior

All breakpoint usage follows the [breakpoint scale](./overview#breakpoint-scale) defined in the overview.

| Breakpoint | Value | Layout Changes |
|------------|-------|----------------|
| `xl` | `1280px` | Outline panel hides |
| `lg` | `1024px` | Sidebar hides, content padding reduces, max-width removed |
| `md` | `768px` | Navbar switches to mobile menu |
| `sm` | `640px` | Titles downsize, pagination stacks, footer stacks |

```css
@media (max-width: 1280px) {
  .outline { display: none; }
}

@media (max-width: 1024px) {
  .sidebar { display: none; }
  .docs-content { padding: var(--spacing-lg); max-width: none; }
}

@media (max-width: 640px) {
  .docs-content { padding: var(--spacing-md); }
  .docs-title { font-size: var(--font-size-3xl); }
}
```

---

## Theme Variables Used

Layout styles consume these variables from `element.css`:

| Variable | Used For |
|----------|---------|
| `--max-width-content` | Navbar, footer, docs-layout--minimal container max-width |
| `--sidebar-width` | Sidebar width |
| `--outline-width` | Outline panel width |
| `--navbar-height` | Navbar height, sidebar/outline sticky offset and height calculation |
| `--spacing-*` | All padding and margin values |
| `--color-border-*` | Section dividers |
