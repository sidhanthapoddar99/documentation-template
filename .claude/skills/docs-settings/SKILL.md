---
name: docs-settings
description: >
  Use this skill to SET UP and CONFIGURE documentation sites using this template.
  This is for PROJECT CONFIGURATION, not writing documentation content (use docs-guide for content).

  TRIGGER on ANY of these:
  - User wants to SET UP a new documentation site from scratch
  - User asks about site.yaml, navbar.yaml, footer.yaml, or .env configuration
  - User wants to ADD NEW PAGES (docs sections, blog, custom pages) to site.yaml
  - User mentions "configure", "setup", "settings", "environment", "yaml config"
  - User wants to edit navigation, footer, or site metadata
  - User asks about path aliases (@data, @assets, @docs, etc.)
  - User wants to understand the project structure for a new docs site

  CRITICAL RULES:
  - NEVER modify files inside documentation-template/ folder
  - ALL changes go in the data/ folder (config, assets, content)
  - Always ask for product name, description, GitHub URL before configuring

  DO NOT use this skill for:
  - Writing markdown content (use docs-guide instead)
  - Editing frontmatter in .md files (use docs-guide)
  - Editing settings.json in doc folders (use docs-guide)
argument-hint: "[action] - e.g., 'setup new site', 'configure navbar', 'add page', 'edit site.yaml'"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mkdir *), Bash(cp *), Bash(git clone *), Bash(cat *)
---

# Documentation Settings Skill

This skill guides Claude through setting up and configuring documentation sites using this template.

## CRITICAL RULES

1. **NEVER modify files inside the `documentation-template/` folder** - This is a git-cloned template that should remain untouched
2. **ALL changes go in the `data/` folder** - Config, assets, content, themes
3. **Always ask for product context** - Name, description, GitHub URL before configuring

## When to Use This Skill

Use this skill when the user wants to:

- **Set up a new documentation site from scratch**
- **Configure site settings** (site.yaml, navbar.yaml, footer.yaml)
- **Configure environment variables** (.env)
- **Add new documentation pages/sections**
- **Set up the project structure for their product's docs**
- **Understand how the template configuration works**

## How to Use This Skill

### Step 1: Determine the Scenario

| Scenario | Action |
|----------|--------|
| **No docs folder exists** | Follow [workflows/initial-setup.md](./workflows/initial-setup.md) |
| **Docs exists, needs new page** | Follow [workflows/add-page.md](./workflows/add-page.md) |
| **Edit site.yaml** | Read [reference/site-yaml.md](./reference/site-yaml.md) |
| **Edit navbar.yaml** | Read [reference/navbar-yaml.md](./reference/navbar-yaml.md) |
| **Edit footer.yaml** | Read [reference/footer-yaml.md](./reference/footer-yaml.md) |
| **Edit .env** | Read [reference/env-reference.md](./reference/env-reference.md) |
| **Understand structure** | Read [reference/structure.md](./reference/structure.md) |

### Step 2: Gather Context

Before making any configuration changes, ask the user:

1. **Product name** - For site.yaml `site.name`
2. **Product description** - For site.yaml `site.description`
3. **GitHub URL** - For navbar and footer
4. **What documentation sections they need** - docs, guides, blog, etc.

### Step 3: Execute

Follow the appropriate workflow or reference file.

## Reference Files

| File | Purpose |
|------|---------|
| [workflows/initial-setup.md](./workflows/initial-setup.md) | Complete setup from scratch |
| [workflows/add-page.md](./workflows/add-page.md) | Add new documentation pages |
| [reference/structure.md](./reference/structure.md) | Directory structure reference |
| [reference/env-reference.md](./reference/env-reference.md) | Environment variables |
| [reference/site-yaml.md](./reference/site-yaml.md) | Site configuration |
| [reference/navbar-yaml.md](./reference/navbar-yaml.md) | Navigation configuration |
| [reference/footer-yaml.md](./reference/footer-yaml.md) | Footer configuration |
| [templates/](./templates/) | Starter config templates |

## Quick Reference: Final Structure

After setup, the structure should be:

```
<project-root>/
└── docs/
    ├── README.md                    # Setup instructions
    ├── .env                         # Config bootstrap (CONFIG_DIR) + server settings
    ├── documentation-template/      # Git clone (DO NOT MODIFY)
    │   └── ...                      # Template source code
    └── data/
        ├── assets/                  # Logos, favicons, images
        ├── config/                  # YAML configuration
        │   ├── site.yaml
        │   ├── navbar.yaml
        │   └── footer.yaml
        ├── themes/                  # Custom themes (optional)
        └── data/                    # Content
            ├── docs/                # Main documentation
            ├── user-guide/          # User guide docs
            ├── prd/                 # PRD documentation
            ├── internal-docs/       # Internal documentation
            ├── doc-template/        # Template's own docs
            │   ├── docs/
            │   └── components/
            ├── roadmap/             # Roadmap content
            ├── blog/                # Blog posts
            └── pages/               # Custom pages
                ├── home.yaml
                └── about.yaml
```

## Default Pages to Create

| Page | URL | Type | Purpose |
|------|-----|------|---------|
| docs | /docs | docs | Main product documentation |
| user-guide | /user-guide | docs | End-user guides |
| prd | /prd | docs | Product requirements |
| internal-docs | /internal-docs | docs | Internal team docs |
| doc-template-docs | /doc-template/docs | docs | Template documentation |
| doc-template-components | /doc-template/components | docs | Component reference |
| blog | /blog | blog | Blog posts |
| roadmap | /roadmap | docs | Product roadmap |
| home | / | custom | Landing page |
| about | /about | custom | About page |

## Default Navbar Structure

```yaml
items:
  - label: "Home"
    href: "/"
  - label: "Docs"
    href: "/docs"
  - label: "Guides"
    items:
      - label: "User Guide"
        href: "/user-guide"
      - label: "PRD"
        href: "/prd"
      - label: "Internal Docs"
        href: "/internal-docs"
  - label: "Roadmap"
    href: "/roadmap"
  - label: "Blog"
    href: "/blog"
  - label: "About"
    href: "/about"
  - label: "GitHub"
    href: "https://github.com/user/repo"
```

## Checklist for New Setup

- [ ] Create docs folder structure
- [ ] Clone documentation-template
- [ ] Configure .env (CONFIG_DIR only)
- [ ] Create data/ folder structure
- [ ] Configure site.yaml with product info and directory paths
- [ ] Configure navbar.yaml with navigation
- [ ] Configure footer.yaml
- [ ] Create placeholder docs for each section
- [ ] Add settings.json to each docs folder
- [ ] Test with `bun run dev`
