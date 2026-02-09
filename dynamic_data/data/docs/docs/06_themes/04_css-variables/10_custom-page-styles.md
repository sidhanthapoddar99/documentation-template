---
title: Custom Page Styles
description: Hero sections, feature grids, info pages, and countdown styling
---

# Custom Page Styles

Custom page styles are **scoped CSS** for specialized pages like landing pages, info pages, and interactive elements. Unlike navbar, footer, docs, and blog styles (which are defined in the theme), custom pages define their own styles using `<style>` blocks within each layout component.

**Pattern:** Each custom layout component includes a `<style>` block with its own CSS

Custom pages use existing theme variables (`--color-*`, `--spacing-*`, `--font-size-*`) for consistency, but define additional selectors specific to their unique components via scoped `<style>` blocks. The layout `.astro` components define both *what* to render (hero content from YAML, feature list, countdown target) and *how it looks* (via component-scoped styles).

---

## Hero Section

A full-width banner with title, subtitle, and call-to-action buttons.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              Hero Title (clamp)                      │
│              Subtitle text here                      │
│                                                      │
│         [Get Started]  [Learn More]                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Container

| Selector | Property | Variable |
|----------|----------|----------|
| `.hero` | `min-height` | `60vh` |
| | `display` | `flex` |
| | `align-items` | `center` |
| | `justify-content` | `center` |
| | `padding` | `var(--spacing-3xl) var(--spacing-lg)` |
| | `background` | `linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)` |
| `.hero__container` | `text-align` | `center` |
| | `max-width` | `800px` |

### Title

| Selector | Property | Variable |
|----------|----------|----------|
| `.hero__title` | `font-size` | `clamp(2.5rem, 5vw, 4rem)` |
| | `font-weight` | `800` |
| | `line-height` | `1.1` |
| | `color` | `--color-text-primary` |
| | `margin-bottom` | `--spacing-lg` |

The `clamp()` function provides fluid typography — scales smoothly from `2.5rem` on small screens to `4rem` on large screens.

### Subtitle

| Selector | Property | Variable |
|----------|----------|----------|
| `.hero__subtitle` | `font-size` | `--font-size-xl` |
| | `color` | `--color-text-secondary` |
| | `line-height` | `1.6` |
| | `margin-bottom` | `--spacing-2xl` |
| | `max-width` | `600px` |
| | `margin-left/right` | `auto` (centered) |

### CTA Buttons

| Selector | Property | Variable |
|----------|----------|----------|
| `.hero__actions` | `display` | `flex` |
| | `justify-content` | `center` |
| | `gap` | `--spacing-md` |
| | `flex-wrap` | `wrap` |
| `.hero__cta` | `padding` | `var(--spacing-md) var(--spacing-xl)` |
| | `font-size` | `--font-size-base` |
| | `font-weight` | `600` |
| | `border-radius` | `--border-radius-md` |
| | `transition` | `all var(--transition-fast)` |
| `.hero__cta svg` | `width` / `height` | `1.25rem` |

#### Primary CTA

| Selector | Property | Variable |
|----------|----------|----------|
| `.hero__cta--primary` | `background-color` | `--color-brand-primary` |
| | `color` | `--color-bg-primary` |
| `.hero__cta--primary:hover` | `background-color` | `--color-brand-secondary` |
| | `transform` | `translateY(-2px)` |

#### Secondary CTA

| Selector | Property | Variable |
|----------|----------|----------|
| `.hero__cta--secondary` | `background-color` | `--color-bg-primary` |
| | `color` | `--color-text-primary` |
| | `border` | `1px solid var(--color-border-default)` |
| `.hero__cta--secondary:hover` | `border-color` | `--color-brand-primary` |
| | `color` | `--color-brand-primary` |

### Responsive

| Breakpoint | Behavior |
|------------|----------|
| `<640px` | Actions stack vertically, CTA buttons become full-width (max 280px) |

---

## Features Grid

A responsive grid of feature cards with icons.

```
┌──────────────────────────────────────────────────────┐
│  ┌───────────┐  ┌───────────┐  ┌───────────┐        │
│  │ [icon]    │  │ [icon]    │  │ [icon]    │        │
│  │ Title     │  │ Title     │  │ Title     │        │
│  │ Desc...   │  │ Desc...   │  │ Desc...   │        │
│  └───────────┘  └───────────┘  └───────────┘        │
└──────────────────────────────────────────────────────┘
```

### Container

| Selector | Property | Variable |
|----------|----------|----------|
| `.features` | `padding` | `var(--spacing-3xl) var(--spacing-lg)` |
| | `background-color` | `--color-bg-primary` |
| `.features__container` | `max-width` | `1200px` |
| | `margin` | `0 auto` |

### Grid

| Selector | Property | Variable |
|----------|----------|----------|
| `.features__grid` | `display` | `grid` |
| | `grid-template-columns` | `repeat(auto-fit, minmax(280px, 1fr))` |
| | `gap` | `--spacing-xl` |

### Feature Card

| Selector | Property | Variable |
|----------|----------|----------|
| `.feature-card` | `padding` | `--spacing-xl` |
| | `background-color` | `--color-bg-secondary` |
| | `border` | `1px solid var(--color-border-light)` |
| | `border-radius` | `--border-radius-lg` |
| | `transition` | `border-color var(--transition-fast), transform var(--transition-fast)` |
| `.feature-card:hover` | `border-color` | `--color-brand-primary` |
| | `transform` | `translateY(-4px)` |

### Icon

| Selector | Property | Variable |
|----------|----------|----------|
| `.feature-card__icon` | `width` / `height` | `3rem` |
| | `background` | `linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))` |
| | `border-radius` | `--border-radius-md` |
| | `margin-bottom` | `--spacing-md` |
| `.feature-card__icon span` | `font-size` | `1.5rem` |

### Text

| Selector | Property | Variable |
|----------|----------|----------|
| `.feature-card__title` | `font-size` | `--font-size-lg` |
| | `font-weight` | `600` |
| | `color` | `--color-text-primary` |
| `.feature-card__description` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-secondary` |

---

## Info Page

A simple centered content page for about, terms, or informational content.

```
┌──────────────────────────────────────────────────────┐
│              Page Title                               │
│              Description                              │
│                                                      │
│  Content area (.markdown-content)                    │
│  ...                                                 │
└──────────────────────────────────────────────────────┘
```

### Container

| Selector | Property | Variable |
|----------|----------|----------|
| `.info-page` | `padding` | `var(--spacing-2xl) var(--spacing-lg)` |
| `.info-page__container` | `max-width` | `800px` |
| | `margin` | `0 auto` |

### Header

| Selector | Property | Variable |
|----------|----------|----------|
| `.info-page__header` | `text-align` | `center` |
| | `margin-bottom` | `--spacing-2xl` |
| `.info-page__title` | `font-size` | `--font-size-4xl` |
| | `font-weight` | `700` |
| | `color` | `--color-text-primary` |
| `.info-page__description` | `font-size` | `--font-size-lg` |
| | `color` | `--color-text-secondary` |

### Content

| Selector | Property | Variable |
|----------|----------|----------|
| `.info-page__content` | `line-height` | `1.8` |

Content typography (h2, h3, p, lists) follows the same pattern as docs and blog content — uses theme font size and spacing variables.

---

## Countdown Page

A centered countdown timer with animated number units. Styles are scoped inside the Astro component.

**Source:** `src/layouts/custom/styles/countdown/Layout.astro`

### Container

| Selector | Property | Variable |
|----------|----------|----------|
| `.countdown-page` | `min-height` | `80vh` |
| | `display` | `flex` |
| | `align-items` | `center` |
| | `justify-content` | `center` |
| `.countdown-container` | `text-align` | `center` |
| | `max-width` | `700px` |

### Timer Units

| Selector | Property | Variable |
|----------|----------|----------|
| `.countdown-timer` | `display` | `flex` |
| | `justify-content` | `center` |
| | `gap` | `--spacing-lg` |
| `.countdown-unit` | `display` | `flex column` |
| | `background-color` | `--color-bg-secondary` |
| | `border` | `1px solid var(--color-border-default)` |
| | `border-radius` | `--border-radius-lg` |
| | `min-width` | `90px` |
| `.countdown-value` | `font-size` | `--font-size-4xl` |
| | `font-weight` | `--font-weight-bold` |
| | `font-variant-numeric` | `tabular-nums` |
| `.countdown-label` | `font-size` | `--font-size-xs` |
| | `color` | `--color-text-muted` |
| | `text-transform` | `uppercase` |

### Responsive

| Breakpoint | Behavior |
|------------|----------|
| `<600px` | Reduced padding, countdown units shrink to `65px` min-width |
