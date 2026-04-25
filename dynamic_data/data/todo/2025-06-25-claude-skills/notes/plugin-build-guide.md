---
title: "How to build and test a Claude Code plugin — recipe + empirical findings"
created: 2026-04-25
tags: [claude-code, plugins, recipe, findings]
---

# Plugin Build & Test Guide

Captured from building the `documentation-guide` plugin in subtask 09. Companion to `claude-code-extensions-reference.md` (the conceptual reference). This one is the *recipe* — concrete steps, real file paths, and the empirical findings that surprised me.

---

## TL;DR — what the build proved

| Surprise | Finding | Implication |
|---|---|---|
| Does `${CLAUDE_PLUGIN_ROOT}` work in skill markdown? | **No.** It only resolves in `commands/`, `hooks/`, and `allowed-tools` frontmatter. The bash environment for tool calls has it set to empty string. | Don't write `bun ${CLAUDE_PLUGIN_ROOT}/...` in SKILL.md — it'll expand to `bun /...` and fail |
| How do consumers run bundled scripts then? | **`bin/` folder is auto-added to PATH.** Each installed plugin's `bin/` is on `$PATH` at session start (verified: env shows `…/cache/<marketplace>/<plugin>/<version>/bin` in `$PATH`) | Ship executable wrappers in `bin/`; the model just types the command name |
| Does `/plugin marketplace add` accept `file://` URLs for local paths? | **No** — despite seeming obvious. Returns "Invalid marketplace source format". | Use plain absolute (`/abs/path`) or relative (`./path`) instead |
| Does the same plugin at multiple scopes duplicate files? | **No.** Files are cached **once** at user level. Each scope's `enabledPlugins` is just a boolean | Multi-scope enable is safe; no registration duplication |
| Are official plugins using `${CLAUDE_PLUGIN_ROOT}` in skills? | **None.** All 3 official plugins shipping skills (skill-creator, claude-md-improver, frontend-design) use **relative paths** in SKILL.md and rely on the model to figure them out | Match the convention — relative paths in skill markdown, `${CLAUDE_PLUGIN_ROOT}` only in commands/hooks |

---

## Plugin folder shape (real, not theoretical)

Taken straight from `plugins/documentation-guide/` after this build:

```
plugins/documentation-guide/
├── .claude-plugin/
│   └── plugin.json           ← MANIFEST (required) — name, version, description, author
├── README.md                 ← human-readable; shown in /plugin UI
├── LICENSE                   ← required for distribution; "TBD" placeholder is fine while iterating
├── bin/                      ← AUTO-ADDED TO $PATH at session start
│   ├── docs-list             ← executable shell wrapper
│   ├── docs-show
│   └── … 6 more
└── skills/                   ← per-capability folders (only those that exist)
    └── documentation-guide/
        ├── SKILL.md          ← frontmatter (name, description) + body
        ├── references/       ← progressive-disclosure files the skill body cites
        └── scripts/          ← bundled .mjs / .py / .sh — invoked via the wrappers in bin/
```

Other capability folders that go alongside `bin/` and `skills/` if you have them:
- `commands/<name>.md` — slash commands
- `agents/<name>.md` — subagent configs
- `hooks/` (or hooks declared in a `hooks.json`) — runtime hooks
- `.mcp.json` — MCP server registrations

A plugin can ship *just one* capability or *all of them* — no requirement.

### `plugin.json` minimum

```json
{
  "name": "documentation-guide",
  "description": "One-paragraph TL;DR — used in /plugin UI",
  "version": "0.1.0",
  "author": { "name": "Your Name" },
  "homepage": "https://github.com/you/repo",
  "repository": "https://github.com/you/repo"
}
```

Add `license` once you've picked one. Keep description rich — it shows up in plugin browsers.

---

## Marketplace shape (real, not theoretical)

A marketplace is just a Git repo (or local folder) with a manifest at the root:

```
your-repo/
└── .claude-plugin/
    └── marketplace.json      ← lists plugins this marketplace ships
```

The marketplace.json from this build:

```json
{
  "name": "documentation-template",
  "owner": { "name": "Sidhantha" },
  "plugins": [
    {
      "name": "documentation-guide",
      "source": "./plugins/documentation-guide",
      "description": "One-line description shown in /plugin browser"
    }
  ]
}
```

A marketplace can ship one plugin or many. The `source` is a path relative to the marketplace root. For local development, the same repo can be both the marketplace AND the plugin source (this is the dogfood pattern — see the dedicated section below).

---

## The `bin/` pattern (the most important practical finding)

This is the cleanest way to expose plugin-bundled scripts to the model. Better than slash commands, better than `${CLAUDE_PLUGIN_ROOT}` interpolation.

**Why it works:** at session start, Claude Code adds every installed plugin's `<plugin-root>/bin/` directory to the bash `$PATH`. Verified live:

```bash
$ env | grep CLAUDE_PLUGIN_ROOT
CLAUDE_PLUGIN_ROOT=          # empty in regular tool-call shells
$ echo $PATH | tr ':' '\n' | grep claude
/home/sid/.claude/plugins/cache/claude-plugins-official/pyright-lsp/1.0.0/bin
/home/sid/.claude/plugins/cache/claude-plugins-official/ralph-loop/1.0.0/bin
/home/sid/.claude/plugins/cache/claude-plugins-official/skill-creator/unknown/bin
…
```

**Wrapper script template** (this is the exact pattern I used for `docs-list`, etc.):

```bash
#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$DIR/../skills/<your-skill>/scripts/<subdir>/<script>.mjs"
if command -v bun >/dev/null 2>&1; then
  exec bun "$SCRIPT" "$@"
else
  exec node "$SCRIPT" "$@"
fi
```

`chmod +x` and you're done. The model can now type `your-command --foo bar` like any CLI tool. No path knowledge required, no `${CLAUDE_PLUGIN_ROOT}`, no slash command boilerplate.

**Naming hygiene:** prefix all wrappers with your plugin's namespace (e.g. `docs-` for documentation-guide) so they don't collide with other plugins or system tools. Imagine 5 plugins each shipping `list` — chaos.

---

## Path resolution cheat sheet (where `${CLAUDE_PLUGIN_ROOT}` works)

| Where | Does `${CLAUDE_PLUGIN_ROOT}` resolve? |
|---|---|
| `commands/<name>.md` body | ✅ Yes — runtime template-expands before injecting prompt |
| `commands/<name>.md` `allowed-tools` frontmatter | ✅ Yes |
| `hooks/hooks.json` command strings | ✅ Yes |
| Shell scripts in `scripts/` (run via Bash) | ❌ No — env var is empty in tool-call shells |
| Bash tool calls written by the model | ❌ No — same reason |
| `SKILL.md` body | ❌ No — just gets read as text by the model; no expansion |

**Rule of thumb:** `${CLAUDE_PLUGIN_ROOT}` is for files Claude Code *templates* (commands, hooks). Anything that runs as a normal shell command needs a different strategy — either `bin/` wrappers (recommended) or a script that resolves its own location via `$(dirname "${BASH_SOURCE[0]}")`.

---

## Testing in real-time (local-file marketplace flow)

You don't need to publish to GitHub or set up CI to iterate on a plugin. Use a `file://` URL.

### Setup (one-time)

```
/plugin marketplace add /absolute/path/to/your/repo
# OR
/plugin marketplace add ./relative/path/to/your/repo
```

This adds a marketplace pointing at your local repo. Claude Code reads `.claude-plugin/marketplace.json` from there.

> [!warning] `file://` URLs do not work
> The interactive `/plugin` UI lists `./path/to/marketplace` as a valid source format but **does NOT accept `file://` URLs** despite that being a natural guess for "local file path." Trying `file:///home/you/repo` returns:
> > Invalid marketplace source format. Try: owner/repo, https://..., or ./path
>
> Use a plain absolute path (`/home/you/repo`) or a relative path (`./repo`) instead. This is undocumented behaviour as of Claude Code 2.1.114 — verified empirically during this build.

### Install your plugin

```
/plugin install <plugin-name>@<marketplace-name>
```

Where `<plugin-name>` is from `plugin.json` and `<marketplace-name>` is from `marketplace.json`. Example from this build:

```
/plugin install documentation-guide@documentation-template
```

This:
1. Copies your plugin files to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`
2. Writes `enabledPlugins: { "<plugin>@<marketplace>": true }` to the chosen scope's `settings.json`

### Reload to pick up changes

```
/reload-plugins
```

This re-scans installed plugins. Use it after editing source files in your plugin folder. Output looks like:

```
Reloaded: 4 plugins · 4 skills · 5 agents · 1 hook · 0 plugin MCP servers · 1 plugin LSP server
```

### Verify install worked

After install + reload, sanity-check:

```bash
# Wrappers should be on PATH
which docs-list

# Should resolve to ~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/bin/docs-list

# Plugin files should be in the cache
ls ~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/

# enabledPlugins should be in settings
cat ~/.claude/settings.json | grep enabledPlugins
# OR
cat <repo>/.claude/settings.json | grep enabledPlugins      # if installed at project scope
```

### Iterating

When you change source files in your plugin:

1. **Most changes** (skill body, references, scripts, wrapper logic) — just `/reload-plugins` and the cache is re-read
2. **Manifest changes** (`plugin.json`, `marketplace.json`) — `/plugin update` then `/reload-plugins`
3. **Adding/removing wrappers in bin/** — `/reload-plugins` (Claude Code re-scans bin/ and updates PATH)
4. **Major restructure** — `/plugin uninstall <plugin>@<marketplace>` then `/plugin install` again

If something looks stale, `/plugin uninstall` + `/plugin install` is the brute-force reset.

### Debugging when things don't work

| Symptom | Likely cause | Fix |
|---|---|---|
| Wrapper not found (`command not found: docs-foo`) | Plugin not installed, or bin/ not chmod +x'd | Check `which docs-foo`, `chmod +x bin/*`, `/reload-plugins` |
| Wrapper runs but says script not found | Path inside wrapper is wrong | The wrapper's `$DIR/../skills/...` path must match the actual on-disk layout |
| Skill not triggering | Description too narrow, or skill not loaded | Check `/reload-plugins` output; confirm skill listed under "available skills" |
| Wrapper's `--help` shows old path | Old Usage string in source | Edit `printHelp()` or equivalent and `/reload-plugins` |
| Multiple skill versions appear | Both project-local AND plugin install active | Pick one — usually delete the project-local copy after the plugin works |

---

## Dogfood pattern — when the plugin lives in the same repo it's distributed from

This is the cleanest setup for a framework that wants to maintain its own tooling skill:

```
your-framework/
├── .claude-plugin/
│   └── marketplace.json           ← REPO IS A MARKETPLACE
├── .claude/
│   └── settings.json              ← committed; enables the plugin in this project
├── plugins/
│   └── your-plugin/               ← REPO IS ALSO THE PLUGIN SOURCE
│       ├── .claude-plugin/plugin.json
│       ├── bin/
│       └── skills/
└── (your framework code)
```

The repo is **both** the marketplace and the plugin source. Consumers run:

```
/plugin marketplace add https://github.com/you/your-framework
/plugin install your-plugin@your-framework
```

And **you** (the maintainer) install from your own marketplace, just like everyone else. This means you eat your own dogfood — any breakage shows up in your own development immediately.

### Critical detail: don't keep two copies of the skill

If you currently have the skill at `<repo>/.claude/skills/your-skill/` (the project-local pattern), you have two options:

1. **Move it** into `plugins/your-plugin/skills/your-skill/` (delete the project-local) — clean, but you lose access until the plugin is installed
2. **Copy first**, install the plugin, verify, then delete the project-local — safer iteration

I went with option 2 in this build because the skill was actively in use during the migration. Once verified, the project-local copy gets deleted (otherwise you have two skills with the same name registered, which is at best wasteful and at worst confusing).

### Critical detail: commit `.claude/settings.json` (not `settings.local.json`)

For dogfood, the `enabledPlugins` boolean goes in **committed** `settings.json` so anyone cloning the repo automatically gets the plugin enabled in their own user-level cache. Putting it in `settings.local.json` (gitignored) would mean only you have it enabled.

---

## Step-by-step recipe (condensed)

For your next plugin, this is the path of least resistance:

1. **Decide what the plugin ships.** Skill? Slash commands? CLI wrappers? Hooks? MCP? Mix?
2. **Create the structure:**
   ```
   plugins/my-plugin/
   ├── .claude-plugin/plugin.json   ← write the manifest
   ├── README.md
   ├── LICENSE                       ← can be "TBD" placeholder while iterating
   ├── bin/                          ← if you have CLI wrappers
   ├── skills/<name>/SKILL.md        ← if you have a skill
   └── commands/<name>.md            ← if you have slash commands
   ```
3. **If you have CLI wrappers:** write the bash template above for each, `chmod +x` them, prefix with your plugin's namespace
4. **If you have a skill:** keep paths relative in SKILL.md; reference your CLI wrappers by name (not by path)
5. **Add `.claude-plugin/marketplace.json` at your repo root** listing the plugin
6. **Test:** `/plugin marketplace add file:///absolute/path/to/repo` → `/plugin install` → `/reload-plugins` → verify
7. **Iterate** until it works for the easy cases
8. **Dogfood:** add `enabledPlugins` to your repo's committed `.claude/settings.json` so anyone who clones gets the plugin auto-enabled
9. **Publish:** push to GitHub. Now consumers can `/plugin marketplace add https://github.com/you/repo`

That's it. The whole "plugin" thing turns out to be much simpler than it looks once you understand that the model doesn't see plugins as first-class entities — it just sees the skills, commands, and CLI tools the plugin happens to ship.

---

## Things I tried that didn't work, so you don't have to

- **`bun ${CLAUDE_PLUGIN_ROOT}/scripts/foo.mjs` in SKILL.md** — the env var doesn't expand for normal tool-call shells. Falls back to empty string. Use `bin/` wrappers instead.
- **`/plugin marketplace add file:///absolute/path`** — rejected with "Invalid marketplace source format" despite `file://` being the obvious guess. Use plain `/absolute/path` or `./relative/path` instead.
- **Counting on the install UI to refuse multi-scope installs** — it doesn't. The same plugin can be enabled at user, project, AND local scope simultaneously. The runtime de-duplicates at load time. So pick *whichever* scope makes sense; don't overthink it.
- **Letting wrapper scripts use just bun** — fragile if the consumer doesn't have bun. The if/else fallback to node is small and worth it.

---

## Cross-references

- `claude-code-extensions-reference.md` (sibling) — the conceptual reference for plugins, skills, commands, hooks, MCP, subagents, scopes
- `subtasks/09_plugin-marketplace-dogfood.md` (sibling) — the subtask this build executed
- Official Claude Code plugin docs — https://docs.claude.com/en/docs/claude-code/plugins
- The `claude-md-management` plugin install used as the reference for real folder layout — `~/.claude/plugins/cache/claude-plugins-official/claude-md-management/1.0.0/`
