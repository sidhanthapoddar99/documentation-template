# documentation-guide

Claude Code plugin shipping a single skill — `documentation-guide` — plus 11 CLI wrappers for the [documentation-template](https://github.com/sidhantha/documentation-template) framework: 8 for the issue tracker (`docs-list`, `docs-show`, `docs-subtasks`, `docs-agent-logs`, `docs-set-state`, `docs-add-comment`, `docs-add-agent-log`, `docs-review-queue`) plus 3 validators (`docs-check-blog`, `docs-check-config`, `docs-check-section`).

The skill teaches Claude Code how to navigate this Astro-based docs framework: the `dynamic_data/` content layout, frontmatter conventions, the folder-per-issue tracker, `site.yaml` configuration, custom themes, and more. Triages every task to a domain-specific reference file rather than dumping everything into one long prompt.

## Install

```
/plugin marketplace add https://github.com/sidhantha/documentation-template
/plugin install documentation-guide@documentation-template
/reload-plugins
```

After install, the 11 CLI wrappers are on your `PATH` automatically (Claude Code adds the plugin's `bin/` to PATH at session start). Try one:

```
docs-list --priority high
docs-list --search "indexer" --status open,review
docs-review-queue
docs-check-config             # validate site.yaml / navbar.yaml / footer.yaml
docs-check-section dynamic_data/data/user-guide
```

The skill triggers automatically whenever you work on docs in a project that has a `dynamic_data/` directory.

## What's inside

| Capability | Where |
|---|---|
| Skill | `skills/documentation-guide/SKILL.md` (+ 5 reference files in `references/`) |
| 8 CLI wrappers | `bin/docs-*` |
| Helper scripts | `skills/documentation-guide/scripts/issues/*.mjs` (the wrappers shell out to these) |

## Requirements

- A documentation-template-shaped project (has `dynamic_data/`)
- `bun` preferred for running the helpers; `node` works as a fallback

## License

TBD — placeholder. Decide before any public distribution.
