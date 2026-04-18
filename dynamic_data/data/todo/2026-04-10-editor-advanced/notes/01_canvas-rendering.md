---
title: "Canvas-Based Text Rendering"
description: Replace DOM textarea with canvas rendering (Pretext) for Google Docs-like performance
sidebar_label: Canvas Rendering
---

# Canvas-Based Text Rendering

**Type:** Feature  
**Priority:** High  
**Component:** `src/dev-toolbar/editor-ui/`  
**Status:** Research

---

## Problem

The current editor uses a layered DOM approach: a transparent `<textarea>` on top of a syntax-highlighted `<pre>` overlay. Every keystroke triggers a full re-render of the highlight overlay (`highlightMarkdown()` processes every line, then sets `innerPre.innerHTML`). This is O(n) per keystroke and causes noticeable lag on long documents.

Additionally, the textarea + overlay approach creates scroll sync complexity and makes features like inline widgets, embedded images, or rich cursors difficult to implement.

## Research: Pretext Library

**Result: Not a direct replacement.** Pretext (`@chenglou/pretext`, v0.0.5, by Cheng Lou) is a **text measurement and layout** library, not a full canvas editor. It uses the Canvas font engine to avoid DOM reflow for measuring text — ~500x faster than `getBoundingClientRect()`. 15KB, zero dependencies, full Unicode support.

- GitHub: `github.com/chenglou/pretext`
- NPM: `@chenglou/pretext`
- Status: Pre-release (v0.0.5)

**What Pretext can help with (partial wins):**
- Replace the mirror-div approach for remote cursor pixel positioning with Canvas-based measurement
- Pre-calculate line heights for virtual scrolling (only render visible lines in the highlight overlay)
- Faster text layout calculations for the highlight `<pre>` element

**What Pretext does NOT provide:**
- No editing primitives (cursor, selection, IME, keyboard handling)
- No rich text or syntax highlighting rendering engine
- Not a replacement for `<textarea>` input handling

## Proposed Solution (Revised)

A two-phase approach:

### Phase 1: Virtual Scrolling for Highlight Overlay (using Pretext)

Use Pretext to pre-calculate line heights, then only render visible lines in the highlight `<pre>` overlay. This eliminates the O(n) full-document re-render on every keystroke.

1. On content change, use `pretext.layout()` to compute line heights
2. Render only the visible range of lines in the highlight overlay
3. Use a sentinel element for total scroll height
4. Update visible range on scroll events

### Phase 2: Full Canvas Editor (future, requires more than Pretext)

For a Google Docs-style canvas editor, evaluate building on top of Pretext + custom editing layer, or use an existing canvas editor framework:

| Option | Description | Maturity |
|--------|-------------|----------|
| Pretext + custom | Build editing primitives on Pretext measurement | Experimental |
| CodeMirror 6 | DOM-based but with virtual scrolling built in | Production |
| Monaco Editor | VS Code's editor (virtual scrolling, web workers) | Production |

## Risks

- Pretext is pre-release (v0.0.5) — API may change
- Virtual scrolling adds complexity to scroll sync between textarea and highlight
- Full canvas editor would require reimplementing all input handling (IME, accessibility, clipboard)
- CodeMirror/Monaco are proven alternatives that solve perf without canvas

## References

- Pretext: `github.com/chenglou/pretext` / `pretextjs.dev`
- Google Docs canvas rendering architecture
- VS Code's GPU-accelerated terminal renderer
- CodeMirror 6 virtual scrolling: `codemirror.net`
