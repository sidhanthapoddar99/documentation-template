# Issue tracker — reference

How to read, write, and navigate any issue tracker in this project. The default tracker lives at `dynamic_data/data/todo/`; a project may have multiple trackers, all following this same shape.

**Canonical source of truth:** `dynamic_data/data/user-guide/19_issues/` — read those pages when this reference is unclear or you need depth this file doesn't cover.

---

## 1. Folder & file layout

Every tracker has the same skeleton:

```
<tracker-base>/                                  ← e.g. dynamic_data/data/todo/
├── settings.json                                ← TRACKER VOCABULARY (status, priority, component, milestone, labels)
└── <YYYY-MM-DD-slug>/                           ← one folder per issue
    ├── settings.json                            ← issue metadata
    ├── issue.md                                 ← main body (the goal / context)
    ├── comments/                                ← chronological discussion
    │   └── NNN_<date>_<author>.md
    ├── subtasks/                                ← atomic units of work
    │   └── NNN_<slug>.md
    ├── notes/                                   ← supporting design docs
    │   └── <slug>.md
    └── agent-log/                               ← AI iteration audit trail
        └── NNN_<slug>.md
```

**Folder naming regex:** `^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$` (date + kebab-case slug).

**Stray root-level `.md` inside an issue folder is a warning.** Surface it to the user — don't silently include or ignore.

---

## 2. Properties of an issue (`<issue>/settings.json`)

```json
{
  "title": "Human-readable issue title",
  "description": "1-3 sentence summary",
  "status": "open",
  "priority": "medium",
  "component": ["live-editor", "integrations"],
  "milestone": "phase-2",
  "labels": ["feature", "wip"],
  "author": "sidhantha",
  "assignees": [],
  "updated": "2026-04-19",
  "due": "2026-04-25"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | Display label |
| `description` | string | optional | Short summary; longer detail goes in `issue.md` |
| `status` | enum | ✅ | One of the 4 lifecycle states (see §4) |
| `priority` | enum | ✅ | From tracker vocabulary (`fields.priority.values`) |
| `component` | **string[]** | ✅ | Multi-select; values from `fields.component.values` |
| `milestone` | enum | ✅ | From `fields.milestone.values` |
| `labels` | string[] | ✅ | Multi-select; values from `fields.labels.values` (often `[]`) |
| `author` | string | ✅ | Must be in tracker `authors` list |
| `assignees` | string[] | ✅ | Often `[]`; otherwise members of `authors` |
| `updated` | YYYY-MM-DD | ✅ | Last meaningful change date |
| `due` | YYYY-MM-DD or null | optional | Used for overdue-row highlighting |
| `draft` | boolean | optional | If `true`, hidden from the tracker UI |

**`null` / missing handling:** `due: null` means "no deadline." Missing `labels` / `assignees` → treat as `[]`. Missing `component` → treat as `[]` and surface as a validation issue (it's required).

---

## 3. Tracker vocabulary (`<tracker-base>/settings.json`)

Defines the enum values every issue draws from:

```json
{
  "label": "Todo",
  "fields": {
    "status":    { "values": ["open", "review", "closed", "cancelled"], "colors": {...} },
    "priority":  { "values": ["low", "medium", "high", "urgent"],       "colors": {...} },
    "component": { "values": ["live-editor", "integrations", ...] },
    "milestone": { "values": ["phase-1", "phase-2", ...] },
    "labels":    { "values": ["wip", "blocked", "feature", "bug", ...] }
  },
  "authors": ["sidhantha", "claude"],
  "views": [ ... preset views ... ]
}
```

When creating an issue, **all enum values must come from this vocabulary**. To add a new value, edit the tracker `settings.json` first, then use it.

Three vocabulary layers:

1. **Tracker-wide** — root `settings.json` (above)
2. **Per-issue** — values picked from the tracker vocabulary
3. **Per-subtask** — `state` field uses the same 4-state vocabulary as `status`, but tracked independently per subtask

---

## 4. Lifecycle — the 4 states & AI rules

States: `open` → `review` → `closed` | `cancelled`

| From | Allowed transitions | Notes |
|---|---|---|
| `open` | → `review`, → `cancelled` | Most common forward path is `open → review` |
| `review` | → `open`, → `closed` | `review → open` if pushback in a comment |
| `closed` | (terminal) | Generally don't reopen — file a new issue |
| `cancelled` | (terminal) | Always paired with a comment explaining why |

### AI rules — these are the most important rules in the skill

1. **Always mark `review`, never `closed` directly.** `closed` is a *human-only* transition in autonomous mode. The agent's job ends at `review` — the human inspects the artefact (PR, file diff, screenshot) and flips to `closed`.

2. **Default search scope is `open` + `review`.** When the user asks an open-ended question about issues ("what's blocked?", "what needs review?", "any duplicate work?"), search **only** `open` and `review` items. Skip `closed` and `cancelled` unless the prompt explicitly asks (e.g. "find closed issues that mentioned X"). This avoids noisy re-reads of shipped work.

3. **Subtask review-debt promotion.** An `open` issue with **any** `review`-state subtask is treated as review-gated — surface it under "needs review" even though its top-level status is still `open`. The Review tab in the UI does this automatically; the agent should follow the same logic when scanning.

4. **Mark `review` only when:**
   - Implementation is done from your perspective
   - All subtasks are `review` or `closed`
   - There's a verifiable artefact for the human (PR, file diff, screenshot, test output)
   - The agent-log captures what was tried and the final state

5. **`cancelled` requires a comment.** Always write a `comments/NNN_…md` explaining why before flipping to `cancelled`.

---

## 5. Sub-documents

### `issue.md` — the goal / context

Read first when picking up an issue. Contains the *why*, the user-facing description of the work, success criteria, scope decisions, links to related issues. Length varies — typically 50-300 lines.

### `comments/NNN_<date>_<author>.md`

Chronological discussion. Frontmatter:
```yaml
---
author: claude
date: 2026-04-24
---

# Optional title

Body...
```

Naming convention: `NNN_<YYYY-MM-DD>_<author>.md` is the spec, but in practice many comments use `NNN_<short-slug>.md`. Either works; check what the issue already uses and match.

### `subtasks/NNN_<slug>.md`

Atomic unit of work. Frontmatter:
```yaml
---
title: "Short imperative title"
done: false
state: open
---

Body — describe the work in enough detail that someone (or an agent) can pick it up cold.
```

`done: true` should be paired with `state: closed` (or `review`). `state` follows the same 4-state vocabulary as issue `status`.

### `notes/<slug>.md`

Supporting design docs — research, design decisions, reference material that doesn't belong in `issue.md`. No state, no numbering. Frontmatter is minimal (often just `title`).

### `agent-log/NNN_<slug>.md` — **read these first when picking up work**

Audit trail of prior AI iterations. **Always read before starting work** — past iterations may have failed approaches you'd otherwise repeat.

Frontmatter:
```yaml
---
iteration: 3
agent: claude-opus-4-7
status: success      # in-progress | success | failed
date: 2026-04-24
---
```

Body structure:
- **Goal** — what was being attempted
- **Approach** — the plan
- **Result** — what actually happened, with evidence
- **Next** — what to try next (if any)

**Failed iterations are kept**, not deleted. One file per *iteration*, not per minute. When closing an issue, the final agent-log entry should reference the shipped commit / PR.

---

## 6. Searching & indexing

### Default search scope

Per AI rule #2: search `open` + `review` only unless told otherwise.

### Grep / find recipes

```bash
# All issues with status:open
grep -l '"status": "open"' dynamic_data/data/todo/*/settings.json

# All issues with status:open OR review
grep -lE '"status": "(open|review)"' dynamic_data/data/todo/*/settings.json

# All subtasks currently in review
grep -lE '^state:\s*review' dynamic_data/data/todo/*/subtasks/*.md

# All issues containing keyword X (in body or any sub-doc)
grep -rli "keyword" dynamic_data/data/todo/

# All comments by a specific author
grep -lE '^author:\s*claude' dynamic_data/data/todo/*/comments/*.md

# All issues with a specific component
grep -l '"live-editor"' dynamic_data/data/todo/*/settings.json
```

### When to spawn a Haiku subagent

When the task requires reading **>10 issue files** to summarise / classify, spawn a Haiku subagent via the Task / Agent tool rather than loading every file into the main context. Pattern:

```
Read all issues under dynamic_data/data/todo/ with status:open.
For each, return: id, title, priority, top blocker (1 sentence).
Output as a markdown table. Under 300 words.
```

This keeps the main context lean and uses cheap tokens for bulk summarisation.

### Helper scripts — use these, they're the fastest path

The `scripts/issues/` directory has 8 CLI helpers. **Prefer them over hand-rolled grep** — they understand the schema (state vs legacy `done`, component-as-array, agent-log subgroups) and emit terse output by default. All run with `bun` (preferred) or `node`.

| Script | What it does |
|---|---|
| `list.mjs` | List issues matching multi-field filters. Default scope: open + review. |
| `show.mjs` | Print one issue's metadata + subtask state summary + comment & agent-log heads. `--full` for bodies. |
| `subtasks.mjs` | List subtasks for one issue, or across all issues with `--all`. Default state: open + review. |
| `agent-logs.mjs` | Print the last N agent-log entries (default 3) — for catching up before resuming work. |
| `set-state.mjs` | Update issue status (`settings.json`) or subtask state (frontmatter). Path-allow-listed to `dynamic_data/`. Subtask flips also sync `done:`. |
| `add-comment.mjs` | Append a comment with auto-incremented `NNN_` prefix. |
| `add-agent-log.mjs` | Append an agent-log entry with auto-incremented iteration. Supports `--group` for subgroups. |
| `review-queue.mjs` | List items needing review — `status: review` issues + `open` issues with `review` subtasks. |

Common usage:

```bash
# Open issues with high/urgent priority
bun scripts/issues/list.mjs --priority high,urgent

# Every review-state subtask across the tracker (cross-issue)
bun scripts/issues/subtasks.mjs --all --state review

# One issue end-to-end (metadata + subtask state + log heads)
bun scripts/issues/show.mjs 2026-04-19-docs-phase-2

# Catch up on prior iterations before resuming work
bun scripts/issues/agent-logs.mjs 2026-04-19-docs-phase-2 --last 5

# Mark a subtask done
bun scripts/issues/set-state.mjs 2026-04-19-foo/subtasks/02_bar.md closed

# Mark an issue ready for human review
bun scripts/issues/set-state.mjs 2026-04-19-foo review

# Append an agent-log entry
bun scripts/issues/add-agent-log.mjs 2026-04-19-foo \
  --status success --body "Goal: …  Approach: …  Result: …  Next: —"

# What's awaiting human review?
bun scripts/issues/review-queue.mjs
```

Each script supports `--help` (full options), `--json` (machine-readable), and `--tracker <path>` (operate on a non-default tracker).

**Falling back to grep/find:** still useful for free-text body search, since none of the scripts grep markdown content. See the recipe block below.

---

## 7. Writing — how to update the tracker

### Create a new subtask

1. Find the next prefix: `ls <issue>/subtasks/` → use `NN+1`
2. Write `<issue>/subtasks/NN_<slug>.md` with the standard frontmatter (`title`, `done: false`, `state: open`)
3. Body: enough detail to pick up cold

### Update a subtask state

Direct file write:
```yaml
---
title: "..."
done: true
state: review
---
```

Or via the editor API if running locally: `POST /__editor/subtask-toggle`. The skill should prefer **direct file writes** unless the user explicitly asks to use the editor API.

### Add a comment

1. Find the next prefix: `ls <issue>/comments/`
2. Write `<issue>/comments/NN_<slug>.md` (or `NN_<date>_<author>.md`)
3. Frontmatter: `author`, `date` (today, YYYY-MM-DD)

### Add an agent-log entry

1. Find the next prefix: `ls <issue>/agent-log/`
2. Write `<issue>/agent-log/NN_<slug>.md`
3. Frontmatter: `iteration` (next int), `agent` (model id), `status` (in-progress | success | failed), `date`
4. Body: Goal → Approach → Result → Next

### When NOT to edit

- Don't touch `closed` / `cancelled` issues without an explicit human prompt
- Don't rewrite history in `comments/` or `agent-log/` — append, don't edit prior entries
- Don't change `author` or `date` on someone else's comment

---

## 8. Worked example — picking up an issue

```
1. Agent gets a prompt: "work on issue 2026-04-19-docs-phase-2"

2. Read the issue end-to-end:
   - cat <issue>/settings.json                 ← metadata
   - cat <issue>/issue.md                      ← goal / context
   - ls <issue>/subtasks/                      ← list of work items
   - ls <issue>/comments/                      ← any recent discussion
   - ls <issue>/agent-log/                     ← prior iterations

3. Read agent-log entries (cheap with grep / Haiku subagent if many):
   - What did past iterations try?
   - What failed?
   - Where did the last iteration leave off?

4. Pick the next subtask (state:open with the lowest prefix), or the
   one the user named. Read it.

5. Do the work. As each subtask completes, update its state:
     state: open → state: review

6. After working: append an agent-log entry summarising
   Goal / Approach / Result / Next.

7. If ALL subtasks are now review or closed:
     Update issue settings.json: status: review
     Hand off to human.

8. Human flips status: review → closed.
   Next pickup writes a closing agent-log entry referencing the shipped state.
```

---

## 9. Cross-references

- `dynamic_data/data/user-guide/19_issues/` — full user-guide section
- `dynamic_data/data/user-guide/19_issues/06_lifecycle-and-review.md` — deep dive on the 4-state model
- `dynamic_data/data/user-guide/19_issues/09_using-with-ai.md` — agent-facing rules
- `dynamic_data/data/user-guide/19_issues/04_settings/02_vocabulary.md` — tracker vocabulary spec
- `2025-06-25-claude-skills/subtasks/02_issues-skill.md` — internal spec for this reference + planned helper scripts
