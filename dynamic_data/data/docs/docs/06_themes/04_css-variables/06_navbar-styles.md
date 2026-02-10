---
title: Navbar Styles
description: Navigation bar layout, dropdowns, mobile menu, and theme toggle styling
---

# Navbar Styles

Navbar styles are **theme CSS** that controls the visual appearance of the navigation bar — positioning, colors, sizing, dropdowns, mobile menu, and theme toggle. The layout `.astro` component only handles HTML structure, data, and JavaScript.

**Theme file:** `navbar.css`

This theme defines one navbar style. The layout component (`src/layouts/navbar/default/index.astro`) defines *what* the navbar contains (logo, links, toggle buttons) and *where data comes from* (navbar.yaml). The theme CSS defines *how it looks*. If you want a different navbar appearance, create a different theme — do not add variant selectors within this file.

---

## Structure

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

---

## Container

| Selector | Property | Variable |
|----------|----------|----------|
| `.navbar` | `position` | `sticky` |
| | `top` | `0` |
| | `z-index` | `100` |
| | `background-color` | `--color-bg-primary` |
| | `border-bottom` | `1px solid var(--color-border-default)` |

| Selector | Property | Variable |
|----------|----------|----------|
| `.navbar__container` | `display` | `flex` |
| | `align-items` | `center` |
| | `justify-content` | `space-between` |
| | `max-width` | `--max-width-primary` |
| | `margin` | `0 auto` |
| | `padding` | `0 var(--spacing-lg)` |
| | `height` | `--navbar-height` |
| | `gap` | `--spacing-xl` |

---

## Logo

| Selector | Property | Variable |
|----------|----------|----------|
| `.navbar__logo` | `display` | `flex` |
| | `align-items` | `center` |
| | `flex-shrink` | `0` |
| | `text-decoration` | `none` |
| `.navbar__logo img` | `height` | `2rem` |
| | `width` | `auto` |
| `.navbar__logo-text` | `font-size` | `--font-size-lg` |
| | `font-weight` | `600` |
| | `color` | `--color-text-primary` |

---

## Desktop Links

| Selector | Property | Variable |
|----------|----------|----------|
| `.navbar__links` | `display` | `none` (flex at `>=768px`) |
| | `align-items` | `center` |
| | `gap` | `--spacing-xs` |
| `.navbar__link` | `display` | `inline-flex` |
| | `align-items` | `center` |
| | `gap` | `--spacing-xs` |
| | `padding` | `var(--spacing-sm) var(--spacing-md)` |
| | `font-size` | `--font-size-sm` |
| | `font-weight` | `500` |
| | `color` | `--color-text-secondary` |
| | `text-decoration` | `none` |
| | `border-radius` | `--border-radius-md` |
| | `border` | `none` |
| | `background` | `none` |
| | `cursor` | `pointer` |
| | `transition` | `color var(--transition-fast), background-color var(--transition-fast)` |
| `.navbar__link:hover` | `color` | `--color-text-primary` |
| | `background-color` | `--color-bg-secondary` |
| `.navbar__link--active` | `color` | `--color-brand-primary` |

---

## Dropdown

| Selector | Property | Variable |
|----------|----------|----------|
| `.navbar__dropdown` | `position` | `relative` |
| `.navbar__dropdown-trigger` | `font-family` | `inherit` |
| `.navbar__dropdown-icon` | `width` / `height` | `1rem` |
| | `transition` | `transform var(--transition-fast)` |
| `.navbar__dropdown:hover .navbar__dropdown-icon` | `transform` | `rotate(180deg)` |
| `.navbar__dropdown-menu` | `display` | `none` → `block` on hover |
| | `position` | `absolute` |
| | `top` | `100%` |
| | `left` | `0` |
| | `min-width` | `180px` |
| | `padding` | `--spacing-sm` |
| | `background-color` | `--color-bg-primary` |
| | `border` | `1px solid var(--color-border-default)` |
| | `border-radius` | `--border-radius-md` |
| | `box-shadow` | `--shadow-lg` |
| `.navbar__dropdown-item` | `display` | `flex` |
| | `align-items` | `center` |
| | `gap` | `--spacing-sm` |
| | `padding` | `var(--spacing-sm) var(--spacing-md)` |
| | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-secondary` |
| | `text-decoration` | `none` |
| | `border-radius` | `--border-radius-sm` |
| `.navbar__dropdown-item:hover` | `color` | `--color-text-primary` |
| | `background-color` | `--color-bg-secondary` |

---

## Right Section

| Selector | Property | Variable |
|----------|----------|----------|
| `.navbar__right` | `display` | `flex` |
| | `align-items` | `center` |
| | `gap` | `--spacing-sm` |

---

## Theme Toggle

| Selector | Property | Variable |
|----------|----------|----------|
| `.navbar__theme-toggle` | `display` | `flex` |
| | `align-items` | `center` |
| | `justify-content` | `center` |
| | `width` / `height` | `2.5rem` |
| | `padding` | `0` |
| | `border` | `none` |
| | `background` | `transparent` |
| | `color` | `--color-text-secondary` |
| | `cursor` | `pointer` |
| | `border-radius` | `--border-radius-md` |
| | `transition` | `color var(--transition-fast), background-color var(--transition-fast)` |
| `.navbar__theme-toggle:hover` | `color` | `--color-text-primary` |
| | `background-color` | `--color-bg-secondary` |
| `.navbar__theme-icon` | `width` / `height` | `1.25rem` |

Dark mode icon switching:

| State | Light Icon | Dark Icon |
|-------|-----------|-----------|
| Light mode (default) | Visible | `display: none` |
| Dark mode (`[data-theme="dark"]`) | `display: none` | Visible |

---

## External Link Icon

| Selector | Property | Value |
|----------|----------|-------|
| `.navbar__external-icon` | `width` / `height` | `0.75rem` |
| | `opacity` | `0.5` |

---

## Mobile Menu

Visibility controlled via `data-mobile-open` attribute on `.navbar`:

| Selector | Property | Variable |
|----------|----------|----------|
| `.navbar__mobile-toggle` | `display` | `flex` (hidden at `>=768px`) |
| | `align-items` | `center` |
| | `justify-content` | `center` |
| | `width` / `height` | `2.5rem` |
| | `padding` | `0` |
| | `border` | `none` |
| | `background` | `transparent` |
| | `color` | `--color-text-primary` |
| | `cursor` | `pointer` |
| | `border-radius` | `--border-radius-md` |
| `.navbar__mobile-toggle:hover` | `background-color` | `--color-bg-secondary` |
| `.navbar__menu-icon` | `width` / `height` | `1.5rem` |
| `.navbar__close-icon` | `width` / `height` | `1.5rem` |
| | `display` | `none` (shown when open) |
| `.navbar__mobile-menu` | `display` | `none` → `flex` when `data-mobile-open="true"` |
| | `flex-direction` | `column` |
| | `padding` | `var(--spacing-sm) var(--spacing-lg) var(--spacing-lg)` |
| | `border-top` | `1px solid var(--color-border-default)` |
| `.navbar__mobile-label` | `padding` | `var(--spacing-md) var(--spacing-sm) var(--spacing-xs)` |
| | `font-size` | `--font-size-xs` |
| | `font-weight` | `600` |
| | `color` | `--color-text-muted` |
| | `text-transform` | `uppercase` |
| | `letter-spacing` | `0.05em` |
| `.navbar__mobile-link` | `display` | `flex` |
| | `align-items` | `center` |
| | `gap` | `--spacing-sm` |
| | `padding` | `--spacing-md` |
| | `font-size` | `--font-size-base` |
| | `color` | `--color-text-secondary` |
| | `text-decoration` | `none` |
| | `border-radius` | `--border-radius-md` |
| `.navbar__mobile-link:hover` | `color` | `--color-text-primary` |
| | `background-color` | `--color-bg-secondary` |
| `.navbar__mobile-link--active` | `color` | `--color-brand-primary` |
| `.navbar__mobile-link--nested` | `padding-left` | `--spacing-xl` |

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| `>=768px` | Desktop links visible, mobile toggle hidden, mobile menu forced hidden |
| `<768px` | Desktop links hidden, mobile toggle visible, mobile menu available via toggle |
