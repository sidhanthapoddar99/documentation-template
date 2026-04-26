## Goal

Split the live editor out of the Astro docs framework into its own standalone product. The docs framework's job is *rendering* a published site; the editor's job is *authoring* content. They share a content directory but have nothing else in common — the current coupling is incidental, not architectural.

After the split, the framework becomes a pure renderer (Astro consumes `dynamic_data/`, builds HTML). The editor becomes its own thing: a Rust core that does the real work (CRDT sync, file I/O, presence, search), exposed through three surfaces — a headless server binary, a Tauri desktop app, and a web frontend. Any of them can author into the same `dynamic_data/` layout the renderer reads.

## Why split

- **The editor doesn't depend on Astro** — it's CodeMirror 6 + Yjs CRDT + a file-system server. Astro just happens to be the host today.
- **They have different lifecycles** — the docs framework iterates on layouts, themes, content types. The editor iterates on authoring UX, CRDT, multi-user. Bundling them slows both down.
- **Distribution differs** — the framework wants to be an npm package consumed in many docs projects (see `2026-04-25-framework-as-npm-package`). The editor wants to be a downloadable app + optional self-hostable server. Different shapes, different release cadences.
- **Performance ceiling** — the editor's hot paths (file watching, CRDT merges, full-text search, AST parsing on save) are CPU/IO bound. A Rust core gives a meaningfully higher ceiling than Node-in-Astro, even if the current bottleneck is elsewhere.

## Architecture sketch

One Rust core, three surfaces:

| Surface | What it is | Use case |
|---|---|---|
| **Rust core** (library crate) | yrs (Rust Yjs port) for CRDT, file I/O, presence, full-text index, persistence | Library — not shipped directly |
| **Server binary** (headless Rust) | HTTP + WebSocket server wrapping the core | Self-hosted multi-user instance; the "coordinator" |
| **Desktop app** (Tauri) | Rust core + bundled webview running the web frontend | Obsidian-style local-first editor; can also connect to a server for collab |
| **Web frontend** (TS) | Same UI code that runs in Tauri — CM6 + Yjs JS client | Browser users connect to a hosted server; Tauri uses the same bundle |

Live sync everywhere uses the Yjs y-protocols wire format over WebSocket — the same format the JS implementation already speaks today, so the migration is incremental: keep JS clients working while the server flips to Rust.

See `notes/01_tauri-architecture.md` for the deeper sketch (server mode vs editor mode, how Tauri does double duty, why Tauri over Electron).

## What this replaces (eventually)

The current TypeScript editor under `astro-doc-code/src/dev-toolbar/editor-v2/` and the server under `astro-doc-code/src/dev-tools/editor/` would, at the end state, be removed from the framework. The framework would no longer ship an editor at all; users who want one install the standalone editor product separately and point it at their `dynamic_data/` directory.

Until then, the existing editor work (`2026-04-10-editor-core`, `2026-04-10-editor-advanced`, `2026-04-10-editor-navigation-and-layout`, `2026-04-10-editor-diagrams`) continues in the current TS-in-Astro stack. Nothing about this issue blocks them.

## Strategic positioning — read this before starting

This is **not in-flight work**. It's a future direction filed so the conversation isn't lost. The right time to start is:

1. The docs framework has shipped at least one real consumer beyond this repo (validates that the split *should* happen).
2. The editor has obvious user demand beyond "I want this for my docs project."
3. There's a measurable bottleneck in the current TS editor that justifies the language switch (so far there isn't one — Yjs JS is fast; current pain is markdown rendering and file-watching, not the core editor loop).

Starting before any of those is the classic second-system trap: rebuild the working thing in a fancier stack, ship neither.

## Subtasks

- **`01_auth-and-access-control.md`** — absorbed from the deleted `2025-06-25-editor-security` issue. Auth (password / OAuth) and access-code invites become a sub-piece of the standalone editor product, since they only matter once the editor is its own deployable thing.
