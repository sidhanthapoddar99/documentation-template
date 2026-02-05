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

### Claude Code Skills (Optional)

Install AI-powered documentation skills for Claude Code to help you write and configure documentation.

**Using curl (Linux/macOS):**

```bash
curl -fsSL https://raw.githubusercontent.com/sidhanthapoddar99/documentation-template/main/download-skills.sh | bash -s -- --dest ./.claude
```

**Using wget:**

```bash
wget -qO- https://raw.githubusercontent.com/sidhanthapoddar99/documentation-template/main/download-skills.sh | bash -s -- --dest ./.claude
```

**Using Node.js (cross-platform):**

```bash
curl -fsSL https://raw.githubusercontent.com/sidhanthapoddar99/documentation-template/main/download-skills.mjs -o /tmp/download-skills.mjs && node /tmp/download-skills.mjs --dest ./.claude
```

| Skill | Purpose |
|-------|---------|
| `docs-guide` | Writing documentation content (markdown, frontmatter, folder settings) |
| `docs-settings` | Configuring documentation sites (YAML files, .env, project structure) |

After installing, add skill permissions to `.claude/settings.local.json`:

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

## Step 3: Environment Setup

Create your environment file:

```bash
cp .env.example .env
```

The default `.env` works out of the box:

```env
# Points to your content directory
DATA_DIR=./dynamic_data

# Production URL (update for deployment)
SITE_URL=http://localhost:4321
```

## Step 4: Start Development

```bash
bun run dev
```

Open `http://localhost:4321` in your browser.

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
3. Broken imports in MDX files

Check the error message for the specific file and line number.

## Next Steps

Continue to [Configuration](/docs/getting-started/configuration) to customize your site.
