---
title: "Editor V2 — Typography Token Alignment"
description: Add semantic font-size tokens to the editor's --ev-* namespace and migrate raw px values
sidebar_label: Editor Typography
---

# Editor V2 — Typography Token Alignment

**Type:** Refactor
**Priority:** Low
**Component:** `src/dev-toolbar/editor-v2/`
**Status:** Open

---

## Context

The main site now has a strict typography contract (`src/styles/font.css` + `theme.yaml`) with a two-tier token model: primitive `--font-size-*` scale and semantic aliases (`--ui-text-*`, `--content-*`, `--display-*`). Layouts consume semantic tokens, never primitives or raw rem/px.

The editor has its own parallel design system under the `--ev-*` namespace (`src/dev-toolbar/editor-v2/styles/editor.css`) — with tokens for colour, surface, border, text-muted, etc. But it **has no font-size tokens**. Every size is a raw `px` value scattered through `editor.css`, `*.ts` inline styles, and toolbar/preview stylesheets.

Same problem we just fixed on the main site, contained to a different subsystem.

## Goal

Mirror the 3-tier pattern inside the editor namespace so the editor has its own disciplined scale without trying to bridge to the site theme (which it can't cleanly — shadow-DOM context, dev-only overlay).

## Proposed tokens

Add to `src/dev-toolbar/editor-v2/styles/editor.css`:

```css
--ev-text-micro: 11px;   /* tree item meta, dialog helper text, stale pills */
--ev-text-body:  13px;   /* default editor UI — slightly denser than site body (14px) */
--ev-text-title: 16px;   /* panel headings, modal titles */
```

Density choice: code editors conventionally run 12–13px for UI chrome (VS Code, JetBrains, Neovim UI). Using 13px for body keeps the editor visually tight without resorting to 14px which feels loose next to the code pane.

## Migration

1. Add the three tokens to the `:root` block in `editor.css` (and repeat in the light-mode override if sizes should differ — probably not).
2. Sweep raw `px` values in editor-v2:
   - `editor.css:46` (`font-size: 14px`) → `--ev-text-body`
   - `editor-page.ts`, `file-dialogs.ts` inline styles (11px, 12px, 13px) → `--ev-text-micro` / `--ev-text-body`
   - Toolbar / preview stylesheets if any — audit.
3. Optional (Option 2 in the original discussion): also sweep `src/dev-toolbar/layout-selector.ts` and `error-logger.ts`. These use 9–14px ranges. Less impactful since those panels are occasional-use.

## Done when

- Zero raw `font-size: Npx` in `src/dev-toolbar/editor-v2/`.
- `grep -rn "font-size:" src/dev-toolbar/editor-v2/` shows only `var(--ev-text-*)` references (and the CodeMirror-managed code pane, which is its own thing).

## Out of scope

- Bridging `--ev-*` to the site's `--ui-text-*` tokens. Kept deliberately separate; the editor is dev-only and not part of the published contract.
- Restyling the CodeMirror code pane — CM6 manages its own font-size via extensions, don't touch.
