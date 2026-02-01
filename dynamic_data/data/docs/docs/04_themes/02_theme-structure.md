---
title: Theme Structure
description: Required files and organization for themes
sidebar_position: 2
---

# Theme Structure

This document describes the required file structure and organization for themes.

## Directory Layout

```
themes/
├── theme-name/
│   ├── theme.yaml      # Required: Theme manifest
│   ├── color.css       # Colors (light/dark)
│   ├── font.css        # Typography
│   ├── element.css     # Spacing, borders, etc.
│   ├── markdown.css    # Content rendering
│   └── index.css       # Main entry point
```

## Required Files

### theme.yaml (Required)

The theme manifest file. Defines metadata and lists included files.

```yaml
name: "My Theme"
version: "1.0.0"
description: "A custom documentation theme"
extends: "@theme/default"  # null for standalone
supports_dark_mode: true

files:
  - color.css
  - font.css
  - element.css
  - markdown.css
  - index.css

required_variables:
  colors:
    - --color-bg-primary
    - --color-text-primary
    - --color-brand-primary
  fonts:
    - --font-family-base
    - --font-size-base
  elements:
    - --spacing-md
    - --border-radius-md
```

#### Manifest Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name |
| `version` | string | Yes | Semantic version |
| `description` | string | No | Brief description |
| `extends` | string | No | Parent theme alias (e.g., `@theme/default`) |
| `supports_dark_mode` | boolean | Yes | Whether theme has dark mode styles |
| `files` | array | Yes | List of CSS files to load |
| `required_variables` | object | No | Variables theme must define |

### index.css (Required)

The main entry point. Imports other CSS modules.

```css
/* Theme: My Theme */
@import './color.css';
@import './font.css';
@import './element.css';
@import './markdown.css';
```

For themes that extend default:

```css
/* Only import overrides - parent provides the rest */
@import './color.css';
```

## Optional Files

### color.css

Defines color palette for light and dark modes.

```css
/* =================================
   Light Mode (Default)
   ================================= */
:root {
  /* Backgrounds */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8f9fa;
  --color-bg-tertiary: #e9ecef;

  /* Text */
  --color-text-primary: #212529;
  --color-text-secondary: #495057;
  --color-text-muted: #6c757d;

  /* Borders */
  --color-border-default: #dee2e6;
  --color-border-light: #e9ecef;

  /* Brand */
  --color-brand-primary: #0066cc;
  --color-brand-secondary: #0052a3;

  /* Status */
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-error: #dc3545;
  --color-info: #17a2b8;
}

/* =================================
   Dark Mode
   ================================= */
[data-theme="dark"] {
  /* Backgrounds */
  --color-bg-primary: #1a1a2e;
  --color-bg-secondary: #16213e;
  --color-bg-tertiary: #0f3460;

  /* Text */
  --color-text-primary: #eaeaea;
  --color-text-secondary: #b8b8b8;
  --color-text-muted: #888888;

  /* Borders */
  --color-border-default: #2d2d44;
  --color-border-light: #3d3d5c;

  /* Brand */
  --color-brand-primary: #4da6ff;
  --color-brand-secondary: #80bfff;
}
```

### font.css

Defines typography settings.

```css
:root {
  /* Font Families */
  --font-family-base: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'Fira Code', 'SF Mono', Monaco, Consolas, monospace;

  /* Font Sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-base: 1.6;
  --line-height-relaxed: 1.75;

  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### element.css

Defines UI element properties.

```css
:root {
  /* Spacing Scale */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */

  /* Layout Dimensions */
  --max-width-content: 1200px;
  --sidebar-width: 280px;
  --outline-width: 220px;
  --navbar-height: 64px;

  /* Border Radius */
  --border-radius-sm: 0.25rem;  /* 4px */
  --border-radius-md: 0.5rem;   /* 8px */
  --border-radius-lg: 0.75rem;  /* 12px */
  --border-radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;
}
```

### markdown.css

Styles for rendered markdown content.

```css
/* Headings */
.markdown h1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
}

.markdown h2 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: var(--spacing-sm);
}

/* Code */
.markdown code {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  background-color: var(--color-bg-tertiary);
  padding: 0.2em 0.4em;
  border-radius: var(--border-radius-sm);
}

.markdown pre {
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  overflow-x: auto;
}

.markdown pre code {
  background: none;
  padding: 0;
}

/* Links */
.markdown a {
  color: var(--color-brand-primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.markdown a:hover {
  color: var(--color-brand-secondary);
  text-decoration: underline;
}

/* Lists */
.markdown ul, .markdown ol {
  padding-left: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.markdown li {
  margin-bottom: var(--spacing-xs);
}

/* Blockquotes */
.markdown blockquote {
  border-left: 4px solid var(--color-brand-primary);
  padding-left: var(--spacing-md);
  margin: var(--spacing-md) 0;
  color: var(--color-text-secondary);
  font-style: italic;
}

/* Tables */
.markdown table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--spacing-md) 0;
}

.markdown th, .markdown td {
  border: 1px solid var(--color-border-default);
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
}

.markdown th {
  background-color: var(--color-bg-secondary);
  font-weight: var(--font-weight-semibold);
}

/* Horizontal Rule */
.markdown hr {
  border: none;
  height: 1px;
  background-color: var(--color-border-default);
  margin: var(--spacing-xl) 0;
}
```

## File Loading Order

When a theme is loaded:

1. If `extends` is set, load parent theme first
2. Load files in the order listed in `files` array
3. Later files override earlier ones
4. Child theme overrides parent

```
@theme/default (base)
    └── reset.css
    └── color.css
    └── font.css
    └── element.css
    └── markdown.css
        │
        ▼
@theme/custom (extends default)
    └── color.css (overrides default colors)
```

## Best Practices

1. **Use modular files** - Split by concern (colors, fonts, etc.)
2. **Always define both modes** - Light and dark for consistency
3. **Use semantic names** - `--color-brand-primary` not `--color-blue`
4. **Document variables** - Add comments for complex values
5. **Test inheritance** - Verify parent variables still work
6. **Validate early** - Check dev toolbar for errors
