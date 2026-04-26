---
title: Subtasks
description: Atomic units of work with their own 4-state lifecycle
sidebar_position: 3
---

# Subtasks

Subtasks break an issue into atomic, trackable units of work. Each one is a markdown file in `<issue-folder>/subtasks/` with frontmatter carrying its own state. An issue can have zero subtasks (small issues) or dozens (phase-scoped rollouts).

## File naming

```
NN_<slug>.md
```

- **`NN`** — numeric prefix (any digits) for ordering in the sidebar. Typically `01`, `02`, `03`, … but `1`, `10`, `001` are all valid.
- **Separator** — either `_` or `-` after the number (`01_foo.md` and `01-foo.md` both work).
- **`<slug>`** — lowercase kebab-case or snake_case, human-readable.

Example:

```
subtasks/
├── 01_issues-layout-docs.md
├── 02_theme-system-docs.md
├── 03_editor-v2-docs.md
└── 04_config-paths-docs.md
```

The prefix drives sort order (numeric), the slug becomes the default display title. Files without a numeric prefix sort after numbered ones, alphabetically.

## Frontmatter

```markdown
---
title: "Issues layout — docs"
state: review
done: false
---

Absorbed from `2026-04-10-issues-layout/subtasks/06_documentation-and-skills.md`.
User-guide and dev-docs coverage for the issues content type.

## User guide — 19_issues/ (new top-level)

- [ ] 01_overview.md — purpose + why AI-native
- [ ] 02_structure.md — folder-per-item…
```

| Field | Type | Purpose |
|---|---|---|
| `title` | string | Display title. If absent, derived from the slug (`02_theme-system-docs` → `theme system docs`). |
| `state` | `"open" \| "review" \| "closed" \| "cancelled"` | Canonical 4-state. Read first. |
| `done` | bool | Legacy alias. `done: true` → `closed` if `state` absent. `done: false` → `open`. |

The loader reads `state` first. If `state` is missing or invalid, it falls back to `done`. If both are missing, the default is `open`.

## The 4 states

| State | Meaning | Typical transition |
|---|---|---|
| `open` | Not started, or in progress | Initial state when a subtask is created |
| `review` | Work claims to be done; waiting for human verification | `open → review` when AI / author believes it's complete |
| `closed` | Done, verified, shipped | `review → closed` by a human |
| `cancelled` | Decided not to do | Any state → `cancelled` with reason in comment / agent-log |

Same semantics as issue-level status. See [Lifecycle and Review](../lifecycle-and-review) for the full model — especially the **review handoff** and **subtask-debt promotion** rules (a parent issue with any `review` subtasks surfaces on the Review tab even if its own status is still `open`).

## Body

Optional. Pure markdown after the frontmatter. Typical contents:

- Breakdown of the work (checkbox list)
- Success criteria specific to this subtask
- Cross-references to relevant files / other issues
- Notes for the person (or agent) who'll pick it up

Subtasks without a body are valid — the frontmatter alone is enough if the title is self-explanatory.

## Rendering

**On the detail page:**

- **Overview tab** — subtasks surface as a checklist with state icons (`○ open`, `◐ review`, `● closed`, `✕ cancelled`). Click-through to jump to the full body in the Comprehensive tab.
- **Comprehensive tab** — every subtask's full body is rendered inline, in sort order, each under its own heading. Heading IDs are prefixed (`#subtask-01-foo`) to prevent anchor collisions across subtasks.
- **Sidebar** — links to each subtask with its state icon visible next to the title.

**On the list page:** each issue row shows a subtask summary (`2 / 5 closed, 1 review`). Issues with `review` subtasks get a secondary badge.

## State transitions

Three common paths:

1. **Author writes it `open` → AI picks it up → marks `review` when done → human flips to `closed`.** Most common path.
2. **Author writes it `open` → they do it themselves → mark `closed` directly.** Fine for solo work.
3. **Author writes it `open` → discussion concludes it shouldn't happen → mark `cancelled` with a comment explaining why.** Leave the file in place — the audit trail is valuable.

There's a built-in endpoint for cycling states in the UI — `POST /__editor/subtask-toggle` — so clicking a subtask's state icon in the detail view progresses through `open → review → closed → cancelled → open`. Agents can also edit the frontmatter directly.

See [Work an Issue](../workflows/work-an-issue) and [Review and Close](../workflows/review-and-close) for step-by-step guides.

## Sub-doc URL

Currently subtasks render inside the parent issue's detail page (Comprehensive tab + anchor links). Each subtask gets a stable anchor `#subtask-<slug>`.

Separate per-subtask URLs (`/todo/<id>/subtasks/<slug>`) are planned — tracked in `2026-04-10-issues-layout/subtasks/17_subdoc-separate-urls.md`.

## Tips

- **Keep subtasks atomic.** If a subtask keeps accumulating new bullet points, it probably wants to be two subtasks.
- **Order numerically, not by status.** Let state carry state. Ordering by number means the breakdown stays readable even as items close.
- **Don't delete `cancelled` subtasks.** They're part of the audit trail — show what wasn't done and why.

## See also

- [Lifecycle and Review](../lifecycle-and-review) — how the 4 states interact at issue + subtask level
- [Work an Issue](../workflows/work-an-issue) — adding subtasks, transitioning state
- [Using with AI](../using-with-ai) — how agents are expected to handle subtasks
