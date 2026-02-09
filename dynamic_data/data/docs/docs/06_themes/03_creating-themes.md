---
title: Creating Themes
description: Step-by-step guide to creating your own custom theme
sidebar_position: 3
---

# Creating Themes

This guide walks you through creating a custom theme from scratch.

## Prerequisites

- Basic understanding of CSS custom properties (variables)
- Familiarity with the theme structure (see [Theme Structure](/docs/themes/theme-structure))

## Quick Start: Color-Only Theme

The simplest theme only overrides colors while inheriting everything else from the default theme.

### Step 1: Create Theme Directory

```bash
mkdir -p dynamic_data/themes/my-brand
```

### Step 2: Create Theme Manifest

Create `dynamic_data/themes/my-brand/theme.yaml`:

```yaml
name: "My Brand Theme"
version: "1.0.0"
description: "Corporate brand colors"
extends: "@theme/default"
supports_dark_mode: true

files:
  - color.css
  - index.css
```

### Step 3: Create Color Overrides

Create `dynamic_data/themes/my-brand/color.css`:

```css
/* My Brand Theme - Colors */

/* Light Mode */
:root {
  /* Brand colors */
  --color-brand-primary: #8b5cf6;    /* Purple */
  --color-brand-secondary: #7c3aed;

  /* Optional: override other colors */
  --color-bg-primary: #fefefe;
  --color-text-primary: #18181b;
}

/* Dark Mode */
[data-theme="dark"] {
  --color-brand-primary: #a78bfa;
  --color-brand-secondary: #8b5cf6;

  --color-bg-primary: #09090b;
  --color-text-primary: #fafafa;
}
```

### Step 4: Create Entry Point

Create `dynamic_data/themes/my-brand/index.css`:

```css
/* My Brand Theme */
@import './color.css';
```

### Step 5: Use the Theme

Update `dynamic_data/config/site.yaml`:

```yaml
site:
  name: "My Docs"

paths:
  themes: "../themes"  # Directory containing your theme

theme: "my-brand"
theme_paths:
  - "@themes"           # Scan this directory for user themes
```

### Step 6: Verify

1. Start the dev server (`npm run start`)
2. Open your site in the browser
3. Verify brand colors are applied
4. Toggle dark mode to check dark theme
5. Check dev toolbar for any validation errors

## Full Custom Theme

For complete control, create a standalone theme without extending default.

### Directory Structure

```
dynamic_data/themes/corporate/
├── theme.yaml
├── color.css
├── font.css
├── element.css
├── markdown.css
├── reset.css
└── index.css
```

### Theme Manifest

```yaml
name: "Corporate Theme"
version: "1.0.0"
description: "Enterprise documentation theme"
extends: null  # Standalone - no parent
supports_dark_mode: true

files:
  - reset.css
  - color.css
  - font.css
  - element.css
  - markdown.css
  - index.css

required_variables:
  colors:
    - --color-bg-primary
    - --color-bg-secondary
    - --color-text-primary
    - --color-brand-primary
  fonts:
    - --font-family-base
    - --font-family-mono
    - --font-size-base
  elements:
    - --spacing-md
    - --border-radius-md
```

### Color Variables

Create `color.css` with all required color variables:

```css
/* Light Mode */
:root {
  /* Backgrounds */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f7f7f8;
  --color-bg-tertiary: #ebebed;

  /* Text */
  --color-text-primary: #1f2937;
  --color-text-secondary: #4b5563;
  --color-text-muted: #9ca3af;

  /* Borders */
  --color-border-default: #e5e7eb;
  --color-border-light: #f3f4f6;

  /* Brand */
  --color-brand-primary: #2563eb;
  --color-brand-secondary: #1d4ed8;

  /* Status */
  --color-success: #059669;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-info: #0891b2;
}

/* Dark Mode */
[data-theme="dark"] {
  --color-bg-primary: #111827;
  --color-bg-secondary: #1f2937;
  --color-bg-tertiary: #374151;

  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-text-muted: #9ca3af;

  --color-border-default: #374151;
  --color-border-light: #4b5563;

  --color-brand-primary: #60a5fa;
  --color-brand-secondary: #93c5fd;
}
```

### Typography Variables

Create `font.css`:

```css
:root {
  /* Families */
  --font-family-base: 'Inter', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;

  /* Sizes */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-base: 1.6;
  --line-height-relaxed: 1.75;

  /* Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### Element Variables

Create `element.css`:

```css
:root {
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Layout */
  --max-width-content: 1200px;
  --sidebar-width: 260px;
  --outline-width: 200px;
  --navbar-height: 56px;

  /* Borders */
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.375rem;
  --border-radius-lg: 0.5rem;
  --border-radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.12);

  /* Transitions */
  --transition-fast: 100ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;

  /* Z-Index Scale */
  --z-index-dropdown: 100;
  --z-index-sticky: 200;
  --z-index-modal: 300;
  --z-index-tooltip: 400;
}
```

### Entry Point

Create `index.css`:

```css
/* Corporate Theme */
@import './reset.css';
@import './color.css';
@import './font.css';
@import './element.css';
@import './markdown.css';
```

## Testing Your Theme

### Visual Testing

1. **Check all pages** - Navigate through docs, blog, and custom pages
2. **Toggle dark mode** - Verify all colors adapt correctly
3. **Check code blocks** - Syntax highlighting should be readable
4. **Test responsive** - Theme should work on mobile

### Validation Testing

1. Open the dev toolbar (bottom of page in dev mode)
2. Click the "Doc Errors" icon
3. Look for any theme-related errors:
   - `theme-missing-file` - CSS file not found
   - `theme-missing-variable` - Required variable not defined
   - `theme-invalid-manifest` - theme.yaml is malformed

### Common Issues

#### Variables Not Applied

```css
/* Wrong - typo in variable name */
.button { color: var(--color-brand-primry); }

/* Right */
.button { color: var(--color-brand-primary); }
```

#### Dark Mode Not Working

```css
/* Wrong - missing selector */
:root {
  --color-bg-primary: #000;  /* This affects both modes */
}

/* Right */
[data-theme="dark"] {
  --color-bg-primary: #000;  /* Only dark mode */
}
```

#### Inheritance Not Loading

```yaml
# Wrong - invalid extends reference
extends: "default"

# Right - use @theme alias
extends: "@theme/default"
```

## Theme Checklist

Before publishing your theme:

- [ ] All required CSS files exist
- [ ] Light mode colors defined
- [ ] Dark mode colors defined
- [ ] theme.yaml has name, version, files
- [ ] No validation errors in dev toolbar
- [ ] Tested on all page types
- [ ] Code blocks are readable
- [ ] Links are visible and distinct

## Important: Compliance Rules

When creating custom layouts or components for your theme, you **MUST** follow the [Theme Compliance Rules](/docs/themes/rules). Key requirements:

- No hardcoded colors (use `--color-*` variables)
- No hardcoded font sizes (use `--font-size-*` variables)
- No hardcoded spacing (use `--spacing-*` variables)
- All elements must work in both light and dark modes

See [Theme Compliance Rules](/docs/themes/rules) for the complete list.

## Next Steps

- [CSS Variables Reference](/docs/themes/css-variables/overview) - Complete variable list
- [Theme Inheritance](/docs/themes/theme-inheritance) - Advanced inheritance patterns
- [Validation](/docs/themes/validation) - Understanding theme validation
- [Theme Compliance Rules](/docs/themes/rules) - Required rules for layouts and components
