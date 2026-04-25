---
title: Installation
description: Set up your documentation site
---

# Installation

Get your documentation site running in under 5 minutes.

## Prerequisites

- **Node.js** 18+ or **Bun** 1.0+
- **Git** for version control
- A code editor (VS Code recommended)

## Step 1: Clone the Repository

```bash
git clone https://github.com/sidhanthapoddar99/documentation-template.git my-docs
cd my-docs
```

## Step 2: Install Dependencies

Using Bun (recommended for speed):

```bash
bun install
```

Or using npm:

```bash
npm install
```

### Claude Code Plugin (Recommended)

Install the `documentation-guide` plugin so Claude Code can help you write content, configure the site, and run the issue tracker. Three commands:

```
/plugin marketplace add https://github.com/sidhanthapoddar99/documentation-template
/plugin install documentation-guide@documentation-template
/reload-plugins
```

This installs:

- A skill that triggers automatically on docs work
- 11 CLI wrappers on `$PATH` (`docs-list`, `docs-show`, `docs-check-section`, …)
- 2 slash commands — `/docs-init` to bootstrap a new project from zero, `/docs-add-section` to add a top-level section to an existing one

For a fresh project that hasn't been scaffolded yet, the easiest entry point is to run `/docs-init` after installing — it walks you through site name + first section and writes everything for you. Skip the rest of this Installation page if you go that route.

For full details (skill internals, wrapper inventory, update flow, scope behaviour), see [Claude Code Plugin](./05_claude-skills.md).

## Step 3: Environment Setup

Create your environment file:

```bash
cp .env.example .env
```

The default `.env` works out of the box:

```env
# Bootstrap: points to the config directory containing site.yaml
CONFIG_DIR=./dynamic_data/config

# Dev server
PORT=3088
HOST=true
```

Directory paths for content, assets, and themes are configured in `site.yaml`'s `paths:` section (see [Site Configuration](/user-guide/configuration/site/overview)).

## Step 4: Start Development

```bash
bun run dev
```

Open `http://localhost:3088` in your browser.

## Verifying Installation

You should see:
- Homepage with hero section
- Navigation with Docs and Blog links
- Sample documentation in the sidebar

## Available Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with hot reload |
| `bun run build` | Build production site to `dist/` |
| `bun run preview` | Preview production build locally |

## Troubleshooting

### Port Already in Use

The server automatically finds an available port. Check terminal output for the actual URL.

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules bun.lockb
bun install
```

### Build Fails

Common causes:
1. Missing `XX_` prefix on doc files (required)
2. Invalid YAML frontmatter
3. Missing `settings.json` in a doc folder

Check the error message for the specific file and line number.

## Next Steps

Continue to [Configuration](/user-guide/configuration/overview) to customize your site.
