---
title: Vocabulary
description: The tracker-root settings.json — enums, colors, preset views, authors, tracker-wide draft
sidebar_position: 2
---

# Vocabulary

Every tracker has a root `settings.json` that defines its **vocabulary** — the allowed values for every enum field, the colors used to render them, the authors known to the tracker, any pre-canned filter views, and (optionally) a flag that hides the whole tracker from production.

Per-issue `settings.json` files are validated against this root. Rename a value here, and every issue using it either migrates or starts warning.

## Example

```json
{
  "label": "Todo",
  "fields": {
    "status": {
      "values": ["open", "review", "closed", "cancelled"],
      "colors": {
        "open":      "#888888",
        "review":    "#f0c674",
        "closed":    "#7ec699",
        "cancelled": "#666666"
      }
    },
    "priority": {
      "values": ["low", "medium", "high", "urgent"],
      "colors": {
        "low":    "#7aa2f7",
        "medium": "#f0c674",
        "high":   "#e5a663",
        "urgent": "#e06c75"
      }
    },
    "component": {
      "values": ["live-editor", "dev-toolbar", "content-pipeline", "layouts-and-themes", "loaders", "components", "ai-skills", "integrations", "infra", "docs"]
    },
    "milestone": {
      "values": ["phase-1", "phase-2", "phase-3", "phase-4", "backlog", "unassigned"]
    },
    "labels": {
      "values": ["wip", "blocked", "bug", "feature", "task", "performance", "refactor", "docs", "idea", "duplicate", "good-first-issue", "discussion", "blocked-external"]
    }
  },
  "authors": ["sidhantha", "claude"],
  "views": [
    { "name": "Phase 2",      "filters": { "milestone": ["phase-2"] }, "group": "component" },
    { "name": "High priority","filters": { "priority": ["high", "urgent"] } },
    { "name": "Blocked",      "filters": { "labels": ["blocked", "blocked-external"] } },
    { "name": "By milestone", "group": "milestone" }
  ]
}
```

## Top-level fields

| Field | Type | Required | Purpose |
|---|---|:---:|---|
| `label` | string | — | Human name for the tracker, shown in the sidebar + page header |
| `fields` | object | ✅ | Enum definitions for every field issues pick from |
| `authors` | string[] | — | Known authors — referenced by `author` / `assignees` in per-issue settings |
| `views` | array | — | Preset filter views (see [Preset views](#preset-views)) |
| `draft` | bool | — | `true` → entire tracker hidden in production |

## The `fields` object

Each key is a field name (`status`, `priority`, `component`, `milestone`, `labels`). Each value has:

```ts
{
  values: string[]           // allowed values
  colors?: { [value]: hex }  // optional, per value
}
```

### Required fields

The loader expects these five fields at minimum. Adding more is possible but the built-in layout won't surface them.

| Field | Multi-select? | Typically used for |
|---|:---:|---|
| `status` | — | Lifecycle state (the 4-state review model) |
| `priority` | — | Urgency (low / medium / high / urgent) |
| `component` | ✅ | Which part of the codebase / product — issues that span multiple |
| `milestone` | — | Long-horizon grouping (phase, release, roadmap) |
| `labels` | ✅ | Everything orthogonal — `wip`, `blocked`, `bug`, `feature`, `docs`, `idea`, … |

The vocabulary shape is the same for single- and multi-select fields — just `values: string[]` (and optional `colors`). Whether issues consume each value singly or as a list is up to per-issue `settings.json`.

### Status — the 4-state contract

```json
"status": {
  "values": ["open", "review", "closed", "cancelled"],
  "colors": {
    "open":      "#888888",
    "review":    "#f0c674",
    "closed":    "#7ec699",
    "cancelled": "#666666"
  }
}
```

**These exact four values are required.** The layout's state-tabs, the Review tab's subtask-debt promotion, and the agent-log review handoff all assume `open / review / closed / cancelled`. Renaming them will break the UI.

If you need finer-grained intermediate states (`in-progress`, `blocked`, `needs-design`), use **labels**, not statuses. See [Design Philosophy](../design-philosophy).

### Colors

Purely cosmetic — drive badge fills on the list view and anywhere status chips render. Omit `colors` for a field entirely, and the UI falls back to neutral text. Per-value — only provide colors for values that need them.

Use any CSS color syntax: hex, `rgb()`, `hsl()`, or CSS variables from the theme (e.g. `"var(--color-success)"`). Hex is the safest for portability across themes.

## `authors[]`

A list of known author identifiers. Used to:

- Populate the "Assignee" dropdown in the metadata sidebar
- Validate `author` and `assignees` entries in per-issue settings
- Attribute comments and agent-log entries (via filename parsing)

Extensible — add a new person to the list and they're immediately available. The field is optional; absence means no validation happens.

## Preset views

Canned filter + grouping configurations that appear as a strip above the list view. One click applies them.

```json
"views": [
  { "name": "Phase 2", "filters": { "milestone": ["phase-2"] }, "group": "component" },
  { "name": "Blocked", "filters": { "labels": ["blocked"] } }
]
```

Per-view fields:

| Field | Type | Purpose |
|---|---|---|
| `name` | string | Label shown in the preset strip |
| `filters` | `{ [field]: string[] }` | Field → values to include (OR within, AND across fields) |
| `group` | string | Field to group the result list by (`component`, `milestone`, `priority`) |
| `sort` | `"updated" \| "created" \| "priority" \| "due"` | Default sort for this view |
| `dir` | `"asc" \| "desc"` | Sort direction |

All fields except `name` are optional — a preset with just `group` applied to the default filter set is a valid "group by X" shortcut.

## Tracker-wide `draft`

```json
{
  "label": "Roadmap (internal)",
  "draft": true,
  "fields": { … }
}
```

- **In dev**: tracker loads normally, every issue visible.
- **In prod**: loader returns `{ vocabulary, rootDraft: true, issues: [] }`. The tracker's URL shows an empty index; individual issue URLs 404.

Use for trackers that are **never meant for public view** (internal roadmaps, draft trackers being staged). For per-issue dev-only, use `"draft": true` in an individual issue's `settings.json` instead. See [Drafts](/user-guide/writing-content/drafts) and [Dev Mode](/user-guide/configuration/dev-mode).

## See also

- [Per-Issue Settings](./per-issue) — what each issue fills in based on this vocabulary
- [List View](../ui/list-view) — how filters + preset views render
- [Setup a new tracker](../setup-new-tracker) — designing a new vocabulary from scratch
