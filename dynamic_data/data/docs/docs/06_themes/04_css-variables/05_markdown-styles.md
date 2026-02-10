---
title: Markdown Styles
description: How rendered markdown content is styled using theme variables
---

# Markdown Styles

Defined in `src/styles/markdown.css`. These styles apply to rendered markdown/MDX content and are scoped under the `.markdown-content` class to prevent leaking into navbar, sidebar, footer, and other structural components.

**Source file:** `src/styles/markdown.css`

---

## Scoping

All markdown styles are scoped to `.markdown-content`. This class is applied to the content container in each layout:

| Layout | Container | Class |
|--------|-----------|-------|
| Docs | `<div class="docs-body">` | `docs-body markdown-content` |
| Blog | `<div class="blog-post__content">` | `blog-post__content markdown-content` |
| Custom | `<div class="info-page__content">` | `info-page__content markdown-content` |

Elements **outside** `.markdown-content` (navbar links, sidebar headings, footer tables) are not affected by these rules.

---

## Global Body Styles

The only non-scoped rule — applies to the `body` element:

| Property | Variable | Description |
|----------|----------|-------------|
| `background-color` | `--color-bg-primary` | Page background |
| `color` | `--color-text-primary` | Default text color |
| `font-family` | `--font-family-base` | Default body font |

---

## Links

| Selector | Property | Variable |
|----------|----------|----------|
| `.markdown-content a` | `color` | `--color-brand-primary` |
| | `text-decoration` | `none` |
| | `transition` | `color var(--transition-fast)` |
| `.markdown-content a:hover` | `color` | `--color-brand-secondary` |
| | `text-decoration` | `underline` |

---

## Inline Code

| Selector | Property | Variable |
|----------|----------|----------|
| `.markdown-content code` | `font-family` | `--font-family-mono` |
| | `font-size` | `0.9em` (relative to parent) |
| | `background-color` | `--color-bg-tertiary` |
| | `padding` | `0.2em 0.4em` |
| | `border-radius` | `--border-radius-sm` |

---

## Code Blocks

| Selector | Property | Variable |
|----------|----------|----------|
| `.markdown-content pre` | `padding` | `--spacing-md` |
| | `border-radius` | `--border-radius-md` |
| | `border` | `1px solid var(--color-border-light)` |
| | `overflow-x` | `auto` |
| `.markdown-content pre code` | `background` | `none` (overrides inline code bg) |
| | `padding` | `0` |
| | `font-size` | `--font-size-sm` |
| | `line-height` | `--line-height-relaxed` |

### Syntax Highlighting (Shiki)

Code blocks are syntax-highlighted at build time using Shiki with dual themes (`github-light` / `github-dark`). The generated HTML uses CSS custom properties for theme switching:

| Selector | Property | Description |
|----------|----------|-------------|
| `.markdown-content .shiki` | `color` | `var(--shiki-light)` in light mode |
| | `background-color` | `var(--shiki-light-bg)` in light mode |
| `[data-theme="dark"] .markdown-content .shiki` | `color` | `var(--shiki-dark)` in dark mode |
| | `background-color` | `var(--shiki-dark-bg)` in dark mode |

The same selectors apply to `.shiki span` elements (individual tokens). Theme switching is instant via CSS — no JavaScript re-rendering needed.

### Language Label & Copy Button

Each code block displays a language label (e.g. `python`, `typescript`) in the top-right corner. On hover over the code block, the label switches to a copy icon with "Copy" text. Clicking copies the code to the clipboard.

| Selector | Property | Variable |
|----------|----------|----------|
| `.code-label` | `position` | `absolute` (top-right of `pre`) |
| | `font-family` | `--font-family-base` |
| | `font-size` | `0.7rem` |
| | `padding` | `0.25rem 0.5rem` |
| | `border-radius` | `--border-radius-sm` |
| | `color` | `--color-text-secondary` |
| | `opacity` | `0.5` (muted when idle) |
| `.markdown-content pre:hover .code-label` | `opacity` | `1` |
| | `background-color` | `--color-bg-tertiary` |
| | `color` | `--color-text-primary` |
| | `cursor` | `pointer` |
| `.code-label--copied` | `color` | `--color-success` (fallback `#22c55e`) |

**Behavior:** The label uses `display: inline-flex` with `gap: 0.3rem` to align the inline SVG icon with the text.

---

## Headings

All headings share base styles:

| Property | Variable |
|----------|----------|
| `font-family` | `--font-family-heading` |
| `font-weight` | `--font-weight-semibold` |
| `line-height` | `--line-height-tight` |
| `color` | `--color-text-primary` |
| `margin-top` | `--spacing-xl` |
| `margin-bottom` | `--spacing-md` |

Individual heading sizes:

| Heading | Font Size Variable | Additional Styles |
|---------|-------------------|-------------------|
| `h1` | `--font-size-4xl` | `font-weight: var(--font-weight-bold)`, `margin-top: 0` |
| `h2` | `--font-size-2xl` | `padding-bottom: var(--spacing-sm)`, `border-bottom: 1px solid var(--color-border-light)` |
| `h3` | `--font-size-xl` | — |
| `h4` | `--font-size-lg` | — |
| `h5` | `--font-size-base` | — |
| `h6` | `--font-size-sm` | `color: var(--color-text-secondary)` |

---

## Paragraphs

| Selector | Property | Variable |
|----------|----------|----------|
| `.markdown-content p` | `margin-bottom` | `--spacing-md` |
| | `line-height` | `--line-height-base` |

---

## Lists

| Selector | Property | Variable |
|----------|----------|----------|
| `.markdown-content ul, ol` | `padding-left` | `--spacing-lg` |
| | `margin-bottom` | `--spacing-md` |
| `.markdown-content li` | `margin-bottom` | `--spacing-xs` |
| | `line-height` | `--line-height-base` |
| `.markdown-content li > ul, li > ol` | `margin-top` | `--spacing-xs` |
| | `margin-bottom` | `0` |

---

## Blockquotes

| Selector | Property | Variable |
|----------|----------|----------|
| `.markdown-content blockquote` | `border-left` | `4px solid var(--color-brand-primary)` |
| | `padding-left` | `--spacing-md` |
| | `margin` | `var(--spacing-md) 0` |
| | `color` | `--color-text-secondary` |
| | `font-style` | `italic` |

---

## Tables

| Selector | Property | Variable |
|----------|----------|----------|
| `.markdown-content table` | `width` | `100%` |
| | `margin` | `var(--spacing-md) 0` |
| | `font-size` | `--font-size-sm` |
| `.markdown-content th, td` | `border` | `1px solid var(--color-border-default)` |
| | `padding` | `var(--spacing-sm) var(--spacing-md)` |
| `.markdown-content th` | `background-color` | `--color-bg-secondary` |
| | `font-weight` | `--font-weight-semibold` |
| `.markdown-content tr:nth-child(even)` | `background-color` | `--color-bg-secondary` |

---

## Horizontal Rules

| Selector | Property | Variable |
|----------|----------|----------|
| `.markdown-content hr` | `height` | `1px` |
| | `background-color` | `--color-border-default` |
| | `margin` | `var(--spacing-xl) 0` |

---

## Images

| Selector | Property | Variable |
|----------|----------|----------|
| `.markdown-content img` | `max-width` | `100%` |
| | `border-radius` | `--border-radius-md` |

---

## Other Elements

| Element | Key Properties |
|---------|---------------|
| `strong`, `b` | `font-weight: var(--font-weight-semibold)` |
| `em`, `i` | `font-style: italic` |
| `mark` | `background-color: var(--color-warning)`, `border-radius: var(--border-radius-sm)` |
| `kbd` | `font-family: var(--font-family-mono)`, `background-color: var(--color-bg-tertiary)`, `border: 1px solid var(--color-border-default)` |
| `abbr[title]` | `text-decoration: underline dotted`, `cursor: help` |
| `details` | `background-color: var(--color-bg-secondary)`, `border: 1px solid var(--color-border-light)`, `border-radius: var(--border-radius-md)` |
| `summary` | `font-weight: var(--font-weight-medium)`, `cursor: pointer` |

---

## Diagram Containers

Styles for Mermaid and Graphviz diagram blocks rendered from fenced code blocks.

| Selector | Property | Variable |
|----------|----------|----------|
| `.markdown-content .diagram` | `text-align` | `center` |
| | `margin` | `var(--spacing-lg) 0` |
| | `padding` | `--spacing-md` |
| | `background-color` | `--color-bg-secondary` |
| | `border-radius` | `--border-radius-md` |
| | `border` | `1px solid var(--color-border-light)` |
| | `overflow-x` | `auto` |
| `.markdown-content .diagram-rendered` | `background` | `none` (cleared after SVG render) |
| | `border` | `none` |
| `.markdown-content .diagram-error` | `color` | `--color-error` (fallback `#e53e3e`) |
| | `font-style` | `italic` |
| `.markdown-content .diagram svg` | `max-width` | `100%` |
| | `height` | `auto` |

---

## Lightbox

Full-screen overlay for click-to-expand on images and rendered diagrams.

| Selector | Property | Value |
|----------|----------|-------|
| `.lightbox-overlay` | `position` | `fixed`, `inset: 0` |
| | `z-index` | `9999` |
| | `background` | `rgba(0, 0, 0, 0.85)` |
| | `cursor` | `zoom-out` |
| | `transition` | `opacity 0.2s ease` |
| `.lightbox-overlay.lightbox-open` | `opacity` | `1`, `visibility: visible` |
| `.lightbox-content` | `max-width` | `90vw` |
| | `max-height` | `90vh` |
| | `transition` | `transform 0.2s ease` (scale 0.95 → 1) |
| `.lightbox-img` | `object-fit` | `contain` |
| | `border-radius` | `--border-radius-md` |
| `.lightbox-svg` | `background` | `white` |
| | `padding` | `1rem` |

The lightbox is not scoped to `.markdown-content` — it is appended to `<body>` as a global overlay.
