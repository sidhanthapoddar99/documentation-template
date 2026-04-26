---
title: "@root alias + supporting scaffold (defaults rename, template, init)"
done: false
---

Land the `@root` system alias along with the surrounding scaffolding it depends on: rename `dynamic_data/` to a clearer name, build a copyable starter template, wire `init` to use that template, and propagate the renames through skills and docs. Captured here as one subtask because the pieces are interlocking (e.g., `@root/default-docs/themes` only resolves cleanly once the rename + template both exist).

## Checklist

- [ ] **Rename `dynamic_data/` → `default-docs/`** (or `defaults/` — pick one; see open question below). This is the framework's bundled content + themes + scripts that ship as the starter template.
- [ ] **Add `@root` system alias.** Resolves to `paths.projectRoot`. Constrain to `@root/<path>` where the normalised result must remain under `projectRoot` (path-traversal blocking — no `..` escapes). A sensitive-file deny-list (`.env`, `.git`, `node_modules`, lockfiles) is optional defense-in-depth — see "Deny-list vs path-traversal blocking" below for the tradeoff.
- [ ] **Create a starter template doc** that becomes the source for `init`. Contains:
  - **5 navbar items**: homepage (default landing), docs (sample with init + small README), issues (sample tracker), blogs (sample posts), user-guide (points at `@root/default-docs/data/user-guide/...` — the framework's bundled docs)
  - Pre-configured `config/site.yaml` with Astro placeholder branding (logo, SVGs), placeholder name + description fields the user customises after init
  - `themes/` includes `@root/default-docs/themes/...` so framework-bundled themes are available out of the box
- [ ] **Update `/docs-init` skill / plugin** to use the template as the starting point — essentially `cp -r template/ <user-target>/` plus prompts for name + description + URL substitution into placeholders.
- [ ] **Sweep skills + docs to introduce `@root`** — touchpoints: user-guide alias page (`dynamic_data/data/user-guide/05_getting-started/03_aliases.md`), dev-docs alias / config pages, plugin `SKILL.md` + relevant references in `plugins/documentation-guide/`, **CLAUDE.md** alias table, **README.md** (if it lists aliases).
- [ ] **Sweep skills + docs for the `dynamic_data/` → `default-docs/` rename** — touchpoints: every page under `dynamic_data/data/user-guide/` and `dynamic_data/data/dev-docs/` that references `dynamic_data/`, all of `plugins/documentation-guide/skills/...` + `commands/...`, **CLAUDE.md** (multiple sections — repo layout, build commands, source-code structure, key rules), **README.md** (the "What's inside the repo" tree we just updated this morning), and any leftover code-level path strings in `astro-doc-code/src/` (esp. error messages, defaults, comments). ~30+ surface points; worth running a `grep -rn "dynamic_data" .` after the rename to catch stragglers.
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

## Open questions to resolve before implementation

1. **`defaults/` vs `default-docs/` for the rename.** User used both interchangeably. `default-docs/` is more descriptive (says it's docs, not just any defaults); `defaults/` is shorter. Pick one before the rename sweep starts so all the docs / skills updates use the same name. *Working assumption: `default-docs/`.*
2. **Was "4 nav bar items" meant as 4 or 5?** List contains 5 (homepage, docs, issues, blogs, user-guide). *Working assumption: 5.*
3. **Stay as one subtask or split into smaller ones?** Currently captured here as a single subtask with a 7-item checklist. Splitting (e.g., `01_root-alias`, `02_defaults-rename`, `03_template-scaffold`, `04_init-wiring`, `05_docs-sweep`) would make each unit shippable on its own and easier to review; bundling keeps the dependency story visible in one place. User's call.

## Out of scope for this subtask

- Broader system-vs-user alias policy doc (could become a `notes/` file if useful later).
- `@root`-in-CLI-tool-mode behaviour gets re-tested when Method 2 lands (project root in that mode is the docs folder, not the repo) — until then, in-repo behaviour is the only thing to verify.
- CLI flag wiring for `init` (currently just a slash command; CLI integration arrives with Method 1).
