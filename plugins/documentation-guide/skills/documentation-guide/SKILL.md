---
name: documentation-guide
description: Use this skill for ANY work in this Astro-based documentation-template project — writing markdown, working with the issue tracker (issues, subtasks, comments, agent-logs), creating blog posts, editing docs pages, configuring site.yaml / navbar.yaml / footer.yaml / .env, and anything touching files under `dynamic_data/data/`. The skill triages the task to a domain-specific reference file (writing, docs-layout, blog-layout, issue-layout, settings-layout). TRIGGER eagerly — documentation work in this project almost always benefits from this skill. Use it whenever the user mentions docs, frontmatter, settings.json, the todo / issues tracker, blog posts, the data folder, content types, themes, or any file path containing `dynamic_data/`. SKIP only for pure source-code work in `src/` that doesn't touch any documentation file.
---

# Documentation skill

Operating manual for working in this Astro-based documentation-template project. The project ships content + config under `dynamic_data/data/` (with a `user-guide/` that is the canonical source of truth) and renders it through Astro layouts under `src/layouts/`.

## Triage — which reference file to read

Pick the reference file that matches the task. Read **only the one(s) you need** — they're independent and self-contained.

| If the task involves… | Domain | Read |
|---|---|---|
| Writing markdown, frontmatter, custom tags, asset embedding (across any content type) | writing | `references/writing.md` |
| Files under `dynamic_data/data/<sidebar-driven-section>/` (e.g. `user-guide/`, `dev-docs/`) | docs-layout | `references/docs-layout.md` |
| Files under `dynamic_data/data/blog/` (flat `YYYY-MM-DD-<slug>.md`) | blog-layout | `references/blog-layout.md` |
| Files under `dynamic_data/data/todo/` or any issue tracker (folder-per-item, `settings.json`, subtasks, comments, agent-logs) | issue-layout | `references/issue-layout.md` |
| `site.yaml` / `navbar.yaml` / `footer.yaml` / `.env` / paths / themes / project setup | settings-layout | `references/settings-layout.md` |

Cross-cutting tasks read multiple references. Example: *"add a new docs section and write its first page"* → read `settings-layout.md` (registering the section) **and** `writing.md` (writing the page).

## Project orientation

```
documentation-template/
├── src/                          ← framework code (Astro layouts, loaders, parsers)
│   └── layouts/                  ← per-content-type layouts (docs, blog, issues, custom)
├── dynamic_data/                 ← USER-EDITABLE content + config
│   ├── config/                   ← site.yaml, navbar.yaml, footer.yaml
│   ├── assets/                   ← static assets served at /assets/
│   ├── themes/                   ← optional custom themes
│   └── data/
│       ├── user-guide/           ← END-USER docs about the framework (canonical reference)
│       ├── dev-docs/             ← developer docs (architecture, layouts, scripts)
│       ├── blog/                 ← blog posts
│       └── todo/                 ← issue tracker (folder-per-item)
└── .claude/skills/docs/          ← this skill
```

**The most important rule:** the user-guide under `dynamic_data/data/user-guide/` is the **canonical source of truth** for everything this skill describes. When this skill is unclear, ambiguous, or stale, the user-guide wins. Each reference file points to its corresponding user-guide section.

## Read `data/README.md` first

Every project should have a `dynamic_data/data/README.md` that maps the data layout — what each top-level folder contains, its purpose, and how it's served. **Read it at the start of any task** to learn the project's content shape. The framework supports `user-guide/`, `dev-docs/`, `blog/`, `todo/`, `pages/` out of the box, but a project may add custom ones (e.g. an `internal-knowledge-base/`, a separate `meeting-notes/`, etc.).

If `dynamic_data/data/README.md` doesn't exist, **create one** before doing the requested task — the skill is far more useful when this map exists, and the cost is low. When you add or remove a top-level folder under `dynamic_data/data/`, **update the README in the same change** so future agents (and humans) don't drift.

## Universal conventions

These apply across all domains. Reference files don't repeat them — they assume you know.

- **`XX_` prefix** — folders and files inside `data/<docs-section>/` use a 2-digit numeric prefix (`01_`, `05_`, `10_`, …) for ordering. Issues and blog posts do **not** use this prefix.
- **`settings.json`** — every docs folder has one (sidebar label, position). Issue trackers have a root `settings.json` declaring vocabulary. Issues have a per-issue `settings.json` for metadata.
- **Frontmatter `title`** — required on every markdown file. Astro builds will fail without it.
- **Theme variables only** — when editing CSS in layouts, consume declared theme variables (see `src/styles/theme.yaml → required_variables`). Never hardcode colours, fonts, or invent variable names.
- **Edit, don't rewrite** — prefer `Edit` over `Write` for existing files. Surgical regex replaces preserve formatting and key order in JSON.
- **`bun` is the project runtime** — `bun run dev`, `bun run build`. For helper scripts and any Node CLI tool, prefer `bun` if available, fall back to `npm` / `node`.

## Helper scripts — 11 CLI wrappers on PATH

This plugin ships 11 CLI wrappers in its `bin/` folder, which Claude Code adds to `PATH` automatically when the plugin is installed. Just type the command — no path needed.

**Issue tracker (8):**

| Command | What it does |
|---|---|
| `docs-list` | Multi-field filter + free-text regex search over the tracker |
| `docs-show` | One issue's metadata + subtask summary + comment & agent-log heads |
| `docs-subtasks` | List subtasks for one issue, or across all (`--all`) |
| `docs-agent-logs` | Last N agent-log entries for an issue |
| `docs-set-state` | Update issue or subtask state |
| `docs-add-comment` | Append a comment with auto-incremented prefix |
| `docs-add-agent-log` | Append an agent-log entry with auto-incremented iteration |
| `docs-review-queue` | Items awaiting review (status=review issues + open issues with review subtasks) |

**Validators (3):**

| Command | What it does |
|---|---|
| `docs-check-blog` | Validate the blog folder — `YYYY-MM-DD-<slug>.md` naming, frontmatter `title:`, no nested folders. Defaults to `dynamic_data/data/blog/`. See `references/blog-layout.md`. |
| `docs-check-config` | Validate `site.yaml` / `navbar.yaml` / `footer.yaml` — required keys, `pages:` structure, `data:` path resolution, footer `page:` references. Defaults to `dynamic_data/config/`. See `references/settings-layout.md`. |
| `docs-check-section` | Validate a docs section — `XX_` prefix discipline, `settings.json` presence, frontmatter `title:`, prefix collisions. Required arg: section folder (e.g. `dynamic_data/data/user-guide`). See `references/docs-layout.md`. |

Each wrapper internally uses `bun` if available, falls back to `node`. Pass `--help` to any of them for the full flag list. Validators exit `0` on clean, `1` on errors found — useful in pre-commit / CI.

**Searching the tracker — use `docs-list --search`, not the `Grep` tool.** Any "find / locate / grep / search" verb against `dynamic_data/data/todo/` should route to `docs-list`, which understands the schema (vocabulary, subtask states, frontmatter), composes structural filters with regex search in one call, and returns exact paths + line numbers. `Grep` only sees text. See `references/issue-layout.md` for the synonym list and examples.

## When to spawn a subagent

For bulk file reads (10+ files), spawn a Haiku subagent via the Task/Agent tool to summarise rather than loading every file into the main context. Pattern: give the subagent the file list + the question, ask for a tight report (under 200 words).

The reference files (especially `issue-layout.md`) document concrete subagent patterns for their domain.

## When to update this skill

This skill mirrors the user-guide. If you discover the skill is wrong or out of date relative to the user-guide, **update the skill** rather than working around it — and tell the user. The skill catalogue page (`dynamic_data/data/user-guide/05_getting-started/05_claude-skills.md`) is the user-facing index of installed skills; keep it in sync.
