---
title: Theme Validation
description: Understanding theme validation and fixing common errors
sidebar_position: 6
---

# Theme Validation

The theming system validates themes at load time to catch errors early. This document covers the validation process, error types, and how to fix common issues.

## Validation Overview

When a theme is loaded in development mode, the system checks:

1. **Manifest validity** - theme.yaml exists and has required fields
2. **File existence** - All files listed in manifest exist
3. **Required variables** - Essential CSS variables are defined
4. **Inheritance chain** - No circular extends references

## Viewing Validation Errors

### Dev Toolbar

The easiest way to see theme errors:

1. Start the dev server (`npm run start`)
2. Open the dev toolbar (bottom of page)
3. Click the "Doc Errors" icon (warning triangle)
4. Theme errors appear with the `theme-*` badge

### Console Output

Theme errors are also logged to the terminal:

```
[theme] Error: Theme file not found: color.css
[theme] Error: Required CSS variable not defined: --color-brand-primary
```

## Error Types

### theme-not-found

**Meaning:** The theme directory doesn't exist

**Example:**
```
Theme not found: @theme/my-theme
```

**Causes:**
- Theme directory doesn't exist
- Typo in theme name
- Theme directory path not configured in `site.yaml` `paths:` section

**Fix:**
```yaml
# site.yaml - verify theme name and paths
paths:
  themes: "../themes"   # Ensure themes directory is configured

theme: "@theme/my-theme"  # Check spelling

# Verify directory exists:
# dynamic_data/themes/my-theme/
```

### theme-invalid-manifest

**Meaning:** theme.yaml is missing or malformed

**Example:**
```
Theme manifest (theme.yaml) not found in: @theme/my-theme
```

**Causes:**
- theme.yaml doesn't exist
- YAML syntax error
- Missing required fields

**Fix:**

Create a valid theme.yaml:
```yaml
# Required fields
name: "My Theme"
version: "1.0.0"
supports_dark_mode: true
files:
  - index.css
```

Check for YAML syntax errors:
```yaml
# Wrong - no space after colon
name:"My Theme"

# Right
name: "My Theme"
```

### theme-missing-file

**Meaning:** A CSS file listed in manifest doesn't exist

**Example:**
```
Theme file not found: color.css
Suggestion: Create the file at: /path/to/themes/my-theme/color.css
```

**Causes:**
- File doesn't exist
- Typo in filename
- Wrong file extension

**Fix:**

Option 1 - Create the file:
```bash
touch dynamic_data/themes/my-theme/color.css
```

Option 2 - Remove from manifest:
```yaml
files:
  - color.css    # Remove if not needed
  - index.css
```

### theme-missing-variable

**Meaning:** A required CSS variable is not defined

**Example:**
```
Required CSS variable not defined: --color-brand-primary
Suggestion: Add "--color-brand-primary: <value>;" to your theme CSS
```

**Causes:**
- Variable not defined in any CSS file
- Typo in variable name
- Standalone theme missing required variable

**Fix:**

Add the variable:
```css
:root {
  --color-brand-primary: #0066cc;
}
```

Or extend the default theme (which defines all required variables):
```yaml
extends: "@theme/default"
```

### theme-circular-extends

**Meaning:** Themes form a circular inheritance chain

**Example:**
```
Circular theme inheritance detected: @theme/A
```

**Causes:**
- Theme A extends Theme B which extends Theme A

**Fix:**

Break the circular reference:
```yaml
# Theme A
extends: "@theme/default"  # Don't extend B if B extends A

# Theme B
extends: "@theme/A"  # This is fine if A extends default
```

## Required Variables List

When creating a standalone theme (extends: null), these must be defined:

### Colors

```css
:root {
  /* Required colors */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8f9fa;
  --color-text-primary: #212529;
  --color-brand-primary: #0066cc;
}
```

### Fonts

```css
:root {
  /* Required fonts */
  --font-family-base: system-ui, sans-serif;
  --font-family-mono: monospace;
  --font-size-base: 1rem;
}
```

### Elements

```css
:root {
  /* Required elements */
  --spacing-md: 1rem;
  --border-radius-md: 0.5rem;
}
```

## Validation Behavior

### Development Mode

- Full validation on every theme load
- Errors displayed in dev toolbar
- Warnings logged to console
- Site continues to render (graceful degradation)

### Production Build

- Minimal validation (existence checks)
- Errors cause build to fail
- No console warnings

## Fixing Common Issues

### Issue: All Styles Missing

**Symptom:** Page has no styling

**Check:**
1. Is theme specified in site.yaml?
2. Does theme directory exist?
3. Does theme have index.css?
4. Is index.css listed in files?

**Debug:**
```yaml
# site.yaml
theme: "@theme/default"  # Try reverting to default
```

### Issue: Some Variables Not Applied

**Symptom:** Partial styling (some colors work, others don't)

**Check:**
1. Are all variables spelled correctly?
2. Is dark mode selector correct?
3. Are variables defined in loaded files?

**Debug:**
```css
/* Check browser devtools for computed value */
.element {
  background: var(--color-bg-primary, red);  /* Red = not loaded */
}
```

### Issue: Inheritance Not Working

**Symptom:** Parent styles not applying

**Check:**
1. Is extends field correct?
2. Is parent theme name spelled correctly?
3. Does parent theme exist?

**Debug:**
```yaml
extends: "@theme/default"  # Must include @theme/
```

### Issue: Dark Mode Broken

**Symptom:** Dark mode uses light colors

**Check:**
1. Are dark mode variables defined?
2. Is selector `[data-theme="dark"]`?
3. Do both modes define same variables?

**Debug:**
```css
/* Must use exact selector */
[data-theme="dark"] {
  --color-bg-primary: #1a1a2e;
}

/* These won't work */
.dark { }
[theme="dark"] { }
```

## Disabling Validation

For performance in large projects, validation can be disabled:

```typescript
// In theme.ts (not recommended)
const SKIP_VALIDATION = true;
```

However, this is not recommended as it masks real issues.

## Best Practices

1. **Run dev server often** - Catch errors early
2. **Check dev toolbar** - Before committing changes
3. **Test both modes** - Light and dark
4. **Extend default** - Unless you need full control
5. **Keep manifest updated** - List all files you use
6. **Document variables** - Comment non-obvious values
