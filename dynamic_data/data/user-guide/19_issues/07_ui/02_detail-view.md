---
title: Detail View
description: The single-issue page — three-column layout, Overview/Comprehensive tabs, editable metadata sidebar
sidebar_position: 2
---

# Detail View

The detail view renders at `/<base>/<YYYY-MM-DD-slug>`. It's the surface for working an issue: reading context, inspecting sub-docs, transitioning state, editing metadata. Three columns and two tabs — that's the whole layout.

## Anatomy

```
┌────────────┬────────────────────────────────────────┬────────────┐
│            │  Documentation update — phase 2        │            │
│  DETAIL    │  Rewrite user-guide around 4 content…  │  META      │
│  SIDEBAR   ├────────────────────────────────────────┤  SIDEBAR   │
│            │  [Overview]  [Comprehensive]           │            │
│  Overview  │                                        │  Status:   │
│  Compreh…  │  ## Goal                               │  open   ▾  │
│            │  Rewrite user-guide around 4 content   │            │
│  Subtasks  │  types…                                │  Priority: │
│   ○ 01     │                                        │  high   ▾  │
│   ◐ 02     │  ## Comments                           │            │
│   ● 03     │  [001] 2026-04-19 sidhantha           │  Component:│
│   …        │  …                                     │  docs   ▾  │
│            │                                        │            │
│  Notes     │  ## Subtasks                           │  Labels:   │
│   · file-  │  ○ 01  Issues layout — docs            │  [docs]    │
│     struct │  ◐ 02  Theme system — docs             │  [task]    │
│            │  …                                     │  + add     │
│  Agent Log │                                        │            │
│   · 001    │                                        │  Assignees:│
│   · 002    │                                        │  sidhantha │
│            │                                        │  claude    │
└────────────┴────────────────────────────────────────┴────────────┘
```

## Three columns

| Column | Role |
|---|---|
| **Left — Detail Sidebar** | Nav: tab switch (Overview / Comprehensive) + links to every sub-doc with state icons |
| **Center — Main** | Content: the issue body, then either the Overview summary or Comprehensive full-text |
| **Right — Meta Sidebar** | Editable metadata form — every `settings.json` field as an input. Sticky on scroll. |

The meta sidebar is load-bearing: every dropdown writes back to `settings.json`. Change the status here and the file changes on disk, the loader cache invalidates, the list view reflects the new state on next load.

## The two tabs

### Overview tab — default

A concise, reading-friendly summary:

1. **Metadata header** — title + description + status/priority/labels chips
2. **`issue.md`** — rendered
3. **Comments thread** — all comments in filename order, each as a styled card
4. **Subtask checklist** — one line per subtask with state icon, title, click-to-toggle state
5. **Sub-doc indicators** — "3 notes · 5 agent-log entries" links to the Comprehensive tab

Purpose: a 2-minute read for a reviewer orienting on what the issue is and where it's at.

### Comprehensive tab

Everything, rendered inline:

1. `issue.md`
2. All comments (same as Overview)
3. Every subtask's full body, concatenated in sort order, under per-subtask headings
4. Every note's full body, concatenated in filename order, under per-note headings
5. Every agent-log entry's full body, concatenated in sequence order, under per-log headings

**Heading IDs are prefixed** (`#subtask-01-foo-goal`, `#note-design-tradeoffs`) to prevent collisions across sub-docs. Deep-linking to a specific section works reliably.

Purpose: a printer-friendly, complete view. Reviewers who want to read everything without clicking around.

### Tab state persists in URL

`?tab=comprehensive` preserves the choice across refreshes and shares. Default is `overview`.

## Left sidebar — Detail Sidebar

Two sections:

### Tab switcher (top)

```
[ Overview ] [ Comprehensive ]
```

Toggle matches the center-column tab content. URL-synced.

### Sub-doc navigation (below)

Every sub-doc gets a link with a state indicator next to it:

```
Subtasks
  ○  01  Issues layout — docs
  ◐  02  Theme system — docs
  ●  03  Editor V2 — docs

Notes
  · 01  Proposed file structure
  · 02  Design decisions

Agent Log
  · 001  Initial triage
  · 002  Restructure approach
```

State icons for subtasks:

| Icon | State |
|---|---|
| `○` | `open` |
| `◐` | `review` |
| `●` | `closed` |
| `✕` | `cancelled` |

Clicking a sub-doc link jumps to its anchor in the Comprehensive tab (switching tabs if needed).

## Right sidebar — Meta Sidebar

Every field in `settings.json` rendered as an editable input:

| Field | Input |
|---|---|
| Status | Dropdown from vocabulary |
| Priority | Dropdown from vocabulary |
| Component | Dropdown from vocabulary |
| Milestone | Dropdown from vocabulary |
| Labels | Multi-select chip list |
| Author | Dropdown from `authors[]` |
| Assignees | Multi-select from `authors[]` |
| Updated | Read-only (auto-bumped) |
| Due | Date picker (or null) |

Changes save on blur / enter — writes back to `settings.json` on disk. The sidebar shows a small save indicator while writing.

Colors for status / priority chips come from the vocabulary. Unknown values (not in the enum) render with a warning glyph — click to see which value is unrecognised.

## Interactions

### Subtask state toggle

Clicking the state icon next to a subtask (anywhere it appears) cycles through `open → review → closed → cancelled → open`. Backed by `POST /__editor/subtask-toggle`.

### Live edits sync

The live editor + Yjs presence manager keep this page in sync with the editing pane. If someone else has the issue open and changes status, your sidebar updates within ~250ms.

### Deep-link to a sub-doc anchor

Every sub-doc has a stable anchor:

- `#subtask-<slug>` — jump to a subtask in Comprehensive
- `#note-<slug>` — jump to a note
- `#agentlog-<sequence>` — jump to an agent-log entry (or `#agentlog-<subgroup>-<sequence>` if it's in a subgroup folder)

Sharing a URL with an anchor jumps the reader straight there.

## Sub-doc URL separation — planned

Each subtask / note / agent-log entry currently renders **inline** on the detail page. Dedicated URLs per sub-doc (`/todo/<id>/subtasks/<slug>`) are planned — tracked in `2026-04-10-issues-layout/subtasks/17_subdoc-separate-urls.md`. Until that ships, anchor-based deep links are the workaround.

## Keyboard

| Key | Action |
|---|---|
| `1` | Overview tab |
| `2` | Comprehensive tab |
| `g` then `l` | Back to list view |

## See also

- [List View](./list-view) — how you get here
- [Per-Issue Settings](../settings/per-issue) — the fields in the right sidebar
- [Subtasks](../sub-docs/subtasks) — state icon meanings
