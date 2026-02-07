# Add Page Workflow

This workflow guides you through adding new documentation pages/sections to an existing setup.

## Before You Start

1. Confirm the docs structure exists (see [initial-setup.md](./initial-setup.md))
2. Ask the user what type of page they want to add
3. **ONLY modify files in the `data/` folder**

## Page Types

| Type | Use Case | Configuration |
|------|----------|---------------|
| `docs` | Documentation with sidebar navigation | `type: docs` |
| `blog` | Blog posts with date-based URLs | `type: blog` |
| `custom` | Landing pages, about pages | `type: custom` |

## Adding a Docs Section

### Step 1: Create the Folder Structure

```bash
# Navigate to the data folder
cd docs/data/data

# Create the new docs folder
mkdir -p new-section

# Create settings.json
cat > new-section/settings.json << 'EOF'
{
  "label": "New Section",
  "isCollapsible": true,
  "collapsed": false
}
EOF

# Create first document
cat > new-section/01_overview.md << 'EOF'
---
title: New Section Overview
description: Description of this section
---

# New Section

Content goes here.
EOF
```

### Step 2: Add to site.yaml

Edit `docs/data/config/site.yaml` and add under `pages:`:

```yaml
pages:
  # ... existing pages ...

  new-section:
    base_url: "/new-section"
    type: docs
    layout: "@docs/doc_style1"
    data: "@data/new-section"
```

### Step 3: Add to navbar.yaml

Edit `docs/data/config/navbar.yaml`:

```yaml
items:
  # ... existing items ...

  - label: "New Section"
    href: "/new-section"
```

Or add as a dropdown item:

```yaml
items:
  - label: "Guides"
    items:
      - label: "Existing Guide"
        href: "/existing"
      - label: "New Section"      # Add here
        href: "/new-section"
```

### Step 4: Optionally Add to Footer

Edit `docs/data/config/footer.yaml`:

```yaml
columns:
  - title: "Documentation"
    links:
      # ... existing links ...
      - label: "New Section"
        href: "/new-section"
```

## Adding a Blog

### Step 1: Create Blog Folder

```bash
mkdir -p docs/data/data/blog
```

### Step 2: Add to site.yaml

```yaml
pages:
  blog:
    base_url: "/blog"
    type: blog
    layout: "@blog/blog_style1"
    data: "@data/blog"
```

### Step 3: Create Blog Posts

Blog posts use date-based naming: `YYYY-MM-DD-slug.md`

```bash
cat > docs/data/data/blog/2024-01-15-first-post.md << 'EOF'
---
title: First Blog Post
description: Our first blog post
author: Team
date: 2024-01-15
tags: [announcement, news]
---

# First Blog Post

Content goes here.
EOF
```

## Adding a Custom Page

### Step 1: Create Page Data File

```bash
cat > docs/data/data/pages/new-page.yaml << 'EOF'
title: "New Page"
description: "Description for SEO"
hero:
  title: "Welcome to New Page"
  subtitle: "Subtitle here"
  cta:
    label: "Get Started"
    href: "/docs"
EOF
```

### Step 2: Add to site.yaml

```yaml
pages:
  new-page:
    base_url: "/new-page"
    type: custom
    layout: "@custom/info"    # or @custom/home for landing pages
    data: "@data/pages/new-page.yaml"
```

## Adding Nested Documentation

For complex docs with subsections:

```
docs/data/data/new-section/
├── settings.json
├── 01_overview.md
├── 02_getting-started/
│   ├── settings.json
│   ├── 01_installation.md
│   └── 02_configuration.md
└── 03_advanced/
    ├── settings.json
    ├── 01_customization.md
    └── 02_api.md
```

Each subfolder needs its own `settings.json`:

```json
{
  "label": "Getting Started",
  "isCollapsible": true,
  "collapsed": false
}
```

## Quick Reference: File Naming

| Type | Naming Convention | Example |
|------|-------------------|---------|
| Docs folder | `XX_name/` | `01_getting-started/` |
| Docs file | `XX_name.md` | `01_overview.md` |
| Blog file | `YYYY-MM-DD-slug.md` | `2024-01-15-hello.md` |
| Custom page | `name.yaml` | `about.yaml` |

## Checklist

- [ ] Created folder/file in `data/data/`
- [ ] Added `settings.json` (for docs type)
- [ ] Added page definition to `site.yaml`
- [ ] Added navigation item to `navbar.yaml`
- [ ] (Optional) Added to `footer.yaml`
- [ ] Tested locally with `bun run dev`
