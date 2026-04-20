---
title: Comments
description: The thread — one markdown file per comment, ordered by sequence number
sidebar_position: 2
---

# Comments

Comments live in `<issue-folder>/comments/` — one markdown file per comment. The UI concatenates them into a chronological thread on the issue's detail page.

## File naming — mandated

```
NNN_YYYY-MM-DD_<author>.md
```

The loader's exact regex: `^(\d+)_(\d{4}-\d{2}-\d{2})_([a-z0-9-]+)\.md$` (case-insensitive).

- **`NNN`** — zero-padded sequence number (`001`, `002`, …). Enforces ordering independent of filesystem sort quirks.
- **`YYYY-MM-DD`** — date the comment was written.
- **`<author>`** — short author slug, kebab-case or lowercase.

Example folder:

```
comments/
├── 001_2026-04-17_sidhantha.md
├── 002_2026-04-18_sidhantha.md
├── 003_2026-04-19_claude.md
└── 004_2026-04-21_sidhantha.md
```

Files that don't match the pattern are skipped with a warning (visible in the error-logger dev-toolbar app).

## Why one file per comment

- **Clean diffs.** A new comment is a new file. No surgical edits to a single monster document, no merge conflicts on unrelated threads.
- **Per-comment git history.** `git log` on `comments/002_…md` tells you exactly when that comment was written or edited.
- **AI agents can cite by filename.** "See `comments/003_2026-04-19_claude.md`" is a stable reference that doesn't rot when other comments are added.
- **Appending is a new file**, not surgery. For agents, `echo "…" > comments/NNN_DATE_AUTHOR.md` is the entire write path.

## Frontmatter

Comments support optional frontmatter. The filename carries sequence / date / author already; frontmatter is for overrides or additional context:

```markdown
---
author: claude
date: 2026-04-19
---

The testbed under `data/issues-test/` looks good for an initial pass. I
propose we migrate the three open items from `2026-04-10-issues-layout` …
```

Supported fields:

| Field | Type | Effect |
|---|---|---|
| `author` | string | Overrides the author parsed from the filename |
| `date` | ISO date | Overrides the date parsed from the filename |

Both optional. If absent, the filename is authoritative.

## Body

Pure markdown — no length cap. Comments can be one-liners or long-form reviews. For lengthy design deliberation, consider a **note** instead (see [Notes](./notes)); comments are for discussion, notes are for design docs.

## Rendering

The detail page's Overview tab shows the full thread in filename order, each comment rendered as a styled card with author + date header. On the list page, the comment count per issue surfaces as a small indicator.

## Adding a comment manually

1. Find the highest existing `NNN` in `comments/` (`ls comments/ | sort -n | tail -1`)
2. Pick the next sequence number
3. Create `NNN_YYYY-MM-DD_<you>.md` with today's date and your author slug
4. Write your comment. No frontmatter needed.

The live editor + planned `/issues` skill automate all of this — see [Using with AI](../using-with-ai).

## When NOT to comment

- **Progress updates on subtasks** — update the subtask's state instead (`open → review`). Subtask state changes are more precise than comments about them.
- **Agent iterations** — use `agent-log/`, not comments. Agent logs have richer frontmatter (iteration / status) and are meant to be audit-read in bulk.
- **Changes to metadata** — edit `settings.json` directly. `git blame` tells the story.

## See also

- [issue.md](./issue-md) — the initial pitch
- [Subtasks](./subtasks) — atomic work units with their own state
- [Agent Log](./agent-log) — audit trail for AI iterations
