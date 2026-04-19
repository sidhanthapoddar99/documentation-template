---
author: claude
date: 2026-04-19
---

# User Guide — progress tracker

Replace `[ ]` with ✅ as each file lands. Legend + rationale live in `notes/01_proposed-file-structure.md`.

```
user-guide/
├── 05_getting-started/
│   ├── ✅  01_overview.md                          ⚪
│   ├── ✅  02_installation.md                      ⚪
│   ├── ✅  03_aliases.md                           ⚪   renamed 03_Alias → 03_aliases
│   ├── 🟡  04_data-structure.md                    🟡  merged old 04_structure/01 + 04_structure/03 — revisit: see `comments/003_revisit-list.md`
│   └── 🟡  05_claude-skills.md                     ⚪   revisit: see `comments/003_revisit-list.md`
│
│   Evicted:
│     ✅  04_structure/02_code-structure.md         🔵 → dev-docs/01_overview/
│     [ ] 04_structure/ folder                      🔴  flattened
│
├── 10_configuration/
│   ├── [ ] 01_overview.md                          ⚪
│   ├── [ ] 02_env.md                               ⚪
│   ├── 03_site/
│   │   ├── [ ] 01_overview.md                      ⚪
│   │   ├── [ ] 02_metadata.md                      ⚪
│   │   ├── [ ] 03_paths.md                         ⚪   update: any new aliases
│   │   ├── [ ] 04_theme.md                         ⚪   update: new token contract, theme_paths
│   │   ├── [ ] 05_server.md                        ⚪
│   │   ├── [ ] 06_editor.md                        ⚪   update: editor.presence.* knobs
│   │   ├── [ ] 07_logo.md                          ⚪
│   │   ├── [ ] 08_page.md                          ⚪
│   │   └── [ ] 09_reference.md                     ⚪
│   ├── [ ] 04_navbar.md                            ⚪
│   └── [ ] 05_footer.md                            ⚪
│
├── 15_writing-content/                             🟡  renamed from 15_content
│   ├── [ ] 01_overview.md                          ⚪   update: trim layout references
│   ├── [ ] 02_markdown-basics.md                   🟡  = old 02_markdown-editing/01
│   ├── [ ] 03_asset-embedding.md                   🟡  = old 02_markdown-editing/02
│   ├── [ ] 04_custom-tags.md                       🟡  = old 02_markdown-editing/03
│   └── [ ] 05_outline.md                           🟡  = old 02_markdown-editing/04
│
│   Evicted:
│     [ ] 15_content/03_docs/*                      🟡 → 25_docs/
│     [ ] 15_content/04_blogs/*                     🟡 → 30_blogs/
│     [ ] 15_content/ folder                        🔴
│
├── 20_layout-system/                               🟡  promoted from 25_layouts
│   └── [ ] 01_overview.md                          ⚪   update: 4 content types, @ext-layouts
│
├── 25_docs/                                        🟡  hoisted from 15_content/03_docs
│   ├── [ ] 01_overview.md                          ⚪
│   ├── [ ] 02_structure.md                         ⚪
│   ├── [ ] 03_folder-settings.md                   ⚪
│   ├── [ ] 04_frontmatter.md                       ⚪
│   └── [ ] 05_asset-embedding.md                   ⚪
│
├── 30_blogs/                                       🟡  hoisted from 15_content/04_blogs
│   ├── [ ] 01_overview.md                          ⚪
│   ├── [ ] 02_blogs-index.md                       ⚪
│   ├── [ ] 03_structure.md                         ⚪
│   ├── [ ] 04_frontmatter.md                       ⚪
│   └── [ ] 05_asset-embedding.md                   ⚪
│
├── 35_issues/                                      🟢  entire section new
│   ├── [ ] 01_overview.md                          🟢   purpose + why AI-native
│   ├── [ ] 02_structure.md                         🟢   folder-per-item layout
│   ├── [ ] 03_settings-json.md                     🟢   per-issue metadata schema
│   ├── [ ] 04_vocabulary.md                        🟢   tracker-wide settings.json
│   ├── [ ] 05_subtasks-notes-agent-log.md          🟢   sub-docs + sub-doc URLs
│   └── [ ] 06_views-and-filters.md                 🟢
│
├── 40_custom/                                      🟢  new top-level
│   ├── [ ] 01_overview.md                          🟢
│   └── [ ] 02_creating-custom-pages.md             🟢
│
├── 45_themes/                                      🟡  renumbered from 20_themes
│   ├── [ ] 01_overview.md                          ⚪   update: two-tier contract, required_variables
│   ├── [ ] 02_theme-structure.md                   ⚪   update: theme.yaml + extends
│   ├── [ ] 03_creating-themes.md                   ⚪   update: inherit-and-override
│   ├── 04_tokens/                                  🟡  renamed from 04_css-variables
│   │   ├── [ ] 01_overview.md                      ⚪   rewrite for primitive/semantic split
│   │   ├── [ ] 02_primitive-tokens.md              🟢
│   │   ├── [ ] 03_semantic-ui-tokens.md            🟢
│   │   ├── [ ] 04_semantic-content-tokens.md       🟢
│   │   ├── [ ] 05_display-tokens.md                🟢
│   │   ├── [ ] 06_element-reference.md             🟡  merge old 04_element-variables
│   │   ├── [ ] 07_markdown-styles.md               ⚪
│   │   ├── [ ] 08_navbar-styles.md                 ⚪
│   │   ├── [ ] 09_footer-styles.md                 ⚪
│   │   ├── [ ] 10_docs-styles.md                   ⚪
│   │   ├── [ ] 11_blog-styles.md                   ⚪
│   │   └── [ ] 12_custom-page-styles.md            ⚪
│   │
│   │   Evicted:
│   │     [ ] old 02_color-variables.md             🔴  absorbed into primitive + semantic-ui
│   │     [ ] old 03_font-variables.md              🔴  absorbed into primitive
│   │
│   ├── [ ] 05_theme-inheritance.md                 ⚪
│   ├── [ ] 06_validation.md                        ⚪   update: required_variables contract
│   └── [ ] 07_rules.md                             ⚪   update: no invented names, no hardcoded fallbacks
│
├── 50_deployment/                                  🟡  renumbered from 30_deployment
│   └── [ ] 01_to_be_written.md                     ⚪
│
└── 55_plugins/                                     🟡  renumbered from 35_plugins
    └── [ ] 01_to_be_written.md                     ⚪
```
