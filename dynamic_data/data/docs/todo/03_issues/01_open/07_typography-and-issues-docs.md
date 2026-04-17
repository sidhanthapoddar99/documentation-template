---
title: "Docs — Typography Contract + Issues Tracker User Guide"
description: Write the user-guide and dev-docs sections for the new theme typography contract and the issues content type
sidebar_label: Typography + Issues Docs
---

# Docs — Typography Contract + Issues Tracker User Guide

**Type:** Docs
**Priority:** Medium
**Component:** `dynamic_data/data/user-guide/`, `dynamic_data/data/dev-docs/`
**Status:** Open

---

## Context

Two recent architectural changes landed without end-user documentation:

1. **Typography token contract** — `src/styles/theme.yaml` now mandates a primitive `--font-size-*` scale plus semantic aliases (`--ui-text-micro/body/title`, `--content-body/h1…h6/code`, `--display-sm/md/lg`). Layouts must consume semantic, never primitive. Theme authors need to know this.
2. **Issues content type** — new first-class layout at `src/layouts/issues/default/`, new `loaders/issues.ts`, new `dynamic_data/data/issues/` folder-per-item schema. End users writing their own issues need docs.

`CLAUDE.md` covers both for future AI collaborators. Human-facing documentation is missing.

## User guide additions (`dynamic_data/data/user-guide/`)

- New section under `20_themes/`: "Typography contract" — explain the 3 UI tiers, 7 content tokens, 3 display tokens; give the rule "consume semantic, never primitive"; link to the theme.yaml contract.
- New section under `15_content/` or top-level: "Issue tracker" — how to create an issue (folder naming `YYYY-MM-DD-<slug>`), what goes in `settings.json`, how `issue.md` + `comments/NNN_*.md` + supporting `*.md` compose; how filters and the list view work; mention the `draft: true` flag for hiding in production.
- Update any screenshots or examples in existing docs that reference the old todo/ folder layout.

## Dev docs additions (`dynamic_data/data/dev-docs/`)

- Under `20_themes/` (or equivalent): "Token layers" — the primitive/semantic split, why it exists, what each layer is for, how a theme author adds a custom tier.
- Under `10_layouts/`: "Issues layout" — first-class peer of docs/blog, the `parts/` split pattern (FilterBar, IssuesTable, Pagination, client.ts), the `<script type="application/json">` config pattern for passing server data to bundled client scripts, the `:global()` gotcha for JS-rendered elements.
- Under `15_scripts/` or similar: brief note on the `loadIssues()` cache (mtime-summed signature, `invalidateIssuesCache()` escape hatch).

## Claude skill

Also pending per the issues-restructure design doc: `.claude/skills/issues.md` that teaches Claude how to traverse, read, and update the issue tracker. Ship alongside these docs so Claude-assisted workflows have a single entry point.

## Done when

- `/user-guide` has a typography page and an issues-tracker page.
- `/dev-docs` has a token-layers page, an issues-layout page, and a cache note.
- `.claude/skills/issues.md` exists.
- Cross-links: typography page links to `src/styles/theme.yaml`; issues-layout page links to the issues-restructure design doc.

## Out of scope

- Rewriting existing docs (e.g. docs-layout) to reflect the new token contract. Covered by the Phase 2 migration TODO when we migrate everything else.
