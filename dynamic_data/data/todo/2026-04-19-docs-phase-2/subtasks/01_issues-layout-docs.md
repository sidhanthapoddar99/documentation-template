---
title: "Issues layout — docs"
done: false
---

Absorbed from `2026-04-10-issues-layout/subtasks/06_documentation-and-skills.md`. User-guide and dev-docs coverage for the **issues** content type.

## User guide — `35_issues/` (new top-level)

- [ ] `01_overview.md` — purpose + why AI-native (subtasks/notes/agent-log are machine-writable + human-readable)
- [ ] `02_structure.md` — folder-per-item (`YYYY-MM-DD-<slug>/`), file roles (`issue.md` / `comments/` / `subtasks/` / `notes/` / `agent-log/`)
- [ ] `03_settings-json.md` — per-issue metadata schema
- [ ] `04_vocabulary.md` — tracker-root `settings.json` (status / priority / component / milestone / labels)
- [ ] `05_subtasks-notes-agent-log.md` — sub-doc model + sub-doc URLs + `draft: true`
- [ ] `06_views-and-filters.md` — filters, presets, group-by, compact mode

## Dev docs — `15_layout-system/09_issues-layout/` (new)

- [ ] `01_overview.md`
- [ ] `02_data-interface.md` — folder-per-item, `settings.json`, vocabulary
- [ ] `03_components.md` — IndexLayout + DetailLayout + `parts/` split pattern
- [ ] `04_sub-doc-urls.md` — subtasks / notes / agent-log routes, legacy-hash redirect
- [ ] `05_conventions.md` — `<script type="application/json">` config pattern, `:global()` gotcha for JS-rendered nodes

## Out of scope for this subtask

- Claude skill `.claude/skills/issues.md` — separate workstream, lives under the source subtask's "Skill content" section.
- Helper Node scripts (`scripts/issues/*.mjs`) — source subtask's "Helper Node scripts" section.
