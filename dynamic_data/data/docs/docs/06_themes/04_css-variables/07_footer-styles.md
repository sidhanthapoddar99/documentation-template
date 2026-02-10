---
title: Footer Styles
description: Footer layout, link columns, social icons, and copyright styling
---

# Footer Styles

Footer styles are **theme CSS** that controls the visual appearance of the footer — column grid layout, link colors, social icon sizing, and copyright text. The layout `.astro` component only handles HTML structure, data, and JavaScript.

**Theme file:** `footer.css`

This theme defines one footer style. The layout component defines *what* the footer contains (columns, links, social icons) and *where data comes from* (footer.yaml). The theme CSS defines *how it looks*. If you want a different footer appearance, create a different theme — do not add variant selectors within this file.

---

## Structure

```
┌──────────────────────────────────────────────────────┐
│  Column 1      Column 2      Column 3      Column 4 │
│  Link          Link          Link          Link      │
│  Link          Link          Link          Link      │
│  Link          Link                                  │
├──────────────────────────────────────────────────────┤
│  © 2024 Company                   [gh] [tw] [li]     │
└──────────────────────────────────────────────────────┘
```

---

## Container

| Selector | Property | Variable |
|----------|----------|----------|
| `.footer` | `background-color` | `--color-bg-secondary` |
| | `border-top` | `1px solid var(--color-border-default)` |
| | `padding` | `var(--spacing-2xl) 0` |
| `.footer__container` | `max-width` | `--max-width-primary` |
| | `margin` | `0 auto` |
| | `padding` | `0 var(--spacing-lg)` |

---

## Link Columns

| Selector | Property | Variable |
|----------|----------|----------|
| `.footer__columns` | `display` | `grid` |
| | `grid-template-columns` | `repeat(auto-fit, minmax(160px, 1fr))` |
| | `gap` | `--spacing-xl` |
| | `margin-bottom` | `--spacing-2xl` |
| `.footer__column-title` | `font-size` | `--font-size-sm` |
| | `font-weight` | `600` |
| | `color` | `--color-text-primary` |
| | `margin-bottom` | `--spacing-md` |
| `.footer__column-links` | `list-style` | `none` |
| | `padding` | `0` |
| | `margin` | `0` |
| | `display` | `flex` |
| | `flex-direction` | `column` |
| | `gap` | `--spacing-sm` |

---

## Links

| Selector | Property | Variable |
|----------|----------|----------|
| `.footer__link` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-secondary` |
| | `text-decoration` | `none` |
| | `transition` | `color var(--transition-fast)` |
| `.footer__link:hover` | `color` | `--color-text-primary` |

---

## Bottom Section

| Selector | Property | Variable |
|----------|----------|----------|
| `.footer__bottom` | `display` | `flex` |
| | `align-items` | `center` |
| | `justify-content` | `space-between` |
| | `padding-top` | `--spacing-xl` |
| | `border-top` | `1px solid var(--color-border-default)` |
| `.footer__copyright` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-muted` |

---

## Social Links

| Selector | Property | Variable |
|----------|----------|----------|
| `.footer__social` | `display` | `flex` |
| | `gap` | `--spacing-md` |
| `.footer__social-link` | `display` | `flex` |
| | `align-items` | `center` |
| | `justify-content` | `center` |
| | `width` / `height` | `2rem` |
| | `color` | `--color-text-muted` |
| | `transition` | `color var(--transition-fast)` |
| `.footer__social-link:hover` | `color` | `--color-text-primary` |
| `.footer__social-link svg` | `width` / `height` | `1.25rem` |

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| `<640px` | Bottom section stacks vertically (`flex-direction: column`), centered text |
