# Configuration-Driven Astro Documentation Framework

## Objective

Create a centralized configuration system (`site.config.ts`) that controls all site structure, navigation, and component selection without requiring code changes.

## Success Criteria

Output `<promise>CONFIG SYSTEM COMPLETE</promise>` when ALL of the following are done:
1. Configuration file created with full type definitions
2. All pages read from config (navbar, sidebar, footer, outline selection)
3. Navbar structure defined in config and rendered correctly
4. Per-page component overrides working
5. Content collections dynamically created from config
6. Dev server runs without errors
7. Changing config values changes site behavior

---

## Configuration Schema

```typescript
// src/config/site.config.ts

export interface SiteConfig {
  // Site metadata
  site: {
    name: string;
    title: string;
    description: string;
    logo?: { src: string; alt: string };
  };

  // Global defaults (used when page doesn't specify)
  defaults: {
    navbar: 'minimal' | 'style1' | 'style2' | 'style3';
    sidebar: 'default';
    footer: 'default';
    outline: 'default';
  };

  // Page definitions
  pages: {
    [page_name: string]: {
      type: 'home' | 'doc' | 'blog' | 'custom';
      title: string;
      url: string;
      description?: string;

      // For doc/blog types
      data_location?: string;      // e.g., "../docs"

      // Per-page component overrides (optional - uses defaults if not set)
      navbar?: 'minimal' | 'style1' | 'style2' | 'style3';
      sidebar?: 'default' | 'none';
      outline?: 'default' | 'none';
      footer?: 'default' | 'none';

      // Layout override for custom types
      layout?: string;
    };
  };

  // Navbar structure - references page names
  navbar: Array<
    | string                           // Direct page link: "home"
    | {                                // Dropdown group
        group: string;
        pages: string[];
      }
  >;

  // Footer config
  footer: {
    copyright?: string;
    links?: Array<{ href: string; label: string }>;
  };
}
```

---

## Task Checklist

### 1. Create Config Infrastructure

Create `src/config/` folder with:

- [ ] `types.ts` - TypeScript interfaces for configuration
- [ ] `site.config.ts` - Main configuration file with example values
- [ ] `helpers.ts` - Helper functions:
  - `getNavItems()` - Convert navbar config to NavItem[] format
  - `getPageConfig(pageName)` - Get page settings with defaults applied
  - `getDocPages()` - Get all doc-type pages
  - `resolveComponent(type, pageName)` - Get component variant for a page
- [ ] `index.ts` - Barrel export

### 2. Create ConfiguredNavbar.astro

Create `src/components/ConfiguredNavbar.astro`:

- [ ] Read navbar variant from config (or page override)
- [ ] Transform `navbar` structure to `NavItem[]` format
- [ ] Dynamically select navbar component (minimal/style1/style2/style3)
- [ ] Pass transformed items to selected navbar
- [ ] Accept `pageName` prop for per-page overrides

### 3. Create ConfiguredFooter.astro

Create `src/components/ConfiguredFooter.astro`:

- [ ] Read footer config
- [ ] Render FooterDefault with config values
- [ ] Accept `pageName` prop for per-page overrides (can hide footer)

### 4. Update DocsLayout.astro

Modify `src/layouts/docs/DocsLayout.astro`:

- [ ] Import ConfiguredNavbar, ConfiguredFooter
- [ ] Accept `pageName` prop to look up component overrides
- [ ] Conditionally render sidebar based on page config
- [ ] Conditionally render outline based on page config

### 5. Update content.config.ts

Modify `src/content.config.ts`:

- [ ] Import pages config
- [ ] Loop through pages with `type: 'doc'`
- [ ] Create collection for each doc page with `data_location`
- [ ] Use page name as collection name

### 6. Update Page Files

Modify pages to use configuration:

- [ ] `src/pages/index.astro` - Use ConfiguredNavbar, read home page config
- [ ] `src/pages/docs/[...slug].astro` - Pass pageName to layout
- [ ] Other pages - Use configured components

### 7. Example Configuration

Create working example config with:

- [ ] Home page (no sidebar, no outline)
- [ ] Docs section (with sidebar and outline)
- [ ] Components section (with sidebar and outline)
- [ ] External GitHub link
- [ ] Navbar with groups/dropdowns

---

## File Structure

```
src/
├── config/
│   ├── index.ts           # Barrel export
│   ├── types.ts           # TypeScript interfaces
│   ├── site.config.ts     # Main configuration
│   └── helpers.ts         # Helper functions
│
├── components/
│   ├── ConfiguredNavbar.astro   # NEW
│   ├── ConfiguredFooter.astro   # NEW
│   ├── navbar/
│   ├── footer/
│   ├── sidebar/
│   └── outline/
│
├── layouts/
│   └── docs/
│       └── DocsLayout.astro     # MODIFY
│
├── pages/
│   ├── index.astro              # MODIFY
│   └── docs/[...slug].astro     # MODIFY
│
└── content.config.ts            # MODIFY
```

---

## Example Usage

After implementation, users can configure their site by editing `src/config/site.config.ts`:

```typescript
export const siteConfig: SiteConfig = {
  site: {
    name: 'My Docs',
    title: 'Documentation',
    description: 'My documentation site',
  },

  defaults: {
    navbar: 'style2',
    sidebar: 'default',
    footer: 'default',
    outline: 'default',
  },

  pages: {
    home: {
      type: 'home',
      title: 'Home',
      url: '/',
      sidebar: 'none',
      outline: 'none',
    },
    docs: {
      type: 'doc',
      title: 'Docs',
      url: '/docs',
      data_location: '../docs',
    },
  },

  navbar: ['home', 'docs'],

  footer: {
    copyright: '2024 My Company',
  },
};
```

---

## Verification

1. `npm run dev` runs without errors
2. Homepage shows correct navbar variant
3. Docs pages show/hide sidebar per config
4. Docs pages show/hide outline per config
5. Navbar structure matches config
6. Changing config changes site (no code edits needed)

---

## Completion

When ALL tasks are complete and verified:

```
<promise>CONFIG SYSTEM COMPLETE</promise>
```
