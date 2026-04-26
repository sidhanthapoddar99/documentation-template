## Goal

Rename and reposition the project. Current framing — "documentation-template, an Astro-based docs framework" — has become too narrow for what's actually being built. Reframe as a **knowledge + task system designed and fine-tuned for AI consumers**, with human-readable docs as one of several first-class outputs.

The rename also unblocks naming decisions downstream (CLI binary name, install URL, plugin namespace, marketplace listing, skill names, package metadata) that are currently held with placeholders.

## Proposed name

`neura-knowledge-system` — placeholder; not locked. The naming requirements:

- Captures the "knowledge + task" duality (docs + issues tracker + structured content for AI to read AND contribute to)
- Signals the AI-first design intent (the CLI wrappers, the issues schema, the plugin, the validators are all built for AI agents to use)
- Survives engine changes — should not couple to "Astro" or any specific tech stack
- Works as a CLI binary name (short-ish, lowercased, no shell-conflict risk)
- Works as an OSS project name and/or a company-aligned product name (decide which)

Open question: brand alignment with `neuralabs.org`. Pulling under the company brand makes sense if this is a company product; less so if it's meant to be community-OSS. Worth making the call before locking the name.

## Why this isn't a bikeshed

The features being built are no longer well-described by "documentation":

- **AI-first issue tracker** — `docs-list`, `docs-show`, `docs-add-comment`, `docs-set-state` etc. are CLI surfaces designed for AI agents (Claude Code) to consume the schema, not for humans browsing
- **Plugin / skill ecosystem** — the `documentation-guide` plugin teaches AI how to work in the project; the structure (skills + references + bin wrappers) is AI-shaped
- **Editor extraction** (per `2026-04-26-editor-as-standalone-product`) — heading toward a CRDT editor that serves human + AI authors equally
- **CLI tool distribution** (per `2026-04-26-framework-as-cli-tool`) — positions this as standalone infrastructure, not a docs library

The project IS becoming a knowledge system; the name should match. The cost of waiting is every naming-locked decision (binary name, install domain, plugin namespace) accumulating placeholders that all need a renaming sweep later.

## What changes

High-level scope, to be expanded into subtasks:

1. **Repo + project name** — rename the GitHub repo, the npm/package name (if it ever becomes one), the directory name in fresh clones, the marketplace listing
2. **Plugin namespace** — `documentation-guide` → `<new-name>-guide` or similar; affects `.claude-plugin/marketplace.json`, `plugins/` folder, plugin.json metadata
3. **CLI wrapper names** — `docs-list` → `<prefix>-list` (or `nks-list` if `nks` is the chosen prefix); affects `plugins/<name>/bin/`, all skill-reference docs
4. **Skill names** — `documentation-guide` skill → `<new-name>-guide` skill
5. **Slash commands** — `/docs-init`, `/docs-add-section` → updated prefixes
6. **Docs sweep** — every reference to "documentation-template" / "docs framework" in user-guide, dev-docs, CLAUDE.md, README, plugin references, in-code error messages, comments
7. **Install / domain** — when CLI tool ships (`2026-04-26-framework-as-cli-tool`), `https://<domain>/install.sh` needs a stable domain that matches the brand
8. **CLI binary name** — placeholder `astro-doc` becomes the real name
9. **Tracker conventions** — issue IDs (currently `YYYY-MM-DD-<slug>`) and tracker schema (vocabulary, components) — decide if any naming there changes too

## What does NOT change

Important to be explicit, so the rebrand doesn't expand scope:

- The actual **feature set** stays. This isn't a pivot; it's a relabel of what already exists.
- The `XX_` prefix convention, `settings.json` schema, frontmatter rules, theme contract, plugin architecture — all unchanged. Same code, new name.
- The Astro engine choice — unchanged. The new name shouldn't imply we've moved off Astro; it just shouldn't *brand* on Astro either.

## Strategic note — sequencing

This issue is a **prerequisite for naming decisions** but not a prerequisite for *all* downstream work:

- Blocks: anything that bakes the name into a published artifact — CLI binary, install URL, plugin namespace if/when republished, marketplace listing
- Does NOT block: feature work, refactors, doc improvements that don't reference the project name centrally, the `astro-doc-code/` folder rename (already done)

Implementation order suggestion: lock the name first (one-paragraph subtask, asynchronously), then run the rename sweeps in parallel (subtasks per surface — code, docs, plugin, CLI wrappers).

## Subtasks

To be filed once the name is locked. Likely shape:

- `01_lock-name.md` — discussion + decision; produces the canonical name + the CLI prefix (e.g., `nks-` for wrappers)
- `02_repo-and-package-rename.md` — GitHub repo, package metadata
- `03_plugin-and-skill-rename.md` — plugin namespace, skill names, slash commands, CLI wrappers
- `04_docs-sweep.md` — user-guide, dev-docs, CLAUDE.md, README, in-code messages
- `05_marketplace-and-install-domain.md` — marketplace listing, install URL/domain registration

## Open questions

1. **Final name.** `neura-knowledge-system` is the proposal. Alternatives worth a pass: `neura-kb`, `neura-docs`, something fully detached from `neura`. Decide with brand alignment in mind.
2. **Brand alignment with neuralabs.** Is this a community-OSS project or a neuralabs product? Affects whether the `neura-` prefix makes sense.
3. **CLI prefix.** Long names = ugly wrappers. `neura-knowledge-system-list` is unusable. Likely need a short alias prefix (`nks-`, `nk-`, `nks `, etc.). Decide alongside the name.
4. **Backwards compatibility for existing installs.** If anyone (including this repo, dogfooding) has the old plugin marketplace install, do we provide a transition path or hard-cut?
