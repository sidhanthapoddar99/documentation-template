---
author: claude
date: 2026-04-26
---

# Closing — superseded by `2026-04-26-framework-as-cli-tool`

The npm-package distribution direction was rejected in a follow-up discussion (see `2026-04-26-framework-as-cli-tool/agent-log/001_distribution-brainstorm.md` for the full reasoning). The replacement direction: distribute the framework as a standalone CLI tool (Go binary, `curl | sh` installable, `docs.yaml` compose-style config), with consumers running it against a separate docs folder.

Comment 001 (`framework-extraction-step1`) documenting today's `astro-doc-code/` move is **still valid** — the framework / project-content split is foundational regardless of distribution shape, and the CLI tool builds on it directly.

## What to cherry-pick into the cli-tool issue

The architectural subtasks here contain work that's still needed for the new direction:

- **`02_path-and-config-externalization`** — fully transferable. Still needs to happen (already partially done with today's `frameworkRoot` / `projectRoot` split). Move into the cli-tool issue as a subtask.
- **`04_dev-tools-split-decision`** — fully transferable. Same question (does the editor ship with the framework or not) regardless of distribution shape; cross-references `2026-04-26-editor-as-standalone-product`.
- **`01_package-boundary-design`** — partially transferable. Reframe as 'what's in the framework cache vs the consumer's docs folder' — the boundary still matters; the answers shift slightly.
- **`03_astro-integration-packaging`** — partially transferable. The integration-boundary thinking transfers; the specific 'consumer adds an Astro integration to their config' doesn't apply to the CLI model.
- **`06_migration-playbook-for-existing-projects`** — partially transferable. Still needed; target shape changes from 'thin npm shell' to 'docs folder + CLI.'

## Obsolete (drop)

- **`05_build-and-publish-pipeline`** — npm publishing replaced by Go binary distribution + `curl | sh` installer + git-tag-based version manifest. No longer relevant in its current form.

## Status

Marking this issue as cancelled. Cherry-picking happens in 2026-04-26-framework-as-cli-tool as the relevant subtasks get filed there. This issue stays as a reference until the cherry-picking is complete; once subtasks are migrated, it can be archived without losing the audit trail.
