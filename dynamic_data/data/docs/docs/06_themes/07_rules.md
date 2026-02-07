---
title: Theme Compliance Rules
description: Required rules for layouts, components, and custom tags to ensure theme compatibility
sidebar_position: 7
---

# Theme Compliance Rules

This document defines the **mandatory rules** that all layouts, components, and custom tags must follow to ensure proper theme integration. These rules ensure that changing themes consistently affects the entire site.

## Core Principle

> **Layouts, components, and custom tags are NOT independent.** They MUST use CSS variables defined by the theme system. Hardcoding visual properties breaks theming.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        THEME DEPENDENCY FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Theme (defines variables)                                                 │
│   ┌─────────────────────────────────────────┐                               │
│   │  color.css  → --color-*                 │                               │
│   │  font.css   → --font-*                  │                               │
│   │  element.css → --spacing-*, --shadow-*  │                               │
│   └─────────────────────────────────────────┘                               │
│                       │                                                     │
│                       ▼ (consumed by)                                       │
│   ┌─────────────────────────────────────────┐                               │
│   │  Layouts      (sidebar, navbar, body)   │                               │
│   │  Components   (cards, buttons, badges)  │                               │
│   │  Custom Tags  (callouts, tabs, alerts)  │                               │
│   └─────────────────────────────────────────┘                               │
│                                                                             │
│   ✗ Components CANNOT define their own colors                               │
│   ✗ Layouts CANNOT hardcode font sizes                                      │
│   ✗ Custom tags CANNOT use pixel values for spacing                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Rule 1: No Hardcoded Colors

**All color values MUST use theme color variables.**

### Backgrounds

```css
/* ❌ WRONG - Hardcoded colors */
.sidebar { background: #f8f9fa; }
.card { background-color: white; }
.header { background: rgb(26, 26, 46); }

/* ✅ CORRECT - Theme variables */
.sidebar { background: var(--color-bg-secondary); }
.card { background-color: var(--color-bg-primary); }
.header { background: var(--color-bg-tertiary); }
```

### Text Colors

```css
/* ❌ WRONG */
.title { color: #212529; }
.subtitle { color: gray; }
.muted { color: rgba(0, 0, 0, 0.5); }

/* ✅ CORRECT */
.title { color: var(--color-text-primary); }
.subtitle { color: var(--color-text-secondary); }
.muted { color: var(--color-text-muted); }
```

### Brand/Accent Colors

```css
/* ❌ WRONG */
.link { color: #0066cc; }
.button { background: blue; }
.active { border-color: #007bff; }

/* ✅ CORRECT */
.link { color: var(--color-brand-primary); }
.button { background: var(--color-brand-primary); }
.active { border-color: var(--color-brand-secondary); }
```

### Borders

```css
/* ❌ WRONG */
.divider { border-color: #dee2e6; }
.card { border: 1px solid #e9ecef; }

/* ✅ CORRECT */
.divider { border-color: var(--color-border-default); }
.card { border: 1px solid var(--color-border-light); }
```

### Status Colors

```css
/* ❌ WRONG */
.success { color: green; }
.error { background: #dc3545; }
.warning { border-color: #ffc107; }

/* ✅ CORRECT */
.success { color: var(--color-success); }
.error { background: var(--color-error); }
.warning { border-color: var(--color-warning); }
```

---

## Rule 2: No Hardcoded Font Sizes

**All font sizes MUST use theme typography variables.**

```css
/* ❌ WRONG - Hardcoded sizes */
.title { font-size: 24px; }
.body { font-size: 16px; }
.small { font-size: 0.875rem; }
.code { font-size: 14px; }

/* ✅ CORRECT - Theme variables */
.title { font-size: var(--font-size-2xl); }
.body { font-size: var(--font-size-base); }
.small { font-size: var(--font-size-sm); }
.code { font-size: var(--font-size-sm); }
```

### Available Font Size Variables

| Variable | Typical Size | Use Case |
|----------|--------------|----------|
| `--font-size-xs` | 12px | Badges, labels |
| `--font-size-sm` | 14px | Secondary text, code |
| `--font-size-base` | 16px | Body text |
| `--font-size-lg` | 18px | Lead paragraphs |
| `--font-size-xl` | 20px | Subheadings |
| `--font-size-2xl` | 24px | Section headings |
| `--font-size-3xl` | 30px | Page headings |
| `--font-size-4xl` | 36px | Hero titles |

---

## Rule 3: No Hardcoded Font Families

**Font families MUST use theme variables.**

```css
/* ❌ WRONG */
body { font-family: Arial, sans-serif; }
code { font-family: 'Courier New', monospace; }
.heading { font-family: 'Helvetica Neue', sans-serif; }

/* ✅ CORRECT */
body { font-family: var(--font-family-base); }
code { font-family: var(--font-family-mono); }
.heading { font-family: var(--font-family-base); }
```

---

## Rule 4: No Hardcoded Spacing

**All margins, paddings, and gaps MUST use spacing variables.**

```css
/* ❌ WRONG - Hardcoded spacing */
.card { padding: 16px; }
.section { margin-bottom: 24px; }
.grid { gap: 8px; }
.container { padding: 32px 48px; }

/* ✅ CORRECT - Theme variables */
.card { padding: var(--spacing-md); }
.section { margin-bottom: var(--spacing-lg); }
.grid { gap: var(--spacing-sm); }
.container { padding: var(--spacing-xl) var(--spacing-2xl); }
```

### Available Spacing Variables

| Variable | Size | Use Case |
|----------|------|----------|
| `--spacing-xs` | 4px | Tight gaps, inline spacing |
| `--spacing-sm` | 8px | Small gaps, button padding |
| `--spacing-md` | 16px | Standard padding, margins |
| `--spacing-lg` | 24px | Section spacing |
| `--spacing-xl` | 32px | Large sections |
| `--spacing-2xl` | 48px | Page sections |

---

## Rule 5: No Hardcoded Border Radius

**All rounded corners MUST use border radius variables.**

```css
/* ❌ WRONG */
.button { border-radius: 4px; }
.card { border-radius: 8px; }
.avatar { border-radius: 50%; }
.pill { border-radius: 999px; }

/* ✅ CORRECT */
.button { border-radius: var(--border-radius-sm); }
.card { border-radius: var(--border-radius-md); }
.avatar { border-radius: var(--border-radius-full); }
.pill { border-radius: var(--border-radius-full); }
```

---

## Rule 6: No Hardcoded Shadows

**All box shadows MUST use shadow variables.**

```css
/* ❌ WRONG */
.card { box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
.dropdown { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15); }
.modal { box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); }

/* ✅ CORRECT */
.card { box-shadow: var(--shadow-sm); }
.dropdown { box-shadow: var(--shadow-md); }
.modal { box-shadow: var(--shadow-lg); }
```

---

## Rule 7: No Hardcoded Transitions

**Transition durations MUST use timing variables.**

```css
/* ❌ WRONG */
.button { transition: all 0.2s ease; }
.link { transition: color 150ms; }
.modal { transition: opacity 0.3s ease-in-out; }

/* ✅ CORRECT */
.button { transition: all var(--transition-fast); }
.link { transition: color var(--transition-fast); }
.modal { transition: opacity var(--transition-normal); }
```

---

## Rule 8: Layout Dimension Variables

**Use layout dimension variables for consistent sizing.**

```css
/* ❌ WRONG */
.sidebar { width: 280px; }
.navbar { height: 64px; }
.content { max-width: 1200px; }
.toc { width: 220px; }

/* ✅ CORRECT */
.sidebar { width: var(--sidebar-width); }
.navbar { height: var(--navbar-height); }
.content { max-width: var(--max-width-content); }
.toc { width: var(--outline-width); }
```

---

## Rule 9: Line Heights and Font Weights

**Typography properties MUST use theme variables.**

```css
/* ❌ WRONG */
.heading {
  line-height: 1.2;
  font-weight: 600;
}
.body {
  line-height: 1.6;
  font-weight: 400;
}

/* ✅ CORRECT */
.heading {
  line-height: var(--line-height-tight);
  font-weight: var(--font-weight-semibold);
}
.body {
  line-height: var(--line-height-base);
  font-weight: var(--font-weight-normal);
}
```

---

## Rule 10: Dark Mode Compatibility

**Components MUST work in both light and dark modes.**

Since components use theme variables, they automatically support dark mode. However, be careful with:

### Opacity-Based Colors

```css
/* ⚠️ CAUTION - May not work well in dark mode */
.overlay { background: rgba(0, 0, 0, 0.5); }

/* ✅ BETTER - Use theme variables */
.overlay { background: var(--color-bg-tertiary); }
```

### Image Filters

```css
/* Consider dark mode for images */
[data-theme="dark"] .icon {
  filter: invert(1);
}
```

### Borders and Dividers

```css
/* Theme variables handle mode automatically */
.divider {
  border-color: var(--color-border-default); /* Works in both modes */
}
```

---

## Applying Rules to Different Elements

### Layouts (Sidebar, Navbar, Footer)

Layouts are the structural containers. They MUST:
- Use `--color-bg-*` for backgrounds
- Use `--color-border-*` for dividers
- Use `--sidebar-width`, `--navbar-height` for dimensions
- Use `--spacing-*` for internal padding

### Components (Cards, Buttons, Badges)

Reusable components MUST:
- Use `--color-brand-*` for interactive elements
- Use `--color-text-*` for text content
- Use `--border-radius-*` for rounded corners
- Use `--shadow-*` for elevation

### Custom Tags (Callouts, Alerts, Tabs)

Custom markdown extensions MUST:
- Use `--color-success/warning/error/info` for status indicators
- Use `--font-size-*` for text sizing
- Use `--spacing-*` for internal layout
- Use `--color-bg-secondary/tertiary` for backgrounds

---

## Exceptions

### When Hardcoding is Acceptable

1. **CSS Reset Values**
   ```css
   * { margin: 0; padding: 0; }  /* OK - resets */
   ```

2. **Percentage/Relative Values**
   ```css
   .container { width: 100%; }  /* OK - relative */
   .half { flex: 0 0 50%; }     /* OK - relative */
   ```

3. **Structural Positioning**
   ```css
   .fixed { position: fixed; top: 0; left: 0; }  /* OK - positioning */
   ```

4. **Z-Index (use variables when available)**
   ```css
   .dropdown { z-index: var(--z-index-dropdown); }  /* Preferred */
   .tooltip { z-index: 9999; }  /* OK if no variable */
   ```

---

## Compliance Checklist

Before submitting a layout, component, or custom tag:

- [ ] **No hex colors** (`#ffffff`, `#000`)
- [ ] **No named colors** (`white`, `black`, `gray`, `blue`)
- [ ] **No rgb/rgba colors** (`rgb(255,255,255)`, `rgba(0,0,0,0.5)`)
- [ ] **No pixel font sizes** (`16px`, `24px`)
- [ ] **No pixel spacing** (`padding: 16px`, `margin: 8px`)
- [ ] **No hardcoded border radius** (`border-radius: 4px`)
- [ ] **No hardcoded shadows** (`box-shadow: 0 2px 4px ...`)
- [ ] **No hardcoded transitions** (`transition: 0.2s`)
- [ ] **No hardcoded font families** (`font-family: Arial`)
- [ ] **Works in both light and dark modes**

---

## Validation

The dev toolbar shows errors when theme rules are violated:

1. Open dev toolbar (bottom of page in dev mode)
2. Click "Doc Errors" icon
3. Look for component-related warnings

Common validation errors:
- `theme-missing-variable` - Using undefined variable
- Component visual inspection - Check if colors change with theme

---

## Why These Rules Matter

1. **Consistency** - All components look unified
2. **Theme Switching** - Changing theme updates everything
3. **Dark Mode** - Automatic support for light/dark
4. **Maintainability** - Change values in one place
5. **Accessibility** - Themes can be adjusted for contrast
6. **Brand Compliance** - Easy to match corporate colors
