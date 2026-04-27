---
title: "@root alias + supporting scaffold (defaults rename, template, init)"
done: false
state: review
---

Land the `@root` system alias along with the surrounding scaffolding it depends on: rename `dynamic_data/` to a clearer name, build a copyable starter template, wire `init` to use that template, and propagate the renames through skills and docs. Captured here as one subtask because the pieces are interlocking (e.g., `@root/default-docs/themes` only resolves cleanly once the rename + template both exist).

## Checklist

- [x] **Rename `dynamic_data/` → `default-docs/`** — done. Build is path-name-agnostic via `CONFIG_DIR`; only inert comments + the early fallback in `paths.ts` referenced the old name (all updated). Plugin CLI tools still hardcode `dynamic_data/` and break until the sweep below lands.
- [x] **Add `@root` system alias.** Done in `astro-doc-code/src/loaders/alias.ts:35` (`@root → paths.root`) and `paths.ts:127` (`'root'` reserved). Path-traversal guard in `alias.ts:115` throws on escapes. Also extended `initPaths()` (`paths.ts:208`) to allow `@root/...` in user `paths:` values (with the same traversal guard). Sensitive-file deny-list intentionally skipped per design discussion.
- [x] **Create a starter template** at `astro-doc-code/template/`. Contains:
  - 5 navbar items (Home / Docs / Issues / Blog / User Guide) wired in `template/config/{site,navbar,footer}.yaml`
  - Pre-configured `site.yaml` with Astro placeholder branding (`assets/astro-{dark,light}.svg`, `astro.png` copied in)
  - `theme_paths` includes `@root/default-docs/themes` so framework-bundled themes are picked up
  - User-guide section uses the new `default-docs` user-alias: `data: "@default-docs/user-guide"` (alternative form `@root/default-docs/data/user-guide` noted in a comment)
  - Verified end-to-end with `CONFIG_DIR=./astro-doc-code/template/config` → 89 pages built, navbar/footer both correct
- [ ] **Update `/docs-init` skill / plugin** to use the template as the starting point — essentially `cp -r template/ <user-target>/` plus prompts for name + description + URL substitution into placeholders.
- [x] **Sweep skills + docs to introduce `@root`** — added to:
  - User-guide alias page (`05_getting-started/03_aliases.md`) — new "Framework Root Alias" section (sharpened from "Project Root" — `@root` resolves to the framework folder, not the consumer's outer project) + diagram update.
  - User-guide paths config page (`10_configuration/03_site/03_paths.md`) — new "Using `@root` in `paths:` values" section, only-`@root`-allowed rule, path-traversal guard, both consumer + dogfood examples.
  - **CLAUDE.md** "Path resolution" key-concept — sharpened paragraph + new two-mode (consumer / dogfood) note.
  - Plugin skill reference (`settings-layout.md`) — `@root/<sub>` row added to the built-in alias table; cross-ref to env.md for the two-mode model.
  - README.md doesn't list aliases, so no edit needed.
- [x] **Reframe user-guide for consumer-mode (framework as a subfolder)** — full conceptual rewrite (not just string-replace):
  - `05_getting-started/01_overview.md` — new "What's in `default-docs/`" section with the three-purpose framing (docs / dogfood / source-of-defaults) + "Two operating modes" table.
  - `05_getting-started/04_data-structure.md` — full rewrite around YOUR content folders at YOUR project root, not `default-docs/`. Shows the `your-docs-folder/ → documentation-template/(framework)` layout explicitly.
  - `05_getting-started/02_installation.md` — install flow rewritten for consumer mode (clone framework as a subfolder, `cd documentation-template/`, `CONFIG_DIR=../config`).
  - `10_configuration/02_env.md` — both modes documented; consumer mode (`CONFIG_DIR=../config`) shown as primary, dogfood as alternative.
  - `10_configuration/01_overview.md` — directory-structure tree updated for consumer-mode layout.
  - `10_configuration/03_site/{03_paths,04_theme}.md` — sharpened examples; theme_paths now shows both `@themes` and `@root/default-docs/themes`.
  - `25_themes/{01_overview,06_creating-themes/02,06_creating-themes/03,10_rules-for-layout-authors}.md` — custom-theme paths shown at `themes/` (your project root), not `default-docs/themes/`.
  - `19_issues/{03_folder-structure,08_workflows/01_create-an-issue,10_setup-new-tracker}.md` and other user-content path examples — bulk sed dropped `default-docs/data/` prefix on user-content paths (`pages`, `todo`, `bugs`, `blog`, `docs`, `issues`); kept the prefix where it correctly refers to framework-bundled content.
- [x] **Sweep skills + docs for the `dynamic_data/` → `default-docs/` rename** — done via single mechanical pass (`grep -rln dynamic_data | xargs sed -i 's|dynamic_data|default-docs|g'`) across 57 files: CLAUDE.md, README.md, all user-guide pages, all dev-docs pages, plugin SKILL.md + 5 references, plugin commands, `default-docs/data/README.md`, `astro-doc-code/src/layouts/navbar/default/README.md`, plus the plugin's 8 `.mjs` scripts (which previously hardcoded `dynamic_data/` in path-safety checks and *refused to write outside it*). Tracker history under `default-docs/data/todo/` was deliberately excluded so old issues remain factually accurate. Verified clean with `grep -rln dynamic_data` (only `data/todo/` matches remain). Build re-ran clean: 338 pages.
- [x] **Refactor plugin scripts — no hardcoded path defaults** (follow-up to the rename sweep): the mechanical replacement left scripts hardcoded with `default-docs/` instead of `dynamic_data/`, which was still a default. Created shared `scripts/_env.mjs` that:
  - walks up to find the framework's `.env`, parses it, reads `CONFIG_DIR`, and derives the content root as the parent of the resolved CONFIG_DIR (matches the convention `data/` is sibling of `config/`);
  - throws clearly if `.env` or `CONFIG_DIR` is missing — no silent fallback to a hardcoded folder.
  - Allows `DOCS_PROJECT_ROOT` env var as an explicit override.
  Updated `issues/_lib.mjs`, `blog/check.mjs`, `config/check.mjs` to consume `_env.mjs`. Removed all `default-docs/` literals from script error messages and help text. Smoke-tested all four primary tools (`docs-list`, `docs-show`, `docs-check-config`, `docs-check-blog`) — all resolve paths correctly via `.env`. Note: requires `/plugin update && /reload-plugins` for the cached plugin install to pick up the changes.
- [ ] **Document the template + init flow** — new user-guide page (or section in getting-started) explaining: "run `docs init`, get a working starter, customise from there."

## What `@root` resolves to (table)

| Mode | `@root` resolves to | Example |
|---|---|---|
| Current (in-repo) | `<repo-root>/` (= `paths.projectRoot` after today's framework/project split) | `@root/default-docs/themes/my-theme.css` |
| Future (CLI-tool, Method 2/1) | `<docs-folder>/` (where `docs.conf` lives — also `paths.projectRoot` in that mode) | `@root/themes/my-theme.css` (no `default-docs/` wrapper in the consumer's flat layout) |

`@root` always means "the user's project," never the framework's location. `paths.projectRoot` is the right variable to bind it to.

## Why system alias, not user alias

User aliases (declared in `site.yaml paths:` section) are scoped to content/asset directories by design — `@data`, `@assets`, `@themes`. Each points at a curated subdirectory. `@root` punches through that scoping by definition: it can reach anywhere under the project root. That makes it:

- A **trust boundary issue** if user-declarable (someone could shadow `@root` to point at an unintended directory).
- A **system concern** because the framework already knows where the project root is (`paths.projectRoot`); the user shouldn't have to redeclare it.

So: reserved key (joins the existing `RESERVED_KEYS` set in `paths.ts:123`) + system-managed resolution.

## Deny-list vs path-traversal blocking

Two ways to constrain `@root`:

- **Path-traversal blocking (essential).** Resolve `@root/<path>`, normalise it, verify the result is still under `paths.projectRoot`. Reject if it escapes (e.g., `@root/../../etc/passwd`). Simple, robust, single rule covers the entire "anywhere outside the project" attack surface.
- **Sensitive-file deny-list (optional).** Also reject `@root/.env`, `@root/.env.*`, `@root/.git/...`, `@root/node_modules/...`, `@root/bun.lock`, `@root/package.json`, etc. — files that *are* inside the project but shouldn't be referenceable from content.

Path-traversal blocking is non-negotiable. The deny-list is defense-in-depth for accidental references (the project owner — or an AI agent writing content — pointing at `@root/.env`). The user's preference is to skip the deny-list and trust the project owner with what's inside their own root. **Recommendation:** ship with path-traversal blocking only; revisit the deny-list if accidents happen. Trivial to add later as a config option.

## Extension — `@root` in `site.yaml paths:` values

User noted: *"we can define other user-defined paths using the root alias or directly use them — basically all configs are converted when alias are present."*

Currently `resolvePathFromConfig()` in `paths.ts` resolves relative paths from the config dir (and accepts absolute paths). It doesn't know about aliases. With `@root` available as a system alias, it makes sense to support alias references in `site.yaml paths:` values:

```yaml
paths:
  data: "@root/data"
  themes: "@root/themes"
  customStuff: "@root/special-folder"
```

Resolution order: system aliases (`@root`, `@theme`, ...) resolve first because they don't depend on user aliases. User aliases (`@data`, `@assets`, `@<custom>`) come from `paths:` values and *can* reference system aliases — but probably shouldn't reference each other (avoids ordering issues). Implementation is a small extension to `resolvePathFromConfig()`.

## Open questions

1. ~~**`defaults/` vs `default-docs/` for the rename.**~~ **Resolved:** `default-docs/`.
2. ~~**Was "4 nav bar items" meant as 4 or 5?**~~ **Resolved:** 5 (Home / Docs / Issues / Blog / User Guide).
3. **Stay as one subtask or split into smaller ones?** Still bundled — top three boxes done, bottom three (skill/docs sweeps + init wiring) deferred for the user-led review pass. Split if those grow.

## Out of scope for this subtask

- Broader system-vs-user alias policy doc (could become a `notes/` file if useful later).
- `@root`-in-CLI-tool-mode behaviour gets re-tested when Method 2 lands (project root in that mode is the docs folder, not the repo) — until then, in-repo behaviour is the only thing to verify.
- CLI flag wiring for `init` (currently just a slash command; CLI integration arrives with Method 1).
