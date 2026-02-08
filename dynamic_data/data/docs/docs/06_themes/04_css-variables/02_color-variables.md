---
title: Color Variables
description: Complete reference for all color CSS custom properties
---

# Color Variables

Defined in `src/styles/color.css`. All color variables have both light mode (`:root`) and dark mode (`[data-theme="dark"]`) values.

**Source file:** `src/styles/color.css`

---

## Backgrounds

| Variable | Description | Light | Dark |
|----------|-------------|-------|------|
| `--color-bg-primary` | Main page background | `#ffffff` | `#1a1a2e` |
| `--color-bg-secondary` | Card/section backgrounds, code blocks, sidebar hover | `#f8f9fa` | `#16213e` |
| `--color-bg-tertiary` | Inline code background, kbd background, deeper emphasis | `#e9ecef` | `#0f3460` |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--color-bg-primary` | `body`, navbar, sidebar, dropdowns, post cards, hero CTA secondary |
| `--color-bg-secondary` | Footer, code blocks, blockquotes, table headers, even table rows, tags, sidebar hover, feature cards, details/summary |
| `--color-bg-tertiary` | Inline `code` elements, `kbd` elements |

---

## Text

| Variable | Description | Light | Dark |
|----------|-------------|-------|------|
| `--color-text-primary` | Main body text, headings, active sidebar links | `#212529` | `#eaeaea` |
| `--color-text-secondary` | Secondary text, descriptions, nav links, footer links | `#495057` | `#b8b8b8` |
| `--color-text-muted` | Placeholder text, metadata, outline links, copyright | `#6c757d` | `#888888` |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--color-text-primary` | Body text, all headings, navbar logo text, sidebar headers, outline title, hover states |
| `--color-text-secondary` | Descriptions, blockquotes, nav links, footer links, post meta, blog descriptions |
| `--color-text-muted` | Copyright text, pagination labels, outline links, anchor links, post card meta, empty states |

---

## Borders

| Variable | Description | Light | Dark |
|----------|-------------|-------|------|
| `--color-border-default` | Standard borders on cards, tables, inputs, separators | `#dee2e6` | `#2d2d44` |
| `--color-border-light` | Subtle borders, heading underlines, feature card borders, details/summary | `#e9ecef` | `#3d3d5c` |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--color-border-default` | Navbar bottom border, sidebar right border, footer top border, table cells, pagination borders, post card borders, kbd borders, `hr` elements |
| `--color-border-light` | `h2` bottom border in content, code block borders, feature card borders, details/summary borders |

---

## Brand

| Variable | Description | Light | Dark |
|----------|-------------|-------|------|
| `--color-brand-primary` | Primary accent — links, active states, CTA buttons, blockquote borders | `#0066cc` | `#4da6ff` |
| `--color-brand-secondary` | Secondary accent — hover states, CTA hover, gradient endpoints | `#0052a3` | `#80bfff` |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--color-brand-primary` | All links, active nav links, active sidebar links, active outline links, blockquote left border, pagination hover, tags, hero CTA primary background, feature card icon gradient, feature card hover border |
| `--color-brand-secondary` | Link hover states, hero CTA primary hover, feature card icon gradient endpoint |

---

## Status

| Variable | Description | Light | Dark |
|----------|-------------|-------|------|
| `--color-success` | Success messages, positive indicators | `#28a745` | `#34d058` |
| `--color-warning` | Warning messages, `<mark>` highlight background | `#ffc107` | `#ffdf5d` |
| `--color-error` | Error messages, destructive action indicators | `#dc3545` | `#f97583` |
| `--color-info` | Informational messages, callout backgrounds | `#17a2b8` | `#79c0ff` |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--color-warning` | `<mark>` element background in markdown content |
| `--color-success/error/info` | Custom callout tags, dev toolbar error badges |

---

## Usage Example

```css
/* Card component using color variables */
.card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-primary);
}

.card-header {
  color: var(--color-text-secondary);
}

.card-link {
  color: var(--color-brand-primary);
}

.card-link:hover {
  color: var(--color-brand-secondary);
}
```

---

## Dark Mode Implementation

Colors are defined in `:root` for light mode and overridden in `[data-theme="dark"]`:

```css
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #212529;
  --color-brand-primary: #0066cc;
}

[data-theme="dark"] {
  --color-bg-primary: #1a1a2e;
  --color-text-primary: #eaeaea;
  --color-brand-primary: #4da6ff;
}
```

The `data-theme` attribute is set on `<html>` by the navbar theme toggle. A blocking script in `<head>` reads `localStorage` to prevent flash of wrong theme on page load.

### Tips

- Ensure 4.5:1 contrast ratio between text and background colors (WCAG 2.1 AA)
- Dark mode brand colors should be lighter than light mode brand colors
- Test both modes — some colors that look fine in light mode become unreadable in dark
