---
title: Layout Styles
description: Theme CSS for page structure, content flow, and responsive arrangement
---

# Layout Styles

Layout styles are **theme CSS** that defines the page structure — how navbar, content, and footer are stacked, how content areas are sized, and how the page adapts at different breakpoints.

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

## Docs Layout Variants

### doc_style1 — Three-column

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

### doc_style2 — Minimal (no sidebar)

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
| `.docs-layout--minimal` | `max-width` | `1200px` |
| | `margin` | `0 auto` |
| `.docs-layout--minimal .docs-content` | `max-width` | `800px` |

---

## Blog Layout

### Blog Index

```
┌──────────────────────────────────────────────────────┐
│         Blog Header (title, description)              │
│      ┌──────────┬──────────┬──────────┐              │
│      │  Card 1  │  Card 2  │  Card 3  │  auto-fill   │
│      └──────────┴──────────┴──────────┘  min 340px    │
│                  Pagination                           │
└──────────────────────────────────────────────────────┘
```

| Selector | Property | Value |
|----------|----------|-------|
| `.blog-index` | `max-width` | `1200px` |
| | `margin` | `0 auto` |
| `.blog-index__grid` | `display` | `grid` |
| | `grid-template-columns` | `repeat(auto-fill, minmax(340px, 1fr))` |

### Blog Post

| Selector | Property | Value |
|----------|----------|-------|
| `.blog-post` | `max-width` | `800px` |
| | `margin` | `0 auto` |

---

## Custom Page Layout

| Selector | Property | Value |
|----------|----------|-------|
| `.info-page__container` | `max-width` | `800px` |
| | `margin` | `0 auto` |

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
| `sm` | `640px` | Titles downsize, pagination stacks, footer stacks, blog grid becomes single column, hero CTA stacks |

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
  .blog-index__grid { grid-template-columns: 1fr; }
}
```

---

## Theme Variables Used

Layout styles consume these variables from `element.css`:

| Variable | Used For |
|----------|---------|
| `--max-width-content` | Navbar, footer, blog index, features container max-width |
| `--sidebar-width` | Sidebar width |
| `--outline-width` | Outline panel width |
| `--navbar-height` | Navbar height, sidebar/outline sticky offset and height calculation |
| `--spacing-*` | All padding and margin values |
| `--color-border-*` | Section dividers |
