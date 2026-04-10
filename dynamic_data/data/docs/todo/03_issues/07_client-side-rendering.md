---
title: "Client-Side Markdown Rendering"
description: Moving the editor's markdown rendering pipeline from server to browser
sidebar_label: Client-Side Rendering
---

## Overview

Move the markdown-to-HTML rendering pipeline from the server to the browser for the editor's preview and live preview modes. The server should only handle file I/O and Yjs text synchronization — no rendering.

## Current Architecture (Server-Side)

```
User types → Yjs syncs text to server → Server renders markdown (remark/rehype)
→ Server sends HTML back via WebSocket (MSG_RENDER) → Preview pane displays HTML
```

**How it works today:**
- User edits in CM6, changes sync via Yjs WebSocket to the server
- Server tracks `contentChangedSinceLastRender` flag
- Every `configRenderInterval` (default 5s), client sends `MSG_RENDER_REQ`
- Server runs the full rendering pipeline: `gray-matter` → `remark` → `rehype` → HTML
- Server sends `MSG_RENDER` with the rendered HTML back to the client
- Preview pane displays the HTML

**Problems:**
- 5-second delay between typing and seeing preview updates
- Server does CPU work for every connected user's render requests
- Preview doesn't work offline or without server connection
- Render pipeline runs on Node.js only — can't be reused client-side for Live Preview widgets

## Proposed Architecture (Client-Side)

```
User types → Yjs syncs text only → Client renders markdown locally
→ Both Preview and Live Preview use client-rendered HTML
```

**What changes:**
- Bundle a markdown renderer for the browser (unified/remark/rehype or marked)
- Client renders markdown → HTML on every document change (debounced)
- Preview pane updates instantly — no network round-trip
- Live Preview mode can use the same renderer for complex widgets (tables, code blocks)
- Remove `MSG_RENDER`, `MSG_RENDER_REQ` from the WebSocket protocol
- Remove `renderBody()`, `renderDocument()` calls from server during editing sessions
- Server keeps: `openDocument()` (file read), `saveDocument()` (file write), Yjs sync relay

---

## Latency Analysis

### Current: Server-Side Rendering Latency

```
Keystroke → Yjs encode (< 1ms)
  → WebSocket send (< 1ms LAN, 20-80ms WAN)
  → Server Yjs apply (< 1ms)
  → Wait for render timer (0-5000ms, avg 2500ms)
  → Client sends MSG_RENDER_REQ via WebSocket (< 1ms)
  → Server renders markdown (10-200ms depending on doc size)
  → Server sends MSG_RENDER via WebSocket (1-50ms depending on HTML size)
  → Client receives + DOM update (1-5ms)

Total: 2500-5300ms (dominated by render timer)
Best case (timer fires immediately): 30-340ms
```

**Per-render WebSocket overhead:**
- `MSG_RENDER_REQ`: ~50 bytes (client → server)
- `MSG_RENDER`: 2KB-200KB depending on doc size (server → client, full HTML)
- This happens every 5 seconds per user per open document
- 10 users = 10 render cycles/5s = ~2 render messages/second on the server

### Proposed: Client-Side Rendering Latency

```
Keystroke → Yjs encode (< 1ms)
  → Local render (debounced 100ms)
  → markdown parse + HTML generate (5-50ms)
  → DOM update (1-5ms)

Total: 106-156ms
```

**WebSocket overhead reduced:**
- `MSG_RENDER_REQ`: eliminated (0 bytes)
- `MSG_RENDER`: eliminated (0 bytes)
- WebSocket only carries: Yjs sync (binary diffs, typically 50-500 bytes), awareness (cursor positions), ping
- 10 users = zero additional render traffic

### Latency Comparison

| Metric | Server-Side | Client-Side | Improvement |
|--------|------------|-------------|-------------|
| Keystroke → preview update | 2500-5300ms | 106-156ms | **~20x faster** |
| Best-case latency | 30-340ms | 106-156ms | Comparable |
| WebSocket messages/render | 2 (req + response) | 0 | **100% reduction** |
| Bandwidth per render | 2-200KB | 0 | **100% reduction** |
| Server CPU per render | 10-200ms | 0 | **100% reduction** |
| Works offline | No | Yes | New capability |

### WebSocket Protocol Simplification

**Current messages (6 types):**
| Type | Direction | Purpose |
|------|-----------|---------|
| MSG_SYNC (0) | Bidirectional | Yjs CRDT sync |
| MSG_CURSOR (1) | — | Legacy (ignored) |
| MSG_PING (2) | Bidirectional | Keepalive + latency |
| MSG_CONFIG (3) | Server → Client | Render/ping intervals |
| MSG_RENDER (4) | Server → Client | Rendered HTML |
| MSG_RENDER_REQ (5) | Client → Server | Request render |
| MSG_AWARENESS (6) | Bidirectional | Remote cursors |

**Proposed messages (4 types):**
| Type | Direction | Purpose |
|------|-----------|---------|
| MSG_SYNC (0) | Bidirectional | Yjs CRDT sync |
| MSG_PING (2) | Bidirectional | Keepalive + latency |
| MSG_CONFIG (3) | Server → Client | Ping interval only |
| MSG_AWARENESS (6) | Bidirectional | Remote cursors |

Removed: MSG_CURSOR (already unused), MSG_RENDER, MSG_RENDER_REQ

---

## Performance Benefits

### Server-Side Savings
- **CPU**: Rendering a 500-line markdown doc takes ~50-200ms on the server. With 10 concurrent users editing, that's 10 renders every 5 seconds = 2 renders/second. With client-side rendering: 0 renders/second on the server.
- **Memory**: `EditorDocument.rendered` stores the full HTML string per open document. A large doc can produce 50-200KB of HTML. With 20 open documents, that's 1-4MB of HTML strings kept in memory. Client-side rendering eliminates this entirely.
- **Bandwidth**: Each `MSG_RENDER` sends the full HTML over WebSocket. For a 100KB HTML output, that's 100KB per render per user. With 10 users rendering every 5s, that's ~200KB/s of render traffic alone. Client-side: 0.

### Client-Side Costs
- **Bundle size**: `marked` is ~40KB minified+gzipped. Full `unified` pipeline is ~100-150KB. Shiki for syntax highlighting adds ~200KB (with languages). Total: ~250-400KB additional, lazy-loaded only when editor opens.
- **CPU**: Rendering happens on the client's CPU. A 500-line doc takes 5-50ms to render. This is negligible on modern hardware but could matter on low-end mobile devices.
- **Memory**: The parsed AST and rendered HTML live in browser memory. For a single doc this is trivial (<1MB).

---

## Downsides & Risks

### Rendering Parity
- The client renderer must produce identical HTML to the server's production build renderer
- Custom tags (callouts, tabs, collapsible) must be ported to work in the browser
- If parity is broken, what you see in the editor preview won't match the published page
- **Mitigation**: Share the same remark/rehype plugin chain between client and server. Run parity tests.

### Bundle Size
- Adding a full markdown renderer + syntax highlighter to the client adds ~250-400KB
- This is only loaded when the editor opens (lazy import), not on doc page views
- **Mitigation**: Tree-shake unused plugins. Use `marked` (~40KB) instead of full `unified` if custom plugins aren't needed in the editor.

### Main Thread Blocking
- Large documents (1000+ lines) could block the main thread during rendering (50-200ms)
- This causes input lag — user types but the UI freezes briefly
- **Mitigation**: Use a Web Worker for rendering. The main thread sends markdown text to the worker, the worker renders and sends HTML back. CM6 editing remains smooth.

### Mobile / Low-End Devices
- Client-side rendering shifts CPU cost from server to client
- Low-end devices may render slower than the server would
- **Mitigation**: Debounce aggressively (300ms on mobile), use incremental rendering (only re-render changed paragraphs).

### Initial Load
- On editor open, the first render must happen before preview is shown
- With server-side rendering, the `openDocument` response includes pre-rendered HTML
- With client-side rendering, the client must render after receiving raw markdown
- **Mitigation**: Render in parallel with Yjs sync. Show loading skeleton in preview pane until render completes (~50ms delay, barely noticeable).

---

## GPU Acceleration

### Can We Use the GPU for Rendering?

Markdown rendering is primarily a **text parsing + string transformation** task. This is CPU-bound, not GPU-bound. The GPU excels at:
- Parallel numerical computation (matrix math, image processing)
- Rasterization (drawing pixels on screen)
- Shader-based transforms

Markdown parsing is inherently **sequential** (tokens depend on prior context) and **string-heavy** (no numerical parallelism). So direct GPU acceleration of the markdown→HTML pipeline is not practical.

### Where GPU Does Help

The GPU is already involved in the final stage — **DOM rendering**:

1. **CSS compositing**: The browser's GPU compositor handles layer painting, transforms, opacity, and scrolling. CM6's DOM updates are GPU-composited automatically.

2. **Canvas rendering**: If we ever move to a canvas-based editor (see Canvas Rendering issue), the GPU would handle all text rendering, selection highlighting, and scrolling. This would bypass DOM entirely.

3. **WebGL text rendering**: Libraries like `@aspect-build/rules_js` or custom WebGL shaders can render text directly on the GPU. This is how VS Code's terminal (xterm.js) achieves high performance. However, this is extreme complexity for a documentation editor.

### Practical GPU-Adjacent Optimizations

Instead of direct GPU rendering, these techniques leverage GPU-friendly browser APIs:

| Technique | How | Benefit |
|-----------|-----|---------|
| **`will-change: transform`** on preview pane | Promotes to GPU-composited layer | Smooth scrolling, no repaint on scroll |
| **`content-visibility: auto`** on preview sections | Browser skips rendering off-screen content | Reduces paint work for long docs |
| **`OffscreenCanvas` in Web Worker** | Render syntax-highlighted code blocks on worker's canvas | Parallel rendering, no main thread blocking |
| **CSS `contain: content`** on preview blocks | Isolates layout/paint to each block | Incremental repaint on changes |
| **`requestIdleCallback`** for deferred rendering | Render non-visible sections during idle time | No jank during active editing |

### Recommendation

For a markdown documentation editor, GPU acceleration is not the bottleneck. The real wins are:

1. **Web Worker rendering** — offload parsing to a background thread (biggest impact)
2. **Incremental rendering** — only re-render changed paragraphs (second biggest impact)
3. **CSS containment** — `content-visibility: auto` on preview sections (free performance)
4. **GPU compositing hints** — `will-change` on scroll containers (smooth scrolling)

Direct GPU rendering (WebGL/Canvas) is only relevant if we pursue the Canvas Rendering approach for the editor itself, which is a separate initiative.

---

## Implementation Plan

### Phase 1: Client-Side Renderer Module
- Create `src/dev-toolbar/editor-v2/renderer/` module
- Bundle `marked` (lighter than full unified pipeline) or subset of `unified/remark/rehype`
- Support: headings, bold/italic, links, images, code blocks, tables, blockquotes, lists, HR, task lists
- Code block syntax highlighting via Shiki (already used in the main site) or Prism
- Custom tag support (callouts, tabs) — port the preprocessors to work client-side

### Phase 2: Wire Into Preview Pane
- On document change (Yjs `ytext.observe`), render markdown → HTML
- Debounce rendering (~100-200ms)
- Update preview pane content directly
- Remove the `onRender` callback from `YjsV2Options`
- Remove `MSG_RENDER_REQ` sending from `yjs-client-v2.ts`

### Phase 3: Wire Into Live Preview
- Live Preview widgets can use the renderer for complex blocks
- Code blocks rendered with syntax highlighting as CM6 widgets
- Tables rendered as HTML table widgets
- Shared renderer instance between preview and live preview

### Phase 4: Server Cleanup
- Remove `MSG_RENDER` and `MSG_RENDER_REQ` message types from `yjs-sync.ts`
- Remove `renderDocument()` and `renderBody()` from `EditorStore` (server.ts)
- Remove render timer from `yjs-client-v2.ts`
- Remove `configRenderInterval` from server config
- `EditorDocument` no longer stores `rendered` field
- `openDocument()` still reads the file and returns raw content — no rendering

### Phase 5: Optimization
- Web Worker for rendering (keep main thread free)
- Incremental rendering (only re-render changed sections)
- Cache rendered sections by content hash
- CSS `content-visibility: auto` on preview sections
- `will-change: transform` on scroll containers

## Files Affected

| File | Change |
|------|--------|
| `editor-v2/renderer/` | **New** — client-side markdown renderer module |
| `editor-v2/sync/yjs-client-v2.ts` | Remove `MSG_RENDER`, `MSG_RENDER_REQ`, render timer |
| `editor-v2/editor-page.ts` | Wire client renderer to preview pane |
| `editor-v2/live-preview/` | Use shared renderer for complex widgets |
| `editor/server.ts` | Remove `renderBody()`, `renderDocument()`, `rendered` field |
| `editor/yjs-sync.ts` | Remove `MSG_RENDER` handling |

## Status

- [ ] Phase 1: Client-side renderer module
- [ ] Phase 2: Wire into preview pane
- [ ] Phase 3: Wire into live preview
- [ ] Phase 4: Server cleanup
- [ ] Phase 5: Optimization (web worker, incremental rendering, GPU compositing hints)
