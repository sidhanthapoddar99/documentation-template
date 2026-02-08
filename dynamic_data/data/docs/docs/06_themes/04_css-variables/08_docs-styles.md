---
title: Docs Styles
description: Documentation layout — sidebar, content area, outline panel, and pagination
---

# Docs Styles

Documentation page styles are **theme CSS** that controls the visual appearance of the sidebar, content body, outline (table of contents), and pagination. The layout `.astro` components only handle HTML structure, data, and JavaScript.

**Theme file:** `docs.css`

The layout components define *what* to show (sidebar tree from `settings.json`, outline from headings, pagination from adjacent pages) and *how data is loaded*. The theme CSS defines *how it all looks* — widths, colors, spacing, sticky behavior, collapse animations, responsive hiding.

---

## Layout Container

The docs layout container is defined in `docs.css` alongside the rest of the documentation styles.

| Selector | Property | Value |
|----------|----------|-------|
| `.docs-layout` | `display` | `flex` |
| | `max-width` | `var(--max-width-content)` (1600px) |
| | `margin` | `0 auto` |

---

## Sidebar

The sidebar is a sticky panel on the left with collapsible sections.

### Container

| Selector | Property | Variable |
|----------|----------|----------|
| `.sidebar` | `width` | `--sidebar-width` |
| | `flex-shrink` | `0` |
| | `padding` | `var(--spacing-lg) var(--spacing-md)` |
| | `border-right` | `1px solid var(--color-border-default)` |
| | `background-color` | `--color-bg-primary` |
| | `height` | `calc(100vh - var(--navbar-height))` |
| | `overflow-y` | `auto` |
| | `position` | `sticky` |
| | `top` | `--navbar-height` |

### Navigation Structure

| Selector | Property | Variable |
|----------|----------|----------|
| `.sidebar__nav` | `display` | `flex` |
| | `flex-direction` | `column` |
| | `gap` | `--spacing-md` |
| `.sidebar__section` | `display` | `flex` |
| | `flex-direction` | `column` |
| | `gap` | `--spacing-xs` |

### Section Headers

| Selector | Property | Variable |
|----------|----------|----------|
| `.sidebar__header` | `font-size` | `--font-size-sm` |
| | `font-weight` | `500` |
| | `letter-spacing` | `0.05em` |
| | `color` | `--color-text-primary` |
| `.sidebar__header--collapsible` | `cursor` | `pointer` |
| | `border-radius` | `--border-radius-sm` |
| | `transition` | `color var(--transition-fast), background-color var(--transition-fast)` |
| `.sidebar__header--collapsible:hover` | `background-color` | `--color-bg-secondary` |

### Collapse Chevron

| Selector | Property | Variable |
|----------|----------|----------|
| `.sidebar__chevron` | `width` / `height` | `1rem` |
| | `transition` | `transform var(--transition-fast)` |
| `[data-collapsed="true"] .sidebar__chevron` | `transform` | `rotate(-90deg)` |
| `[data-collapsed="true"] .sidebar__list` | `display` | `none` |

### Links

| Selector | Property | Variable |
|----------|----------|----------|
| `.sidebar__link` | `padding` | `0 var(--spacing-md)` |
| | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-secondary` |
| | `text-decoration` | `none` |
| | `border-radius` | `--border-radius-sm` |
| | `transition` | `color var(--transition-fast), background-color var(--transition-fast)` |
| `.sidebar__link:hover` | `color` | `--color-text-primary` |
| | `background-color` | `--color-bg-secondary` |
| `.sidebar__link--active` | `color` | `--color-text-primary` |
| | `background-color` | `--color-bg-secondary` |
| | `font-weight` | `500` |

### Nested Sections

| Selector | Property | Variable |
|----------|----------|----------|
| `.sidebar__section--nested` | `padding-left` | `--spacing-sm` |
| `.sidebar__header--nested` | `font-size` | `--font-size-sm` |

### Responsive

| Breakpoint | Behavior |
|------------|----------|
| `<1024px` | Sidebar hidden (`display: none`) |

---

## Content Area

The main content region where rendered markdown appears.

| Selector | Property | Variable |
|----------|----------|----------|
| `.docs-content` | `flex` | `1` |
| | `min-width` | `0` |
| | `padding` | `var(--spacing-xl) var(--spacing-2xl)` |
| | `max-width` | `900px` |

### Header (optional, currently commented out)

| Selector | Property | Variable |
|----------|----------|----------|
| `.docs-header` | `margin-bottom` | `--spacing-xl` |
| | `padding-bottom` | `--spacing-lg` |
| | `border-bottom` | `1px solid var(--color-border-default)` |
| `.docs-title` | `font-size` | `--font-size-4xl` |
| | `font-weight` | `700` |
| | `color` | `--color-text-primary` |

### Content Typography (`.docs-body`)

These styles apply inside the `.docs-body` container (which also has `.markdown-content`):

| Element | Font Size | Font Weight | Margin Top | Margin Bottom |
|---------|-----------|-------------|------------|---------------|
| `h2` | `--font-size-2xl` | `600` | `--spacing-2xl` | `--spacing-md` |
| `h3` | `--font-size-xl` | `600` | `--spacing-xl` | `--spacing-sm` |
| `h4` | `--font-size-lg` | `600` | `--spacing-lg` | `--spacing-sm` |
| `p` | inherited | inherited | — | `--spacing-md` |
| `ul, ol` | inherited | inherited | — | `--spacing-md` |
| `li` | inherited | inherited | — | `--spacing-sm` |

Additional content styles:

| Element | Styles |
|---------|--------|
| `blockquote` | `border-left: 4px solid var(--color-brand-primary)`, `background-color: var(--color-bg-secondary)` |
| `table th` | `background-color: var(--color-bg-secondary)` |
| `hr` | `border-top: 1px solid var(--color-border-default)` |
| `img` | `max-width: 100%`, `border-radius: var(--border-radius-md)` |

### Anchor Links

| Selector | Property | Variable |
|----------|----------|----------|
| `.anchor-link` | `position` | `absolute` |
| | `left` | `-1.5rem` |
| | `opacity` | `0` |
| | `color` | `--color-text-muted` |
| | `transition` | `opacity var(--transition-fast)` |
| `h2:hover .anchor-link` (etc.) | `opacity` | `1` |
| `.anchor-link:hover` | `color` | `--color-brand-primary` |

### Responsive

| Breakpoint | Selector | Changes |
|------------|----------|---------|
| `<1024px` | `.docs-content` | `padding: var(--spacing-lg)`, `max-width: none` |
| `<640px` | `.docs-title` | `font-size: var(--font-size-3xl)` |
| `<640px` | `.docs-content` | `padding: var(--spacing-md)` |

---

## Outline (Table of Contents)

The outline panel shows heading links on the right side.

| Selector | Property | Variable |
|----------|----------|----------|
| `.outline` | `width` | `--outline-width` |
| | `flex-shrink` | `0` |
| | `padding` | `var(--spacing-lg) var(--spacing-md)` |
| | `height` | `calc(100vh - var(--navbar-height))` |
| | `position` | `sticky` |
| | `top` | `--navbar-height` |
| | `overflow-y` | `auto` |
| `.outline__nav` | `padding-left` | `--spacing-md` |
| | `border-left` | `1px solid var(--color-border-default)` |
| `.outline__title` | `font-size` | `--font-size-sm` |
| | `font-weight` | `600` |
| | `color` | `--color-text-primary` |
| `.outline__list` | `display` | `flex` |
| | `flex-direction` | `column` |
| | `gap` | `--spacing-sm` |

### Link Styles

| Selector | Property | Variable |
|----------|----------|----------|
| `.outline__link` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-muted` |
| | `transition` | `color var(--transition-fast)` |
| `.outline__link:hover` | `color` | `--color-text-primary` |
| `.outline__link--active` | `color` | `--color-brand-primary` |
| | `font-weight` | `500` |

### Depth Indentation

| Selector | Property | Value |
|----------|----------|-------|
| `.outline__item--depth-3` | `padding-left` | `var(--spacing-md)` |
| `.outline__item--depth-4` | `padding-left` | `calc(var(--spacing-md) * 2)` |

### Responsive

| Breakpoint | Behavior |
|------------|----------|
| `<1280px` | Outline hidden (`display: none`) |

---

## Pagination

Previous/next navigation links at the bottom of docs pages.

| Selector | Property | Variable |
|----------|----------|----------|
| `.pagination` | `display` | `flex` |
| | `justify-content` | `space-between` |
| | `gap` | `--spacing-lg` |
| | `margin-top` | `--spacing-2xl` |
| | `padding-top` | `--spacing-xl` |
| | `border-top` | `1px solid var(--color-border-default)` |
| `.pagination__link` | `border` | `1px solid var(--color-border-default)` |
| | `border-radius` | `--border-radius-md` |
| | `transition` | `border-color var(--transition-fast)` |
| `.pagination__link:hover` | `border-color` | `--color-brand-primary` |
| | `background-color` | `--color-bg-secondary` |
| `.pagination__icon` | `width` / `height` | `1.25rem` |
| | `color` | `--color-text-muted` |
| `.pagination__label` | `font-size` | `--font-size-xs` |
| | `color` | `--color-text-muted` |
| | `text-transform` | `uppercase` |
| `.pagination__title` | `font-size` | `--font-size-sm` |
| | `font-weight` | `500` |
| | `color` | `--color-text-primary` |

### Responsive

| Breakpoint | Behavior |
|------------|----------|
| `<640px` | Stacks vertically (`flex-direction: column`) |
