---
title: "Editor V2 — Performance Optimizations"
description: Outstanding performance wins in the live editor (CM6 + Yjs + server middleware)
sidebar_label: Editor Performance
---

# Editor V2 — Performance Optimizations

**Type:** Performance
**Priority:** Medium
**Component:** `src/dev-toolbar/editor-v2/`, `src/dev-toolbar/editor/`
**Status:** Open

---

## Context

The editor is well-architected and mostly well-optimized for a dev-only tool, but a review of the CM6 live-preview path and the server-side Yjs/middleware found several concrete wins. Listed below by impact.

---

## High-impact

- [ ] **Viewport-restrict live-preview decorations**
  - **Where:** `editor-v2/live-preview/build-decorations.ts:82`, `editor-v2/live-preview/index.ts`
  - **Problem:** `buildLivePreviewDecorations` iterates the full syntax tree on every selection change because the `StateField` triggers on `tr.selection`. On a 5k-line file every arrow-key press rebuilds decorations for the entire document.
  - **Fix:** iterate only `view.visibleRanges` — either switch to a `ViewPlugin`, or keep the `StateField` but dispatch narrowed rebuilds from a `ViewPlugin`.
  - **Stretch:** only rebuild for nodes whose `cursorInRange` / `cursorOnLine` status actually changed since the last selection (dirty the previously-focused range + the new one).

- [ ] **Debounce `onContentChange` in Yjs sync**
  - **Where:** `dev-toolbar/editor/yjs-sync.ts:122`, `dev-toolbar/editor/server.ts:99`
  - **Problem:** every Yjs update calls `text.toString()` (O(n)) and reassigns `EditorStore.raw`. Under rapid typing on a large doc this is hot.
  - **Fix:** debounce `onContentChange` ~50–100ms. Disk persistence and external-edit detection don't need per-keystroke fidelity; the Y.Doc is the source of truth.

- [ ] **Cache combined preview CSS**
  - **Where:** `dev-toolbar/editor/middleware.ts:165` (`getContentCSS`)
  - **Problem:** reads 5 CSS files from disk on every `/__editor/styles` request. Comment says "no caching" is intentional for theme HMR, but `cache-manager.ts` already does mtime-aware caching elsewhere.
  - **Fix:** cache the combined CSS; invalidate via the existing theme/styles watcher events.

- [ ] **Cache file-tree + frontmatter**
  - **Where:** `dev-toolbar/editor/middleware.ts:49` (`buildFileTree`), `:93` (frontmatter read)
  - **Problem:** `/tree` reads frontmatter synchronously from every `.md` file. On a 500-file project this blocks the event loop for hundreds of ms.
  - **Fix:** mtime-cache the tree (invalidate via existing watcher). At minimum, cache per-file frontmatter.

---

## Medium-impact

- [ ] **Skip the decoration sort when possible**
  - **Where:** `editor-v2/live-preview/build-decorations.ts:357`
  - **Problem:** full sort + overlap-filter pass (O(n log n)) on every rebuild.
  - **Fix:** Lezer iterates in document order already — push in-order and skip the sort. Becomes trivial once viewport restriction (above) lands.

- [ ] **Cache cursor line numbers in `buildLivePreviewDecorations`**
  - **Where:** `editor-v2/live-preview/build-decorations.ts:20` (`cursorOnLine`)
  - **Problem:** per node, calls `doc.lineAt` up to 3×. Constant-factor waste on every node in the tree.
  - **Fix:** compute the selection's line numbers once at the top of `buildLivePreviewDecorations` and reuse.

- [ ] **Replace `treeReadyPlugin` polling with events**
  - **Where:** `editor-v2/live-preview/index.ts:36`
  - **Problem:** uses `setTimeout` + `requestAnimationFrame` polling to detect when the Lezer tree is ready. Works but fragile.
  - **Fix:** use `ensureSyntaxTree` / `forceParsing` from `@codemirror/language` and tree-update events.

- [ ] **Don't materialize full doc for frontmatter parse**
  - **Where:** `editor-v2/live-preview/build-decorations.ts:68` (`docStr = state.doc.toString()`)
  - **Problem:** allocates the whole document string just to parse frontmatter at the top.
  - **Fix:** `state.sliceDoc(0, 2048)` — frontmatter lives in the first few KB.

---

## Low-impact (fine as-is, tracked for completeness)

- [ ] **Diff presence broadcasts instead of sending full user list**
  - `dev-toolbar/editor/presence.ts:173` — already pre-serialized, fine for <10 users. Skip unless we scale up.
- [ ] **Piggy-back stale-user cleanup on SSE keepalive**
  - `dev-toolbar/editor/presence.ts:220` — one fewer interval; cosmetic.
- [ ] **Expose Yjs room eviction interval in `PresenceConfig`**
  - `dev-toolbar/editor/yjs-sync.ts:202` — hardcoded 60s / 30min; minor.

---

## Already well-optimized (do not touch)

- Counter-based `ignoreSaveMap` — no timing assumptions, handles rapid saves correctly (`server.ts:37`).
- Latency delta threshold in `updateLatency` — avoids N² SSE writes (`presence.ts:163`).
- Pre-serialized SSE payload in `broadcastPresence` — single `JSON.stringify` per broadcast.
- `Compartment`-based mode switching — no remount, Yjs state preserved.
- Stream lifecycle (close existing, `writableEnded` checks, cleanup on disconnect).
- Raw `MSG_AWARENESS` rebroadcast without parsing (`yjs-sync.ts:313`).

---

## Recommended order

If only three land:

1. Viewport-restrict live-preview decorations — biggest perceived win.
2. Debounce `onContentChange` — reduces server CPU under heavy typing.
3. Cache file tree + preview CSS — cheap, visible UI speedup.
