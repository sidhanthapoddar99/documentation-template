---
title: Customization Guide
description: Learn how to customize your documentation site
date: 2024-01-20
author: Documentation Team
tags:
  - guides
  - customization
---

# Customization Guide

Learn how to customize the look and feel of your documentation site.

## CSS Variables

The framework uses CSS variables for easy theming:

```css
:root {
  --color-brand-primary: #0066cc;
  --color-bg-primary: #ffffff;
  --color-text-primary: #212529;
}
```

## Layout Packages

Choose from different layout packages:

### Documentation Layouts
- `@docs/doc_style1` - Standard three-column layout

### Blog Layouts
- `@blog/blog_style1` - Card-based blog layout

### Custom Layouts
- `@custom/home` - Hero + features homepage
- `@custom/info` - Simple content page

## Creating Custom Themes

Create a theme in `themes/`:

```css
/* themes/custom.css */
:root {
  --color-brand-primary: #8b5cf6;
}
```

Then reference it in your configuration.

## Next Steps

Explore more customization options in the full documentation.
