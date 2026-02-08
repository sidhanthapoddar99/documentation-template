---
title: Element Variables
description: Complete reference for spacing, dimensions, borders, shadows, transitions, z-index, and opacity variables
---

# Element Variables

Defined in `src/styles/element.css`. These variables provide the dimensional and decorative building blocks that all layout components consume. They define **values only** — how those values are applied to structure is a layout concern.

**Source file:** `src/styles/element.css`

---

## Spacing Scale

A consistent spacing system used for padding, margin, and gaps throughout all components.

| Variable | Description | Value | Pixels |
|----------|-------------|-------|--------|
| `--spacing-0` | No spacing | `0` | 0 |
| `--spacing-px` | Hairline | `1px` | 1px |
| `--spacing-0-5` | Half extra-small | `0.125rem` | 2px |
| `--spacing-xs` | Extra small — tight gaps, list item margins | `0.25rem` | 4px |
| `--spacing-sm` | Small — inner padding, compact gaps | `0.5rem` | 8px |
| `--spacing-md` | Medium — standard padding, paragraph margins, standard gaps | `1rem` | 16px |
| `--spacing-lg` | Large — section padding, generous gaps | `1.5rem` | 24px |
| `--spacing-xl` | Extra large — section separation, large margins | `2rem` | 32px |
| `--spacing-2xl` | 2x large — major section breaks, footer/blog padding | `3rem` | 48px |
| `--spacing-3xl` | 3x large — hero section padding, features section padding | `4rem` | 64px |
| `--spacing-4xl` | 4x large — available for dramatic spacing | `6rem` | 96px |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--spacing-xs` | Navbar link gaps, sidebar section gaps, list item margins, tag gaps, inline code padding |
| `--spacing-sm` | Sidebar link padding, dropdown item padding, tag padding, h2 bottom padding, small gaps |
| `--spacing-md` | Standard padding, paragraph margins, table cell padding, navbar link padding, outline title margin, cache key prefix padding |
| `--spacing-lg` | Container padding, sidebar padding, navbar container padding, section gaps, footer link gaps |
| `--spacing-xl` | Content area padding, hero CTA padding, heading top margins, section separators, pagination top border |
| `--spacing-2xl` | Major section spacing, heading top margins, footer padding, blog index padding |
| `--spacing-3xl` | Hero section padding, features section padding |

---

## Layout Dimensions

Fixed dimensions for structural components. Layouts use these to size major page regions.

| Variable | Description | Value |
|----------|-------------|-------|
| `--max-width-content` | Maximum width of the content container | `1200px` |
| `--max-width-prose` | Maximum width for long-form text (character-based) | `65ch` |
| `--sidebar-width` | Width of the documentation sidebar | `280px` |
| `--outline-width` | Width of the table of contents panel | `220px` |
| `--navbar-height` | Height of the navigation bar | `64px` |
| `--footer-height` | Height of the footer (dynamic) | `auto` |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--max-width-content` | Navbar container, footer container, blog index, features container |
| `--sidebar-width` | Sidebar width, used in layout flex calculations |
| `--outline-width` | Outline panel width |
| `--navbar-height` | Navbar height, sidebar/outline `height: calc(100vh - var(--navbar-height))`, sidebar/outline `top` offset for sticky positioning |

---

## Border Radius

| Variable | Description | Value | Pixels |
|----------|-------------|-------|--------|
| `--border-radius-none` | No rounding | `0` | 0 |
| `--border-radius-sm` | Subtle rounding — inline code, tags, sidebar links | `0.25rem` | 4px |
| `--border-radius-md` | Standard rounding — cards, buttons, code blocks, dropdowns | `0.5rem` | 8px |
| `--border-radius-lg` | Prominent rounding — post cards, blog images, feature cards | `0.75rem` | 12px |
| `--border-radius-xl` | Large rounding | `1rem` | 16px |
| `--border-radius-2xl` | Extra large rounding | `1.5rem` | 24px |
| `--border-radius-full` | Pill shape / circle | `9999px` | — |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--border-radius-sm` | Inline code, kbd, tags, sidebar links, sidebar collapsible headers |
| `--border-radius-md` | Code blocks, navbar links, navbar toggle, dropdowns, pagination links, hero CTA, feature card icon, images in content |
| `--border-radius-lg` | Post cards, blog images, feature cards, details/summary |

---

## Border Width

| Variable | Description | Value |
|----------|-------------|-------|
| `--border-width-0` | No border | `0` |
| `--border-width-1` | Standard border | `1px` |
| `--border-width-2` | Emphasis border | `2px` |
| `--border-width-4` | Heavy border — blockquote left border | `4px` |

---

## Shadows

| Variable | Description | Value |
|----------|-------------|-------|
| `--shadow-none` | No shadow | `none` |
| `--shadow-sm` | Subtle elevation — subtle cards | `0 1px 2px rgba(0, 0, 0, 0.05)` |
| `--shadow-md` | Medium elevation — post card hover, dropdowns | `0 4px 6px rgba(0, 0, 0, 0.1)` |
| `--shadow-lg` | High elevation — dropdown menus, modals | `0 10px 15px rgba(0, 0, 0, 0.1)` |
| `--shadow-xl` | Maximum elevation | `0 20px 25px rgba(0, 0, 0, 0.1)` |
| `--shadow-inner` | Inset shadow for pressed/recessed effect | `inset 0 2px 4px rgba(0, 0, 0, 0.05)` |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--shadow-md` | Post card hover state |
| `--shadow-lg` | Dropdown menus |

---

## Transitions

| Variable | Description | Value |
|----------|-------------|-------|
| `--transition-fast` | Quick interactions — hover color changes, icon opacity | `150ms ease` |
| `--transition-normal` | Standard transitions — card transforms, image zoom | `250ms ease` |
| `--transition-slow` | Deliberate animations — expand/collapse | `350ms ease` |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--transition-fast` | Link hover, navbar link hover, sidebar link hover, footer link hover, theme toggle hover, dropdown icon rotation, anchor link opacity, pagination hover, feature card hover, post card border hover |
| `--transition-normal` | Post card image scale on hover |

---

## Z-Index Scale

Defines stacking order for layered elements.

| Variable | Description | Value |
|----------|-------------|-------|
| `--z-index-dropdown` | Dropdown menus | `1000` |
| `--z-index-sticky` | Sticky navbar, sticky sidebar | `1020` |
| `--z-index-fixed` | Fixed position elements | `1030` |
| `--z-index-modal-backdrop` | Modal overlay background | `1040` |
| `--z-index-modal` | Modal dialog content | `1050` |
| `--z-index-popover` | Popovers, floating panels | `1060` |
| `--z-index-tooltip` | Tooltips (highest priority) | `1070` |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--z-index-sticky` | Navbar (`position: sticky; z-index: 100` — currently hardcoded, should use this variable) |

---

## Opacity

| Variable | Description | Value |
|----------|-------------|-------|
| `--opacity-0` | Fully transparent | `0` |
| `--opacity-25` | 25% visible | `0.25` |
| `--opacity-50` | Half visible | `0.5` |
| `--opacity-75` | 75% visible | `0.75` |
| `--opacity-100` | Fully visible | `1` |

---

## Usage Example

```css
/* Card using element variables */
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

/* Page section */
.section {
  max-width: var(--max-width-content);
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--spacing-lg);
}
```

---

## Responsive Overrides

Layout dimensions can be adjusted at breakpoints:

```css
@media (max-width: 768px) {
  :root {
    --sidebar-width: 100%;
    --navbar-height: 56px;
  }
}
```

> **Note:** CSS custom properties cannot be used inside `@media` query conditions (e.g., `@media (max-width: var(--breakpoint))` does not work). Breakpoint values must be hardcoded in media queries. The canonical breakpoints are documented in [Layout Styles](./layout-styles).
