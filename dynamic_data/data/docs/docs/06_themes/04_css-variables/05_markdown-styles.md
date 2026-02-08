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
| `.markdown-content pre` | `background-color` | `--color-bg-secondary` |
| | `padding` | `--spacing-md` |
| | `border-radius` | `--border-radius-md` |
| | `border` | `1px solid var(--color-border-light)` |
| | `overflow-x` | `auto` |
| `.markdown-content pre code` | `background` | `none` (overrides inline code bg) |
| | `padding` | `0` |
| | `font-size` | `--font-size-sm` |
| | `line-height` | `--line-height-relaxed` |

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
