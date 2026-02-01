---
title: Structure Overview
description: Understanding the project directory structure
sidebar_position: 1
---

# Project Structure Overview

The project is organized into two main areas: **framework code** (in `src/`) and **user content** (in `dynamic_data/`).

## Top-Level Structure

```
project/
├── dynamic_data/           # User content & configuration
│   ├── assets/             # Static assets (logos, images)
│   ├── config/             # Configuration files
│   ├── data/               # Content (docs, blog, pages)
│   └── themes/             # Custom themes
│
├── src/                    # Framework code (don't modify)
│   ├── layouts/            # Layout components
│   ├── loaders/            # Config & data loaders
│   ├── pages/              # Astro pages
│   └── styles/             # Global styles
│
├── .env                    # Environment configuration
├── astro.config.mjs        # Astro configuration
└── package.json
```

## Separation of Concerns

| Directory | Purpose | Modify? |
|-----------|---------|---------|
| `dynamic_data/` | Your content, config, and assets | Yes |
| `src/` | Framework layouts and loaders | No |
| `.env` | Environment-specific settings | Yes |

## Key Principles

1. **Content lives in `dynamic_data/`** - All your documentation, blog posts, and configuration
2. **Framework code in `src/`** - Layouts, loaders, and routing logic (don't modify)
3. **Configuration via YAML** - Easy to edit without touching code
4. **Path aliases** - Use `@data/`, `@assets/`, etc. for clean references

## Next Steps

- [Code Structure](./code-structure) - Understanding the `src/` framework
- [Dynamic Data Structure](./dynamic-data) - Working with your content
