---
title: Per-Issue Settings
description: The settings.json schema for a single issue — fields, types, examples
sidebar_position: 1
---

# Per-Issue Settings

Every issue folder has a `settings.json` at its root. It holds all the metadata — status, priority, labels, dates, authors. The body (`issue.md`) stays pure prose; metadata lives here so the editor UI can render a structured form instead of parsing frontmatter.

## Minimal example

```json
{
  "title": "Editor V2 — Performance Optimizations",
  "description": "Outstanding performance wins in the live editor.",
  "status": "open",
  "priority": "medium",
  "component": "live-editor",
  "milestone": "phase-2",
  "labels": ["performance"],
  "author": "sidhantha",
  "assignees": ["sidhantha"],
  "updated": "2026-04-17",
  "due": null
}
```

## Full schema

| Field | Type | Required | Notes |
|---|---|:---:|---|
| `title` | string | ✅ | Shown on list + detail views |
| `description` | string | — | Shown under the title on list + detail |
| `status` | enum | ✅ | Single value from `fields.status.values` in the tracker root |
| `priority` | enum | ✅ | Single value from `fields.priority.values` |
| `component` | enum | ✅ | Single value from `fields.component.values` |
| `milestone` | enum | ✅ | Single value from `fields.milestone.values` |
| `labels` | string[] | ✅ | Multi-select from `fields.labels.values` — any subset |
| `author` | string | ✅ | The person who filed it. From `authors[]` in the tracker root |
| `assignees` | string[] | ✅ | From `authors[]`. Empty array is fine |
| `updated` | ISO date | ✅ | `YYYY-MM-DD`. Auto-bumped by the editor on any change |
| `due` | ISO date \| null | ✅ | `null` if unset. Overdue state is derived at render time |
| `draft` | bool | — | `true` → issue hidden in prod builds (see [Drafts](/user-guide/writing-content/drafts)) |

All enum fields are validated at load time against the tracker's root `settings.json` vocabulary. An unknown value produces a warning (visible in the error-logger dev-toolbar app); the issue still loads, but the value may not render cleanly.

## Fields that are NOT stored

| Concept | Where it comes from |
|---|---|
| **`id`** | Derived from the folder name — `YYYY-MM-DD-<slug>`. The filesystem is the source of truth. |
| **`created`** | The `YYYY-MM-DD` prefix of the folder name. |
| **Overdue** | Computed at render time: `due < today && status ∈ {open, review}`. |
| **Subtask counts** | Read from the `subtasks/` folder on load. |

One source of truth per fact. The folder carries identity and creation date; nothing duplicates them into `settings.json`.

## Field semantics

### `status` · `priority` · `component` · `milestone`

Single-select. Each picks exactly one value from the corresponding enum. Colors (optional) come from the tracker root — the UI uses them to render badges.

### `labels`

Multi-select. Use labels for anything orthogonal to status — `wip`, `blocked`, `bug`, `feature`, `refactor`, `docs`, `idea`, etc. You can stack any number.

Labels are where `type`-like concepts live. There's deliberately **no `type` field** — real work is composite (a perf fix is bug + perf + refactor). Forcing a single primary type was lossy. See [Design Philosophy](../design-philosophy).

### `author` vs `assignees`

- **`author`** — who filed the issue. One person. Doesn't change.
- **`assignees`** — who's currently working on it. Zero or more. Can change as responsibility moves. Often same as `author` in solo projects.

### `updated`

The editor auto-bumps `updated` to today's date on any change to either `settings.json` or `issue.md`. Manual edits outside the editor should also update this field — it drives default sort order on the index.

### `due`

Literal deadline. If it's `null`, the issue doesn't surface in due-date sorts or overdue badges. If it's in the past and status is `open` or `review`, the UI renders an "overdue" indicator.

### `draft`

Same flag used by docs and blogs (see [Drafts](/user-guide/writing-content/drafts)). Per-issue `"draft": true` hides the one issue in production while keeping it visible in dev. To hide a whole tracker, set `"draft": true` in the tracker's **root** `settings.json` (see [Vocabulary](./vocabulary)).

## Bigger example

```json
{
  "title": "Documentation update — phase 2",
  "description": "Rewrite user-guide around 4 content types; add issues / dev-mode / drafts coverage.",
  "status": "open",
  "priority": "high",
  "component": "docs",
  "milestone": "phase-2",
  "labels": ["docs", "task", "wip"],
  "author": "sidhantha",
  "assignees": ["sidhantha", "claude"],
  "updated": "2026-04-21",
  "due": "2026-04-30"
}
```

## Validation

Load-time validation covers:

- **Required fields present** — missing `title`, `status`, etc. produces a warning; the issue is skipped (won't appear in the index).
- **Enum values known** — unknown `status`, `priority`, `component`, `milestone`, or `labels[i]` produces a warning but doesn't block the load.
- **Date format** — `updated` and `due` must match `YYYY-MM-DD` (or `null` for `due`).
- **`authors[]` membership** — `author` and each entry in `assignees` should be in the tracker-root `authors[]`. Extensible — new people can be added to the root list at any time.

Warnings surface in the **error-logger** dev-toolbar app. Builds succeed; the loader errs on the side of not crashing when metadata drift is the only problem.

## See also

- [Vocabulary](./vocabulary) — the tracker-root `settings.json` that defines enum values and colors
- [Folder Structure](../folder-structure) — where this file sits
- [Drafts](/user-guide/writing-content/drafts) — the draft flag in the broader framework
