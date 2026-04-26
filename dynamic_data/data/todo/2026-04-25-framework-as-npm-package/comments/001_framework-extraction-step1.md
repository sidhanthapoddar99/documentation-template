---
author: claude
date: 2026-04-26
---

## First concrete step toward npm extraction — repo restructured

Physically separated framework code from user content in preparation for eventual `npm publish`. The repo shape now mirrors the eventual published-package boundary almost exactly.

### Repo restructure

- **Created `astro-doc-code/`** at the repo root and moved all framework files into it: `src/`, `astro.config.mjs`, `package.json`, `bun.lock`, `tsconfig.json` (plus untracked `node_modules/`, `dist/`, `.astro/`).
- **Repo root is now the consumer's view**: `dynamic_data/` (content), `plugins/` (plugin source), `.claude*`, `.env*`, `.mcp.json`, `CLAUDE.md`, `README.md`, and a new `./start` wrapper.

### `./start` wrapper at repo root

Detects `bun` (falls back to `npm`), runs `bun install` if `node_modules` is missing, runs a build sanity check, then launches `bun run dev`. With an explicit arg (`./start dev|build|preview`) it skips preflight and forwards.

### Two surgical source edits — the only code changes needed

- **`astro-doc-code/src/loaders/paths.ts`** — split the previous single `projectRoot` into `projectRoot` (repo root, where `dynamic_data/` lives) and `frameworkRoot` (`astro-doc-code/`, where `src/` lives). User-content paths use the former; framework structural paths (`paths.layouts`, `paths.styles`, etc.) use the latter.
- **`astro-doc-code/astro.config.mjs`** — derives `repoRoot = path.resolve(__dirname, '..')` and uses it for `loadEnv()`, `CONFIG_DIR` / `LAYOUT_EXT_DIR` resolution, and broadens Vite `fs.allow` to the repo root so it can serve `dynamic_data/`. Replaces all prior `process.cwd()` references.

### Verified

`./start build` succeeded — 326 pages in ~10s. No regressions.

## Why this matters for the npm-extraction goal

The shape of the repo after this move matches the eventual published-package boundary almost exactly: `astro-doc-code/` is the publishable unit (`name`, `version`, `dependencies`, all source). The next extraction step is mostly mechanical — `npm publish astro-doc-code/`, then have the consumer's repo `npm install` it and replace the local `astro-doc-code/` folder with a thin `node_modules` reference plus a per-project `astro.config.mjs` shim that re-exports the package config. The `./start` wrapper survives that change largely unchanged.

## Open questions for follow-up subtasks (if not already filed)

- Decide whether the published package wraps Astro entirely (consumer doesn't see Astro at all) or exposes `defineConfig` for advanced users.
- Decide what the consumer's `package.json` looks like after extraction (likely just one dep + one script).
- Plugin source under `plugins/documentation-guide/` is unaffected by the move and stays at repo root — it's already independently distributable via the marketplace.
