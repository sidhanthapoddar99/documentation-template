---
name: docs-guide
description: >
  IMPORTANT: This skill defines how documentation is structured and written in this project.
  Always use this skill when the user references any docs folder/path or asks anything about documentation.

  Trigger on ANY of these:
  - User references a docs path (@docs/, docs/data/, etc.) with any question
  - Questions about docs: "what is this", "tell me about", "explain", "summarize", "entails", "contains", "overview"
  - Exploring/analyzing doc structure or content
  - Creating, modifying, or organizing documentation files
  - Questions about frontmatter, markdown conventions, folder structure, settings.json
  - How to write documentation for this project

  When in doubt about a docs-related question, USE THIS SKILL.
argument-hint: "[path] [action] - e.g., 'docs/data/ overview', 'docs/ create section', 'frontmatter help'"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mkdir *), Bash(node *)
---

# Documentation Writing & Navigation Guide

You are helping the user write and navigate documentation files. This guide covers the **docs content type only** (not blogs or custom pages).

## How to Use This Skill

### Step 1: Choose Your Approach

**Match the task type to the right tool:**

| Task Type | Best Approach | Why |
|-----------|---------------|-----|
| **Understand / Explore** | | |
| "What docs exist?" / "Overview" | Run scan script | Need full picture of structure |
| "Understand this folder" | Scan + read a few files | Get structure + content context |
| "Find X" / "Where is Y mentioned" | Use `Grep` directly | Faster than scanning everything |
| "Read specific file" | Use `Read` directly | You already know the path |
| **Create / Structure** | | |
| "Create new folder/section" | Scan → `mkdir` → create `settings.json` | See existing structure first |
| "Create new page" | Scan → create with `XX_` prefix | Need to know next available prefix |
| "How to structure docs" | Read [workflows.md](./workflows.md) | Has step-by-step patterns |
| "Add nested subsection" | Scan parent → create subfolder + settings.json | Match existing hierarchy |
| **Edit / Modify** | | |
| "Edit existing file" | `Read` → `Edit` directly | No scan needed |
| "Rename/reorder pages" | Scan → rename with new `XX_` prefix | See current ordering |
| "Move files between folders" | Scan both folders → move + update prefixes | Understand both structures |
| **Reference / Rules** | | |
| "Frontmatter options" | Read [frontmatter.md](./frontmatter.md) | Rules don't change |
| "Folder settings.json" | Read [folder-settings.md](./folder-settings.md) | Rules don't change |
| "Markdown syntax" | Read [markdown-reference.md](./markdown-reference.md) | Rules don't change |

**Scan script (use selectively, not always):**

```bash
node .claude/skills/docs-guide/scripts/scan-docs.js <docs-path>
```

This outputs:
- Project structure (folders, files, settings.json labels)
- Frontmatter summary (title, description for each file)
- Statistics (total files, missing frontmatter, drafts)

**When to skip the scan:**
- You already know the file path → just `Read` it
- Looking for specific content → use `Grep` instead
- Following up on previous work → you have context already

### Step 2: Handle the Request

Based on `$ARGUMENTS`, read the appropriate reference file:

| User Wants | Read This File | Then Do |
|------------|----------------|---------|
| **"overview"** / **"explore"** / **"what is this"** / **"analyze"** | (run script first) | Run scan script, explain folder purpose, summarize content areas, describe conventions used |
| **"create section"** | [workflows.md](./workflows.md) | Guide through section creation step-by-step |
| **"create page"** | [workflows.md](./workflows.md) | Help create page with proper frontmatter |
| **"frontmatter"** | [frontmatter.md](./frontmatter.md) | Explain all frontmatter options with examples |
| **"settings"** | [folder-settings.md](./folder-settings.md) | Explain `settings.json` configuration |
| **"markdown"** | [markdown-reference.md](./markdown-reference.md) | Show syntax, code blocks, links |
| **"assets"** | [markdown-reference.md](./markdown-reference.md) | Explain `[[path]]` embedding syntax |
| **"tags"** | [markdown-reference.md](./markdown-reference.md) | Show callouts, tabs, collapsible usage |
| **"structure"** | (use Core Rules below) | Explain `XX_` prefix rule |
| **"scan"** / **"list"** | (run script only) | Show project structure and frontmatter |
| **No argument** | (run script, then ask) | Get context, give overview, ask what they need |

### Reference Files Summary

| File | Contains | Read When |
|------|----------|-----------|
| [frontmatter.md](./frontmatter.md) | YAML fields: title, description, sidebar_label, draft, tags | User asks about page metadata |
| [folder-settings.md](./folder-settings.md) | settings.json: label, isCollapsible, collapsed | User asks about sidebar sections |
| [markdown-reference.md](./markdown-reference.md) | Syntax, `[[path]]` embedding, callouts/tabs/collapsible | User asks about writing content |
| [workflows.md](./workflows.md) | Step-by-step: create section, create page, add assets, reorder | User wants to create or modify docs |

### Script Reference

| Script | Purpose | Run When |
|--------|---------|----------|
| `scripts/scan-docs.js <path>` | Get structure + frontmatter of docs directory | Always run first to get context |

## Core Rules

### The `XX_` Prefix Rule

**Every doc file and folder MUST start with a two-digit prefix (01-99):**

```
docs-root/
├── 01_getting-started/
│   ├── settings.json
│   ├── 01_overview.md
│   └── 02_installation.md
├── 02_guides/
│   ├── settings.json
│   └── 01_basics.md
```

| Rule | Example | Result |
|------|---------|--------|
| Prefix required | `01_overview.md` | Determines sidebar order |
| Folders need prefix | `01_getting-started/` | Organizes sections |
| Position = order | `01_` before `02_` | Lower numbers first |
| Clean URLs | `01_overview.md` | URL becomes `/overview` |

**Exceptions (no prefix needed):**
- `settings.json` - folder configuration
- `assets/` - asset folder

## Quick Start Checklist

To create documentation, you need:

1. A folder with `XX_` prefix (e.g., `01_getting-started/`)
2. A `settings.json` in that folder with a `label`
3. Markdown files with `XX_` prefix (e.g., `01_overview.md`)
4. Frontmatter with at least a `title` field

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Page not showing in sidebar | Check file has `XX_` prefix |
| Section not appearing | Add `settings.json` with `label` field |
| Wrong sidebar order | Rename with correct `XX_` prefix |
| Assets not embedding | Use `[[./assets/file.ext]]` inside code block |
| Frontmatter not parsed | Ensure `---` delimiters are on their own lines |
| H1 not matching title | Keep frontmatter `title` and `# Heading` consistent |

## Best Practices

1. **Use descriptive names** - `01_getting-started.md` not `01_gs.md`
2. **Keep names lowercase** - Use hyphens for spaces
3. **Leave number gaps** - 01, 05, 10 allows easy insertions
4. **One H1 per page** - Match your frontmatter title
5. **Don't skip heading levels** - H2 → H3, not H2 → H4
