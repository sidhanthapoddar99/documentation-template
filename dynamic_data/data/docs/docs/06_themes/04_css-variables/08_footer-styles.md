---
title: Footer Styles
description: Footer layout, link columns, social icons, and copyright styling
---

# Footer Styles

Footer styles are **theme CSS** that controls the visual appearance of the footer — column grid layout, link colors, social icon sizing, and copyright text. The layout `.astro` components only handle HTML structure, data, and JavaScript.

**Theme file:** `footer.css`

The layout components (`src/layouts/footer/default/index.astro`, `src/layouts/footer/minimal/index.astro`) define *what* the footer contains (columns, links, social icons) and *where data comes from* (footer.yaml). The theme CSS defines *how it looks*.

---

## Footer Variants

### default — Multi-column

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

### minimal — Single Line

```
┌──────────────────────────────────────────────────────┐
│  © 2024 Company              Link  Link  Link  Link  │
└──────────────────────────────────────────────────────┘
```

---

## Default Footer

### Container

| Selector | Property | Variable |
|----------|----------|----------|
| `.footer` | `background-color` | `--color-bg-secondary` |
| | `border-top` | `1px solid var(--color-border-default)` |
| | `padding` | `var(--spacing-2xl) 0` |
| `.footer__container` | `max-width` | `--max-width-content` |
| | `margin` | `0 auto` |
| | `padding` | `0 var(--spacing-lg)` |

### Link Columns

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
| | `display` | `flex` |
| | `flex-direction` | `column` |
| | `gap` | `--spacing-sm` |

### Links

| Selector | Property | Variable |
|----------|----------|----------|
| `.footer__link` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-secondary` |
| | `text-decoration` | `none` |
| | `transition` | `color var(--transition-fast)` |
| `.footer__link:hover` | `color` | `--color-text-primary` |

### Bottom Section

| Selector | Property | Variable |
|----------|----------|----------|
| `.footer__bottom` | `display` | `flex` |
| | `align-items` | `center` |
| | `justify-content` | `space-between` |
| | `padding-top` | `--spacing-xl` |
| | `border-top` | `1px solid var(--color-border-default)` |
| `.footer__copyright` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-muted` |

### Social Links

| Selector | Property | Variable |
|----------|----------|----------|
| `.footer__social` | `display` | `flex` |
| | `gap` | `--spacing-md` |
| `.footer__social-link` | `width` / `height` | `2rem` |
| | `color` | `--color-text-muted` |
| | `transition` | `color var(--transition-fast)` |
| `.footer__social-link:hover` | `color` | `--color-text-primary` |
| `.footer__social-link svg` | `width` / `height` | `1.25rem` |

### Responsive

| Breakpoint | Behavior |
|------------|----------|
| `<640px` | Bottom section stacks vertically (`flex-direction: column`), centered text |

---

## Minimal Footer

### Container

| Selector | Property | Variable |
|----------|----------|----------|
| `.footer-minimal` | `background-color` | `--color-bg-secondary` |
| | `border-top` | `1px solid var(--color-border-default)` |
| `.footer-minimal__container` | `display` | `flex` |
| | `align-items` | `center` |
| | `justify-content` | `space-between` |
| | `max-width` | `--max-width-content` |
| | `margin` | `0 auto` |
| | `padding` | `--spacing-lg` |

### Content

| Selector | Property | Variable |
|----------|----------|----------|
| `.footer-minimal__copyright` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-muted` |
| `.footer-minimal__links` | `display` | `flex` |
| | `gap` | `--spacing-lg` |
| `.footer-minimal__link` | `font-size` | `--font-size-sm` |
| | `color` | `--color-text-secondary` |
| | `text-decoration` | `none` |
| | `transition` | `color var(--transition-fast)` |
| `.footer-minimal__link:hover` | `color` | `--color-text-primary` |

### Responsive

| Breakpoint | Behavior |
|------------|----------|
| `<640px` | Container stacks vertically (`flex-direction: column`), centered text |

---

## Supported Social Platforms

The default footer includes SVG icons for:

| Platform | Icon Key |
|----------|----------|
| GitHub | `github` |
| Twitter | `twitter` |
| LinkedIn | `linkedin` |
| YouTube | `youtube` |
| Discord | `discord` |

Configured in `footer.yaml`:

```yaml
social:
  - platform: github
    href: "https://github.com/yourorg"
  - platform: twitter
    href: "https://twitter.com/yourorg"
```
