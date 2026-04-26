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

The framework's source code lives in the `astro-doc-code/` subfolder. The repo root ships a `./start` wrapper that handles dependency install, build sanity check, and dev launch in one go — you usually don't have to `cd` into `astro-doc-code/` yourself.

First-run bootstrap (does install + build + dev):

```bash
./start
```

The wrapper detects `bun` (falling back to `npm` if Bun isn't installed), runs `bun install` if `node_modules/` is missing, runs a build sanity check, then launches the dev server. After the first run you can skip the preflight by passing the script name explicitly (see [Available Commands](#available-commands) below).

If you'd rather drive `bun`/`npm` directly, `cd astro-doc-code/` first:

```bash
cd astro-doc-code
bun install     # or: npm install
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
./start dev
```

Open `http://localhost:3088` in your browser. (`./start` with no args also works — it just runs the install-and-build preflight first.)

## Verifying Installation

You should see:
- Homepage with hero section
- Navigation with Docs and Blog links
- Sample documentation in the sidebar

## Available Commands

Run from the repo root via the `./start` wrapper:

| Command | Description |
|---------|-------------|
| `./start` | Preflight (install + build) then dev — use on a fresh clone |
| `./start dev` | Start dev server with hot reload (skip preflight) |
| `./start build` | Build production site to `dist/` (skip preflight) |
| `./start preview` | Preview production build locally (skip preflight) |
| `./start <script>` | Forward any other `package.json` script |

The dev server, build output, and preview all run inside `astro-doc-code/`. If you're already `cd`'d into that folder, the equivalent `bun run dev` / `bun run build` / `bun run preview` work as well.

## Troubleshooting

### Port Already in Use

The server automatically finds an available port. Check terminal output for the actual URL.

### Module Not Found Errors

```bash
# Clear node_modules and reinstall (from the repo root)
rm -rf astro-doc-code/node_modules astro-doc-code/bun.lockb
./start          # re-runs preflight (install + build + dev)
```

### Build Fails

Common causes:
1. Missing `XX_` prefix on doc files (required)
2. Invalid YAML frontmatter
3. Missing `settings.json` in a doc folder

Check the error message for the specific file and line number.

## Next Steps

Continue to [Configuration](/user-guide/configuration/overview) to customize your site.
