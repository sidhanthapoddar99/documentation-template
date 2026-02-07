---
title: CSS Variables Reference
description: Complete list of all CSS custom properties used by themes
sidebar_position: 4
---

# CSS Variables Reference

This document lists all CSS custom properties (variables) used by the theming system. All layout components use these variables instead of hardcoded values.

## Color Variables

### Backgrounds

| Variable | Description | Default (Light) | Default (Dark) |
|----------|-------------|-----------------|----------------|
| `--color-bg-primary` | Main page background | `#ffffff` | `#1a1a2e` |
| `--color-bg-secondary` | Secondary/card backgrounds | `#f8f9fa` | `#16213e` |
| `--color-bg-tertiary` | Tertiary/hover backgrounds | `#e9ecef` | `#0f3460` |

### Text

| Variable | Description | Default (Light) | Default (Dark) |
|----------|-------------|-----------------|----------------|
| `--color-text-primary` | Main body text | `#212529` | `#eaeaea` |
| `--color-text-secondary` | Secondary text | `#495057` | `#b8b8b8` |
| `--color-text-muted` | Muted/helper text | `#6c757d` | `#888888` |

### Borders

| Variable | Description | Default (Light) | Default (Dark) |
|----------|-------------|-----------------|----------------|
| `--color-border-default` | Standard borders | `#dee2e6` | `#2d2d44` |
| `--color-border-light` | Subtle borders | `#e9ecef` | `#3d3d5c` |

### Brand

| Variable | Description | Default (Light) | Default (Dark) |
|----------|-------------|-----------------|----------------|
| `--color-brand-primary` | Primary accent (links, buttons) | `#0066cc` | `#4da6ff` |
| `--color-brand-secondary` | Secondary accent (hover states) | `#0052a3` | `#80bfff` |

### Status

| Variable | Description | Default (Light) | Default (Dark) |
|----------|-------------|-----------------|----------------|
| `--color-success` | Success messages/badges | `#28a745` | `#34ce57` |
| `--color-warning` | Warning messages | `#ffc107` | `#ffca2c` |
| `--color-error` | Error messages | `#dc3545` | `#e35d6a` |
| `--color-info` | Info messages | `#17a2b8` | `#3dd5f3` |

### Usage Example

```css
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

## Typography Variables

### Font Families

| Variable | Description | Default |
|----------|-------------|---------|
| `--font-family-base` | Body text | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |
| `--font-family-mono` | Code/monospace | `'Fira Code', 'SF Mono', Monaco, Consolas, monospace` |

### Font Sizes

| Variable | Description | Default |
|----------|-------------|---------|
| `--font-size-xs` | Extra small | `0.75rem` (12px) |
| `--font-size-sm` | Small | `0.875rem` (14px) |
| `--font-size-base` | Base/body | `1rem` (16px) |
| `--font-size-lg` | Large | `1.125rem` (18px) |
| `--font-size-xl` | Extra large | `1.25rem` (20px) |
| `--font-size-2xl` | 2x large | `1.5rem` (24px) |
| `--font-size-3xl` | 3x large | `1.875rem` (30px) |
| `--font-size-4xl` | 4x large | `2.25rem` (36px) |

### Line Heights

| Variable | Description | Default |
|----------|-------------|---------|
| `--line-height-tight` | Headings | `1.25` |
| `--line-height-base` | Body text | `1.6` |
| `--line-height-relaxed` | Spacious text | `1.75` |

### Font Weights

| Variable | Description | Default |
|----------|-------------|---------|
| `--font-weight-normal` | Regular text | `400` |
| `--font-weight-medium` | Medium emphasis | `500` |
| `--font-weight-semibold` | Semi-bold | `600` |
| `--font-weight-bold` | Bold | `700` |

### Usage Example

```css
h1 {
  font-family: var(--font-family-base);
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

code {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
}

p {
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}
```

## Element Variables

### Spacing Scale

| Variable | Description | Default |
|----------|-------------|---------|
| `--spacing-xs` | Extra small | `0.25rem` (4px) |
| `--spacing-sm` | Small | `0.5rem` (8px) |
| `--spacing-md` | Medium (default) | `1rem` (16px) |
| `--spacing-lg` | Large | `1.5rem` (24px) |
| `--spacing-xl` | Extra large | `2rem` (32px) |
| `--spacing-2xl` | 2x large | `3rem` (48px) |

### Layout Dimensions

| Variable | Description | Default |
|----------|-------------|---------|
| `--max-width-content` | Content container | `1200px` |
| `--sidebar-width` | Sidebar width | `280px` |
| `--outline-width` | Table of contents | `220px` |
| `--navbar-height` | Navbar height | `64px` |

### Border Radius

| Variable | Description | Default |
|----------|-------------|---------|
| `--border-radius-sm` | Small radius | `0.25rem` (4px) |
| `--border-radius-md` | Medium radius | `0.5rem` (8px) |
| `--border-radius-lg` | Large radius | `0.75rem` (12px) |
| `--border-radius-full` | Pill/circle | `9999px` |

### Shadows

| Variable | Description | Default |
|----------|-------------|---------|
| `--shadow-sm` | Subtle shadow | `0 1px 2px rgba(0, 0, 0, 0.05)` |
| `--shadow-md` | Medium shadow | `0 4px 6px rgba(0, 0, 0, 0.1)` |
| `--shadow-lg` | Large shadow | `0 10px 15px rgba(0, 0, 0, 0.1)` |

### Transitions

| Variable | Description | Default |
|----------|-------------|---------|
| `--transition-fast` | Quick interactions | `150ms ease` |
| `--transition-normal` | Standard transitions | `250ms ease` |
| `--transition-slow` | Deliberate animations | `350ms ease` |

### Z-Index Scale

| Variable | Description | Default |
|----------|-------------|---------|
| `--z-index-dropdown` | Dropdowns | `100` |
| `--z-index-sticky` | Sticky elements | `200` |
| `--z-index-modal` | Modals/dialogs | `300` |
| `--z-index-tooltip` | Tooltips | `400` |

### Usage Example

```css
.card {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
  transition: box-shadow var(--transition-fast);
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

.sidebar {
  width: var(--sidebar-width);
  padding: var(--spacing-lg);
}
```

## Dark Mode Implementation

Variables are defined in `:root` for light mode and `[data-theme="dark"]` for dark mode:

```css
/* Light mode (default) */
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #212529;
}

/* Dark mode */
[data-theme="dark"] {
  --color-bg-primary: #1a1a2e;
  --color-text-primary: #eaeaea;
}
```

The `data-theme` attribute is set on the `<html>` element when dark mode is toggled.

## Required Variables

When creating a standalone theme (without `extends`), these variables must be defined:

### Colors (Required)

- `--color-bg-primary`
- `--color-bg-secondary`
- `--color-text-primary`
- `--color-brand-primary`

### Fonts (Required)

- `--font-family-base`
- `--font-family-mono`
- `--font-size-base`

### Elements (Required)

- `--spacing-md`
- `--border-radius-md`

## Tips for Custom Values

### Choosing Colors

1. **Contrast** - Ensure sufficient contrast between text and backgrounds (WCAG 2.1 recommends 4.5:1)
2. **Consistency** - Use a coherent color palette
3. **Dark mode** - Test readability in both modes

### Spacing Consistency

Use the spacing scale consistently:

```css
/* Good - uses spacing scale */
.element {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

/* Avoid - arbitrary values */
.element {
  padding: 17px;
  margin-bottom: 23px;
}
```

### Responsive Considerations

Layout variables can be adjusted for mobile:

```css
@media (max-width: 768px) {
  :root {
    --sidebar-width: 100%;
    --navbar-height: 56px;
    --font-size-base: 0.9375rem;
  }
}
```
