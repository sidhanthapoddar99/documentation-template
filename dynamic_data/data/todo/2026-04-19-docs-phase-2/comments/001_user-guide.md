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
│   ├── ✅  01_overview.md                          ⚪
│   ├── ✅  02_env.md                               ⚪
│   ├── 03_site/
│   │   ├── ✅  01_overview.md                      ⚪
│   │   ├── ✅  02_metadata.md                      ⚪
│   │   ├── ✅  03_paths.md                         ⚪   reserved-keys list aligned with code
│   │   ├── 🟡  04_theme.md                         ⚪   revisit: theme-section URL pending (see `comments/003_revisit-list.md`)
│   │   ├── ✅  05_server.md                        ⚪
│   │   ├── ✅  06_editor.md                        ⚪
│   │   ├── ✅  07_logo.md                          ⚪
│   │   ├── ✅  08_page.md                          ⚪
│   │   └── ✅  09_reference.md                     ⚪
│   ├── 🟡  04_navbar.md                            ⚪   revisit: future file refs (see `comments/003_revisit-list.md`)
│   ├── 🟡  05_footer.md                            ⚪   revisit: future file refs (see `comments/003_revisit-list.md`)
│   └── ✅  06_dev-mode.md                          🟢  new — dev vs prod runtime + planned `hideInProd` (section/navbar) feature; merged from evicted `15_writing-content/06_dev-mode.md`; links to issue `2025-06-25-dev-only-content`
│
├── 15_writing-content/                             ✅  renamed from 15_content (docs/blogs hoisted out)
│   ├── ✅  01_overview.md                          ⚪   rewritten for 4 content types, removed MDX + dead parser links
│   ├── ✅  02_markdown-basics.md                   🟡  = old 02_markdown-editing/01, dropped MDX row + MDX-components section
│   ├── 🟡  03_asset-embedding.md                   🟡  = old 02_markdown-editing/02, issues section marked not-implemented pending phase-3 wiring; see `comments/003_revisit-list.md`
│   ├── ✅  04_outline.md                           🟡  = old 02_markdown-editing/04, renumbered (was 05_outline)
│   └── ✅  05_drafts.md                            🟢  new — cross-content-type draft feature, per-type + tracker-wide behaviour
│
│   Evicted:
│     🔵  06_dev-mode.md                            → merged into `10_configuration/06_dev-mode.md` (runtime + dev-only-content are config concerns, not writing-content)
│
│   Evicted:
│     🔴  old 04_custom-tags.md                     → moved to `2026-04-20-custom-tags/notes/01_original-user-doc.md` (transformers not wired; see `comments/004_custom-tags-removed.md`)
│
├── 16_layout-system/                               ✅  renamed from 25_layouts
│   └── [ ] 01_overview.md                          ⚪   update: 4 content types, @ext-layouts
│
├── 17_docs/                                        ✅  hoisted from 15_content/03_docs
│   ├── ✅  01_overview.md                          ⚪   dropped MDX, fixed DATA_DIR, added issues/blogs cross-refs, removed dead parser link
│   ├── ✅  02_structure.md                         ⚪   .mdx → .md across examples + tables
│   ├── ✅  03_folder-settings.md                   ⚪   .mdx → .md across examples
│   ├── ✅  04_frontmatter.md                       ⚪   dropped .mdx from header
│   └── ✅  05_asset-embedding.md                   ⚪   fixed cross-link, removed CollapsibleCodeBlock + MDX Requirement, .mdx → .md
│
├── 18_blogs/                                       ✅  hoisted from 15_content/04_blogs
│   ├── ✅  01_overview.md                          ⚪   dropped MDX, fixed DATA_DIR, added docs/issues cross-refs, removed dead parser link
│   ├── ✅  02_blogs-index.md                       ⚪   fixed src/layouts/blog/ → blogs/, removed RSS section (not implemented)
│   ├── ✅  03_structure.md                         ⚪   dropped .mdx from format spec + table
│   ├── ✅  04_frontmatter.md                       ⚪   fixed DATA_DIR path, removed RSS references
│   └── ✅  05_asset-embedding.md                   ⚪   fixed cross-link to /user-guide/writing-content/asset-embedding
│
├── 19_issues/                                      ✅  entire section new — restructured from flat 6-file plan to 10-entry with subfolders
│   ├── ✅  01_overview.md                          🟢   what it is · 4 content types table · folder-per-issue · 6 file types
│   ├── ✅  02_design-philosophy.md                 🟢   NEW — 1–4 person AI-augmented team · no sprints · why `review` · pros/cons
│   ├── ✅  03_folder-structure.md                  🟢   folder naming regex · per-issue contents · URL shapes · draft at two levels
│   ├── 04_settings/                                🟢   NEW subfolder
│   │   ├── ✅  01_per-issue.md                     🟢   full settings.json schema · field semantics · validation
│   │   └── ✅  02_vocabulary.md                    🟢   tracker-root settings.json · fields · colors · preset views · tracker-wide draft
│   ├── 05_sub-docs/                                🟢   NEW subfolder (was one file "05_subtasks-notes-agent-log")
│   │   ├── ✅  01_issue-md.md                      🟢   main body conventions · length · anchors · assets status
│   │   ├── ✅  02_comments.md                      🟢   NNN_YYYY-MM-DD_author naming · frontmatter · rationale
│   │   ├── ✅  03_subtasks.md                      🟢   4-state · frontmatter · state transitions · rendering
│   │   ├── ✅  04_notes.md                         🟢   supporting design docs · when to use vs others
│   │   └── ✅  05_agent-log.md                     🟢   iteration discipline · 4-section body · subgroups · keep-failed-iterations
│   ├── ✅  06_lifecycle-and-review.md              🟢   4-state model · review handoff · subtask-debt promotion · never-autonomous-closed
│   ├── 07_ui/                                      🟢   NEW subfolder (was "06_views-and-filters" flat)
│   │   ├── ✅  01_list-view.md                     🟢   state tabs · preset strip · filter bar · grouping · sort · URL state
│   │   └── ✅  02_detail-view.md                   🟢   3-column layout · Overview/Comprehensive tabs · meta sidebar · keyboard
│   ├── 08_workflows/                               🟢   NEW subfolder — narrative walkthroughs
│   │   ├── ✅  01_create-an-issue.md               🟢   step-by-step from empty to well-formed
│   │   ├── ✅  02_work-an-issue.md                 🟢   pickup · advance subtask · comment · agent-log · hand off
│   │   └── ✅  03_review-and-close.md              🟢   human's side · accept/reject/partial · close-out log
│   ├── ✅  09_using-with-ai.md                     🟢   `/issues` skill (planned) · mental model · 4 rules · helper scripts (planned)
│   └── ✅  10_setup-new-tracker.md                 🟢   new tracker · vocabulary design · site.yaml mount · multiple trackers
│
├── 20_themes/                                      ⚪  kept at 20 (not renumbered per revised plan)
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
├── 30_deployment/                                  ⚪  kept at 30
│   └── [ ] 01_to_be_written.md                     ⚪
│
└── 35_plugins/                                     ⚪  kept at 35
    └── [ ] 01_to_be_written.md                     ⚪
```

> **Custom pages section** — deferred from the original phase-2 plan (was `40_custom/`). To revisit after 17/18/19 ship.
