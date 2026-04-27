---
author: sidhantha
date: 2026-04-27
---

## Consumer-mode refactor — checkpoint

The first slab of this issue (subtask `01_root-alias`) ended up dragging in a much larger reframe than originally scoped. Capturing here so subsequent subtasks (Method 1/2/3, wrapper absorption) inherit the new mental model rather than the old one.

### What changed at the framework layer

- **`@root` system alias landed** — resolves to the *framework folder* (parent of `astro-doc-code/`, where `.env` and `default-docs/` live), with a path-traversal guard. Reserved key, never user-declarable. Also accepted inside `site.yaml → paths:` values (only `@root`, no other aliases — keeps declaration order unambiguous). See `alias.ts:115` + `paths.ts:208`.
- **`dynamic_data/` → `default-docs/`** — single mechanical sweep across 57 files (CLAUDE, README, all user-guide + dev-docs pages, plugin SKILL + 5 references, plugin commands, all 8 plugin `.mjs` scripts). Tracker history excluded so old issues stay factually accurate.
- **Two operating modes formalised** — *consumer mode* (framework as subfolder of user's project, `CONFIG_DIR=../config`) is now the **default**; *dogfood mode* (this repo) is the alternative. Same code path, only `CONFIG_DIR` differs. Vite 6 SSR module-isolation bug surfaced during template testing — fixed by propagating env to `process.env` in `astro.config.mjs` before SSR loads `paths.ts` in its isolated context.
- **No silent path fallbacks** — removed the hardcoded `default-docs/config` early fallback in `paths.ts`; throws cleanly if `.env` / `CONFIG_DIR` is missing. Same principle now governs the plugin scripts.
- **`./start clean`** — wipes `.astro/`, `dist/`, `node_modules/.vite/` (cache invalidation needed when the rename was tested).

### What changed at the template layer

- **`astro-doc-code/template/`** — copyable starter: 5 nav items (Home/Docs/Issues/Blog/User Guide), `theme_paths` includes `@root/default-docs/themes` so framework-bundled themes work out of the box, user-guide section reachable via a `default_docs: \"@root/default-docs/data\"` user-alias (so the framework's bundled docs are available in any consumer site). Verified end-to-end: 89 pages built clean from the template config.

### What changed at the plugin layer (v0.1.2)

- **Shared `scripts/_env.mjs`** — walks up to find the framework's `.env`, parses it, derives `contentRoot = parent(CONFIG_DIR)`. All scripts (`issues/_lib.mjs`, `blog/check.mjs`, `config/check.mjs`) now consume this. **Allows `DOCS_PROJECT_ROOT` env override** for explicit pointing. Throws on missing `.env`/`CONFIG_DIR` — no silent fallback.
- **Skill prose made mode-agnostic** — SKILL.md + all 5 references (`writing`, `docs-layout`, `blog-layout`, `issue-layout`, `settings-layout`) stripped of hardcoded `default-docs/` prefixes for consumer content. Paths now read \`data/<X>\`, \`themes/<name>/\`, \`assets/\`, \`config/\` — script resolution does the actual mode-aware lookup. Cross-references to the *framework's bundled* user-guide rewritten as \`@root/default-docs/data/user-guide/...\` so they're explicit about pointing at the framework folder regardless of mode.
- **Plugin README + plugin.json description** updated for consumer-mode framing.
- `/docs-init` and `/docs-add-section` already had legacy fallback logic; left as-is.

### What's left in this issue

Subtask `01_root-alias` is in **review** (top three checkboxes done; bottom two — `/docs-init` rewrite to use the new template, and a new user-guide page documenting the template + init flow — deferred for the user-led review pass; can split if they grow).

The other four subtasks (Method 1 CLI binary, Method 2 manual clone, Method 3 Docker, absorbing the 11 shell wrappers into the binary) inherit:
- the renamed `default-docs/` everywhere,
- `@root` as the canonical "framework folder" handle,
- consumer-mode as the assumed install shape (Method 2 = "clone framework into a subfolder, point `.env` at sibling content"; Method 1 = same shape but bootstrapped by a binary; Method 3 = same shape but containerised).

Treat this comment as the new starting baseline before reading old subtask specs — anything in those that still says "edit `default-docs/` to add your content" is stale.
