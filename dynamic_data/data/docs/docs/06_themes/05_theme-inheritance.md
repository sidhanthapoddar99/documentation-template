---
title: Theme Inheritance
description: How themes can extend and override parent themes
sidebar_position: 5
---

# Theme Inheritance

Theme inheritance allows you to create themes that build upon existing themes, overriding only the parts you want to change.

## How Inheritance Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        THEME INHERITANCE FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   @theme/default (Parent)                                                   │
│   ┌─────────────────────────┐                                               │
│   │ reset.css               │                                               │
│   │ color.css               │  ─────┐                                       │
│   │ font.css                │       │                                       │
│   │ element.css             │       │  Loaded first                         │
│   │ markdown.css            │       │                                       │
│   └─────────────────────────┘       │                                       │
│                                     ▼                                       │
│   @theme/my-theme (Child)       Combined CSS                                │
│   ┌─────────────────────────┐       ▲                                       │
│   │ color.css (overrides)   │       │                                       │
│   └─────────────────────────┘  ─────┘  Child overrides                      │
│                                        applied on top                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

When a theme extends another:

1. Parent theme CSS is loaded first
2. Child theme CSS is applied on top
3. CSS variables in child override parent (CSS cascade)
4. Unlisted variables inherit from parent

## Setting Up Inheritance

In your theme's `theme.yaml`, use the `extends` field:

```yaml
name: "My Theme"
version: "1.0.0"
extends: "@theme/default"  # Inherit from default
supports_dark_mode: true

files:
  - color.css    # Only override colors
  - index.css
```

### Available Parent Themes

| Theme | `extends` value | Description |
|-------|-----------------|-------------|
| Default | `@theme/default` | Built-in base theme (`src/styles/`) |
| Any custom | `@theme/<name>` | User themes in `theme_paths` directories |

## Inheritance Examples

### Example 1: Color-Only Override

The simplest inheritance - only change the color palette:

**theme.yaml:**
```yaml
name: "Purple Brand"
version: "1.0.0"
extends: "@theme/default"
supports_dark_mode: true
files:
  - color.css
  - index.css
```

**color.css:**
```css
/* Only override brand colors - inherit all others */
:root {
  --color-brand-primary: #8b5cf6;
  --color-brand-secondary: #7c3aed;
}

[data-theme="dark"] {
  --color-brand-primary: #a78bfa;
  --color-brand-secondary: #8b5cf6;
}
```

**Result:** Your theme has purple brand colors, but all other colors, fonts, spacing, and markdown styles come from the default theme.

### Example 2: Multiple Overrides

Override colors and typography:

**theme.yaml:**
```yaml
name: "Modern Docs"
version: "1.0.0"
extends: "@theme/default"
supports_dark_mode: true
files:
  - color.css
  - font.css
  - index.css
```

**font.css:**
```css
:root {
  /* Use Inter for body text */
  --font-family-base: 'Inter', system-ui, sans-serif;

  /* Slightly larger base size */
  --font-size-base: 1.0625rem;  /* 17px */
}
```

### Example 3: Chained Inheritance

Themes can extend other custom themes:

```
@theme/default
    └── @theme/corporate (extends default)
            └── @theme/corporate-dark (extends corporate)
```

**corporate/theme.yaml:**
```yaml
name: "Corporate"
extends: "@theme/default"
files:
  - color.css
  - font.css
  - index.css
```

**corporate-dark/theme.yaml:**
```yaml
name: "Corporate Dark"
extends: "@theme/corporate"  # Extends corporate, not default
files:
  - color.css  # Only override dark mode colors
  - index.css
```

## Override Modes

The `override_mode` field in `theme.yaml` controls how a child theme's CSS interacts with its parent. If not specified, it defaults to `merge`.

```yaml
name: "My Theme"
version: "1.0.0"
extends: "@theme/default"
override_mode: "merge"  # "merge" | "override" | "replace"
files:
  - element.css
```

### merge (default)

Parent CSS is loaded first, then child CSS is appended after it. The CSS cascade handles the rest — child rules with equal or higher specificity win. Variables not redefined in the child inherit from the parent.

```
Parent CSS (all files)  →  Child CSS (all files)
         loaded first            loaded second, wins cascade
```

This is the safest mode. Use it when you want to tweak a few variables (colors, fonts, spacing) while keeping everything else from the parent.

### override

Parent CSS is loaded, but any parent file whose name matches a child file is **skipped**. The child's version completely replaces that specific file — no cascade, no merge.

```yaml
# Parent has: reset.css, color.css, font.css, element.css, ...
# Child has:  element.css

override_mode: "override"
files:
  - element.css  # Parent's element.css is skipped entirely
```

```
Parent: reset.css ✓  color.css ✓  font.css ✓  element.css ✗ (skipped)
Child:                                         element.css ✓ (replaces it)
```

Use this when you need to completely redefine a CSS layer (e.g. all spacing values in `element.css`) without any parent values bleeding through. Variables that were only defined in the skipped parent file will be **absent** — you must redefine them in your child file.

### replace

Parent CSS is **not loaded at all**. The child theme is fully standalone.

```yaml
override_mode: "replace"
files:
  - color.css
  - font.css
  - element.css
  - markdown.css
```

Use this when building a completely custom design system that shares nothing with the parent. The `extends` field is still useful for chained inheritance validation, but no parent CSS is injected.

### Choosing a Mode

| Mode | Parent CSS loaded? | When to use |
|------|-------------------|-------------|
| `merge` | All files | Tweaking colors, fonts, or spacing |
| `override` | All except matching filenames | Completely replacing specific CSS layers |
| `replace` | None | Fully custom theme, no defaults |

## CSS Cascade Behavior

Understanding how CSS variables cascade is key to inheritance:

```css
/* @theme/default loads first */
:root {
  --color-brand-primary: #0066cc;    /* Blue */
  --color-brand-secondary: #0052a3;
  --color-bg-primary: #ffffff;
}

/* @theme/my-theme loads second (overrides) */
:root {
  --color-brand-primary: #8b5cf6;    /* Purple - overrides blue */
  /* --color-brand-secondary not defined - inherits #0052a3 */
  /* --color-bg-primary not defined - inherits #ffffff */
}
```

### What Gets Overridden

| Scenario | Result |
|----------|--------|
| Variable defined in both | Child wins |
| Variable only in parent | Parent value inherited |
| Variable only in child | New variable added |
| Class/selector in both | Child wins |

## Best Practices

### 1. Extend Default for Consistency

Always extend `@theme/default` unless you have a specific reason not to:

```yaml
# Recommended
extends: "@theme/default"

# Only if creating entirely new design system
extends: null
```

### 2. Override Minimally

Only include files you actually modify:

```yaml
# Good - only includes what's needed
files:
  - color.css
  - index.css

# Unnecessary - includes files with no changes
files:
  - color.css
  - font.css      # If no changes, don't include
  - element.css   # If no changes, don't include
  - index.css
```

### 3. Document Your Overrides

Add comments explaining what you changed:

```css
/* Override: Use brand purple instead of default blue */
:root {
  --color-brand-primary: #8b5cf6;
  --color-brand-secondary: #7c3aed;
}

/* Override: Slightly warmer background */
:root {
  --color-bg-primary: #fefdfb;
}
```

### 4. Test Inherited Values

Verify that inherited variables work correctly:

1. Check that non-overridden colors display correctly
2. Verify font stacks render as expected
3. Test spacing in various components
4. Toggle dark mode to verify both modes work

### 5. Avoid Circular Inheritance

Never create a loop:

```yaml
# Theme A
extends: "@theme/B"  # Bad if B extends A

# Theme B
extends: "@theme/A"  # Circular!
```

The theme system will detect and report circular inheritance errors.

## Troubleshooting

### Variables Not Inheriting

**Symptom:** Child theme missing styles from parent

**Cause:** Usually `extends` is not set or misspelled

**Fix:**
```yaml
# Check extends value
extends: "@theme/default"  # Must use @theme/ prefix in extends
```

### Parent Styles Overwritten

**Symptom:** Everything looks different, not just your changes

**Cause:** Standalone mode (extends: null) or full override

**Fix:** Ensure extends is set and only override specific variables

### Dark Mode Not Working

**Symptom:** Dark mode colors don't apply

**Cause:** Missing `[data-theme="dark"]` selector

**Fix:**
```css
/* Must use this selector for dark mode */
[data-theme="dark"] {
  --color-brand-primary: #a78bfa;
}
```

## Debugging Inheritance

### Check Loaded CSS

In browser dev tools:

1. Inspect the `<style id="theme-styles">` tag
2. Verify parent CSS appears before child CSS
3. Check that variables are defined in correct order

### Check for Errors

Open the dev toolbar:

1. Click "Doc Errors" icon
2. Look for theme errors:
   - `theme-circular-extends` - Circular inheritance detected
   - `theme-not-found` - Parent theme doesn't exist

### Print Resolved Theme

Add temporary logging to see the loaded theme:

```javascript
// In BaseLayout.astro (temporary debugging)
console.log('Theme CSS length:', themeCSS.length);
console.log('First 500 chars:', themeCSS.slice(0, 500));
```
