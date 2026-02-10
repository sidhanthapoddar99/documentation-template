// Yjs CRDT sync, multiplexed WS messages (cursor/ping/config/render),
// input handler, tab/keydown, save, close, refresh, render timer

import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

import type { EditorContext, SaveStatus, Disposable } from './types.js';

// WS message types — must match server (yjs-sync.ts)
const MSG_SYNC       = 0;
const MSG_CURSOR     = 1;
const MSG_PING       = 2;
const MSG_CONFIG     = 3;
const MSG_RENDER     = 4;
const MSG_RENDER_REQ = 5;

export interface YjsClientHandle extends Disposable {
  sendCursorUpdate: (cursor: { line: number; col: number; offset: number }) => void;
  getCursorThrottle: () => number;
}

export function initYjsClient(ctx: EditorContext, deps: {
  updateHighlight: () => void;
  remeasureAllCursors: () => void;
  handleRemoteCursor: (data: any) => void;
}): YjsClientHandle {
  const { textarea, preview, refreshBtn, saveBtn, closeBtn } = ctx.dom;

  const ydoc = new Y.Doc();
  const ytext = ydoc.getText('content');
  let contentChangedSinceLastRender = false;
  let renderTimer: ReturnType<typeof setInterval> | null = null;
  let yjsWs: WebSocket | null = null;
  let yjsReconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Config state — updated by MSG_CONFIG from server, defaults until then
  let configPingInterval = 5000;
  let configCursorThrottle = 100;
  let configRenderInterval = 5000;
  let lastLatencyMs = 0;
  let pingTimer: ReturnType<typeof setInterval> | null = null;

  // Update status indicator (skips DOM write if unchanged to avoid
  // triggering Astro audit's MutationObserver on every keystroke)
  function updateStatus(status: SaveStatus) {
    if (ctx.getSaveStatus() === status) return;
    ctx.setSaveStatus(status);
    ctx.dom.statusEl.className = `editor-status ${status}`;
    switch (status) {
      case 'saved':
        ctx.dom.statusEl.textContent = 'Saved';
        break;
      case 'unsaved':
        ctx.dom.statusEl.textContent = 'Unsaved changes';
        break;
      case 'saving':
        ctx.dom.statusEl.textContent = 'Saving...';
        break;
    }
  }

  // Fetch helper
  async function editorFetch(endpoint: string, body: Record<string, any>) {
    const res = await fetch(`/__editor/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // Wrap rendered HTML in docs-body for proper theme styling.
  // Skips innerHTML replacement when content is unchanged to avoid
  // re-triggering cached image loads on every render cycle.
  let lastPreviewHtml = '';
  function setPreviewContent(html: string) {
    if (html === lastPreviewHtml) return;
    lastPreviewHtml = html;
    const scrollTop = preview.scrollTop;
    preview.innerHTML = `<div class="docs-content"><article class="docs-article"><div class="docs-body markdown-content">${html}</div></article></div>`;
    preview.scrollTop = scrollTop;
    // Trigger diagram rendering for any new diagram blocks in the preview
    document.dispatchEvent(new CustomEvent('diagrams:render'));
  }

  // ---- WS JSON helpers ----

  function sendWsJson(type: number, payload: Record<string, any>): void {
    if (!yjsWs || yjsWs.readyState !== WebSocket.OPEN) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, type);
    encoding.writeVarString(encoder, JSON.stringify(payload));
    try { yjsWs.send(encoding.toUint8Array(encoder)); } catch { /* broken */ }
  }

  // ---- Ping loop ----

  function startPingLoop(): void {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      sendWsJson(MSG_PING, { clientTime: Date.now(), latencyMs: lastLatencyMs });
    }, configPingInterval);
  }

  function stopPingLoop(): void {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }

  // ---- Render timer ----

  function restartRenderTimer(): void {
    if (renderTimer) clearInterval(renderTimer);
    renderTimer = setInterval(requestRender, configRenderInterval);
  }

  // Request a server render via WS
  function requestRender(): void {
    if (!contentChangedSinceLastRender) return;
    sendWsJson(MSG_RENDER_REQ, {});
  }

  // ---- Cursor send (exposed for late-binding from cursors.ts) ----

  function sendCursorUpdate(cursor: { line: number; col: number; offset: number }): void {
    sendWsJson(MSG_CURSOR, { cursor });
  }

  function getCursorThrottle(): number {
    return configCursorThrottle;
  }

  // -- Yjs WebSocket connection --
  function connectYjsWs(): void {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/__editor/yjs?file=${encodeURIComponent(ctx.filePath)}&userId=${encodeURIComponent(ctx.identity.userId)}`;
    yjsWs = new WebSocket(wsUrl);
    yjsWs.binaryType = 'arraybuffer';

    yjsWs.addEventListener('open', () => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.writeSyncStep1(encoder, ydoc);
      yjsWs!.send(encoding.toUint8Array(encoder));
      startPingLoop();
    });

    yjsWs.addEventListener('message', (event) => {
      const data = new Uint8Array(event.data as ArrayBuffer);
      const decoder = decoding.createDecoder(data);
      const msgType = decoding.readVarUint(decoder);

      switch (msgType) {
        case MSG_SYNC: {
          const responseEncoder = encoding.createEncoder();
          encoding.writeVarUint(responseEncoder, MSG_SYNC);
          syncProtocol.readSyncMessage(decoder, responseEncoder, ydoc, 'remote');
          if (encoding.length(responseEncoder) > 1) {
            yjsWs!.send(encoding.toUint8Array(responseEncoder));
          }
          break;
        }

        case MSG_CURSOR: {
          try {
            const payload = JSON.parse(decoding.readVarString(decoder));
            deps.handleRemoteCursor(payload);
          } catch { /* ignore parse errors */ }
          break;
        }

        case MSG_PING: {
          try {
            const payload = JSON.parse(decoding.readVarString(decoder));
            if (payload.clientTime) {
              lastLatencyMs = Date.now() - payload.clientTime;
            }
          } catch { /* ignore */ }
          break;
        }

        case MSG_CONFIG: {
          try {
            const payload = JSON.parse(decoding.readVarString(decoder));
            if (payload.pingInterval) configPingInterval = payload.pingInterval;
            if (payload.cursorThrottle) configCursorThrottle = payload.cursorThrottle;
            if (payload.renderInterval) configRenderInterval = payload.renderInterval;
            startPingLoop();
            restartRenderTimer();
          } catch { /* ignore */ }
          break;
        }

        case MSG_RENDER: {
          try {
            const payload = JSON.parse(decoding.readVarString(decoder));
            if (payload.file === ctx.filePath) {
              setPreviewContent(payload.rendered);
              contentChangedSinceLastRender = false;
            }
          } catch { /* ignore */ }
          break;
        }
      }
    });

    yjsWs.addEventListener('close', () => {
      yjsWs = null;
      stopPingLoop();
      yjsReconnectTimer = setTimeout(connectYjsWs, 2000);
    });

    yjsWs.addEventListener('error', () => {
      yjsWs?.close();
    });
  }

  // Send local Y.Doc updates to the server via WebSocket
  ydoc.on('update', (update: Uint8Array, origin: unknown) => {
    if (origin === 'remote') return;
    if (!yjsWs || yjsWs.readyState !== WebSocket.OPEN) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    yjsWs.send(encoding.toUint8Array(encoder));
  });

  // Observe remote Y.Text changes → update textarea
  ytext.observe((event: Y.YTextEvent, transaction: Y.Transaction) => {
    if (transaction.origin === 'local') return;

    ctx.setIsApplyingRemote(true);

    if (!ctx.getYjsSynced()) {
      // First sync from server — populate textarea from Yjs (authoritative)
      textarea.value = ytext.toString();
      deps.updateHighlight();
      ctx.setYjsSynced(true);
      ctx.setIsApplyingRemote(false);
      deps.remeasureAllCursors();
      return;
    }

    // Subsequent remote changes — adjust local cursor around the edit
    let selStart = textarea.selectionStart;
    let selEnd = textarea.selectionEnd;
    let index = 0;

    for (const op of event.delta) {
      if (op.retain != null) {
        index += op.retain;
      } else if (op.insert != null) {
        const len = typeof op.insert === 'string' ? op.insert.length : 0;
        if (index <= selStart) selStart += len;
        if (index <= selEnd) selEnd += len;
        index += len;
      } else if (op.delete != null) {
        if (index < selStart) {
          selStart = Math.max(index, selStart - op.delete);
        }
        if (index < selEnd) {
          selEnd = Math.max(index, selEnd - op.delete);
        }
      }
    }

    textarea.value = ytext.toString();
    textarea.selectionStart = Math.min(selStart, textarea.value.length);
    textarea.selectionEnd = Math.min(selEnd, textarea.value.length);

    deps.updateHighlight();
    deps.remeasureAllCursors();
    ctx.setIsApplyingRemote(false);
    contentChangedSinceLastRender = true;
  });

  // Open document on server (creates Yjs room), then connect Yjs WebSocket
  editorFetch('open', { filePath: ctx.filePath }).then((data) => {
    // Show initial content from HTTP while Yjs syncs
    textarea.value = data.raw;
    deps.updateHighlight();
    setPreviewContent(data.rendered);
    updateStatus('saved');
    textarea.focus();

    connectYjsWs();
    renderTimer = setInterval(requestRender, configRenderInterval);
  }).catch((err) => {
    preview.innerHTML = `<div style="color: var(--color-error, #f7768e); padding: 16px;">Failed to open file: ${err.message}</div>`;
  });

  // On textarea input → compute change, apply to Y.Text
  function onInput() {
    if (ctx.getIsApplyingRemote() || !ctx.getYjsSynced()) return;

    deps.updateHighlight();
    updateStatus('unsaved');

    const ytextContent = ytext.toString();
    const newContent = textarea.value;
    if (ytextContent === newContent) return;

    // Find the changed region (prefix/suffix matching)
    let prefixLen = 0;
    const minLen = Math.min(ytextContent.length, newContent.length);
    while (prefixLen < minLen && ytextContent[prefixLen] === newContent[prefixLen]) prefixLen++;

    let oldSuffix = ytextContent.length;
    let newSuffix = newContent.length;
    while (oldSuffix > prefixLen && newSuffix > prefixLen && ytextContent[oldSuffix - 1] === newContent[newSuffix - 1]) {
      oldSuffix--;
      newSuffix--;
    }

    const deleteCount = oldSuffix - prefixLen;
    const insertStr = newContent.slice(prefixLen, newSuffix);

    ydoc.transact(() => {
      if (deleteCount > 0) ytext.delete(prefixLen, deleteCount);
      if (insertStr.length > 0) ytext.insert(prefixLen, insertStr);
    }, 'local');

    contentChangedSinceLastRender = true;
  }

  textarea.addEventListener('input', onInput);

  // Tab key support, Ctrl+S, Escape
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!ctx.getYjsSynced()) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      deps.updateHighlight();
      textarea.dispatchEvent(new Event('input'));
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      doSave();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      doClose();
    }
  }

  textarea.addEventListener('keydown', onKeydown);

  // Save — Yjs keeps EditorStore.doc.raw in sync, so just trigger disk write
  async function doSave() {
    if (ctx.getSaveStatus() === 'saved' || ctx.getSaveStatus() === 'saving') return;

    updateStatus('saving');
    try {
      await editorFetch('save', { filePath: ctx.filePath });
      updateStatus('saved');
    } catch (err: any) {
      console.error('[editor] Save failed:', err);
      updateStatus('unsaved');
    }
  }

  // Refresh preview button
  refreshBtn.addEventListener('click', () => {
    contentChangedSinceLastRender = true;
    requestRender();
  });

  // Close — no window.location.reload(); server HMR handles it if file was saved
  async function doClose() {
    masterCleanup();
    try {
      await editorFetch('close', { filePath: ctx.filePath });
    } catch (err: any) {
      console.error('[editor] Close failed:', err);
    }
    ctx.dom.overlay.remove();
  }

  saveBtn.addEventListener('click', doSave);
  closeBtn.addEventListener('click', doClose);

  // Master cleanup tears down everything owned by this module
  function masterCleanup() {
    textarea.removeEventListener('input', onInput);
    textarea.removeEventListener('keydown', onKeydown);

    stopPingLoop();

    if (renderTimer) {
      clearInterval(renderTimer);
      renderTimer = null;
    }
    if (yjsReconnectTimer) {
      clearTimeout(yjsReconnectTimer);
      yjsReconnectTimer = null;
    }
    if (yjsWs) {
      yjsWs.close();
      yjsWs = null;
    }
    ydoc.destroy();
  }

  return {
    cleanup: masterCleanup,
    sendCursorUpdate,
    getCursorThrottle,
  };
}
