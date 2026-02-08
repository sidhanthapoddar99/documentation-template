---
title: Navbar Styles
description: Navigation bar layout, dropdowns, mobile menu, and theme toggle styling
---

# Navbar Styles

Navbar styles are **theme CSS** that controls the visual appearance of the navigation bar — positioning, colors, sizing, dropdowns, mobile menu, and theme toggle. The layout `.astro` components only handle HTML structure, data, and JavaScript.

**Theme file:** `navbar.css`

The layout components (`src/layouts/navbar/style1/index.astro`, `src/layouts/navbar/minimal/index.astro`) define *what* the navbar contains (logo, links, toggle buttons) and *where data comes from* (navbar.yaml). The theme CSS defines *how it looks*.

---

## Navbar Variants

### style1 — Full Featured

Supports dropdowns, mobile hamburger menu, and theme toggle.

```
Desktop:
┌──────────────────────────────────────────────────────┐
│  [Logo]     [Link] [Link] [Dropdown ▼]    [☀] [☰]   │
└──────────────────────────────────────────────────────┘

Mobile (expanded):
┌──────────────────────────────────────────────────────┐
│  [Logo]                                   [☀] [✕]   │
├──────────────────────────────────────────────────────┤
│  Link                                                │
│  Link                                                │
│  DROPDOWN LABEL                                      │
│    Nested Link                                       │
│    Nested Link                                       │
└──────────────────────────────────────────────────────┘
```

### minimal — Simple

Flat links only (no dropdowns, no mobile menu — links just hide on small screens).

```
┌──────────────────────────────────────────────────────┐
│  [Logo]        [Link]  [Link]  [Link]         [☀]   │
└──────────────────────────────────────────────────────┘
```

---

## Common Structure

Both variants share this base pattern:

| Selector | Property | Variable |
|----------|----------|----------|
| `.navbar` / `.navbar-minimal` | `position` | `sticky` |
| | `top` | `0` |
| | `z-index` | `100` |
| | `background-color` | `--color-bg-primary` |
| | `border-bottom` | `1px solid var(--color-border-default)` |

| Selector | Property | Variable |
|----------|----------|----------|
| `__container` | `display` | `flex` |
| | `align-items` | `center` |
| | `justify-content` | `space-between` |
| | `max-width` | `--max-width-content` |
| | `margin` | `0 auto` |
| | `padding` | `0 var(--spacing-lg)` |
| | `height` | `--navbar-height` |

---

## Logo

| Selector | Property | Variable |
|----------|----------|----------|
| `__logo` | `display` | `flex` |
| | `align-items` | `center` |
| | `text-decoration` | `none` |
| `__logo img` | `height` | `2rem` (style1) / `1.75rem` (minimal) |
| `__logo-text` | `font-size` | `--font-size-lg` |
| | `font-weight` | `600` |
| | `color` | `--color-text-primary` |

---

## Navigation Links

| Selector | Property | Variable |
|----------|----------|----------|
| `__link` | `font-size` | `--font-size-sm` |
| | `font-weight` | `500` |
| | `color` | `--color-text-secondary` |
| | `text-decoration` | `none` |
| | `border-radius` | `--border-radius-md` |
| | `transition` | `color var(--transition-fast), background-color var(--transition-fast)` |
| `__link:hover` | `color` | `--color-text-primary` |
| | `background-color` | `--color-bg-secondary` (style1 only) |
| `__link--active` | `color` | `--color-brand-primary` |

---

## Dropdown (style1 only)

| Selector | Property | Variable |
|----------|----------|----------|
| `__dropdown` | `position` | `relative` |
| `__dropdown-icon` | `width` / `height` | `1rem` |
| | `transition` | `transform var(--transition-fast)` |
| `__dropdown:hover __dropdown-icon` | `transform` | `rotate(180deg)` |
| `__dropdown-menu` | `display` | `none` → `block` on hover |
| | `position` | `absolute` |
| | `top` | `100%` |
| | `min-width` | `180px` |
| | `background-color` | `--color-bg-primary` |
| | `border` | `1px solid var(--color-border-default)` |
| | `border-radius` | `--border-radius-md` |
| | `box-shadow` | `--shadow-lg` |
| `__dropdown-item` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-secondary` |
| | `border-radius` | `--border-radius-sm` |
| `__dropdown-item:hover` | `color` | `--color-text-primary` |
| | `background-color` | `--color-bg-secondary` |

---

## Theme Toggle

| Selector | Property | Variable |
|----------|----------|----------|
| `__theme-toggle` | `width` / `height` | `2.5rem` (style1) / `2rem` (minimal) |
| | `border` | `none` |
| | `background` | `transparent` |
| | `color` | `--color-text-secondary` |
| | `border-radius` | `--border-radius-md` |
| | `transition` | `color var(--transition-fast)` |
| `__theme-toggle:hover` | `color` | `--color-text-primary` |
| `__theme-icon` | `width` / `height` | `1.25rem` |

Dark mode icon switching:

| State | Light Icon | Dark Icon |
|-------|-----------|-----------|
| Light mode (default) | Visible | `display: none` |
| Dark mode (`[data-theme="dark"]`) | `display: none` | Visible |

---

## External Link Icon

| Selector | Property | Value |
|----------|----------|-------|
| `__external-icon` | `width` / `height` | `0.75rem` |
| | `opacity` | `0.5` |

---

## Mobile Menu (style1 only)

Visibility controlled via `data-mobile-open` attribute on `.navbar`:

| Selector | Property | Variable |
|----------|----------|----------|
| `__mobile-toggle` | `display` | `flex` (hidden at `≥768px`) |
| | `width` / `height` | `2.5rem` |
| | `color` | `--color-text-primary` |
| `__menu-icon` | `width` / `height` | `1.5rem` |
| `__close-icon` | `width` / `height` | `1.5rem` |
| | `display` | `none` (shown when open) |
| `__mobile-menu` | `display` | `none` → `flex` when `data-mobile-open="true"` |
| | `border-top` | `1px solid var(--color-border-default)` |
| `__mobile-label` | `font-size` | `--font-size-xs` |
| | `font-weight` | `600` |
| | `color` | `--color-text-muted` |
| | `text-transform` | `uppercase` |
| `__mobile-link` | `font-size` | `--font-size-base` |
| | `color` | `--color-text-secondary` |
| | `border-radius` | `--border-radius-md` |
| `__mobile-link--nested` | `padding-left` | `--spacing-xl` |

---

## Responsive Behavior

| Breakpoint | style1 | minimal |
|------------|--------|---------|
| `≥768px` | Desktop links visible, mobile toggle hidden | — |
| `<768px` | Desktop links hidden, mobile toggle visible | — |
| `≥640px` | — | All links visible |
| `<640px` | — | Links hidden |
