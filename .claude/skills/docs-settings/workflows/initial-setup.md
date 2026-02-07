# Initial Setup Workflow

This workflow guides you through setting up a documentation site from scratch.

## Prerequisites

- User has a project that needs documentation
- Git is installed
- Bun is installed

## Step-by-Step Process

### Step 1: Gather Product Information

Before starting, ask the user for:

```
1. Product name (for site title)
2. Product description (for SEO)
3. GitHub repository URL
4. What documentation sections they need (or use defaults)
```

### Step 2: Create Directory Structure

```bash
# From project root
mkdir -p docs
cd docs

# Create the README
cat > README.md << 'EOF'
# Documentation

This folder contains the documentation for [PRODUCT_NAME].

## Setup

1. Navigate to the documentation-template folder:
   ```bash
   cd documentation-template
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start development server:
   ```bash
   bun run dev
   ```

4. Open http://localhost:3088 in your browser

## Structure

- `documentation-template/` - The documentation framework (do not modify)
- `data/` - Your documentation content and configuration
  - `assets/` - Logos, images, favicons
  - `config/` - Site, navbar, footer configuration
  - `data/` - Markdown documentation content
  - `themes/` - Custom themes (optional)

## Adding Content

Edit files in `data/` folder only. Never modify `documentation-template/`.
EOF
```

### Step 3: Clone the Documentation Template

```bash
# Still in docs folder
git clone https://github.com/USER/documentation-template.git documentation-template
```

Replace with the actual repository URL.

### Step 4: Create Data Folder Structure

```bash
# Create all required directories
mkdir -p data/{assets,config,themes,data/{docs,user-guide,prd,internal-docs,doc-template/docs,doc-template/components,roadmap,blog,pages}}
```

### Step 5: Copy Template Documentation

Copy the template's own documentation to preserve it:

```bash
# Copy template docs to doc-template folder
cp -r documentation-template/dynamic_data/data/docs/docs/* data/data/doc-template/docs/
cp -r documentation-template/dynamic_data/data/docs/components/* data/data/doc-template/components/

# Copy default assets
cp -r documentation-template/dynamic_data/assets/* data/assets/

# Copy page templates
cp -r documentation-template/dynamic_data/data/pages/* data/data/pages/
```

**DO NOT copy the `todo` folder** - that's template-specific.

### Step 6: Create Environment File

```bash
# Copy from template and edit
cp documentation-template/.env.copy .env
```

Edit `.env` — only `CONFIG_DIR` is needed to locate `site.yaml`. All other directory paths are configured in `site.yaml`'s `paths:` section:

```env
# ============================================
# CONFIG BOOTSTRAP
# ============================================
# Points to the directory containing site.yaml, navbar.yaml, footer.yaml
# Relative to the project root (documentation-template/), or absolute
CONFIG_DIR=../data/config

# ============================================
# SERVER SETTINGS
# ============================================
PORT=3088
HOST=true

# ============================================
# SITE SETTINGS
# ============================================
SITE_URL=http://localhost:3088
BASE_PATH=

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_SEARCH=false
ENABLE_DARK_MODE=true
```

> **Path relativity:** `CONFIG_DIR` in `.env` is relative to the **project root** (where `documentation-template/` lives).

### Step 7: Create site.yaml

Create `data/config/site.yaml`:

```yaml
# Site Configuration
site:
  name: "[PRODUCT_NAME]"
  title: "[PRODUCT_NAME] Documentation"
  description: "[PRODUCT_DESCRIPTION]"

# Directory Paths (relative to this config directory, or absolute)
# Each key becomes an @key alias (e.g., data → @data/, assets → @assets/)
paths:
  data: "../data"
  assets: "../assets"
  themes: "../themes"

# Vite Server Configuration
server:
  allowedHosts: true

# Theme Configuration
theme: "@theme/minimal"

# Logo and Favicon Configuration
logo:
  src: "@assets/logo.svg"
  alt: "[PRODUCT_NAME]"
  theme:
    dark: "@assets/logo-dark.svg"
    light: "@assets/logo-light.svg"
  favicon: "@assets/favicon.png"

# Page Definitions
pages:
  # Main Documentation
  docs:
    base_url: "/docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/docs"

  # User Guide
  user-guide:
    base_url: "/user-guide"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/user-guide"

  # PRD Documentation
  prd:
    base_url: "/prd"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/prd"

  # Internal Documentation
  internal-docs:
    base_url: "/internal-docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/internal-docs"

  # Template Documentation (reference)
  doc-template-docs:
    base_url: "/doc-template/docs"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/doc-template/docs"

  doc-template-components:
    base_url: "/doc-template/components"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/doc-template/components"

  # Roadmap
  roadmap:
    base_url: "/roadmap"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/roadmap"

  # Blog
  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/blog_style1"
    data: "@data/blog"

  # Custom Pages
  home:
    base_url: "/"
    type: custom
    layout: "@custom/home"
    data: "@data/pages/home.yaml"

  about:
    base_url: "/about"
    type: custom
    layout: "@custom/info"
    data: "@data/pages/about.yaml"
```

### Step 8: Create navbar.yaml

Create `data/config/navbar.yaml`:

```yaml
# Navbar Configuration
layout: "@navbar/style1"

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
    href: "[GITHUB_URL]"
```

### Step 9: Create footer.yaml

Create `data/config/footer.yaml`:

```yaml
# Footer Configuration
layout: "@footer/default"

copyright: "© {year} [PRODUCT_NAME]. All rights reserved."

columns:
  - title: "Documentation"
    links:
      - label: "Getting Started"
        href: "/docs"
      - label: "User Guide"
        href: "/user-guide"
      - label: "Roadmap"
        href: "/roadmap"

  - title: "Resources"
    links:
      - label: "Blog"
        page: "blog"
      - label: "Template Docs"
        href: "/doc-template/docs"
      - label: "Components"
        href: "/doc-template/components"

  - title: "Company"
    links:
      - label: "About"
        page: "about"
      - label: "GitHub"
        href: "[GITHUB_URL]"

social:
  - platform: "github"
    href: "[GITHUB_URL]"
```

### Step 10: Create Placeholder Documentation

For each docs section, create an intro file and settings.json.

#### Main Docs (`data/data/docs/`)

```bash
# Create settings.json
cat > data/data/docs/settings.json << 'EOF'
{
  "label": "Documentation",
  "isCollapsible": false
}
EOF

# Create intro file
cat > data/data/docs/01_intro.md << 'EOF'
---
title: Introduction
description: Welcome to [PRODUCT_NAME] documentation
---

# Introduction

Welcome to [PRODUCT_NAME] documentation.

## Getting Started

Start here to learn the basics.

## Need Help?

Check out our [User Guide](/user-guide) for detailed instructions.
EOF
```

#### User Guide (`data/data/user-guide/`)

```bash
cat > data/data/user-guide/settings.json << 'EOF'
{
  "label": "User Guide",
  "isCollapsible": false
}
EOF

cat > data/data/user-guide/01_placeholder.md << 'EOF'
---
title: User Guide
description: End-user documentation for [PRODUCT_NAME]
---

# User Guide

This guide helps end-users get started with [PRODUCT_NAME].
EOF
```

#### PRD (`data/data/prd/`)

```bash
cat > data/data/prd/settings.json << 'EOF'
{
  "label": "PRD",
  "isCollapsible": false
}
EOF

cat > data/data/prd/01_placeholder.md << 'EOF'
---
title: Product Requirements
description: Product requirements documentation
---

# Product Requirements Document

Product requirements and specifications.
EOF
```

#### Internal Docs (`data/data/internal-docs/`)

```bash
cat > data/data/internal-docs/settings.json << 'EOF'
{
  "label": "Internal Docs",
  "isCollapsible": false
}
EOF

cat > data/data/internal-docs/01_placeholder.md << 'EOF'
---
title: Internal Documentation
description: Internal team documentation
---

# Internal Documentation

Documentation for internal team use.
EOF
```

#### Roadmap (`data/data/roadmap/`)

```bash
cat > data/data/roadmap/settings.json << 'EOF'
{
  "label": "Roadmap",
  "isCollapsible": false
}
EOF

cat > data/data/roadmap/01_overview.md << 'EOF'
---
title: Product Roadmap
description: Planned features and timeline
---

# Product Roadmap

## Current Phase

Work in progress...

## Upcoming

Planned features...

## Backlog

Future considerations...
EOF
```

### Step 11: Install and Run

```bash
cd documentation-template
bun install
bun run dev
```

Open http://localhost:3088 to see the documentation site.

## Final Structure Verification

After completing all steps, verify the structure:

```
docs/
├── README.md
├── .env
├── documentation-template/      # Git clone (untouched)
│   ├── src/
│   ├── package.json
│   └── ...
└── data/
    ├── assets/
    │   ├── logo.svg
    │   └── favicon.png
    ├── config/
    │   ├── site.yaml
    │   ├── navbar.yaml
    │   └── footer.yaml
    ├── themes/
    └── data/
        ├── docs/
        │   ├── settings.json
        │   └── 01_intro.md
        ├── user-guide/
        │   ├── settings.json
        │   └── 01_placeholder.md
        ├── prd/
        │   ├── settings.json
        │   └── 01_placeholder.md
        ├── internal-docs/
        │   ├── settings.json
        │   └── 01_placeholder.md
        ├── doc-template/
        │   ├── docs/
        │   └── components/
        ├── roadmap/
        │   ├── settings.json
        │   └── 01_overview.md
        ├── blog/
        └── pages/
            ├── home.yaml
            └── about.yaml
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Config not found" | Check CONFIG_DIR in .env is correct relative to project root |
| "Module not found" | Check `paths:` in site.yaml are correct relative to config dir |
| Blank sidebar | Ensure settings.json exists in each docs folder |
| 404 errors | Verify base_url in site.yaml matches navbar hrefs |
| Assets not loading | Check `paths.assets` in site.yaml is correct relative to config dir |
