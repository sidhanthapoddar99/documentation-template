---
title: Font Variables
description: Complete reference for typography CSS custom properties
---

# Font Variables

Defined in `src/styles/font.css`. Typography variables control font families, sizes, weights, line heights, and letter spacing across all components.

**Source file:** `src/styles/font.css`

---

## Font Families

| Variable | Description | Default |
|----------|-------------|---------|
| `--font-family-base` | Body text, headings, UI elements | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif` |
| `--font-family-mono` | Code blocks, inline code, kbd elements | `'Fira Code', 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace` |
| `--font-family-heading` | Heading elements (h1-h6) | `var(--font-family-base)` (inherits from base) |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--font-family-base` | `body` (via reset.css), all UI text inherits from body |
| `--font-family-mono` | `code`, `pre code`, `kbd` elements in markdown content |
| `--font-family-heading` | `h1`–`h6` in markdown content |

---

## Font Sizes

| Variable | Description | Value | Pixels |
|----------|-------------|-------|--------|
| `--font-size-xs` | Labels, badges, metadata captions | `0.75rem` | 12px |
| `--font-size-sm` | Secondary text, nav links, sidebar links, table text | `0.875rem` | 14px |
| `--font-size-base` | Body text, default paragraphs | `1rem` | 16px |
| `--font-size-lg` | Descriptions, `h4` headings, navbar logo text | `1.125rem` | 18px |
| `--font-size-xl` | `h3` headings, blog post descriptions | `1.25rem` | 20px |
| `--font-size-2xl` | `h2` headings | `1.5rem` | 24px |
| `--font-size-3xl` | `h1` headings on mobile | `1.875rem` | 30px |
| `--font-size-4xl` | `h1` headings on desktop, page titles | `2.25rem` | 36px |
| `--font-size-5xl` | Hero titles (large displays) | `3rem` | 48px |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--font-size-xs` | Tag badges, pagination labels, sidebar section headers (uppercase) |
| `--font-size-sm` | Navbar links, sidebar links, outline links, footer links, table text, blog card meta, code block text, copyright |
| `--font-size-base` | Body paragraphs, hero CTA buttons, `h5` in markdown |
| `--font-size-lg` | Descriptions, `h4` in markdown, navbar logo text, feature card titles |
| `--font-size-xl` | `h3` in markdown, blog post descriptions, hero subtitles, post card titles |
| `--font-size-2xl` | `h2` in markdown, blog post content headings |
| `--font-size-3xl` | `h1` at mobile breakpoint (640px) |
| `--font-size-4xl` | `h1` in markdown, docs title, blog post title, blog index title, info page title |
| `--font-size-5xl` | Available for hero/display use cases |

---

## Font Weights

| Variable | Description | Value |
|----------|-------------|-------|
| `--font-weight-normal` | Regular body text | `400` |
| `--font-weight-medium` | Medium emphasis — nav links, sidebar links, active outline links, summary elements | `500` |
| `--font-weight-semibold` | Semi-bold — headings (h2-h6), table headers, `strong`/`b` elements | `600` |
| `--font-weight-bold` | Bold — `h1` headings, page titles | `700` |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--font-weight-medium` | Navbar links, sidebar headers, sidebar active links, outline active links, pagination titles, summary elements |
| `--font-weight-semibold` | h2–h6 headings, table `th` elements, `strong`/`b` in markdown |
| `--font-weight-bold` | h1 headings, page titles, blog post titles |

---

## Line Heights

| Variable | Description | Value |
|----------|-------------|-------|
| `--line-height-tight` | Headings, compact text | `1.25` |
| `--line-height-snug` | Between tight and base | `1.375` |
| `--line-height-base` | Body text, paragraphs, list items | `1.6` |
| `--line-height-relaxed` | Code blocks, spacious text | `1.75` |
| `--line-height-loose` | Extra spacious text | `2` |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--line-height-tight` | h1–h6 headings in markdown content |
| `--line-height-base` | `body` text (via reset.css), paragraphs, list items |
| `--line-height-relaxed` | `pre code` blocks in markdown content |

---

## Letter Spacing

| Variable | Description | Value |
|----------|-------------|-------|
| `--letter-spacing-tight` | Tight tracking for large headings | `-0.025em` |
| `--letter-spacing-normal` | Default tracking | `0` |
| `--letter-spacing-wide` | Wide tracking for labels, uppercase text | `0.025em` |

### Where They're Used

| Variable | Components |
|----------|-----------|
| `--letter-spacing-wide` | Sidebar section headers (with `text-transform: uppercase`), pagination labels |

---

## Usage Example

```css
/* Typography in a card component */
.card-title {
  font-family: var(--font-family-base);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.card-body {
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

.card-code {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
}

.card-meta {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;
}
```

---

## Responsive Typography

Font sizes can be adjusted at breakpoints via theme overrides:

```css
@media (max-width: 768px) {
  :root {
    --font-size-base: 0.9375rem;  /* Slightly smaller on mobile */
    --font-size-4xl: 2rem;        /* Reduce large heading size */
  }
}
```

The hero section uses `clamp()` for fluid typography that scales with viewport width:

```css
.hero__title {
  font-size: clamp(2.5rem, 5vw, 4rem);
}
```
