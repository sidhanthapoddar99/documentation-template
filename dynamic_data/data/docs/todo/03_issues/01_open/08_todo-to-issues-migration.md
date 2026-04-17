---
title: "Migration — todo/ → issues/ (Phase 2)"
description: Move items from dynamic_data/data/docs/todo/ into the new dynamic_data/data/issues/ folder-per-item format, flip site.yaml, delete testbed
sidebar_label: Todo → Issues Migration
---

# Migration — `todo/` → `issues/` (Phase 2)

**Type:** Task
**Priority:** Medium
**Component:** `dynamic_data/data/`
**Status:** Blocked — requires Phase 1 sign-off

---

## Context

The issues tracker Phase 1 is running against a throwaway testbed at `dynamic_data/data/issues-test/`. Design doc: [`05_issues-restructure.md`](./05_issues-restructure.md). Phase 2 is moving the real work items from the current `todo/` hierarchy into the new folder-per-item format.

Do NOT start this until Phase 1 is signed off and the UI is stable. Interleaving breaks both.

## Scope

### 1. Create `dynamic_data/data/issues/`

- Root `settings.json` with the vocabulary (copy from `issues-test/settings.json` but remove `"draft": true` if the tracker should render in production, or keep it for internal-only).
- Same folder naming: `YYYY-MM-DD-<slug>/`.

### 2. Migrate items from `todo/03_issues/01_open/`

| From | To |
|---|---|
| `01_wysiwyg-mode.md` | `issues/YYYY-MM-DD-wysiwyg-mode/` |
| `02_excalidraw-integration.md` | `issues/YYYY-MM-DD-excalidraw-integration/` |
| `03_canvas-rendering.md` | `issues/YYYY-MM-DD-canvas-rendering/` |
| `04_editor-performance.md` | `issues/2026-04-17-editor-performance/` |
| `05_issues-restructure.md` | `issues/2026-04-17-issues-restructure/` |
| `06_editor-typography.md` | `issues/YYYY-MM-DD-editor-typography/` |
| `07_typography-and-issues-docs.md` | `issues/YYYY-MM-DD-typography-and-issues-docs/` |
| `08_todo-to-issues-migration.md` | this file — mark as `status: done` once migration completes |

For each: extract frontmatter → `settings.json`, body → `issue.md`, add `comments/` if there's discussion history.

Dates: use the earliest commit touching the file (`git log --follow --diff-filter=A -- <file>`) as the creation date prefix.

### 3. Migrate `todo/02_backlog/`

- `01_bugs.md` — split each bug entry into its own folder, `type: bug`.
- `02_feature-ideas.md` — split each idea into its own folder, `labels: [idea]`.

### 4. Migrate `todo/01_sprints/*`

Extract items from each sprint folder; set `milestone` based on the sprint name (e.g. `phase-1`, `phase-2`). Discard the sprint folder after migration.

### 5. Keep as docs (NOT migrate)

- `todo/03_issues/01_overview.md` — project state narrative, belongs in `dev-docs/`.
- `todo/04_testing.md` — documentation, not a work item.

### 6. Flip `site.yaml`

```yaml
pages:
  issues:
    base_url: "/issues"
    type: issues
    layout: "@issues/default"
    data: "@data/issues"
```

Remove the `issues-test` entry and the `todo` entry (or keep `todo` temporarily if there's lingering content).

### 7. Cleanup

- Delete `dynamic_data/data/issues-test/`.
- Delete `dynamic_data/data/docs/todo/` once migration is verified and no other page references it.
- Update `navbar.yaml` — change "Issues" link from `/issues-test` to `/issues`; drop "Todo" if empty.

## Done when

- `/issues` renders the real issue list.
- Zero files under `dynamic_data/data/docs/todo/` or `dynamic_data/data/issues-test/`.
- Navbar "Issues" link works; "Todo" link gone.
- `git grep "issues-test"` returns only archival references (this file + the restructure design doc).

## Caveats

- Historical commit dates for some files might not exist (if created recently). Fall back to today's date for those.
- If any TODO item references another by path (`[see](./04_editor-performance.md)`), update the link to the new folder format.
