
Guide Link: [Docusaurus Documentation Guide](https://docusaurus.io/docs)

# Complete Docusaurus Usage Guide

- [Complete Docusaurus Usage Guide](#complete-docusaurus-usage-guide)
  - [What is Docusaurus?](#what-is-docusaurus)
- [Basic Overview Setup](#basic-overview-setup)
  - [Standard Dirs](#standard-dirs)
  - [Core Concepts](#core-concepts)
    - [1. Static Site Generation (SSG)](#1-static-site-generation-ssg)
    - [2. File-Based Routing](#2-file-based-routing)
    - [3. MDX (Markdown + JSX)](#3-mdx-markdown--jsx)
  - [Directory Structure](#directory-structure)
    - [Default Docusaurus Project Structure](#default-docusaurus-project-structure)
    - [Special Directories Explained](#special-directories-explained)
      - [1. `docs/` - Documentation Content](#1-docs---documentation-content)
      - [2. `blog/` - Blog Content](#2-blog---blog-content)
      - [3. `src/pages/` - Custom Pages](#3-srcpages---custom-pages)
      - [4. `src/theme/` - Theme Overrides](#4-srctheme---theme-overrides)
      - [5. `static/` - Static Assets](#5-static---static-assets)
  - [Configuration System](#configuration-system)
    - [1. `docusaurus.config.js` - Main Configuration](#1-docusaurusconfigjs---main-configuration)
    - [2. `sidebars.js` - Documentation Sidebar](#2-sidebarsjs---documentation-sidebar)
    - [3. `_category_.json` - Category Configuration](#3-_category_json---category-configuration)
  - [Content Organization](#content-organization)
    - [1. Documentation Structure](#1-documentation-structure)
    - [2. Front Matter](#2-front-matter)
    - [3. Blog Post Front Matter](#3-blog-post-front-matter)
  - [Theme System](#theme-system)
    - [1. How Themes Work](#1-how-themes-work)
    - [2. Component Shadow Hierarchy](#2-component-shadow-hierarchy)
    - [3. Swizzling Components](#3-swizzling-components)
    - [4. Common Theme Overrides](#4-common-theme-overrides)
  - [Plugin Architecture](#plugin-architecture)
    - [1. Plugin Types](#1-plugin-types)
    - [2. Common Plugins](#2-common-plugins)
    - [3. Creating a Custom Plugin](#3-creating-a-custom-plugin)
  - [Build Process](#build-process)
    - [1. Development Mode](#1-development-mode)
    - [2. Production Build](#2-production-build)
    - [3. Build Output Structure](#3-build-output-structure)
  - [Customization Patterns](#customization-patterns)
    - [1. Custom CSS](#1-custom-css)
    - [2. Custom React Components](#2-custom-react-components)
    - [3. MDX Component Mapping](#3-mdx-component-mapping)
    - [4. Custom Pages](#4-custom-pages)
  - [Best Practices](#best-practices)
    - [1. Project Organization](#1-project-organization)
    - [2. Performance](#2-performance)
    - [3. SEO](#3-seo)
    - [4. Maintenance](#4-maintenance)
    - [5. Content Guidelines](#5-content-guidelines)
  - [Common Patterns](#common-patterns)
    - [1. Multi-version Documentation](#1-multi-version-documentation)
    - [2. Multiple Documentation Sections](#2-multiple-documentation-sections)
    - [3. Custom Search](#3-custom-search)
  - [Deployment](#deployment)
    - [GitHub Pages](#github-pages)
    - [Vercel](#vercel)
    - [Netlify](#netlify)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)

## What is Docusaurus?

Docusaurus is a **static site generator** built on React that specializes in documentation websites. It provides:

- **Pre-built components** for docs, blogs, and landing pages
- **File-based routing** for easy content organization
- **MDX support** for mixing Markdown with React components
- **Theme system** for customization
- **Plugin architecture** for extensibility
- **SEO optimization** out of the box
- **i18n support** for multi-language sites

# Basic Overview Setup

Main Thing to Note - this is dir based routing

in `docuarus.config.js` you can set the `plugins` which are basically individual documentation sections, each with its own sidebar and configuration.

```javascript
plugins: [
  [
    '@docusaurus/plugin-content-docs',
    {
      id: 'docs',
      
```

## Standard Dirs


The standard Docusaurus structure includes:
- `docs/` - Documentation pages
- `blog/` - Blog posts  
- `src/pages/` - Custom pages like  `index.js`-- the homepage or other custom pages like `roadmap.js` -- `/roadmap` route 
- `src/components/` - React components
- `src/theme/` - Theme overrides
- `static/` - Static assets
- `src/components/elements` - Custom React components




## Core Concepts

### 1. Static Site Generation (SSG)
- **Build time**: Docusaurus converts your React/Markdown files into static HTML
- **Runtime**: The static HTML is "hydrated" back into an interactive React app
- **Benefits**: Fast loading, SEO-friendly, can be hosted anywhere

### 2. File-Based Routing
- Files in specific directories automatically become routes
- `docs/intro.md` → `/docs/intro`
- `src/pages/about.js` → `/about`
- `blog/2024-01-01-hello.md` → `/blog/hello`

### 3. MDX (Markdown + JSX)
- Write content in Markdown
- Import and use React components within Markdown
- Powerful for interactive documentation

## Directory Structure

### Default Docusaurus Project Structure

```
my-docusaurus-site/
├── blog/                    # Blog posts (optional)
│   ├── 2024-01-01-post.md
│   └── authors.yml         # Blog authors configuration
│
├── docs/                    # Documentation files
│   ├── intro.md            # /docs/intro
│   ├── tutorial/           # /docs/tutorial/*
│   │   ├── _category_.json # Category metadata
│   │   └── basics.md
│   └── api/                # /docs/api/*
│       └── reference.md
│
├── src/                     # React components and custom pages
│   ├── components/         # Reusable React components
│   │   └── Feature.js
│   ├── css/               # Global styles
│   │   └── custom.css     # Your custom global CSS
│   ├── pages/             # Custom pages (file = route)
│   │   ├── index.js       # Homepage (/)
│   │   ├── about.js       # /about
│   │   └── showcase.js    # /showcase
│   └── theme/             # Theme component overrides
│       └── Navbar.js      # Override default Navbar
│
├── static/                  # Static assets (images, fonts, etc.)
│   ├── img/                # Images accessible at /img/*
│   ├── fonts/              # Fonts
│   └── files/              # Downloadable files
│
├── docusaurus.config.js     # Main configuration file
├── sidebars.js             # Sidebar configuration for docs
├── package.json            # Dependencies and scripts
├── babel.config.js         # Babel configuration
└── README.md               # Project documentation
```

### Special Directories Explained

#### 1. `docs/` - Documentation Content
- **Purpose**: Contains all your documentation in Markdown/MDX
- **Features**:
  - Automatic routing based on file structure
  - Sidebar generation
  - Version support
  - Category organization with `_category_.json`

#### 2. `blog/` - Blog Content
- **Purpose**: Blog posts with dates, authors, tags
- **Naming**: `YYYY-MM-DD-slug.md` format
- **Features**:
  - RSS feed generation
  - Tag system
  - Author profiles
  - Archive pages

#### 3. `src/pages/` - Custom Pages
- **Purpose**: React components that become routes
- **File types**: `.js`, `.jsx`, `.tsx`, `.md`, `.mdx`
- **Special files**:
  - `index.js` → Homepage (`/`)
  - `404.js` → Custom 404 page

#### 4. `src/theme/` - Theme Overrides
- **Purpose**: Override default Docusaurus components
- **Process**: Called "swizzling"
- **Example**: Custom Navbar, Footer, Layout

#### 5. `static/` - Static Assets
- **Purpose**: Files served as-is without processing
- **Access**: Available at root URL
- **Example**: `/static/img/logo.png` → `/img/logo.png`

## Configuration System

### 1. `docusaurus.config.js` - Main Configuration

This is the heart of your Docusaurus site configuration:

```javascript
module.exports = {
  // Site Metadata
  title: 'My Documentation',
  tagline: 'Documentation made easy',
  url: 'https://mysite.com',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  
  // Deployment
  organizationName: 'myorg',      // GitHub org/user name
  projectName: 'myproject',       // GitHub repo name
  deploymentBranch: 'gh-pages',   // Branch for GitHub Pages
  
  // Behavior
  onBrokenLinks: 'throw',         // What to do with broken links
  onBrokenMarkdownLinks: 'warn',  // What to do with broken MD links
  
  // Internationalization
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'es'],
  },
  
  // Presets (bundles of plugins/themes)
  presets: [
    [
      'classic',                  // Most common preset
      {
        // Docs plugin configuration
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/myorg/myproject/edit/main/',
          routeBasePath: 'docs',  // URL path for docs
          remarkPlugins: [],      // Markdown plugins
          rehypePlugins: [],      // HTML plugins
        },
        
        // Blog plugin configuration
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/myorg/myproject/edit/main/',
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
        },
        
        // Theme configuration
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  
  // Theme Configuration (navbar, footer, etc.)
  themeConfig: {
    // Navbar
    navbar: {
      title: 'My Site',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',  // Dark mode logo
      },
      items: [
        // Doc link
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Documentation',
        },
        // Blog link
        {
          to: '/blog',
          label: 'Blog',
          position: 'left'
        },
        // External link
        {
          href: 'https://github.com/myorg/myproject',
          label: 'GitHub',
          position: 'right',
        },
        // Dropdown
        {
          type: 'dropdown',
          label: 'Community',
          position: 'left',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/...',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/...',
            },
          ],
        },
      ],
    },
    
    // Footer
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/...',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project.`,
    },
    
    // Code syntax highlighting
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: ['rust', 'ruby', 'php'],
    },
    
    // Announcement bar
    announcementBar: {
      id: 'support_us',
      content: 'We are looking for contributors!',
      backgroundColor: '#fafbfc',
      textColor: '#091E42',
      isCloseable: false,
    },
    
    // Color mode
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  },
  
  // Plugins (if not included in preset)
  plugins: [
    '@docusaurus/plugin-ideal-image',
    [
      '@docusaurus/plugin-pwa',
      {
        debug: true,
        offlineModeActivationStrategies: [
          'appInstalled',
          'standalone',
          'queryString',
        ],
      },
    ],
  ],
  
  // Custom fields (accessible in components)
  customFields: {
    myCustomField: 'value',
  },
};
```

### 2. `sidebars.js` - Documentation Sidebar

Controls how your documentation sidebar is structured:

```javascript
module.exports = {
  // Sidebar for docs
  docsSidebar: [
    // Simple string (doc ID)
    'intro',
    
    // Category with items
    {
      type: 'category',
      label: 'Tutorial',
      collapsed: false,
      items: [
        'tutorial/basics',
        'tutorial/advanced',
        {
          type: 'category',
          label: 'Extra',
          items: ['tutorial/extra/styling'],
        },
      ],
    },
    
    // Auto-generated category from filesystem
    {
      type: 'autogenerated',
      dirName: 'guides',  // Auto-generate from docs/guides
    },
    
    // Link to external page
    {
      type: 'link',
      label: 'GitHub',
      href: 'https://github.com/myorg/myproject',
    },
    
    // Reference to another doc
    {
      type: 'ref',
      id: 'api/reference',
    },
  ],
  
  // Multiple sidebars
  apiSidebar: [
    {
      type: 'autogenerated',
      dirName: 'api',
    },
  ],
};
```

### 3. `_category_.json` - Category Configuration

Place in any docs folder to configure that category:

```json
{
  "label": "Tutorial",
  "position": 2,
  "link": {
    "type": "generated-index",
    "title": "Tutorial Overview",
    "description": "Learn the basics step by step",
    "slug": "/tutorial"
  },
  "collapsed": false,
  "collapsible": true,
  "customProps": {
    "description": "This is a tutorial category"
  }
}
```

## Content Organization

### 1. Documentation Structure

```
docs/
├── intro.md                 # /docs/intro
├── getting-started.md       # /docs/getting-started
├── tutorial/               # Category
│   ├── _category_.json     # Category config
│   ├── basics.md          # /docs/tutorial/basics
│   └── advanced.md        # /docs/tutorial/advanced
└── api/                   # Another category
    ├── _category_.json
    ├── overview.md
    └── reference.md
```

### 2. Front Matter

Every Markdown file can have front matter:

```markdown
---
id: doc-id              # Unique ID (optional, defaults to filename)
title: My Document      # Page title
sidebar_label: My Doc   # Sidebar display name
sidebar_position: 3     # Order in sidebar
slug: /my-custom-url   # Custom URL (overrides default)
tags: [tag1, tag2]     # Tags for grouping
description: SEO description
keywords: [seo, keywords]
image: /img/thumbnail.png
hide_table_of_contents: false
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Document Content

Your markdown content here...
```

### 3. Blog Post Front Matter

```markdown
---
slug: welcome-post           # URL slug
title: Welcome to Our Blog   # Post title
authors: [john, jane]        # Author IDs from authors.yml
tags: [welcome, blog]        # Post tags
date: 2024-01-15            # Publication date
draft: false                # Draft status
hide_table_of_contents: false
image: /img/blog-post.png   # Social card image
---

Blog content here...

<!--truncate-->

More content after the fold...
```

## Theme System

### 1. How Themes Work

- **Theme**: A collection of React components that render your content
- **Classic Theme**: The default theme with navbar, footer, docs, blog
- **Swizzling**: Process of overriding theme components

### 2. Component Shadow Hierarchy

```
User's component (highest priority) like the `src/components/<ComponentName>/codeblock.js/.css`
    ↓
Theme overrides (src/theme/)
    ↓
Theme components (@theme/)
    ↓
Core components (@docusaurus/)
```

### 3. Swizzling Components

To customize a theme component:

```bash
# List all components available for swizzling
npm run swizzle @docusaurus/theme-classic -- --list

# Swizzle a component (eject = full control)
npm run swizzle @docusaurus/theme-classic Navbar -- --eject

# Swizzle a component (wrap = extend functionality)
npm run swizzle @docusaurus/theme-classic Footer -- --wrap
```

### 4. Common Theme Overrides

```
src/theme/
├── Navbar/              # Custom navbar
│   └── index.js
├── Footer/              # Custom footer
│   └── index.js
├── Layout/              # Custom layout wrapper
│   └── index.js
├── MDXComponents/       # Custom MDX components
│   └── index.js
└── prism-include-languages.js  # Additional Prism languages
```

## Plugin Architecture

### 1. Plugin Types

- **Official plugins**: `@docusaurus/plugin-*`
- **Community plugins**: `docusaurus-plugin-*`
- **Local plugins**: `./src/plugins/my-plugin`

### 2. Common Plugins

```javascript
plugins: [
  // Google Analytics
  [
    '@docusaurus/plugin-google-analytics',
    {
      trackingID: 'UA-12345678-1',
      anonymizeIP: true,
    },
  ],
  
  // Progressive Web App
  [
    '@docusaurus/plugin-pwa',
    {
      debug: true,
      offlineModeActivationStrategies: ['appInstalled', 'queryString'],
      pwaHead: [
        {
          tagName: 'link',
          rel: 'manifest',
          href: '/manifest.json',
        },
      ],
    },
  ],
  
  // Search
  [
    '@docusaurus/plugin-search-local',
    {
      hashed: true,
      language: ['en', 'es'],
    },
  ],
  
  // Sitemap
  [
    '@docusaurus/plugin-sitemap',
    {
      changefreq: 'weekly',
      priority: 0.5,
      ignorePatterns: ['/tags/**'],
      filename: 'sitemap.xml',
    },
  ],
];
```

### 3. Creating a Custom Plugin

```javascript
// src/plugins/my-plugin.js
module.exports = function (context, options) {
  return {
    name: 'my-custom-plugin',
    
    // Add custom webpack config
    configureWebpack(config, isServer, utils) {
      return {
        module: {
          rules: [
            // Custom rules
          ],
        },
      };
    },
    
    // Modify the generated HTML
    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: 'script',
            attributes: {
              src: 'https://example.com/script.js',
              async: true,
            },
          },
        ],
      };
    },
    
    // Add custom routes
    async contentLoaded({content, actions}) {
      const {createData, addRoute} = actions;
      
      // Create data that can be imported
      const jsonPath = await createData(
        'my-data.json',
        JSON.stringify({foo: 'bar'})
      );
      
      // Add a route
      addRoute({
        path: '/my-page',
        component: '@site/src/components/MyPage',
        modules: {
          data: jsonPath,
        },
      });
    },
  };
};
```

## Build Process

### 1. Development Mode

```bash
npm start
# or
yarn start
```

What happens:
1. Webpack dev server starts
2. React components are bundled
3. MDX files are transformed to React
4. Hot module replacement (HMR) enabled
5. Site available at `http://localhost:3000`

### 2. Production Build

```bash
npm run build
# or
yarn build
```

Build steps:
1. **Content loading**: Read all content files
2. **Plugin execution**: Run plugin lifecycle hooks
3. **Route generation**: Create routes from files
4. **React SSG**: Generate static HTML for each route
5. **Asset optimization**: Minify JS/CSS, optimize images
6. **Output**: Complete static site in `build/` directory

### 3. Build Output Structure

```
build/
├── index.html              # Homepage
├── docs/                   # Documentation pages
│   ├── intro/index.html
│   └── tutorial/
│       └── basics/index.html
├── blog/                   # Blog pages
│   ├── index.html         # Blog listing
│   └── 2024/
│       └── 01/
│           └── 15/
│               └── welcome/index.html
├── assets/                 # JS/CSS bundles
│   ├── js/
│   └── css/
├── img/                    # Static images
├── sitemap.xml            # SEO sitemap
└── 404.html               # 404 page
```

## Customization Patterns

### 1. Custom CSS

```css
/* src/css/custom.css */
:root {
  /* Light theme colors */
  --ifm-color-primary: #2e8555;
  --ifm-color-primary-dark: #29784c;
  --ifm-color-primary-darker: #277148;
  --ifm-color-primary-darkest: #205d3b;
  --ifm-color-primary-light: #33925d;
  --ifm-color-primary-lighter: #359962;
  --ifm-color-primary-lightest: #3cad6e;
  
  /* Custom variables */
  --custom-border-radius: 8px;
  --custom-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

[data-theme='dark'] {
  /* Dark theme overrides */
  --ifm-color-primary: #4fd1c5;
  --custom-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
```

### 2. Custom React Components

```jsx
// src/components/Feature.js
import React from 'react';
import styles from './Feature.module.css';

export default function Feature({icon, title, description}) {
  return (
    <div className={styles.feature}>
      <div className={styles.icon}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
```

### 3. MDX Component Mapping

```jsx
// src/theme/MDXComponents/index.js
import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import Feature from '@site/src/components/Feature';
import CodeBlock from '@site/src/components/CodeBlock';

export default {
  ...MDXComponents,
  // Map components for use in MDX
  Feature,
  CodeBlock,
  // Override default elements
  h2: (props) => <h2 style={{color: 'red'}} {...props} />,
};
```

### 4. Custom Pages

```jsx
// src/pages/showcase.js
import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Showcase() {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <Layout
      title="Showcase"
      description="Projects built with our framework">
      <main>
        <h1>Project Showcase</h1>
        {/* Your custom content */}
      </main>
    </Layout>
  );
}
```

## Best Practices

### 1. Project Organization

```
✅ DO:
- Keep related files together (docs with images)
- Use clear, descriptive filenames
- Follow consistent naming conventions
- Organize docs by feature/topic

❌ DON'T:
- Mix concerns (docs in src/, components in docs/)
- Use spaces in filenames
- Create deep nesting (>3 levels)
```

### 2. Performance

- **Optimize images**: Use appropriate formats and sizes
- **Lazy load**: Use `@docusaurus/plugin-ideal-image`
- **Code splitting**: Import large components dynamically
- **Minimize plugins**: Only use what you need

### 3. SEO

- Always add meaningful `title` and `description` to pages
- Use structured data where appropriate
- Create a comprehensive sitemap
- Add proper meta tags for social sharing

### 4. Maintenance

- Keep dependencies updated
- Use version control for content
- Document your customizations
- Test builds regularly

### 5. Content Guidelines

- Write clear, concise documentation
- Use consistent formatting
- Include code examples
- Add images and diagrams where helpful
- Keep front matter organized

## Common Patterns

### 1. Multi-version Documentation

```javascript
// docusaurus.config.js
docs: {
  lastVersion: 'current',
  versions: {
    current: {
      label: '2.0.0',
      path: '',
    },
    '1.0.0': {
      label: '1.0.0',
      path: '1.0.0',
    },
  },
}
```

### 2. Multiple Documentation Sections

```javascript
// docusaurus.config.js
plugins: [
  [
    '@docusaurus/plugin-content-docs',
    {
      id: 'api',
      path: 'api',
      routeBasePath: 'api',
      sidebarPath: require.resolve('./sidebarsApi.js'),
    },
  ],
]
```

### 3. Custom Search

```javascript
// docusaurus.config.js
themeConfig: {
  algolia: {
    appId: 'YOUR_APP_ID',
    apiKey: 'YOUR_API_KEY',
    indexName: 'YOUR_INDEX_NAME',
  },
}
```

## Deployment

### GitHub Pages

```bash
GIT_USER=<GITHUB_USERNAME> npm run deploy
```

### Vercel

```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ]
}
```

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "18"
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Clear cache: `npm run clear`
   - Delete node_modules and reinstall

2. **Build failures**
   - Check for broken links
   - Validate front matter
   - Ensure unique doc IDs

3. **Styling issues**
   - Check CSS specificity
   - Use CSS modules for component styles
   - Inspect theme variables

4. **Performance problems**
   - Reduce bundle size
   - Optimize images
   - Enable production builds

This guide covers the essential aspects of Docusaurus. The key is understanding the file-based routing, configuration system, and theme architecture. Start simple and gradually add customizations as needed.