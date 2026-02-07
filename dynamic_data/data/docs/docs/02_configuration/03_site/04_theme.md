---
title: Theme Configuration
description: Configure site theme and theme inheritance in site.yaml
---

# Theme Configuration

The `theme` field specifies which theme to use for the site's styling.

```yaml
# Use default built-in theme
theme: "@theme/default"

# Use a custom theme
theme: "@theme/minimal"
```

| Value | Description |
|-------|-------------|
| `@theme/default` | Built-in theme from `src/styles/` |
| `@theme/theme_name` | Custom theme from `paths.themes/theme_name/` |

## Theme Inheritance

Custom themes can inherit from the default theme, only overriding specific variables:

```yaml
# In themes/minimal/theme.yaml
name: "Minimal Theme"
extends: "@theme/default"  # Inherit from default
supports_dark_mode: true
```

See [Themes Documentation](/docs/themes) for complete details on creating and using themes.
