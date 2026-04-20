---
title: Claude Skills
description: AI-powered skills for writing and configuring documentation with Claude Code.
---

# Claude Skills

This template ships with a set of **Claude Code skills** — packaged prompts that teach Claude how to work inside this project without you having to explain the conventions every time.

A skill is invoked with its slash-command (e.g. `/docs-guide`) or automatically triggered when you describe matching work.

## Skill catalogue

| Skill | Command | Use for | Triggers on |
|---|---|---|---|
| `docs-guide` | `/docs-guide` | Writing documentation content | Creating / editing markdown files, frontmatter, `settings.json`, custom tags, asset embedding |
| `docs-settings` | `/docs-settings` | Configuring the site itself | Editing `site.yaml` / `navbar.yaml` / `footer.yaml` / `.env`, adding new pages or sections, path aliases, initial setup |

That's the full set today. This page is kept **in sync** with the installed skills — if it looks out of date, see the [phase-2 docs-update issue](/todo/2026-04-19-docs-phase-2) which tracks skill additions.

## When to reach for which

A rough decision tree:

- **"I want to write, edit, or organise markdown"** → `/docs-guide`
- **"I want to change how the site is configured"** → `/docs-settings`
- If both apply (e.g. adding a new section and writing its first page), start with `/docs-settings` to register the section, then `/docs-guide` for the content.

| Task | Skill |
|---|---|
| Write a new doc page | `docs-guide` |
| Add / change frontmatter | `docs-guide` |
| Configure sidebar labels (`settings.json`) | `docs-guide` |
| Add a custom tag / callout | `docs-guide` |
| Edit `site.yaml` | `docs-settings` |
| Add a new navbar item | `docs-settings` |
| Set up `.env` | `docs-settings` |
| Create a project from scratch | `docs-settings` |

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

Then add skill permissions to `.claude/settings.local.json` so Claude Code can invoke them without prompting:

```json
{
  "permissions": {
    "allow": [
      "Skill(docs-guide)",
      "Skill(docs-settings)"
    ]
  }
}
```

## Example prompts

### `docs-guide`

- "Create a new getting-started guide for the deployment feature."
- "What frontmatter fields are available on a doc page?"
- "How do I add a collapsible section?"
- "Embed this Python file into the installation doc."

### `docs-settings`

- "Set up a new docs site for my project."
- "Add a new documentation section called API Reference."
- "Configure the navbar with a dropdown menu."
- "Add a second data directory for shared content."

## When new skills ship

The catalogue above is authoritative. If additional skills land in a release (e.g. an `issues` skill for the issue tracker), they're added here with the same four columns — **Skill / Command / Use for / Triggers on**. The phase-2 docs-update issue owns that sweep.
