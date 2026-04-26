---
description: Bootstrap a new documentation-template project (config + sample data + CLAUDE.md patch). Walks through scope, site name, and first section interactively.
allowed-tools: Read, Write, Edit, Bash
argument-hint: (no arguments — fully interactive)
---

You are running the `/docs-init` slash command from the `documentation-guide` plugin.

# Goal

Scaffold a new **documentation-template** project from zero. The project layout this command produces:

```
<chosen-root>/
├── assets/                    ← logos, images (served at /assets/)
├── config/
│   ├── site.yaml              ← site name, theme, page definitions
│   ├── navbar.yaml            ← top-nav links
│   └── footer.yaml            ← footer columns
├── data/
│   ├── README.md              ← maps the data layout for future agents
│   └── <section>/             ← first docs section (e.g. user-guide)
│       ├── settings.json      ← label + sidebar config
│       └── 01_welcome.md      ← starter page (XX_ prefix on FILES, not section folder)
├── themes/                    ← (empty — for custom themes)
├── astro-doc-code/            ← framework code, git-cloned by the user
│                                  (future: replaced by `bun add documentation-template`)
└── start                      ← bash wrapper from the framework clone (`./start [dev|build|preview]`)
```

**Naming convention:** top-level folders under `data/` use plain kebab-case (e.g. `user-guide`, `dev-docs`). The `XX_` numeric prefix is only used on files within a section, and on subsection folders if the section grows them — never on the top-level section folder.

The framework code itself (`astro-doc-code/`) is **not** part of this scaffold — it's a separate clone the user runs at the end. Today it must be cloned; once the npm-package work lands, it becomes a dependency install.

A patched `CLAUDE.md` lives at the repo root (created if absent) so future Claude Code sessions know the docs layout, the active skill, and the build commands.

# Workflow

Walk the user through these steps **in order**. Be conversational — ask questions, confirm before writing files, summarise at the end.

## Step 1 — Pre-flight check

Before asking anything, check the current working directory for evidence the project is already initialised:

- Does `./config/site.yaml` exist?
- Does `./data/` exist with any subdirectories?
- Does `./dynamic_data/config/site.yaml` exist (legacy layout)?

If **any** of these is true, stop and tell the user:
> Looks like docs are already initialised here (`<path-found>` exists). Use `/docs-add-section` to add a new section, or remove the existing structure first.

Do not proceed.

If none of these exist, continue.

## Step 2 — Ask: scope

Ask the user:
> Will this entire repo be the docs site, or should the docs live in a subfolder?
>
> 1. **Whole repo** — initialise at the current directory
> 2. **Subfolder** (recommended for projects that already have source code) — pick a folder name (default: `docs`)

Capture the answer:
- If "whole repo" → `chosen_root = "."`
- If "subfolder" → ask for name (default `docs`), create the folder if missing → `chosen_root = "./<name>"`

Print the resolved absolute path back to the user for confirmation before writing anything.

## Step 3 — Ask: site identity

Ask three short questions (one message, the user can answer all at once):

1. **Site name** — short label, shown in the navbar (e.g. "Acme Docs")
2. **Site title** — full title used in `<title>` tags (default: same as site name)
3. **Description** — one-sentence tagline (default: "Documentation built with documentation-template")

## Step 4 — Ask: first section name

Ask:
> What's the first docs section called? (e.g. `user-guide`, `dev-docs`, `handbook`, `getting-started`)

Default to `user-guide`. Use kebab-case. This becomes the first folder under `data/` and the first entry in `pages:` in `site.yaml`.

## Step 5 — Confirm and scaffold

Show the user the full plan, then wait for confirmation. If they say no, stop. If they say yes, write all files using the templates in the next section.

```
Will create at <chosen_root>:
  assets/                                           (empty)
  config/site.yaml                                  (site name, theme: default, first section: <section>)
  config/navbar.yaml                                (Home, <Section Title>)
  config/footer.yaml                                (minimal default)
  data/README.md                                    (data layout map)
  data/<section>/settings.json                      (label "<Section Title>", sidebar config)
  data/<section>/01_welcome.md                      (frontmatter + starter content)
  themes/                                           (empty)

Will patch:
  CLAUDE.md                                         (at repo root — created if absent)

Will print clone instructions for the framework engine at the end.

Proceed?
```

## Step 6 — Patch CLAUDE.md

Open `./CLAUDE.md` (the repo root, NOT inside `chosen_root` if it's a subfolder). If absent, create it with the full `CLAUDE.md` template below. If present, append the **"## Documentation"** section from the template (or merge intelligently if there's already such a section).

The CLAUDE.md patch is the **single most important output** — without it, future sessions don't know the docs layout, that the `documentation-guide` skill is installed and applies to this project, or how to build/run.

## Step 7 — Print summary + next steps

End with a clear next-actions block:

```
Created docs scaffold at <chosen_root>.

Next steps:

1. Clone the framework code into <chosen_root> as `astro-doc-code/` and launch:
     cd <chosen_root>
     git clone https://github.com/sidhanthapoddar99/documentation-template.git astro-doc-code
     # The clone ships its own ./start wrapper at the repo root. If you want it visible
     # at <chosen_root>/start, copy or symlink it from astro-doc-code/start, then:
     echo "CONFIG_DIR=config" > .env       # path is relative to <chosen_root> (where .env lives)
     ./start                                # preflight: pick bun (else npm) → install → sanity build → dev

2. Open http://localhost:4321 — you should see "<Site Name>" with one page in the sidebar.

3. To add another top-level section later: run /docs-add-section.

4. Edit `<chosen_root>/data/<section>/01_welcome.md` to start writing.
```

---

# Templates

Use these EXACTLY (substitute `<...>` placeholders with the user's answers).

## `config/site.yaml`

```yaml
# Site Configuration
site:
  name: "<site_name>"
  title: "<site_title>"
  description: "<description>"

# Vite Server Configuration
server:
  allowedHosts: true

# Directory Paths (relative to this config directory)
# Each key becomes an @key alias.
paths:
  data: "../data"
  assets: "../assets"
  themes: "../themes"

# Theme Configuration
theme: "default"
theme_paths:
  - "@themes"

# Logo
logo:
  src: "@assets/logo.svg"
  alt: "<site_name>"
  favicon: "@assets/favicon.png"

# Editor Configuration (required — framework throws if missing)
editor:
  autosave_interval: 10000  # milliseconds

# Page Definitions
pages:
  <section>:
    base_url: "/<section>"
    type: docs
    layout: "@docs/default"
    data: "@data/<section>"
```

## `config/navbar.yaml`

```yaml
layout: "@navbar/default"

items:
  - label: "Home"
    href: "/"

  - label: "<Section Title>"
    href: "/<section>"
```

`<Section Title>` = the user's section name converted to Title Case (e.g. `user-guide` → "User Guide").

## `config/footer.yaml`

```yaml
layout: "@footer/default"

copyright: "© {year} <site_name>. All rights reserved."

columns:
  - title: "Documentation"
    links:
      - label: "<Section Title>"
        href: "/<section>"

  - title: "Project"
    links:
      - label: "GitHub"
        href: "https://github.com/your-org/your-repo"
```

## `data/README.md`

```markdown
# Data Layout

This folder holds all editable content for the docs site. Each top-level folder is either a docs section, a content type, or supporting data.

## Top-level folders

| Folder | Purpose | Served at |
|---|---|---|
| `<section>/` | First docs section — sidebar-driven, files use `XX_` numeric prefix for ordering | `/<section>` |

## Adding a new section

Run `/docs-add-section` from Claude Code, or:

1. Create `data/<kebab-name>/` (top-level — no `XX_` prefix on the folder)
2. Add `settings.json` with `{ "label": "...", "sidebar": { "collapsed": false, "collapsible": true } }`
3. Add `01_overview.md` with frontmatter `title:` (the `XX_` prefix on FILES controls sidebar order)
4. Add a matching entry to `config/site.yaml` under `pages:`

## Conventions

- **`XX_` prefix** — applies to **files** inside a section (e.g. `01_overview.md`, `05_setup.md`) and to **subsection folders** (e.g. `data/<section>/05_getting-started/`). It does NOT apply to top-level section folders themselves.
- **`settings.json` required** — every section folder needs one (label + sidebar config)
- **`title` frontmatter required** — every markdown file needs `title: "..."` in frontmatter
- See the `documentation-guide` skill (installed via the plugin marketplace) for full conventions
```

## `data/<section>/settings.json`

```json
{
  "label": "<Section Title>",
  "sidebar": {
    "collapsed": false,
    "collapsible": true,
    "sort": "position",
    "depth": 3
  }
}
```

## `data/<section>/01_welcome.md`

```markdown
---
title: Welcome
description: Start here.
---

# Welcome to <site_name>

This is the first page of your documentation site. Edit `data/<section>/01_welcome.md` to replace this content.

## What you can do next

- **Add a page** to this section: create `data/<section>/02_<slug>.md` with frontmatter `title:`. The `XX_` prefix controls sidebar order — leave gaps so future inserts don't require renumbering.
- **Add a subsection folder**: create `data/<section>/05_<sub-name>/` with its own `settings.json` and pages
- **Add a new top-level section**: run `/docs-add-section` from Claude Code
- **Customise the navbar**: edit `config/navbar.yaml`
- **Switch themes**: edit `theme: "..."` in `config/site.yaml`

## Conventions

The `XX_` numeric prefix on files (`01_`, `05_`, `10_`, …) controls sidebar order — gaps are fine. Every folder needs `settings.json`; every markdown file needs `title:` in frontmatter.

For full conventions and tooling, see the `documentation-guide` skill — Claude Code triggers it automatically when you work in `data/`.
```

## `CLAUDE.md` (root) — full template if absent

```markdown
# <Site Name>

<one-sentence description>

## Documentation

Docs site lives at `<chosen_root>/` (relative to repo root).

- **Content**: `<chosen_root>/data/`
- **Config**: `<chosen_root>/config/{site,navbar,footer}.yaml`
- **Themes**: `<chosen_root>/themes/`
- **Framework code**: `<chosen_root>/astro-doc-code/` (cloned separately — see below)

### Build commands

From `<chosen_root>/`, use the `./start` wrapper that ships with the framework clone:

```bash
./start            # preflight: pick bun (else npm) → install if needed → sanity build → dev
./start dev        # skip preflight, dev only      → http://localhost:4321
./start build      # skip preflight, build only    → astro-doc-code/dist/
./start preview    # skip preflight, preview only
```

Inside `astro-doc-code/`, `bun run dev` / `bun run build` / `bun run preview` work directly.

The framework reads `.env` from the repo root (`<chosen_root>/.env`) for `CONFIG_DIR`, which points at the consumer's `config/` folder (path relative to the repo root).

### Tooling — `documentation-guide` plugin

This project uses the `documentation-guide` Claude Code plugin. It ships:

- **Skill** — automatically triggers on docs work; routes to domain-specific reference files (writing, docs-layout, blog-layout, issue-layout, settings-layout)
- **CLI wrappers on PATH** — `docs-list`, `docs-show`, `docs-subtasks`, `docs-agent-logs`, `docs-set-state`, `docs-add-comment`, `docs-add-agent-log`, `docs-review-queue` (issue tracker), `docs-check-blog`, `docs-check-config`, `docs-check-section` (validators)
- **Slash commands** — `/docs-init`, `/docs-add-section`

Install (per repo):

```
/plugin marketplace add https://github.com/sidhanthapoddar99/documentation-template
/plugin install documentation-guide@documentation-template
/reload-plugins
```

To enable for everyone who clones this repo, the plugin is also enabled in committed `.claude/settings.json`.

### Adding content

- **New page in existing section** — create `data/<section>/<XX>_<slug>.md` with `title:` frontmatter. `XX_` is the next 2-digit prefix in the section.
- **New top-level section** — run `/docs-add-section` (creates `data/<name>/`, `settings.json`, starter page; optionally registers in `site.yaml`)
- **Validate before commit** — `docs-check-section <chosen_root>/data/<section>` flags missing `settings.json`, missing frontmatter, prefix collisions
```

If `CLAUDE.md` already exists, append the `## Documentation` section (everything from `## Documentation` to the end of the template) — don't overwrite the rest of the file.

---

# Tone & guardrails

- Ask one question at a time when you genuinely need user input; batch related questions where natural.
- Show the file plan before writing — never silently scaffold.
- If the user has chosen a non-default for any answer, restate it back so they can correct typos.
- After scaffolding, validate by running `docs-check-config <chosen_root>/config` and `docs-check-section <chosen_root>/data/<section>` — both should exit clean. If they don't, fix the issue or report it.
- Do not clone the framework engine for the user (network operation, license decision, fork preference). Print the clone command in the summary instead.
