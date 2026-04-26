---
title: Overview
description: AI-native documentation framework with a built-in issues tracker for solo builders and small teams.
---

# Overview

A documentation framework built for **the new world of software** — where one person, or a handful, ships alongside an AI agent instead of a PM, a scrum master, and a quarterly roadmap.

## Purpose

This is two things stitched together, intentionally:

1. **A memory system for AI.** The whole framework is shaped so Claude — or any coding agent — can read, write, and navigate your docs as its long-term memory of the project. Conventions, decisions, architecture, past bugs. Predictable folder layout, `XX_` numeric ordering, machine-readable frontmatter, and a built-in live editor mean an agent can pick up context on a cold start and keep adding to it as the work moves.
2. **An issues tracker designed for 1-person unicorns and 1–5-person teams.** No sprints, no planning poker, no ceremony. Each issue is a folder in your repo with subtasks, notes, and an agent-log — all markdown, all human-readable, all AI-writable. The tracker *is* the workflow.

Together they support the working model that's actually emerging: **AI + small team development.** One person (or a small group) with an agent replaces what used to need a full team. Docs that the agent reads, issues that the agent writes to — no overhead, full context every turn.

## Separation of Concerns

Your content lives completely separate from the framework code. You edit `dynamic_data/` at the repo root; the framework lives in its own subfolder (`astro-doc-code/`) that you don't have to touch:

```
project/
├── dynamic_data/        # YOUR STUFF - edit freely
│   ├── config/          # Site configuration
│   ├── assets/          # Static assets (logos, images)
│   ├── data/            # Content (docs, blog, issues, custom pages)
│   └── themes/          # Custom themes (optional)
│
├── start                # Wrapper script — run ./start from the repo root
│
└── astro-doc-code/      # FRAMEWORK - don't touch
    ├── src/             # Layouts, loaders, parsers, dev-tools
    ├── astro.config.mjs
    ├── package.json
    └── node_modules/
```

## Key Features

| Feature | Description |
|---------|-------------|
| **Zero Config Routing** | Folder structure = URL structure |
| **Content Types** | Docs, blogs, issues, custom pages — each with its own layout family |
| **Issues Tracker** | Folder-per-issue, subtasks + notes + agent-log, AI-writable end-to-end |
| **Live Editor** | In-browser multi-user editing over Yjs CRDT, real-time preview |
| **Modular Layouts** | Pick a style per content type; override with your own |
| **Theme System** | YAML token contract — primitive + semantic tiers, no invented names |
| **Auto Sidebar** | Generated from file positions via `XX_` prefixes |

## How It Works

1. **Define pages** in `config/site.yaml`.
2. **Write content** in `data/` as Markdown files — or let an agent do it.
3. **Customize theme** in `themes/` (optional).
4. **Build** and deploy anywhere.

## Quick Example

Create a doc at `data/docs/getting-started/01_hello.md`:

```md
---
title: Hello World
description: My first doc
---

# Hello World

Welcome to my documentation!
```

It automatically appears at `/docs/getting-started/hello` in the sidebar.

## What's Next?

1. **[Installation](/user-guide/getting-started/installation)** — set up your project
2. **[Configuration](/user-guide/configuration/overview)** — configure your site
3. **[Data Structure](/user-guide/getting-started/structure/overview)** — understand the `dynamic_data/` layout
