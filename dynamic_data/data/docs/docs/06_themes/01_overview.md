---
title: Themes Overview
description: Introduction to the theming system and how it works
sidebar_position: 1
---

# Themes Overview

The theming system provides a modular, customizable way to style your documentation site. Themes control colors, typography, spacing, and other visual elements.

## How Themes Work

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THEME LOADING FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   site.yaml                                                                 │
│   theme: "@theme/minimal"                                                   │
│        │                                                                    │
│        ▼                                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   Config Loader (loadSiteConfig)     │                                  │
│   │   1. Resolve @theme → absolute path  │                                  │
│   │      (once, at config load time)     │                                  │
│   └──────────────────────────────────────┘                                  │
│        │                                                                    │
│        ▼                                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   Theme Loader                       │                                  │
│   │   1. Load theme.yaml manifest        │                                  │
│   │   2. Check extends (inheritance)     │                                  │
│   │   3. Load CSS files                  │                                  │
│   │   4. Validate theme                  │                                  │
│   └──────────────────────────────────────┘                                  │
│        │                                                                    │
│        ▼                                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   BaseLayout.astro                   │                                  │
│   │   Injects theme CSS in <head>        │                                  │
│   └──────────────────────────────────────┘                                  │
│        │                                                                    │
│        ▼                                                                    │
│   ┌──────────────────────────────────────┐                                  │
│   │   Page renders with theme styles     │                                  │
│   └──────────────────────────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Default vs Custom Themes

| Type | Location | Reference |
|------|----------|-----------|
| Default (built-in) | `src/styles/` | `@theme/default` |
| Custom | `themes/<name>/` | `@theme/<name>` |

### Default Theme

The built-in theme located in `src/styles/`. Always available and serves as the base for custom themes.

### Custom Themes

User-created themes in the themes directory (configured via `paths.themes` in `site.yaml`). Can extend the default theme or be standalone.

## Quick Start

### Using the Default Theme

```yaml
# site.yaml
site:
  name: "My Docs"

theme: "@theme/default"  # Required — explicitly specify the theme
```

> **Note:** The `theme` field is required in `site.yaml`. An error will be thrown if it is missing.

### Using a Custom Theme

```yaml
# site.yaml
site:
  name: "My Docs"

theme: "@theme/minimal"  # Use the "minimal" theme from themes directory
```

### Creating a Simple Theme

1. Create theme directory:
```
dynamic_data/themes/my-theme/
├── theme.yaml
├── color.css
└── index.css
```

2. Create manifest (`theme.yaml`):
```yaml
name: "My Theme"
version: "1.0.0"
extends: "@theme/default"
supports_dark_mode: true
files:
  - color.css
  - index.css
```

3. Override colors (`color.css`):
```css
:root {
  --color-brand-primary: #8b5cf6;
  --color-brand-secondary: #7c3aed;
}

[data-theme="dark"] {
  --color-brand-primary: #a78bfa;
  --color-brand-secondary: #8b5cf6;
}
```

4. Import in `index.css`:
```css
@import './color.css';
```

5. Use in site.yaml:
```yaml
theme: "@theme/my-theme"
```

## Theme Structure

Every theme consists of:

```
theme-name/
├── theme.yaml     # Required: Theme manifest
├── color.css      # Colors (light/dark mode)
├── font.css       # Typography
├── element.css    # Spacing, borders, shadows
├── markdown.css   # Content rendering
└── index.css      # Main entry point
```

See [Theme Structure](/docs/themes/theme-structure) for details.

## Theme Inheritance

Themes can extend other themes, only overriding specific values:

```yaml
# theme.yaml
name: "Corporate Blue"
extends: "@theme/default"  # Inherit from default
files:
  - color.css  # Only override colors
```

This loads default theme CSS first, then applies your overrides.

See [Theme Inheritance](/docs/themes/theme-inheritance) for details.

## Dark Mode Support

Themes can support both light and dark modes:

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

The `[data-theme="dark"]` selector is applied to `<html>` when dark mode is active.

## CSS Variables

Themes work by defining CSS custom properties (variables). **All layouts, components, and custom tags MUST use these variables instead of hardcoded values.** This is a strict requirement - see [Theme Compliance Rules](/docs/themes/rules) for details.

### Color Variables
```css
--color-bg-primary      /* Main background */
--color-text-primary    /* Main text */
--color-brand-primary   /* Links, buttons */
```

### Font Variables
```css
--font-family-base      /* Body text */
--font-family-mono      /* Code */
--font-size-base        /* Default size */
```

### Element Variables
```css
--spacing-md            /* Standard spacing */
--border-radius-md      /* Rounded corners */
--shadow-md             /* Box shadows */
```

See [CSS Variables Reference](/docs/themes/css-variables) for the complete list.

## Validation

Themes are validated at load time. The dev toolbar shows any errors:

- Missing required files
- Missing CSS variables
- Invalid manifest format

See [Theme Validation](/docs/themes/validation) for details.

## Next Steps

- [Theme Structure](/docs/themes/theme-structure) - Detailed file organization
- [Creating Themes](/docs/themes/creating-themes) - Step-by-step guide
- [CSS Variables](/docs/themes/css-variables) - Complete variable reference
- [Theme Compliance Rules](/docs/themes/rules) - Required rules for layouts and components
