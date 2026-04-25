# documentation-template

Astro-based documentation framework with modular layouts, YAML configuration, a folder-per-issue tracker, and live editing via Yjs CRDT. Ships its own Claude Code plugin so authoring docs is one slash command away.

## Quick start

The fastest path is via the bundled Claude Code plugin — three commands to install, one to scaffold:

```
/plugin marketplace add https://github.com/sidhanthapoddar99/documentation-template
/plugin install documentation-guide@documentation-template
/reload-plugins
/docs-init
```

`/docs-init` walks you through site name, first section, and patches `CLAUDE.md`. At the end it prints the framework-clone command tailored to your scope choice. Open `http://localhost:4321` and you have a docs site.

> [!note]
> Local install while iterating? Use a plain absolute path (no `file://` prefix) for the marketplace add: `/plugin marketplace add /absolute/path/to/this/repo`.

## What's in the plugin

| Surface | Use it for |
|---|---|
| **Skill** — `documentation-guide` | Triggers automatically on any docs/issue/blog/config work. Triages to one of five domain-specific reference files. |
| **Slash commands** — `/docs-init`, `/docs-add-section` | Bootstrap a new project; add a top-level section. Both interactive. |
| **CLI wrappers (8)** for the issue tracker | `docs-list`, `docs-show`, `docs-subtasks`, `docs-agent-logs`, `docs-set-state`, `docs-add-comment`, `docs-add-agent-log`, `docs-review-queue` |
| **Validators (3)** — exit `0` clean / `1` on errors | `docs-check-blog`, `docs-check-config`, `docs-check-section <folder>` |

All 11 wrappers land on your `$PATH` automatically after install — no path configuration. Pass `--help` to any of them for the full flag list.

## Manual setup (without the plugin)

If you'd rather not use the plugin, the framework is a normal Astro project:

```bash
git clone https://github.com/sidhanthapoddar99/documentation-template.git my-docs
cd my-docs
bun install      # or npm install
cp .env.example .env
bun run dev      # http://localhost:4321
```

Edit content under `dynamic_data/data/`. See the user-guide ([Installation](https://github.com/sidhanthapoddar99/documentation-template/blob/main/dynamic_data/data/user-guide/05_getting-started/02_installation.md)) for the full walkthrough.

## Build commands

```bash
bun run dev      # development server with hot reload
bun run build    # production build → dist/
bun run preview  # preview production build locally
```

## What's inside the repo

```
documentation-template/
├── .claude-plugin/marketplace.json   ← marketplace manifest (this repo IS a marketplace)
├── .claude/settings.json             ← dogfood: enables the plugin in this project
├── plugins/
│   └── documentation-guide/          ← the plugin source (skill + wrappers + commands)
├── src/                              ← framework code (Astro layouts, loaders, parsers)
└── dynamic_data/                     ← USER-EDITABLE content + config
    ├── config/                       ← site.yaml, navbar.yaml, footer.yaml
    ├── assets/                       ← static assets served at /assets/
    ├── themes/                       ← optional custom themes
    └── data/                         ← content (user-guide, dev-docs, blog, todo)
```

The repo is **both** the marketplace and the plugin source — a dogfood setup. The same install command above is what every consumer (and every clone of this repo) runs.

## Documentation

- **End-user docs** — `dynamic_data/data/user-guide/` (rendered at `/user-guide` in the live site). Setup, configuration, content authoring, themes, layouts, the issue tracker.
- **Developer docs** — `dynamic_data/data/dev-docs/` (rendered at `/dev-docs`). Architecture, layouts internals, loader pipeline, scripts, and the **Plugins** section explaining how Claude Code plugins work and how to author one.
- **CLAUDE.md** at the repo root — orientation for Claude Code sessions working in this repo.

## What's coming

The framework currently ships via `git clone`. A planned refactor (`2026-04-25-framework-as-npm-package` issue) packages it as a published `bun add documentation-template` dependency, so each consumer becomes a thin shell over the engine instead of a full clone. Once that lands, `/docs-init` will install the engine via npm/bun instead of asking you to clone.

## License

TBD — placeholder. Pick before public distribution.
