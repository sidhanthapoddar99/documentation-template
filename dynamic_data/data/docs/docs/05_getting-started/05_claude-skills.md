---
title: Claude Skills
description: AI-powered skills for writing and configuring documentation
---

# Claude Skills

This template includes two Claude Code skills that help you write and configure documentation using AI assistance.

## Available Skills

### docs-guide

Helps you **write documentation content**.

**Use when:**
- Creating new markdown files or sections
- Writing frontmatter (title, description, tags)
- Configuring folder `settings.json`
- Understanding markdown syntax and custom tags
- Embedding assets in documentation

**Example prompts:**
- "Create a new getting started guide"
- "What frontmatter fields are available?"
- "How do I add a collapsible section?"

### docs-settings

Helps you **configure documentation sites**.

**Use when:**
- Setting up a new documentation site from scratch
- Editing `site.yaml`, `navbar.yaml`, or `footer.yaml`
- Configuring environment variables (`.env`)
- Adding new pages or sections to the site
- Understanding path aliases (`@data`, `@assets`, etc.)

**Example prompts:**
- "Set up a new docs site for my project"
- "Add a new documentation section called API Reference"
- "Configure the navbar with a dropdown menu"

## Quick Reference

| Skill | Command | Purpose |
|-------|---------|---------|
| docs-guide | `/docs-guide` | Write documentation content |
| docs-settings | `/docs-settings` | Configure site settings |

## Installation

Install via one-liner (see [Installation](/docs/final-docs/getting-started/installation#claude-code-skills-optional)):

```bash
curl -fsSL https://raw.githubusercontent.com/sidhanthapoddar99/documentation-template/main/download-skills.sh | bash -s -- --dest ./.claude
```

Then add to `.claude/settings.local.json`:

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

## When to Use Which Skill

| Task | Skill |
|------|-------|
| Write a new doc page | docs-guide |
| Add frontmatter to a file | docs-guide |
| Configure sidebar labels | docs-guide |
| Edit site.yaml | docs-settings |
| Add a new navbar item | docs-settings |
| Set up .env file | docs-settings |
| Create project from scratch | docs-settings |
