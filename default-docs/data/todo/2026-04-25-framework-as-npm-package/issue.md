# Framework as a published npm/bun package

## Why now

The current distribution model is **full-clone-per-project**: each of ~20-30 documentation sites built on this framework holds its own copy of `src/`, `astro.config.mjs`, `package.json`, dev-tools, layouts, parsers, loaders. Updating the framework means touching every repo — pull the new template, resolve conflicts, reinstall. That doesn't scale.

The end-state every comparable framework lands on (Astro Starlight, Docusaurus, VuePress, Nextra) is **engine as an installable package**. The consumer ships only:

```
my-docs/
├── package.json          ← one dep: "documentation-template": "^1.0.0"
├── astro.config.mjs      ← 5 lines: import the integration, add to integrations
├── .env                  ← per-project secrets
└── dynamic_data/         ← content + config (the part that's actually unique)
```

Updates become `bun update documentation-template` per project (or rely on a renovate bot). 30 instances → one engine source of truth.

## Scope of the shift

Two architectural changes drive everything else:

1. **The engine has to stop assuming "we ARE the project."** Today, `paths.ts`, `alias.ts`, `config.ts` resolve paths relative to a hard-coded notion of "the project root is the cwd." Layout discovery via `import.meta.glob('src/layouts/**')` only works when `src/` is co-located with the consumer. To become a library, the engine has to *take the project root as input* — passed in via the Astro integration's options, sourced from cwd or `.env` at boot.

2. **Astro integration boundary.** Instead of the consumer running `astro build` against this whole repo, they import an integration:
   ```js
   // consumer's astro.config.mjs
   import { defineConfig } from 'astro/config';
   import { documentationTemplate } from 'documentation-template/integration';

   export default defineConfig({
     integrations: [documentationTemplate({ dataPath: './dynamic_data' })],
   });
   ```
   The integration registers all the loaders, layouts, dev-tools, and routes at build time.

These are not small refactors. Together they're roughly **1-2 weeks of focused work** by an experienced person.

## Relationship to the plugin marketplace work

This issue is **independent** of `2025-06-25-claude-skills/subtasks/09_plugin-marketplace-dogfood.md` (the Claude Code plugin for the agent skill). The two solve different distribution problems:

| | What it ships | Mechanism | When it earns its complexity |
|---|---|---|---|
| Plugin marketplace (subtask 09 over there) | The agent skill (SKILL.md + references + scripts) | `/plugin install` | 30 projects × 1 skill — already true |
| **This issue** | The framework engine (loaders, parsers, layouts, dev-tools) | `bun add documentation-template` | 30 projects × full-clone updates — already true |

Both should ship eventually. Plugin marketplace is the smaller, lower-risk first move (~3-5 hrs). This is the bigger structural change (~1-2 weeks). They don't block each other.

## Subtask breakdown

See `subtasks/`:

- `01_package-boundary-design.md` — what's *in* the package vs in the consumer; naming, scope decisions
- `02_path-and-config-externalization.md` — refactor `paths.ts` / `alias.ts` / `config.ts` to take project root as input
- `03_astro-integration-packaging.md` — expose the framework as an Astro integration consumers add to their config
- `04_dev-tools-split-decision.md` — does the live editor / Yjs sync / cache inspector / system metrics ship in the package, or split out?
- `05_build-and-publish-pipeline.md` — npm publishing, build/transpile setup, semver policy, dist shape
- `06_migration-playbook-for-existing-projects.md` — how the 30 instances move from full-clone to thin-shell

Order: 01 → 02 + 03 in parallel → 04 (can be early too) → 05 → 06.

## Open questions

- **Package name.** `documentation-template` is descriptive but generic; npm names like `@<scope>/docs-template` or a branded name might be better. Decide in subtask 01.
- **Astro version pinning.** The package should declare a peer dep on Astro; consumers control the Astro version. Pick a min Astro version that supports everything we need.
- **Bun vs npm.** Bun is the project runtime today; npm is the publish registry. The published package should work under both runtimes (no bun-specific APIs in the published code; that's mostly already true).
- **What happens to `dynamic_data/data/user-guide/`** in the package repo itself once the engine is split out? It's the framework's own self-hosted documentation — probably stays in the engine repo as a reference site, distributed as an example consumer.

## References

- `2025-06-25-claude-skills/subtasks/09_plugin-marketplace-dogfood.md` — sibling distribution work for the skill; informs the dogfood pattern but doesn't block this
- Astro integration API docs (consult before subtask 03): https://docs.astro.build/en/reference/integrations-reference/
- Reference frameworks for boundary design: Astro Starlight (`@astrojs/starlight`), Docusaurus, VuePress
