---
title: Issues Overview
description: What the issues content type is, who it's for, and how the pieces fit together
sidebar_position: 1
---

# Issues

A first-class content type for tracking work: bugs, features, tasks, refactors, ideas. Unlike docs or blogs — which are *published material* — issues are a **tracker**. Every entry is a folder of markdown, indexed and rendered by the framework the same way pages are.

## What makes it different

| | Docs / Blogs | **Issues** |
|---|---|---|
| Purpose | Published reading material | Work tracking |
| Storage | One file per page | **One folder per item** |
| Metadata | Frontmatter | **`settings.json`** (UI-editable) |
| Lifecycle | Published / not | **open → review → closed \| cancelled** |
| Sub-content | Nothing | `comments/` · `subtasks/` · `notes/` · `agent-log/` |
| Audience | End users | Team + AI agents |

## Who it's for

A 1–4 person team that relies heavily on AI agents and ships continuously. Deliberately **not** a replacement for GitHub Issues, Linear, or Jira on public work. Positioned like `docs/adr/` or Fossil's built-in tracker — the repo *is* the record.

See [Design Philosophy](./design-philosophy) for the full rationale.

## The core idea: folder-per-issue

Each issue is a folder named `YYYY-MM-DD-<slug>/`. The folder *is* the issue's identity — no separate ID field, no database row.

```
todo/                               ← the tracker (dataPath)
├── settings.json                   ← tracker vocabulary (status, priority, etc.)
├── 2026-04-19-docs-phase-2/
│   ├── settings.json               ← this issue's metadata
│   ├── issue.md                    ← goal / context
│   ├── comments/
│   │   └── 001_2026-04-19_sidhantha.md
│   ├── subtasks/
│   │   ├── 01_issues-layout-docs.md
│   │   └── 02_theme-system-docs.md
│   ├── notes/
│   │   └── 01_proposed-file-structure.md
│   └── agent-log/
│       └── 001_initial-triage.md
└── 2025-06-25-dev-only-content/
    ├── settings.json
    └── issue.md
```

Six file types, each load-bearing. See [Folder Structure](./folder-structure).

## The six file types at a glance

| File / folder | Purpose | Required? |
|---|---|---|
| `settings.json` | Metadata (status, priority, labels, dates) | ✅ required |
| `issue.md` | Goal / context / initial pitch | ✅ required |
| `comments/` | Thread — one file per comment | optional |
| `subtasks/` | Atomic units of work, each with own 4-state | optional |
| `notes/` | Supporting design docs | optional |
| `agent-log/` | Audit trail of AI iterations | optional |

Each gets its own page under [Sub-Documents](./sub-docs/issue-md).

## AI-native by design

Every file is plain markdown in a predictable folder. No API, no auth, no schema — an agent can `ls` the tracker, read any issue, write subtasks, append to agent logs. The 4-state lifecycle (`open → review → closed | cancelled`) exists specifically so AI-driven work can ship to **review** and hand the final call to a human.

Agents working with this tracker should invoke the **`/issues` skill** (planned — see [Using with AI](./using-with-ai)). The skill teaches traversal, reading, writing, and the review handoff in one place.

## What to read next

- [Design Philosophy](./design-philosophy) — why this shape
- [Folder Structure](./folder-structure) — the data layout in detail
- [Settings](./settings/per-issue) — metadata schema
- [Sub-Documents](./sub-docs/issue-md) — each file type's conventions
- [Lifecycle and Review](./lifecycle-and-review) — the 4-state model
- [List View](./ui/list-view) and [Detail View](./ui/detail-view) — what the UI does
- [Workflows](./workflows/create-an-issue) — step-by-step guides
- [Using with AI](./using-with-ai) — the skill + agent discipline
- [Setup a new tracker](./setup-new-tracker) — spinning one up from scratch
