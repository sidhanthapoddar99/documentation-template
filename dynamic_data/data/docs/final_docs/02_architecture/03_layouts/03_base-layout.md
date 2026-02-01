---
title: BaseLayout
description: The root HTML structure that wraps all pages
sidebar_position: 3
---

# BaseLayout

`BaseLayout.astro` is the root layout component that wraps every page in the framework. It provides the HTML shell, head meta tags, and slot structure for navbar, content, and footer.

## Location

**File:** `src/layouts/BaseLayout.astro`

## Role in the Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      BaseLayout.astro                        │
│                                                             │
│   <html>                                                    │
│     <head>                                                  │
│       • Meta tags (title, description, OG)                  │
│       • Favicon                                             │
│       • Font preconnects                                    │
│       • Theme flash prevention script                       │
│     </head>                                                 │
│     <body>                                                  │
│       ┌─────────────────────────────────────────────────┐   │
│       │ <slot name="navbar" />  ← Navbar component      │   │
│       └─────────────────────────────────────────────────┘   │
│       ┌─────────────────────────────────────────────────┐   │
│       │ <main>                                          │   │
│       │   <slot />  ← Content layout (docs/blog/custom) │   │
│       │ </main>                                         │   │
│       └─────────────────────────────────────────────────┘   │
│       ┌─────────────────────────────────────────────────┐   │
│       │ <slot name="footer" />  ← Footer component      │   │
│       └─────────────────────────────────────────────────┘   │
│     </body>                                                 │
│   </html>                                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Props Interface

```typescript
interface BaseLayoutProps {
  title: string;           // Page title (required)
  description?: string;    // Meta description
  ogImage?: string;        // Open Graph image URL
}
```

## Structure

```astro
---
import { loadSiteConfig, getFavicon } from '@loaders/config';
import '@/styles/globals.css';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}

const { title, description, ogImage } = Astro.props;
const siteConfig = loadSiteConfig();
const faviconUrl = getFavicon();
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- SEO -->
    <title>{title} | {siteConfig.site.name}</title>
    <meta name="description" content={description || siteConfig.site.description} />

    <!-- Open Graph -->
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {ogImage && <meta property="og:image" content={ogImage} />}

    <!-- Favicon -->
    <link rel="icon" href={faviconUrl} />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />

    <!-- Theme Flash Prevention -->
    <script is:inline>
      // Runs before page renders to prevent flash
      const theme = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', theme);
    </script>
  </head>

  <body>
    <slot name="navbar" />

    <main class="main-content">
      <slot />
    </main>

    <slot name="footer" />
  </body>
</html>
```

## Slot System

BaseLayout uses Astro's named slots for composition:

| Slot | Purpose | Filled By |
|------|---------|-----------|
| `navbar` | Top navigation | `NavbarStyle1`, `NavbarMinimal` |
| (default) | Main content | Layout components |
| `footer` | Bottom footer | `FooterDefault`, `FooterMinimal` |

### Usage in Page Components

```astro
---
// In [...slug].astro
import BaseLayout from '@layouts/BaseLayout.astro';
import NavbarStyle1 from '@layouts/navbar/style1/index.astro';
import FooterDefault from '@layouts/footer/default/index.astro';
import DocsLayout from '@layouts/docs/styles/doc_style1/Layout.astro';
---

<BaseLayout title={title} description={description}>
  <NavbarStyle1 slot="navbar" />

  <DocsLayout {...layoutProps} />

  <FooterDefault slot="footer" />
</BaseLayout>
```

## Dark Mode Handling

The inline script prevents theme flash on page load:

```javascript
// Runs synchronously before render
const theme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', theme);
```

This sets `data-theme` attribute immediately, before CSS loads, preventing the flash of wrong theme colors.

CSS uses the attribute for theming:

```css
:root {
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
}

[data-theme="dark"] {
  --color-bg: #1a1a1a;
  --color-text: #ffffff;
}
```

## Flex Layout Structure

The body uses flexbox for sticky footer:

```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;  /* Grows to fill available space */
}
```

This ensures:
- Navbar stays at top
- Footer stays at bottom (even on short pages)
- Content fills the middle

## Favicon Resolution

Favicon is loaded from site configuration:

```typescript
// In BaseLayout
import { getFavicon } from '@loaders/config';
const faviconUrl = getFavicon();

// getFavicon() reads from site.yaml
// logo:
//   favicon: "@assets/favicon.png"  →  /assets/favicon.png
```

## Global Styles Import

BaseLayout imports the global stylesheet:

```astro
---
import '@/styles/globals.css';
---
```

This file contains:
- CSS reset
- CSS custom properties (colors, spacing, typography)
- Base element styles
- Dark mode variables
