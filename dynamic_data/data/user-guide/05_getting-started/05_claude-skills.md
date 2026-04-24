---
title: Claude Skills
description: AI-powered skill for writing, configuring, and operating documentation projects with Claude Code.
---

# Claude Skills

This template ships with a **Claude Code skill** — a packaged prompt that teaches Claude how to work inside this project without you having to explain the conventions every time.

A skill is invoked with its slash-command (e.g. `/documentation-guide`) or automatically triggered when you describe matching work.

## Skill catalogue

| Skill | Command | Use for | Triggers on |
|---|---|---|---|
| `documentation-guide` | `/documentation-guide` | Everything in this project — writing content, configuring the site, running the issue tracker | Editing markdown / frontmatter / `settings.json`, writing blog posts, configuring `site.yaml` / `navbar.yaml` / `footer.yaml` / `.env`, creating or updating issues, adding pages or sections |

That's it — one skill covers the whole framework. It loads the right reference internally based on the task, so you don't have to choose between sub-skills.

### What's inside

The skill is organised by **domain references** that Claude pulls in on demand:

| Reference | Covers |
|---|---|
| `references/writing.md` | Markdown basics, frontmatter, custom tags, asset embedding |
| `references/docs-layout.md` | Docs folder structure, `XX_` prefixes, per-folder `settings.json`, sidebar generation |
| `references/blog-layout.md` | Blog file naming (`YYYY-MM-DD-<slug>.md`), tags, index behaviour |
| `references/issue-layout.md` | Issue tracker — folder-per-item, vocabulary, 4-state lifecycle, AI rules |
| `references/settings-layout.md` | `site.yaml`, `navbar.yaml`, `footer.yaml`, `.env`, path aliases, themes |

It also bundles **helper scripts** under `scripts/{issues,docs,blog,config}/` for listing issues, querying subtasks, validating frontmatter, and linting config files. Claude runs them with `bun` (preferred) or falls back to `node`.

## When to reach for it

You almost always just type `/documentation-guide` or describe the task in natural language. The skill internally chooses which reference to load.

| Task | Reference loaded |
|---|---|
| Write a new doc page | `writing` + `docs-layout` |
| Add / change frontmatter | `writing` |
| Configure sidebar labels (`settings.json`) | `docs-layout` |
| Add a custom tag / callout | `writing` |
| Write or edit a blog post | `writing` + `blog-layout` |
| Create or update an issue / subtask | `issue-layout` |
| Edit `site.yaml` | `settings-layout` |
| Add a new navbar item | `settings-layout` |
| Set up `.env` | `settings-layout` |
| Create a project from scratch | `settings-layout` (then `writing` for the first page) |

## Installation

Install via one-liner — pick one of the three:

**curl (Linux / macOS):**

```bash
curl -fsSL https://raw.githubusercontent.com/sidhanthapoddar99/documentation-template/main/download-skills.sh | bash -s -- --dest ./.claude
```

**wget:**

```bash
wget -qO- https://raw.githubusercontent.com/sidhanthapoddar99/documentation-template/main/download-skills.sh | bash -s -- --dest ./.claude
```

**Node (cross-platform):**

```bash
curl -fsSL https://raw.githubusercontent.com/sidhanthapoddar99/documentation-template/main/download-skills.mjs -o /tmp/download-skills.mjs && node /tmp/download-skills.mjs --dest ./.claude
```

Then add skill permissions to `.claude/settings.local.json` so Claude Code can invoke the skill without prompting:

```json
{
  "permissions": {
    "allow": [
      "Skill(documentation-guide)"
    ]
  }
}
```

## Example prompts

### Writing & docs

- "Create a new getting-started guide for the deployment feature."
- "What frontmatter fields are available on a doc page?"
- "How do I add a collapsible section?"
- "Embed this Python file into the installation doc."

### Blog

- "Draft a release-notes post for v0.4."
- "What's the file naming convention for blog posts?"

### Issue tracker

- "List all open issues with priority high."
- "Add a comment to the claude-skills issue summarising today's testing."
- "Move issue 2025-06-25-claude-skills to review and add an agent log."
- "Show me the open subtasks for the editor-v2 issue."

### Site configuration

- "Set up a new docs site for my project."
- "Add a new documentation section called API Reference."
- "Configure the navbar with a dropdown menu."
- "Add a second data directory for shared content."

## Why one skill, not five?

Earlier drafts split this into separate skills (`docs-guide`, `docs-settings`, `blog`, `issues`, `writing`). Validation testing across 22 agent runs showed the umbrella skill is **30% faster** in real-world multi-task usage with **100% correctness**, because the per-task loading cost amortises across the conversation. The single-skill design also removes the cognitive overhead of picking which slash-command to type.

If a future release adds something genuinely orthogonal (custom themes, custom Astro components), it may ship as its own skill — the catalogue above is kept in sync with whatever is actually installed.
