---
author: claude
date: 2026-04-26
---

# Closing — superseded by `2026-04-26-framework-as-cli-tool/subtasks/04_method-3-docker.md`

This issue's content (Docker, nginx topologies, global URL prefix, static build output, deployment skill) has been folded into the new CLI-tool issue as **Method 3 — Docker**. The reframing reason: deployment isn't a separate concern from running the framework; it's one of the three convergent ways to use it (alongside Method 1 CLI and Method 2 from-source). Treating it as part of the same distribution story keeps the user-facing model consistent.

## Where things live now

- **Comprehensive design** → `2026-04-26-framework-as-cli-tool/notes/01_docker-deployment-design.md`. Covers the two roles Docker plays (running vs deploying), all four hosting topologies (subpath single-nginx, subpath multi-nginx, subdomain, standalone), multi-stage Dockerfile pattern, docker-compose shapes per topology, nginx config snippets, volume mount strategy, mode-to-container mapping, and what the skill produces.
- **Work checklist** → `2026-04-26-framework-as-cli-tool/subtasks/04_method-3-docker.md`. Holds the TODOs (framework prerequisites, deployment skill, documentation, verification) and points at the note for the design.

## Per-subtask migration map

- **`01_global-url-prefix`** — fully transferred. Listed as a framework prerequisite under subtask `04_method-3-docker.md` (required for Topologies A/B subpath deployments). Detailed in the note's "Global URL prefix" section.
- **`02_deployment-skill`** — fully transferred and expanded. The skill design (prompts, generated artifacts, hosting topologies, verification checklist) is covered in detail in the note. The work item is in the new subtask. The "content-type creation skills" portion is dropped — already covered by the existing `documentation-guide` plugin.
- **`03_static-build-output`** — fully transferred. Listed as a framework prerequisite under subtask `04_method-3-docker.md`. Detailed in the note's "Static build output requirements" section.

## Dropped (explicitly out of scope)

- **Platform-specific deployment guides** (Vercel, Netlify, GitHub Pages, Cloudflare Pages) — these were in this issue's `issue.md` task list but never made it into a subtask. Reasoning for dropping: each is a "take the static `dist/` and upload it to X" recipe, downstream of the framework, not Method-3-specific. Writing four of them at once is high-cost / low-value. Could be filed as a separate issue if demand surfaces.
- **CI/CD templates** (GitHub Actions, GitLab CI workflow files) — same reasoning. Filed separately if needed.

## Status

Marking this issue as `cancelled`. All actionable content is preserved in the new home. Audit trail stays intact via the issue references in the note's frontmatter and the migration map above.
