---
title: "Proposed file structure — User Guide and Dev Docs"
description: From-scratch file-level layout for both docs with every existing page annotated (kept / new / moved-in-doc / moved-across-docs / deleted).
sidebar_label: Proposed file structure
---

## Legend

| Marker | Meaning |
|---|---|
| ⚪ | **Kept same** — same location, same purpose. May still need content updates, called out inline where relevant. |
| 🟢 | **New** — page or section does not exist today. |
| 🟡 | **Moved within the same doc** — relocated inside user-guide (or inside dev-docs), renamed or renumbered. |
| 🔵 | **Moved across docs** — leaves one doc and lands in the other. |
| 🔴 | **Deleted** — removed entirely. |

Content-level rewrites are called out as **(update)** in the notes column — the colour marker still tracks *location only*.

---

## User Guide

Target audience: people writing docs / configuring a site. Zero need to understand backend or frontend internals.

Top-level IA reshaped so each content type (Docs / Blogs / Issues / Custom) is its own section, and code-structure material is evicted.

```
user-guide/
├── 05_getting-started/
│   ├── 01_overview.md                          ⚪
│   ├── 02_installation.md                      ⚪
│   ├── 03_aliases.md                           ⚪   (rename 03_Alias → 03_aliases for consistency)
│   ├── 04_data-structure.md                    🟡  (merge 04_structure/01 + 04_structure/03; data folder only)
│   └── 05_claude-skills.md                     ⚪
│
│   Evicted:
│     04_structure/02_code-structure.md         🔵 → dev-docs (code/project structure is maintainer-facing)
│     04_structure/ folder                      🔴 (flattened into 04_data-structure.md)
│
├── 10_configuration/
│   ├── 01_overview.md                          ⚪
│   ├── 02_env.md                               ⚪
│   ├── 03_site/
│   │   ├── 01_overview.md                      ⚪
│   │   ├── 02_metadata.md                      ⚪
│   │   ├── 03_paths.md                         ⚪   (update: any new aliases)
│   │   ├── 04_theme.md                         ⚪   (update: new token contract, theme_paths)
│   │   ├── 05_server.md                        ⚪
│   │   ├── 06_editor.md                        ⚪   (update: editor.presence.* knobs)
│   │   ├── 07_logo.md                          ⚪
│   │   ├── 08_page.md                          ⚪
│   │   └── 09_reference.md                     ⚪
│   ├── 04_navbar.md                            ⚪
│   └── 05_footer.md                            ⚪
│
├── 15_writing-content/                         🟡  (renamed from 15_content — now *just* writing)
│   ├── 01_overview.md                          ⚪   (update: trim layout references)
│   ├── 02_markdown-basics.md                   🟡  (= old 02_markdown-editing/01)
│   ├── 03_asset-embedding.md                   🟡  (= old 02_markdown-editing/02)
│   ├── 04_custom-tags.md                       🟡  (= old 02_markdown-editing/03)
│   └── 05_outline.md                           🟡  (= old 02_markdown-editing/04)
│
│   Evicted:
│     15_content/03_docs/*                      🟡 → 25_docs/   (hoisted to top-level)
│     15_content/04_blogs/*                     🟡 → 30_blogs/  (hoisted to top-level)
│
├── 20_layout-system/                           🟡  (promoted from 25_layouts, single overview page)
│   └── 01_overview.md                          ⚪   (update: 4 content types, @ext-layouts, style-per-folder)
│
├── 25_docs/                                    🟡  (hoisted from 15_content/03_docs)
│   ├── 01_overview.md                          ⚪
│   ├── 02_structure.md                         ⚪
│   ├── 03_folder-settings.md                   ⚪
│   ├── 04_frontmatter.md                       ⚪
│   └── 05_asset-embedding.md                   ⚪
│
├── 30_blogs/                                   🟡  (hoisted from 15_content/04_blogs)
│   ├── 01_overview.md                          ⚪
│   ├── 02_blogs-index.md                       ⚪
│   ├── 03_structure.md                         ⚪
│   ├── 04_frontmatter.md                       ⚪
│   └── 05_asset-embedding.md                   ⚪
│
├── 35_issues/                                  🟢  (entire section new)
│   ├── 01_overview.md                          🟢   (purpose + why AI-native)
│   ├── 02_structure.md                         🟢   (folder-per-item layout)
│   ├── 03_settings-json.md                     🟢   (per-issue metadata schema)
│   ├── 04_vocabulary.md                        🟢   (tracker-wide settings.json)
│   ├── 05_subtasks-notes-agent-log.md          🟢   (sub-docs + sub-doc URLs)
│   └── 06_views-and-filters.md                 🟢
│
├── 40_custom/                                  🟢  (new top-level — custom pages)
│   ├── 01_overview.md                          🟢
│   └── 02_creating-custom-pages.md             🟢
│
├── 45_themes/                                  🟡  (renumbered from 20_themes)
│   ├── 01_overview.md                          ⚪   (update: two-tier contract, required_variables)
│   ├── 02_theme-structure.md                   ⚪   (update: theme.yaml + extends)
│   ├── 03_creating-themes.md                   ⚪   (update: inherit-and-override)
│   ├── 04_tokens/                              🟡  (renamed from 04_css-variables, restructured)
│   │   ├── 01_overview.md                      ⚪   (rewrite for primitive/semantic split)
│   │   ├── 02_primitive-tokens.md              🟢   (font-size scale, raw palette)
│   │   ├── 03_semantic-ui-tokens.md            🟢   (--ui-text-* / --color-bg-* etc.)
│   │   ├── 04_semantic-content-tokens.md       🟢   (--content-body / --content-h* / --content-code)
│   │   ├── 05_display-tokens.md                🟢   (--display-sm/md/lg for marketing)
│   │   ├── 06_element-reference.md             🟡  (merge old 04_element-variables)
│   │   ├── 07_markdown-styles.md               ⚪   (= old 05_markdown-styles)
│   │   ├── 08_navbar-styles.md                 ⚪
│   │   ├── 09_footer-styles.md                 ⚪
│   │   ├── 10_docs-styles.md                   ⚪
│   │   ├── 11_blog-styles.md                   ⚪
│   │   └── 12_custom-page-styles.md            ⚪
│   │
│   │   Evicted:
│   │     old 02_color-variables.md             🔴 (absorbed into primitive + semantic-ui tokens)
│   │     old 03_font-variables.md              🔴 (absorbed into primitive tokens)
│   │
│   ├── 05_theme-inheritance.md                 ⚪
│   ├── 06_validation.md                        ⚪   (update: required_variables contract)
│   └── 07_rules.md                             ⚪   (update: no invented names, no hardcoded fallbacks)
│
├── 50_deployment/                              🟡  (renumbered from 30_deployment)
│   └── 01_to_be_written.md                     ⚪   (stub stays)
│
└── 55_plugins/                                 🟡  (renumbered from 35_plugins)
    └── 01_to_be_written.md                     ⚪   (stub stays)
```

---

## Dev Docs

Target audience: maintainers / contributors. Opens with a component map so the codebase shape is visible before drilling into any one file.

Section numbers align 1:1 with the **nine components** called out in the issue braindump:

1. Overview / component map
2. Architecture
3. Parsers
4. Routing system
5. Layout system
6. Caching system
7. Scripts
8. Dev toolkits
9. Optimizations
10. Theme system

```
dev-docs/
├── 01_overview/                                🟢  (new top-level opener — the component map)
│   ├── 01_component-map.md                     🟢   (one-page overview of the nine components)
│   └── 02_code-structure.md                    🔵   (from user-guide/05/04_structure/02_code-structure)
│
├── 05_architecture/
│   ├── 01_overview.md                          ⚪
│   ├── 02_routing.md                           ⚪
│   ├── 03_data-loading.md                      ⚪
│   └── 04_server-vs-static-mode.md             🟡  (from 20_development/03_server-vs-static-mode)
│
├── 10_parsers/                                 🟡  (promoted from 05_architecture/04_parser/ to top-level)
│   ├── 01_overview.md                          🟡
│   ├── 02_content-type-parser.md               🟡
│   ├── 03_processing-pipeline.md               🟡
│   ├── 04_pre-processing.md                    🟡
│   ├── 05_renderer.md                          🟡
│   ├── 06_post-processing.md                   🟡
│   └── 07_transformers.md                      🟡
│
├── 15_layout-system/                           🟡  (merges 05_architecture/05_layout-internals + 10_layouts)
│   ├── 01_overview.md                          🟡
│   ├── 02_layout-types.md                      🟡
│   ├── 03_base-layout.md                       🟡
│   ├── 04_components.md                        🟡
│   ├── 05_layout-resolution.md                 🟡
│   ├── 06_creating-layouts.md                  🟡
│   ├── 07_docs-layout/                         🟡  (from 10_layouts/02_docs-layout)
│   │   ├── 01_overview.md                      🟡
│   │   ├── 02_data-interface.md                🟡
│   │   ├── 03_components.md                    🟡
│   │   └── 04_conventions.md                   🟡
│   ├── 08_blog-layout/                         🟡  (from 10_layouts/03_blog-layout)
│   │   ├── 01_overview.md                      🟡
│   │   ├── 02_data-interface.md                🟡
│   │   ├── 03_components.md                    🟡
│   │   └── 04_conventions.md                   🟡
│   ├── 09_issues-layout/                       🟢   (entire section new)
│   │   ├── 01_overview.md                      🟢
│   │   ├── 02_data-interface.md                🟢   (folder-per-item, settings.json, vocab)
│   │   ├── 03_components.md                    🟢   (IndexLayout + DetailLayout + parts/)
│   │   ├── 04_sub-doc-urls.md                  🟢   (subtasks / notes / agent-log routes)
│   │   └── 05_conventions.md                   🟢
│   └── 10_custom-layout/                       🟡  (from 10_layouts/04_custom-layout)
│       ├── 01_overview.md                      🟡
│       ├── 02_data-interface.md                🟡
│       ├── 03_components.md                    🟡
│       └── 04_creating.md                      🟡
│
├── 20_caching/                                 🟡  (promoted from 05_architecture/06_optimizations)
│   ├── 01_why-caching.md                       🟡
│   └── 02_unified-cache-system.md              🟡
│
├── 25_scripts/                                 🟡  (renumbered from 15_scripts)
│   ├── 05_overview.md                          ⚪
│   ├── 10_diagrams.md                          ⚪
│   ├── 15_lightbox.md                          ⚪
│   ├── 20_code-labels.md                       ⚪
│   └── 50_creating-scripts.md                  ⚪
│
├── 30_dev-toolkits/                            🟢  (new top-level — consolidates dev-toolbar apps)
│   ├── 01_overview.md                          🟢   (what dev-tools are, how they register)
│   ├── 02_folder-structure.md                  🟢   (folder-per-tool, _shared/ layer)
│   ├── 03_layout-switcher.md                   🟡   (from 20_development/02)
│   ├── 04_error-logger.md                      🟡   (from 20_development/05_error-warning-logs)
│   ├── 05_live-editor.md                       🟡   (from 20_development/06 — placeholder; full rewrite is its own issue)
│   ├── 06_system-metrics.md                    🟢   (RAM / CPU toolbar app)
│   └── 07_cache-inspector.md                   🟢   (Yjs rooms / editor docs / presence)
│
├── 35_optimizations/                           🟡  (kept as its own section per the nine-component spine)
│   └── 01_optimization-details.md              🟡   (from 05_architecture/06_optimizations/03)
│
├── 40_theme-system/                            🟢  (entire section new — no current dev-side theme coverage)
│   ├── 01_overview.md                          🟢   (why a contract exists)
│   ├── 02_required-variables.md                🟢   (theme.yaml contract)
│   ├── 03_two-tier-token-model.md              🟢   (primitive vs semantic UI/content/display)
│   ├── 04_theme-resolution.md                  🟢   (resolveThemeName, theme_paths, load order)
│   └── 05_standardization-rules.md             🟢   (no invented names, no hardcoded fallbacks, why)
│
└── 99_appendix/                                🟡  (catch-all)
    ├── 01_troubleshooting.md                   🟡   (from 20_development/04)
    └── 02_development-overview.md              🟡   (from 20_development/01 — if still useful)
```

---

## Cross-docs moves (summary)

| From | → | To | Why |
|---|---|---|---|
| `user-guide/05_getting-started/04_structure/02_code-structure.md` | 🔵 | `dev-docs/01_overview/02_code-structure.md` | Readers writing docs don't need to know the `src/` layout. |

---

## Deletions (summary)

| Path | Why |
|---|---|
| `user-guide/15_content/02_markdown-editing/` (folder) | 🔴 flattened into `15_writing-content/*` top-level files. |
| `user-guide/15_content/03_docs/` + `04_blogs/` (folders) | 🔴 hoisted out — `15_content/` no longer holds content-type sub-sections. |
| `user-guide/15_content/` itself | 🔴 replaced by `15_writing-content/`. |
| `user-guide/05_getting-started/04_structure/` (folder) | 🔴 flattened into `04_data-structure.md` + `code-structure.md` moves across docs. |
| `user-guide/20_themes/04_css-variables/02_color-variables.md` | 🔴 absorbed into primitive + semantic-ui token pages. |
| `user-guide/20_themes/04_css-variables/03_font-variables.md` | 🔴 absorbed into primitive token page. |

---

## Open questions

1. **`user-guide/50_deployment/` and `55_plugins/`** currently hold `01_to_be_written.md` stubs. Keep as placeholders for phase-3 or delete until they're real? (Marked ⚪ above; flip to 🔴 if we prefer deleting.)
2. **`dev-docs/20_development/`** as a folder disappears — its contents split between `05_architecture/`, `30_dev-toolkits/`, and `99_appendix/`. OK?
3. **Claude skills placement** — currently a single page at `user-guide/05_getting-started/05_claude-skills.md`. Leave it inside getting-started, or hoist to its own top-level (e.g. `60_claude-skills/`)? Left inline for now.
4. **Layout System user-guide depth** — currently just a one-page overview. Do we want authoring-how-to pages here too, or keep authoring entirely inside `25_docs/` / `30_blogs/` / `35_issues/` / `40_custom/` (with `20_layout-system/` being purely conceptual)? Current proposal does the latter.
5. **Old `css-variables/` element pages (element / markdown / navbar / footer / docs / blog / custom-page-styles)** — all marked ⚪ and renumbered. Do any of these fold into the new token tiers, or do they stay as per-surface reference? Kept separate for now.
