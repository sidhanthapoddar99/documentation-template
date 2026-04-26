---
author: claude
date: 2026-04-19
---

# Dev Docs — progress tracker

Replace `[ ]` with ✅ as each file lands. Legend + rationale live in `notes/01_proposed-file-structure.md`.

```
dev-docs/
├── 01_overview/                                    🟢  new top-level opener
│   ├── [ ] 01_component-map.md                     🟢   one-page overview of the nine components
│   └── ✅  02_code-structure.md                    🔵   from user-guide/05/04_structure/02_code-structure
│
├── 05_architecture/
│   ├── [ ] 01_overview.md                          ⚪
│   ├── [ ] 02_routing.md                           ⚪
│   ├── [ ] 03_data-loading.md                      ⚪
│   └── [ ] 04_server-vs-static-mode.md             🟡  from 20_development/03
│
├── 10_parsers/                                     🟡  promoted from 05_architecture/04_parser/
│   ├── [ ] 01_overview.md                          🟡
│   ├── [ ] 02_content-type-parser.md               🟡
│   ├── [ ] 03_processing-pipeline.md               🟡
│   ├── [ ] 04_pre-processing.md                    🟡
│   ├── [ ] 05_renderer.md                          🟡
│   ├── [ ] 06_post-processing.md                   🟡
│   └── [ ] 07_transformers.md                      🟡
│
├── 15_layout-system/                               🟡  merges 05_architecture/05_layout-internals + 10_layouts
│   ├── [ ] 01_overview.md                          🟡
│   ├── [ ] 02_layout-types.md                      🟡
│   ├── [ ] 03_base-layout.md                       🟡
│   ├── [ ] 04_components.md                        🟡
│   ├── [ ] 05_layout-resolution.md                 🟡
│   ├── [ ] 06_creating-layouts.md                  🟡
│   ├── 07_docs-layout/                             🟡  from 10_layouts/02
│   │   ├── [ ] 01_overview.md                      🟡
│   │   ├── [ ] 02_data-interface.md                🟡
│   │   ├── [ ] 03_components.md                    🟡
│   │   └── [ ] 04_conventions.md                   🟡
│   ├── 08_blog-layout/                             🟡  from 10_layouts/03
│   │   ├── [ ] 01_overview.md                      🟡
│   │   ├── [ ] 02_data-interface.md                🟡
│   │   ├── [ ] 03_components.md                    🟡
│   │   └── [ ] 04_conventions.md                   🟡
│   ├── 09_issues-layout/                           🟢  entire section new
│   │   ├── [ ] 01_overview.md                      🟢
│   │   ├── [ ] 02_data-interface.md                🟢   folder-per-item, settings.json, vocab
│   │   ├── [ ] 03_components.md                    🟢   IndexLayout + DetailLayout + parts/
│   │   ├── [ ] 04_sub-doc-urls.md                  🟢   subtasks / notes / agent-log routes
│   │   └── [ ] 05_conventions.md                   🟢
│   └── 10_custom-layout/                           🟡  from 10_layouts/04
│       ├── [ ] 01_overview.md                      🟡
│       ├── [ ] 02_data-interface.md                🟡
│       ├── [ ] 03_components.md                    🟡
│       └── [ ] 04_creating.md                      🟡
│
├── 20_caching/                                     🟡  promoted from 05_architecture/06_optimizations
│   ├── [ ] 01_why-caching.md                       🟡
│   └── [ ] 02_unified-cache-system.md              🟡
│
├── 25_scripts/                                     🟡  renumbered from 15_scripts
│   ├── [ ] 05_overview.md                          ⚪
│   ├── [ ] 10_diagrams.md                          ⚪
│   ├── [ ] 15_lightbox.md                          ⚪
│   ├── [ ] 20_code-labels.md                       ⚪
│   └── [ ] 50_creating-scripts.md                  ⚪
│
├── 30_dev-toolkits/                                🟢  new top-level
│   ├── [ ] 01_overview.md                          🟢   what dev-tools are, how they register
│   ├── [ ] 02_folder-structure.md                  🟢   folder-per-tool, _shared/ layer
│   ├── [ ] 03_layout-switcher.md                   🟡   from 20_development/02
│   ├── [ ] 04_error-logger.md                      🟡   from 20_development/05_error-warning-logs
│   ├── [ ] 05_live-editor.md                       🟡   from 20_development/06 (placeholder; full rewrite is its own issue)
│   ├── [ ] 06_system-metrics.md                    🟢   RAM / CPU toolbar app
│   └── [ ] 07_cache-inspector.md                   🟢   Yjs rooms / editor docs / presence
│
├── 35_optimizations/                               🟡  kept per the nine-component spine
│   └── [ ] 01_optimization-details.md              🟡  from 05_architecture/06_optimizations/03
│
├── 40_theme-system/                                🟢  entire section new
│   ├── [ ] 01_overview.md                          🟢   why a contract exists
│   ├── [ ] 02_required-variables.md                🟢   theme.yaml contract
│   ├── [ ] 03_two-tier-token-model.md              🟢   primitive vs semantic UI/content/display
│   ├── [ ] 04_theme-resolution.md                  🟢   resolveThemeName, theme_paths, load order
│   └── [ ] 05_standardization-rules.md             🟢   no invented names, no hardcoded fallbacks, why
│
└── 99_appendix/                                    🟡  catch-all
    ├── [ ] 01_troubleshooting.md                   🟡  from 20_development/04
    └── [ ] 02_development-overview.md              🟡  from 20_development/01 (if still useful)
```
