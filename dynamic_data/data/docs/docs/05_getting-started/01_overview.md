---
title: Overview
description: Introduction to the documentation template
---

# Overview

A modern, flexible documentation template built with Astro. Create beautiful documentation sites with minimal configuration.

## Why This Template?

### Separation of Concerns

Your content lives completely separate from the framework code:

```
project/
├── dynamic_data/        # YOUR STUFF - edit freely
│   ├── config/          # Site configuration
│   ├── assets/          # Static assets (logos, images)
│   ├── data/            # Content (docs, blog, pages)
│   └── themes/          # Custom themes (optional)
│
└── src/                 # FRAMEWORK - don't touch
    ├── layouts/         # Pre-built layouts
    ├── loaders/         # Data loading engine
    └── pages/           # Route handlers
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Zero Config Routing** | Folder structure = URL structure |
| **Multiple Content Types** | Docs, blogs, and custom pages |
| **Modular Layouts** | Mix and match components |
| **Theme System** | YAML-based color customization |
| **MDX Support** | Use React/Astro components in markdown |
| **Auto Sidebar** | Generated from file positions |

### How It Works

1. **Define pages** in `config/site.yaml`
2. **Write content** in `data/` as Markdown files
3. **Customize theme** in `themes/` (optional)
4. **Build** and deploy anywhere

## Quick Example

Create a doc at `data/docs/getting-started/01_hello.mdx`:

```mdx
---
title: Hello World
description: My first doc
---

# Hello World

Welcome to my documentation!
```

It automatically appears at `/docs/getting-started/hello` in the sidebar.

## What's Next?

1. **[Installation](/docs/getting-started/installation)** - Set up your project
2. **[Configuration](/docs/configuration/overview)** - Configure your site
3. **[Project Structure](/docs/getting-started/structure/overview)** - Understand the codebase
