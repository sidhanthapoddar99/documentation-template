---
title: "Phase 2: Content Features & Layouts"
description: Diagrams, components, and additional layout options
sidebar_label: Phase 2
---

# Phase 2: Content Features & Layouts

**Goal:** Add rich content features and expand layout options.

---

## 1. Mermaid & GraphViz Support

- [ ] Add Mermaid diagram rendering (flowcharts, sequence diagrams)
- [ ] Add GraphViz/DOT diagram support
- [ ] Create diagram documentation with examples
- [ ] Test diagram theming (light/dark mode)
- [ ] Add diagram copy/export functionality

## 2. Components Library

- [ ] Build reusable UI components:
  - [ ] Cards (info, warning, tip, danger)
  - [ ] Badges and labels
  - [ ] Buttons and button groups
  - [ ] Tabs component
  - [ ] Accordion/collapsible
- [ ] Create component showcase/gallery page
- [ ] Add component documentation with live examples
- [ ] Test components across different themes

## 3. Additional Doc Layouts

- [ ] Create `doc_style3` - Wide content, no sidebar
- [ ] Create `doc_style4` - Split view (sidebar + TOC)
- [ ] More sidebar variations:
  - [ ] Icons in sidebar items
  - [ ] Badge counts
  - [ ] Search in sidebar
- [ ] Alternative outline positions (left side, floating)

## 4. Custom Page Templates

- [ ] Create more custom page layouts
- [ ] Build landing page template with hero section
- [ ] Create about page template
- [ ] Create contact page template
- [ ] Test custom page data binding

## 5. Navbar & Footer Variations

- [x] ~~Navbar style switcher~~ (Completed)
- [x] ~~Footer style switcher~~ (Completed)
- [ ] Create `navbar/style2` - Centered logo variant
- [ ] Create `footer/columns` - 4-column footer
- [ ] Add mega menu navbar option

## 6. Claude Skills for Development

- [ ] Skill to create and validate themes
- [ ] Skill to create and validate layouts
- [ ] Skill to create and validate components
- [x] ~~Skill to create and validate configs~~ → `docs-settings` skill
- [x] ~~Skill to write documentation pages~~ → `docs-guide` skill
- [ ] Skill to write blog posts
- [ ] Skill to create custom pages

**Completed Skills:**
- `docs-guide` - Writing documentation content (markdown, frontmatter, folder settings)
- `docs-settings` - Configuring documentation sites (YAML files, .env, project structure)

See [Claude Skills documentation](/docs/final-docs/getting-started/claude-skills) for usage.

## 7. Dev-Only Content (Hide in Production)

Allow certain pages/sections to be visible only during development.

### Page-Level Hiding

- [ ] Add `hideInProd: true` option in page config (site.yaml)
- [ ] Add `draft: true` or `devOnly: true` frontmatter option for individual docs
- [ ] Filter out dev-only pages during production build
- [ ] Show visual indicator in dev mode for hidden pages

**Use Case:** Todo/roadmap docs visible during development but hidden in production.

```yaml
# site.yaml example
pages:
  todo:
    base_url: "/todo"
    type: docs
    layout: "@docs/default"
    data: "@data/docs/todo"
    hideInProd: true  # Only visible in dev mode
```

### Navbar Item Hiding (Independent)

- [ ] Add `hideInProd: true` option for navbar items
- [ ] Filter navbar items during production build
- [ ] Show visual indicator (e.g., badge/icon) in dev mode for hidden items
- [ ] Support hiding nested dropdown items independently

```yaml
# navbar.yaml example
layout: "@navbar/default"

items:
  - label: "Home"
    href: "/"
  - label: "Docs"
    href: "/docs/final-docs"
  - label: "Todo"
    href: "/todo"
    hideInProd: true  # Only visible in dev navbar
  - label: "Debug"
    hideInProd: true
    items:
      - label: "Cache Stats"
        href: "/debug/cache"
      - label: "Config Viewer"
        href: "/debug/config"
```

- [ ] Document the feature with examples

## 8. Multiple Data Paths

Support multiple named data paths instead of single DATA_DIR.

- [ ] Update `.env` to support multiple paths:
  ```env
  DATA_PATHS=docs:./dynamic_data/data/docs,blog:./dynamic_data/data/blog,external:/abs/path/to/data
  ```
- [ ] Or use YAML config for paths:
  ```yaml
  # In site.yaml or separate paths.yaml
  dataPaths:
    docs: "./dynamic_data/data/docs"
    blog: "./dynamic_data/data/blog"
    external: "/absolute/path/to/data"
  ```
- [ ] Create path resolution utilities in `@loaders/paths.ts`
- [ ] Support `@data/<path_name>/subpath` alias format
- [ ] Standardize all path inputs to use this pattern
- [ ] Handle both relative and absolute paths
- [ ] Validate paths exist on startup
- [ ] Update documentation for new path system

## 9. Codebase Refactoring

Clean up and improve code quality.

- [ ] Audit and refactor loaders for consistency
- [ ] Standardize error handling patterns
- [ ] Remove dead code and unused imports
- [ ] Improve TypeScript types coverage
- [ ] Add JSDoc comments to public APIs
- [ ] Refactor large files into smaller modules
- [ ] Create shared utilities for common operations
- [ ] Update all documentation after refactoring
- [ ] Ensure all code examples in docs match refactored code

---

## Deliverables

| Item | Status |
|------|--------|
| Mermaid diagram support | Pending |
| GraphViz diagram support | Pending |
| Component library (5+ components) | Pending |
| 2 new doc layouts | Pending |
| 3 custom page templates | Pending |
| Additional navbar/footer styles | Partial |
| 7 Claude skills | Partial (2/7) |
| Dev-only content feature | Pending |
| Multiple data paths support | Pending |
| Codebase refactoring | Pending |

---

## Success Criteria

- Mermaid diagrams render correctly in light and dark mode
- Component library is documented with live examples
- At least 4 doc layout styles available
- Landing, about, and contact templates ready to use
- Claude skills accelerate development workflow
- Dev-only pages hidden in production builds
- Multiple data sources can be configured and accessed via aliases
- Codebase is clean with updated documentation
