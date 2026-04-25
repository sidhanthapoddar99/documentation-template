---
title: Testing Locally
description: Iterating on a plugin during development — local marketplace, install, reload, debug recipes
---

# Testing Locally

You don't need to publish to GitHub or set up CI to iterate on a plugin. The plugin marketplace flow works against any local path. The same commands you'll use to ship the plugin are the commands you use to dogfood it.

## One-time setup

Add your repo as a local marketplace:

```
/plugin marketplace add /absolute/path/to/your/repo
```

or

```
/plugin marketplace add ./relative/path/to/your/repo
```

Claude Code reads `.claude-plugin/marketplace.json` from the path. The marketplace is registered at user scope — your other projects can install from it too.

> [!warning] `file://` URLs are rejected
> The interactive `/plugin` UI implies `./path/to/marketplace` is a valid format and treats `file:///home/you/repo` as **invalid** with the error: `"Invalid marketplace source format. Try: owner/repo, https://..., or ./path"`. Use a plain absolute or relative path instead. This is undocumented behaviour as of Claude Code 2.1.114 — verified empirically.

## Install your plugin

```
/plugin install <plugin-name>@<marketplace-name>
```

`<plugin-name>` comes from your plugin's `plugin.json`; `<marketplace-name>` from your marketplace's `marketplace.json`.

This:

1. Copies your plugin files to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`
2. Writes `enabledPlugins: { "<plugin>@<marketplace>": true }` to the chosen scope's `settings.json`

## Pick up changes without reinstalling

```
/reload-plugins
```

This re-scans installed plugins and reloads them from cache. Use it after editing files in your local plugin folder. Output looks like:

```
Reloaded: 5 plugins · 4 skills · 5 agents · 1 hook · 0 plugin MCP servers · 1 plugin LSP server
```

For most edits — skill body, references, scripts, wrapper logic — `/reload-plugins` alone picks up the change.

## When to use which command

| Change you made | What to run |
|---|---|
| Edited `SKILL.md`, `references/*.md`, `commands/*.md`, `agents/*.md` | `/reload-plugins` |
| Edited a script under `scripts/` | `/reload-plugins` (often unnecessary — scripts run fresh each invocation) |
| Edited `bin/<wrapper>` | `/reload-plugins` (re-scans bin folder, updates PATH) |
| Edited `plugin.json` (manifest) | `/plugin update <plugin>@<marketplace>`, then `/reload-plugins` |
| Edited `marketplace.json` | `/plugin update <plugin>@<marketplace>`, then `/reload-plugins` |
| Major restructure (added/removed capability folders) | `/plugin uninstall` then `/plugin install` again |

When in doubt: `/plugin uninstall <plugin>@<marketplace>` followed by `/plugin install` is the brute-force reset. It's a few seconds slower but always picks up state.

## Verifying install worked

```bash
# Wrappers should be on PATH
which <your-wrapper>
# Should resolve to ~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/bin/<wrapper>

# Plugin files in cache
ls ~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/

# enabledPlugins boolean in settings
grep enabledPlugins ~/.claude/settings.json
# OR
grep enabledPlugins <repo>/.claude/settings.json     # if installed at project scope
```

`/reload-plugins`'s output is also a sanity check — if your plugin's skill/command count is missing from the totals, the install probably didn't take.

## Debugging when things don't work

| Symptom | Likely cause | Fix |
|---|---|---|
| `command not found: <wrapper>` | Plugin not installed, or `bin/<wrapper>` not chmod +x | `which <wrapper>`, `chmod +x bin/*`, `/reload-plugins` |
| Wrapper runs but says script not found | Path inside wrapper is wrong | Check wrapper's `$DIR/../skills/...` matches actual on-disk layout |
| Skill not triggering on relevant prompts | Description too narrow or too vague | Tighten the `description` frontmatter; include specific triggers and a "skip when…" line |
| Slash command doesn't appear in `/help` | Plugin not loaded, or filename has a typo | `/reload-plugins`; verify `commands/<name>.md` exists |
| `${CLAUDE_PLUGIN_ROOT}` shows as empty in a Bash tool call | Env var only resolves in commands/hooks, not skill bodies or shell tools | Use a `bin/` wrapper — see [Bin Wrappers](./04_bin-wrappers.md) |
| Wrapper's `--help` shows old path after edit | Old `Usage:` string in the implementation script | Edit the script and `/reload-plugins` |
| Multiple skill versions appear | Both project-local AND plugin install active | Pick one — usually delete the project-local copy after the plugin works |

## The typical iteration loop

1. Edit a skill body, command body, or wrapper script
2. `/reload-plugins`
3. In the same session, prompt with the use case to verify
4. Repeat

For interactive tests of a slash command, just type `/<command>` directly — the model receives the new body immediately.

For skill triggering tests, pose a prompt that matches the description and observe whether the skill activates. If it doesn't trigger when expected, the description needs sharpening.

## Clean-install testing — wiping the cache

For most iteration `/reload-plugins` is enough, but when you want to verify a release works **as a new consumer would experience it**, the cache from a previous install can mask bugs (stale skill bodies, orphaned wrappers, scripts the new code path doesn't reference).

Truly clean test:

```bash
# Inside Claude Code
/plugin uninstall <plugin>@<marketplace>
/plugin marketplace remove <marketplace>

# In your shell
rm -rf ~/.claude/plugins/cache/<marketplace>/

# Back in Claude Code
/plugin marketplace add <source>
/plugin install <plugin>@<marketplace>
/reload-plugins
```

The `rm -rf` is the step most people skip. Without it, you're testing whatever's left over from your last iteration. Full uninstall + cache wipe + reinstall flow is documented in [Uninstalling](../06_uninstalling.md).

## Dogfood pattern recap

If your plugin's repo is the same repo as your marketplace (and the same repo the plugin's content is *about*), you can have the project enable its own plugin. Add to the project's committed `.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "<your-plugin>@<your-marketplace>": true
  }
}
```

Now anyone cloning the repo gets the plugin auto-enabled. They run `/plugin marketplace add <repo-path>` once (since marketplaces are user-scope) and the boolean takes care of the rest.

You're consumer #1 of your own plugin, so any bug in path resolution or `${CLAUDE_PLUGIN_ROOT}` interpolation shows up in your own usage immediately. Highly recommended.

## See also

- **[Installation](../03_installation.md)** — the consumer-side install flow
- **[Storage and Scope](../02_storage-and-scope.md)** — what the cache and the scope booleans actually mean
- **[Versioning and Publishing](./06_versioning-and-publishing.md)** — going from local iteration to public release
