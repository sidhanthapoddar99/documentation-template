---
title: "Tauri architecture — server mode, editor mode, web mode"
description: One Rust core, three deployment surfaces. How Tauri does double duty as desktop shell, why it's not the right choice for the headless server, and how live sync stays unified across all three.
sidebar_label: Tauri Architecture
---

# Tauri architecture — server mode, editor mode, web mode

This note answers the architectural question that surfaced during the issue's discussion: *"When we use Tauri, does it serve as both backend and frontend? Can it run as a server (coordinator) and an editor (Obsidian-like) at the same time?"*

The short answer: **Tauri is a desktop-app framework, not a server framework — but the Rust core that powers a Tauri app can also be packaged as a separate headless server binary.** The shared-core pattern is what gives the project three deployment shapes from one codebase.

## What Tauri actually is

Tauri bundles a Rust backend with the OS's native webview into a single distributable binary (`.dmg`, `.msi`, `.deb`, `.AppImage`). The webview hosts a normal web frontend (HTML/CSS/JS — for us, CodeMirror 6 + Yjs JS client). The Rust side gets first-class native APIs: file I/O, OS integration, background work, IPC with the webview.

What Tauri is *not*: a way to run a long-lived headless service. The Tauri runtime expects a webview window. If you don't want a window, you don't want Tauri — you want a plain Rust binary.

## The shared-core architecture

```
┌─────────────────────────── Rust core (library crate) ───────────────────────────┐
│  yrs (Yjs in Rust)  •  file I/O & watcher  •  presence  •  full-text index     │
│  persistence (sqlite or flat-file)  •  Yjs y-protocols wire format             │
└─────────────────────────────────────────────────────────────────────────────────┘
            │                            │                              │
            ▼                            ▼                              ▼
   ┌────────────────┐          ┌──────────────────┐          ┌───────────────────┐
   │ Server binary  │          │ Desktop app      │          │ Web frontend      │
   │ (headless)     │          │ (Tauri)          │          │ (browser, JS)     │
   │                │          │                  │          │                   │
   │ Rust core +    │          │ Rust core +      │          │ CM6 + Yjs JS      │
   │ HTTP/WS server │          │ webview running  │          │ client; talks to  │
   │ — coordinator  │          │ web frontend     │          │ a server binary   │
   └────────────────┘          └──────────────────┘          └───────────────────┘
            ▲                            │                              │
            │                            │                              │
            └────────────────────────────┴──────────────────────────────┘
                  All speak Yjs y-protocols over WebSocket — one wire
                  format, one sync model, all clients interchangeable
```

### Server binary — the coordinator

A standalone Rust binary that hosts the core over HTTP + WebSocket. No UI, no Tauri, just a service. Runs on a VPS, in a Docker container, or locally for solo use. Handles auth, persistence, multi-user CRDT broadcast. Self-hostable.

This is the analogue of Obsidian Sync, except open-source and you own the box.

### Desktop app — Tauri

A Tauri app bundles the same Rust core (linked as a library) with a webview. The webview runs the **same** web frontend bundle as the browser version — no UI fork. Two operating modes:

- **Local-first**: the app is fully offline, talks to its own embedded core, persists to local disk. Like Obsidian's default mode.
- **Connected**: the app's webview points at a remote server binary's URL instead. Same UI, same Yjs client, just a different sync target. Like opening a shared vault.

### Web frontend — the browser surface

Pure JS/TS + CM6 + `yjs` (the JS reference implementation). Connects to a server binary's WebSocket. Used by anyone who doesn't want to install the desktop app, or for quick edits from any device.

## Why this layout works for "efficient live sync"

Yjs CRDT is the right primitive for this kind of editor. The server binary holds the canonical `Y.Doc`; clients (web, desktop) all run their own `Y.Doc` instances bound to the same shared state. Edits propagate as compact binary updates over WebSocket — typically tens of bytes per keystroke, sub-millisecond merge time, no server-side conflict resolution code (the CRDT handles it).

`yrs` (Rust port of Yjs) speaks the same wire format as `yjs` (JS), which means:

- The server can be Rust while clients stay JS — no protocol break, migration is incremental.
- A web client and a Tauri desktop client can collaborate on the same document in real time without either knowing the other's runtime.
- Existing JS-based Yjs servers (`y-websocket`) are drop-in interoperable, so prototyping starts in JS and migrates to Rust per-component.

## Why Tauri over Electron for the desktop surface

| Concern | Tauri | Electron |
|---|---|---|
| Binary size | 5–15 MB | 100–150 MB |
| Idle RAM | 30–80 MB | 150–300 MB |
| Cold startup | < 1 s | 1–3 s |
| Backend language | Rust (shared with server) | Node (would not share) |
| JS perf in the editor pane | webview engine — comparable | Chromium V8 — comparable |

The decisive factor for this project specifically: the desktop app shares a Rust core with the server binary. Electron forces a Node backend, which means the desktop and server stop sharing implementation. Tauri keeps them in lockstep.

The Tauri tradeoff is webview consistency — different OSes use different webview engines (WebKit on macOS, WebView2 on Windows, WebKitGTK on Linux). For a CM6-based editor this is generally fine; CM6 is well-tested across browsers. For something pushing exotic CSS or bleeding-edge web APIs the Electron-style "always Chromium" guarantee is worth more.

## What this rules out

- **A Tauri-only architecture (no separate server binary).** You'd lose the headless self-hosted use case and force every collab user to install a desktop app.
- **Two separate frontends (one for desktop, one for web).** Tempting, but it doubles the UI maintenance burden for what's mostly window-chrome differences. Build one web frontend; let Tauri host it with extra `tauri-invoke` IPC for native features the browser can't do.
- **A Node-only server.** Works fine for the prototype, but locks you out of the shared-core pattern. The decisive moment is when the editor genuinely needs to scale or ship as a binary product — at that point, port to Rust.

## Open questions for the actual implementation phase

- Persistence — flat-file (each Y.Doc snapshotted to disk on idle) or SQLite-backed? Flat-file is closer to "edit my dynamic_data/ folder directly, the editor is just a fancy view." SQLite is closer to "the editor owns its store, syncs out to flat files on save."
- Plugin model — does the editor adopt the docs framework's plugin pattern, or invent its own?
- File-system bridge — when the editor edits a file, who owns the canonical version: the editor's Y.Doc or the file on disk? (Decides the file-watcher / save behaviour.)
- Headless mode for the server — does it serve any UI itself (an admin page, a viewer) or is it purely a sync endpoint?

These are deferred to the implementation phase, not part of this issue.
