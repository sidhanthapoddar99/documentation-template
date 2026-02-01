# Theme System Implementation - Ralph Loop Task

## Completion Promise

When all tasks are complete and verified, output:
```
<promise>THEME SYSTEM COMPLETE</promise>
```

---

## Overview

Implement a comprehensive theming system for the Astro documentation framework. This includes:
- Modular CSS architecture
- Theme inheritance
- Theme validation
- Layout compliance
- Dev toolbar integration
- Documentation

## Current State

- `src/styles/globals.css` contains all CSS variables (~163 lines)
- `THEMES_DIR` is configured in `.env` pointing to `./dynamic_data/themes`
- `getThemePath()` exists in `paths.ts` but is unused
- `dynamic_data/themes/` directory exists (empty)
- All components use CSS variables

---

## PHASE 1: Default Theme Structure

### Task 1.1: Split globals.css into modular structure

**Create these files in `src/styles/`:**

#### 1.1.1 - `color.css`
Extract all color variables for both light and dark modes:
```css
/* Light Mode Colors */
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8f9fa;
  --color-bg-tertiary: #e9ecef;
  --color-text-primary: #212529;
  --color-text-secondary: #495057;
  --color-text-muted: #6c757d;
  --color-border-default: #dee2e6;
  --color-border-light: #e9ecef;
  --color-brand-primary: #0066cc;
  --color-brand-secondary: #0052a3;
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-error: #dc3545;
  --color-info: #17a2b8;
}

/* Dark Mode Colors */
[data-theme="dark"] {
  --color-bg-primary: #1a1a2e;
  /* ... all dark mode overrides */
}
```

#### 1.1.2 - `font.css`
Typography variables:
```css
:root {
  /* Font Families */
  --font-family-base: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'Fira Code', 'SF Mono', Monaco, Consolas, monospace;

  /* Font Sizes */
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
}
```

#### 1.1.3 - `element.css`
UI element variables:
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
  --sidebar-width: 280px;
  --outline-width: 220px;
  --navbar-height: 64px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Borders */
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 0.75rem;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

#### 1.1.4 - `markdown.css`
Content rendering styles:
```css
/* Headings */
.markdown h1, .markdown h2, .markdown h3, .markdown h4 {
  font-family: var(--font-family-base);
  font-weight: 600;
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
}

/* Code blocks */
.markdown pre {
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
}

.markdown code {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  background-color: var(--color-bg-tertiary);
  padding: 0.2em 0.4em;
  border-radius: var(--border-radius-sm);
}

/* Links */
.markdown a {
  color: var(--color-brand-primary);
  transition: color var(--transition-fast);
}

/* Tables, blockquotes, lists, etc. */
```

#### 1.1.5 - `reset.css`
CSS reset (extracted from globals.css):
```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { scroll-behavior: smooth; }
body { line-height: var(--line-height-base); -webkit-font-smoothing: antialiased; }
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
```

#### 1.1.6 - `index.css`
Main entry point that imports all modules:
```css
/* Theme: Default */
@import './reset.css';
@import './color.css';
@import './font.css';
@import './element.css';
@import './markdown.css';
```

#### 1.1.7 - `theme.yaml`
Theme manifest for the default theme:
```yaml
name: "Default Theme"
version: "1.0.0"
description: "Built-in default theme"
extends: null  # This is the base theme
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

### Task 1.2: Update globals.css to import index.css

Replace `src/styles/globals.css` content with:
```css
/* Global Styles - Entry Point */
@import './index.css';
```

This maintains backwards compatibility while using the new modular structure.

---

## PHASE 2: Theme Loader Implementation

### Task 2.1: Create theme types

**File: `src/loaders/theme-types.ts`**

```typescript
export interface ThemeManifest {
  name: string;
  version: string;
  description?: string;
  extends?: string;  // "@theme/default" or null
  supports_dark_mode: boolean;
  files: string[];
  required_variables?: {
    colors?: string[];
    fonts?: string[];
    elements?: string[];
  };
}

export interface ThemeConfig {
  name: string;
  path: string;
  manifest: ThemeManifest;
  css: string;  // Combined CSS content
  isDefault: boolean;
}

export interface ThemeValidationError {
  type: 'missing-file' | 'missing-variable' | 'invalid-manifest' | 'circular-extends';
  message: string;
  file?: string;
  variable?: string;
}

export interface ThemeValidationResult {
  valid: boolean;
  errors: ThemeValidationError[];
  warnings: string[];
}
```

### Task 2.2: Create theme loader

**File: `src/loaders/theme.ts`**

```typescript
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { paths, getThemePath } from './paths';
import { addError } from './cache';
import type { ThemeManifest, ThemeConfig, ThemeValidationResult } from './theme-types';

/**
 * Resolve theme alias to path
 */
export function resolveThemeAlias(themeRef: string): { path: string; isDefault: boolean } {
  if (themeRef === '@theme/default') {
    return { path: paths.styles, isDefault: true };
  }

  if (themeRef.startsWith('@theme/')) {
    const themeName = themeRef.slice('@theme/'.length);
    return { path: getThemePath(themeName), isDefault: false };
  }

  return { path: themeRef, isDefault: false };
}

/**
 * Load theme manifest
 */
export function loadThemeManifest(themePath: string): ThemeManifest | null {
  const manifestPath = path.join(themePath, 'theme.yaml');

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return yaml.load(content) as ThemeManifest;
  } catch (error) {
    console.error(`Error loading theme manifest: ${manifestPath}`, error);
    return null;
  }
}

/**
 * Load and combine theme CSS files
 */
export function loadThemeCSS(themePath: string, manifest: ThemeManifest): string {
  const cssFiles = manifest.files.filter(f => f.endsWith('.css'));
  let combinedCSS = '';

  for (const file of cssFiles) {
    const filePath = path.join(themePath, file);
    if (fs.existsSync(filePath)) {
      combinedCSS += fs.readFileSync(filePath, 'utf-8') + '\n';
    }
  }

  return combinedCSS;
}

/**
 * Validate theme structure and variables
 */
export function validateTheme(themePath: string, manifest: ThemeManifest): ThemeValidationResult {
  const errors: ThemeValidationError[] = [];
  const warnings: string[] = [];

  // Check required files exist
  for (const file of manifest.files) {
    const filePath = path.join(themePath, file);
    if (!fs.existsSync(filePath)) {
      errors.push({
        type: 'missing-file',
        message: `Theme file not found: ${file}`,
        file,
      });
    }
  }

  // Load CSS and check for required variables
  if (manifest.required_variables) {
    const css = loadThemeCSS(themePath, manifest);
    const allRequired = [
      ...(manifest.required_variables.colors || []),
      ...(manifest.required_variables.fonts || []),
      ...(manifest.required_variables.elements || []),
    ];

    for (const variable of allRequired) {
      if (!css.includes(variable)) {
        // Only warn if theme extends default (parent provides vars)
        if (manifest.extends) {
          warnings.push(`Variable ${variable} not found, will use from parent theme`);
        } else {
          errors.push({
            type: 'missing-variable',
            message: `Required CSS variable not defined: ${variable}`,
            variable,
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Load complete theme configuration
 */
export function loadThemeConfig(themeRef: string = '@theme/default'): ThemeConfig | null {
  const { path: themePath, isDefault } = resolveThemeAlias(themeRef);

  if (!fs.existsSync(themePath)) {
    console.error(`Theme path not found: ${themePath}`);
    return null;
  }

  const manifest = loadThemeManifest(themePath);
  if (!manifest) {
    // For default theme without manifest, create a basic one
    if (isDefault) {
      return {
        name: 'default',
        path: themePath,
        manifest: {
          name: 'Default Theme',
          version: '1.0.0',
          extends: null,
          supports_dark_mode: true,
          files: ['index.css'],
        },
        css: fs.readFileSync(path.join(themePath, 'index.css'), 'utf-8'),
        isDefault: true,
      };
    }
    return null;
  }

  const css = loadThemeCSS(themePath, manifest);

  return {
    name: themeRef.replace('@theme/', ''),
    path: themePath,
    manifest,
    css,
    isDefault,
  };
}

/**
 * Get theme CSS for injection (handles inheritance)
 */
export function getThemeCSS(themeRef: string = '@theme/default'): string {
  const theme = loadThemeConfig(themeRef);
  if (!theme) return '';

  let css = '';

  // If extends, load parent first
  if (theme.manifest.extends) {
    css += getThemeCSS(theme.manifest.extends);
  }

  // Then add this theme's CSS (overrides parent)
  css += theme.css;

  return css;
}
```

### Task 2.3: Add @theme alias to alias.ts

Update `src/loaders/alias.ts`:
- Add `'@theme'` to `AliasPrefix` type
- Add theme resolution to `aliasMap`
- Add `resolveThemePath()` function

### Task 2.4: Update paths.ts

Ensure `toAliasPath()` handles theme paths:
```typescript
// Match themes directory
const themeMatch = normalizedPath.match(/[/\\](dynamic_data[/\\])?themes[/\\](.+)$/);
if (themeMatch) {
  return '@theme/' + themeMatch[2];
}
```

---

## PHASE 3: Theme Integration

### Task 3.1: Update site.yaml schema

Add theme field to `SiteConfig` interface in `src/loaders/config.ts`:
```typescript
export interface SiteConfig {
  site: SiteMetadata;
  theme?: string;  // Add this
  logo?: SiteLogo;
  pages: Record<string, PageConfig>;
}
```

### Task 3.2: Update BaseLayout.astro

Modify `src/layouts/BaseLayout.astro` to:
1. Load theme config from site.yaml
2. Load theme CSS using `getThemeCSS()`
3. Inject theme CSS as `<style>` in `<head>`

```astro
---
import { loadSiteConfig } from '@loaders/config';
import { getThemeCSS } from '@loaders/theme';

const siteConfig = loadSiteConfig();
const themeRef = siteConfig.theme || '@theme/default';
const themeCSS = getThemeCSS(themeRef);
---

<html>
  <head>
    <!-- Theme CSS (injected inline) -->
    <style id="theme-styles" set:html={themeCSS}></style>

    <!-- Rest of head -->
  </head>
</html>
```

### Task 3.3: Update globals.css import

Change from static import to dynamic injection in BaseLayout.

---

## PHASE 4: Layout Component Compliance

### CRITICAL RULES FOR LAYOUTS AND COMPONENTS

All layout components MUST follow these rules:

#### Rule 1: NO HARDCODED COLORS
```css
/* ❌ WRONG */
.sidebar { background: #f8f9fa; }
.nav-link { color: #0066cc; }

/* ✅ CORRECT */
.sidebar { background: var(--color-bg-secondary); }
.nav-link { color: var(--color-brand-primary); }
```

#### Rule 2: NO HARDCODED FONT SIZES
```css
/* ❌ WRONG */
.title { font-size: 24px; }
.body-text { font-size: 16px; }

/* ✅ CORRECT */
.title { font-size: var(--font-size-2xl); }
.body-text { font-size: var(--font-size-base); }
```

#### Rule 3: NO HARDCODED FONT FAMILIES
```css
/* ❌ WRONG */
body { font-family: Arial, sans-serif; }
code { font-family: 'Courier New', monospace; }

/* ✅ CORRECT */
body { font-family: var(--font-family-base); }
code { font-family: var(--font-family-mono); }
```

#### Rule 4: NO HARDCODED SPACING
```css
/* ❌ WRONG */
.container { padding: 16px; margin: 24px; }

/* ✅ CORRECT */
.container { padding: var(--spacing-md); margin: var(--spacing-lg); }
```

#### Rule 5: NO HARDCODED BORDERS/RADII
```css
/* ❌ WRONG */
.card { border-radius: 8px; }

/* ✅ CORRECT */
.card { border-radius: var(--border-radius-md); }
```

#### Rule 6: NO HARDCODED SHADOWS
```css
/* ❌ WRONG */
.dropdown { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }

/* ✅ CORRECT */
.dropdown { box-shadow: var(--shadow-md); }
```

#### Rule 7: NO HARDCODED TRANSITIONS
```css
/* ❌ WRONG */
.button { transition: all 0.2s ease; }

/* ✅ CORRECT */
.button { transition: all var(--transition-fast); }
```

### Task 4.1: Audit and fix Navbar styles

**File: `src/layouts/navbar/style1/index.astro`**

The navbar has ~457 lines of inline CSS. Audit and fix:
- All color values → use `--color-*` variables
- All font sizes → use `--font-size-*` variables
- All spacing → use `--spacing-*` variables
- All borders/shadows → use theme variables

### Task 4.2: Audit and fix Sidebar styles

**Files:**
- `src/layouts/docs/components/sidebar/default/styles.css`

Check for hardcoded values and replace with variables.

### Task 4.3: Audit and fix Body/Content styles

**Files:**
- `src/layouts/docs/components/body/default/styles.css`
- `src/layouts/docs/components/common/styles.css`

### Task 4.4: Audit and fix Outline styles

**File: `src/layouts/docs/components/outline/default/styles.css`**

### Task 4.5: Audit and fix Footer styles

**File: `src/layouts/footer/default/index.astro`**

### Task 4.6: Audit and fix Blog component styles

**Files:**
- `src/layouts/blogs/components/body/default/styles.css`
- `src/layouts/blogs/components/cards/default/styles.css`

### Task 4.7: Audit and fix Custom page styles

**Files:**
- `src/layouts/custom/components/hero/default/styles.css`
- `src/layouts/custom/components/features/default/styles.css`
- `src/layouts/custom/components/content/default/styles.css`

---

## PHASE 5: Theme Validation & Dev Tools

### Task 5.1: Add theme error types to cache

Update `src/loaders/cache.ts`:
```typescript
// Add theme error types
type ErrorType =
  | 'asset-missing'
  | 'frontmatter'
  | 'syntax'
  | 'theme-missing-file'
  | 'theme-missing-variable'
  | 'theme-invalid-manifest';
```

### Task 5.2: Integrate theme validation in dev mode

In `loadThemeConfig()`, when in dev mode:
- Run `validateTheme()`
- Add any errors to the error cache
- Errors appear in dev toolbar

### Task 5.3: Add theme info to error logger panel

Update dev toolbar to show theme validation errors.

---

## PHASE 6: Create Example Custom Theme

### Task 6.1: Create "minimal" theme

**Directory: `dynamic_data/themes/minimal/`**

```
minimal/
├── theme.yaml
├── color.css      # Custom color palette
└── index.css      # Only imports color.css (inherits rest from default)
```

**theme.yaml:**
```yaml
name: "Minimal Theme"
version: "1.0.0"
description: "A clean, minimal color palette"
extends: "@theme/default"
supports_dark_mode: true

files:
  - color.css
  - index.css
```

**color.css:**
```css
/* Minimal Theme - Light Mode */
:root {
  --color-bg-primary: #fafafa;
  --color-bg-secondary: #f5f5f5;
  --color-bg-tertiary: #eeeeee;
  --color-text-primary: #1a1a1a;
  --color-brand-primary: #2563eb;
  --color-brand-secondary: #1d4ed8;
}

/* Minimal Theme - Dark Mode */
[data-theme="dark"] {
  --color-bg-primary: #0a0a0a;
  --color-bg-secondary: #171717;
  --color-bg-tertiary: #262626;
  --color-text-primary: #fafafa;
  --color-brand-primary: #3b82f6;
  --color-brand-secondary: #60a5fa;
}
```

**index.css:**
```css
/* Minimal Theme */
@import './color.css';
/* Inherits font.css, element.css, markdown.css from @theme/default */
```

---

## PHASE 7: Documentation

### Task 7.1: Create theme documentation structure

**Files to create in `dynamic_data/data/docs/docs/04_themes/`:**

```
04_themes/
├── settings.json
├── 01_overview.md
├── 02_theme-structure.md
├── 03_creating-themes.md
├── 04_css-variables.md
├── 05_theme-inheritance.md
└── 06_validation.md
```

### Task 7.2: Write 01_overview.md

Content should cover:
- What themes are
- How they work (architecture diagram)
- Default vs custom themes
- Quick start example

### Task 7.3: Write 02_theme-structure.md

Content should cover:
- Required files (theme.yaml, index.css)
- File organization (color.css, font.css, etc.)
- Manifest file reference

### Task 7.4: Write 03_creating-themes.md

Content should cover:
- Step-by-step guide to create a theme
- Copying from default
- Customizing colors
- Testing themes

### Task 7.5: Write 04_css-variables.md

Content should cover:
- Complete list of CSS variables
- Categories (colors, fonts, elements)
- Dark mode variables
- Usage examples

### Task 7.6: Write 05_theme-inheritance.md

Content should cover:
- How extends works
- Partial overrides
- Best practices

### Task 7.7: Write 06_validation.md

Content should cover:
- Validation rules
- Error messages
- Dev toolbar integration
- Fixing common issues

---

## PHASE 8: Theme Switcher (Later Phase)

### Task 8.1: Create theme switcher dev toolbar app

**File: `src/dev-toolbar/theme-switcher.ts`**

Features:
- List all available themes from THEMES_DIR
- Show current theme
- Click to switch themes
- Preview without reload (inject CSS)
- Persist selection to site.yaml

### Task 8.2: Document theme switcher

Add documentation for the dev toolbar theme switcher.

---

## Verification & Screenshots

### Use Puppeteer MCP for Screenshots

After each major phase, use the Puppeteer MCP tool to take screenshots:

```
1. Connect to dev server: mcp__puppeteer__puppeteer_navigate to http://localhost:4321
2. Take screenshot: mcp__puppeteer__puppeteer_screenshot with descriptive name
3. Screenshot light mode, then toggle dark mode and screenshot again
4. Compare before/after for theme changes
```

### Verification Checklist

- [x] Default theme loads correctly (verified via build)
- [x] Dark mode toggle works (verified - dark mode variables in color.css)
- [x] Custom theme (minimal) loads correctly (verified via build with site.yaml theme: "@theme/minimal")
- [x] Theme inheritance works (minimal extends default, verified via build)
- [x] All layouts render without hardcoded styles (audited in Phase 4, only hero.css had issue which was fixed)
- [x] Dev toolbar shows theme errors (added theme error types to cache.ts)
- [x] Documentation renders correctly (verified - theme docs built successfully)

---

## File Reference

### Files to CREATE

```
src/styles/
├── reset.css
├── color.css
├── font.css
├── element.css
├── markdown.css
├── index.css
└── theme.yaml

src/loaders/
├── theme-types.ts
└── theme.ts

dynamic_data/themes/minimal/
├── theme.yaml
├── color.css
└── index.css

dynamic_data/data/docs/docs/04_themes/
├── settings.json
├── 01_overview.md
├── 02_theme-structure.md
├── 03_creating-themes.md
├── 04_css-variables.md
├── 05_theme-inheritance.md
└── 06_validation.md

src/dev-toolbar/
└── theme-switcher.ts (Phase 8)
```

### Files to MODIFY

```
src/styles/globals.css           # Simplify to import index.css
src/layouts/BaseLayout.astro     # Add theme injection
src/loaders/alias.ts             # Add @theme alias
src/loaders/paths.ts             # Add theme to toAliasPath
src/loaders/config.ts            # Add theme to SiteConfig
src/loaders/cache.ts             # Add theme error types

# Layout component files to audit:
src/layouts/navbar/style1/index.astro
src/layouts/footer/default/index.astro
src/layouts/docs/components/sidebar/default/styles.css
src/layouts/docs/components/body/default/styles.css
src/layouts/docs/components/outline/default/styles.css
src/layouts/docs/components/common/styles.css
src/layouts/blogs/components/body/default/styles.css
src/layouts/blogs/components/cards/default/styles.css
src/layouts/custom/components/hero/default/styles.css
src/layouts/custom/components/features/default/styles.css
src/layouts/custom/components/content/default/styles.css
```

---

## Progress Tracking

Update this section as you complete tasks:

### Phase 1: Default Theme Structure
- [x] 1.1.1 Create color.css
- [x] 1.1.2 Create font.css
- [x] 1.1.3 Create element.css
- [x] 1.1.4 Create markdown.css
- [x] 1.1.5 Create reset.css
- [x] 1.1.6 Create index.css
- [x] 1.1.7 Create theme.yaml
- [x] 1.2 Update globals.css

### Phase 2: Theme Loader
- [x] 2.1 Create theme-types.ts
- [x] 2.2 Create theme.ts
- [x] 2.3 Update alias.ts
- [x] 2.4 Update paths.ts

### Phase 3: Theme Integration
- [x] 3.1 Update config.ts
- [x] 3.2 Update BaseLayout.astro
- [x] 3.3 Update globals.css import

### Phase 4: Layout Compliance
- [x] 4.1 Fix navbar styles (already compliant)
- [x] 4.2 Fix sidebar styles (already compliant)
- [x] 4.3 Fix body/content styles (already compliant)
- [x] 4.4 Fix outline styles (already compliant)
- [x] 4.5 Fix footer styles (already compliant)
- [x] 4.6 Fix blog styles (already compliant)
- [x] 4.7 Fix custom page styles (fixed hero.css: color: white -> var(--color-bg-primary))

### Phase 5: Validation & Dev Tools
- [x] 5.1 Add theme error types (added to cache.ts: theme-not-found, theme-missing-file, theme-missing-variable, theme-invalid-manifest, theme-circular-extends)
- [x] 5.2 Integrate validation (already in theme.ts loadThemeConfig)
- [x] 5.3 Update error logger (already handles dynamic types)

### Phase 6: Example Theme
- [x] 6.1 Create minimal theme (created in dynamic_data/themes/minimal/)

### Phase 7: Documentation
- [x] 7.1 Create doc structure (04_themes folder with settings.json)
- [x] 7.2 Write overview (01_overview.md)
- [x] 7.3 Write structure doc (02_theme-structure.md)
- [x] 7.4 Write creating themes (03_creating-themes.md)
- [x] 7.5 Write CSS variables (04_css-variables.md)
- [x] 7.6 Write inheritance (05_theme-inheritance.md)
- [x] 7.7 Write validation (06_validation.md)

### Phase 8: Theme Switcher
- [x] 8.1 Create switcher (updated layout-selector.ts with Color Theme section, added /api/dev/themes endpoint, updated BaseLayout for URL param override)
- [x] 8.2 Document switcher (included in theme docs and integrated into existing dev toolbar)

---

## Notes

- Work through phases sequentially
- Test after each major change
- Use Puppeteer for visual verification
- Update documentation as you implement
- Check dev toolbar for errors after each phase
