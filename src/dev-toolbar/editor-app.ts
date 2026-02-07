/**
 * Dev Toolbar - Live Documentation Editor
 *
 * Overleaf-style split-pane editor for docs/blog pages.
 * Left pane: syntax-highlighted markdown editor (textarea + highlight overlay)
 * Right pane: live-rendered HTML preview
 * Scroll sync: both panes scroll proportionally together
 *
 * Multi-user presence: shows connected users, their pages, latency, and
 * renders remote cursors in the editor when editing the same file.
 *
 * Only active on pages with a `data-editor-path` attribute (docs/blog).
 * Full-screen overlay appended to document.body for proper viewport coverage.
 */

import type { SaveStatus, EditorContext } from './editor-ui/types.js';
import { getOrCreateIdentity, escapeHtml } from './editor-ui/types.js';
import {
  setupHmrGuard,
  setPresenceUpdateCallback,
  sendPresenceAction,
  setRenderUpdateCallback,
  getServerRenderInterval,
  getServerSseReconnect,
  getPresenceUsers,
} from './editor-ui/sse-presence.js';
import { highlightMarkdown } from './editor-ui/highlight.js';
import { createEditorOverlay } from './editor-ui/overlay-dom.js';
import { initRemoteCursors } from './editor-ui/cursors.js';
import { initScrollSync } from './editor-ui/scroll-sync.js';
import { initYjsClient } from './editor-ui/yjs-client.js';

// ---- Module-level identity & presence ----

const identity = getOrCreateIdentity();
setupHmrGuard(identity);

// ---- Toolbar App Export ----

export default {
  id: 'doc-editor',
  name: 'Edit Page',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,

  async init(canvas: ShadowRoot, app: any, _server: any) {
    const editorPath = document.documentElement.getAttribute('data-editor-path');

    // ---- Panel UI ----

    const windowEl = document.createElement('astro-dev-toolbar-window');
    const styles = document.createElement('style');
    styles.textContent = `
      astro-dev-toolbar-window {
        max-height: 80vh !important;
        overflow: hidden !important;
      }
      .panel-content {
        padding: 12px;
        font-family: system-ui, -apple-system, sans-serif;
        min-width: 260px;
      }
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .panel-title {
        font-size: 13px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
      }
      .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 4px;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.9);
      }
      .close-btn svg {
        width: 14px;
        height: 14px;
      }

      /* Presence table */
      .presence-section {
        margin-bottom: 12px;
      }
      .presence-header {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 6px;
      }
      .presence-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 9px;
        background: rgba(99, 102, 241, 0.3);
        color: #a5b4fc;
        font-size: 10px;
        font-weight: 700;
      }
      .presence-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      .presence-table th {
        text-align: left;
        padding: 4px 6px;
        color: rgba(255, 255, 255, 0.4);
        font-weight: 500;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
      .presence-table td {
        padding: 4px 6px;
        color: rgba(255, 255, 255, 0.7);
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100px;
      }
      .presence-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 4px;
        vertical-align: middle;
      }
      .presence-you {
        font-size: 9px;
        color: rgba(255, 255, 255, 0.35);
        margin-left: 2px;
      }
      .ping-good { color: #9ece6a; }
      .ping-ok { color: #e0af68; }
      .ping-bad { color: #f7768e; }
      .jump-btn {
        padding: 2px 6px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        font-size: 10px;
        transition: all 0.15s ease;
      }
      .jump-btn:hover {
        background: rgba(99, 102, 241, 0.2);
        border-color: rgba(99, 102, 241, 0.4);
        color: #a5b4fc;
      }

      .edit-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: rgba(99, 102, 241, 0.2);
        border: 1px solid rgba(99, 102, 241, 0.5);
        border-radius: 6px;
        color: #a5b4fc;
        cursor: pointer;
        transition: all 0.15s ease;
        font-size: 13px;
        width: 100%;
      }
      .edit-btn:hover {
        background: rgba(99, 102, 241, 0.3);
        border-color: rgba(99, 102, 241, 0.7);
      }
      .edit-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.4);
      }
      .edit-btn svg {
        width: 16px;
        height: 16px;
      }
      .disabled-msg {
        padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.4);
        font-size: 12px;
        text-align: center;
        margin-top: 8px;
      }
      .file-path {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.4);
        margin-top: 8px;
        padding: 6px 8px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 4px;
        word-break: break-all;
      }
    `;

    let html = '<div class="panel-content">';
    html += `<div class="panel-header">
      <span class="panel-title">Edit Page</span>
      <button class="close-btn" id="close-panel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>`;

    // Presence section
    html += `
      <div class="presence-section">
        <div class="presence-header">
          Connected <span class="presence-count" id="presence-count">0</span>
        </div>
        <table class="presence-table">
          <thead>
            <tr><th>User</th><th>Page</th><th>Ping</th><th></th></tr>
          </thead>
          <tbody id="presence-body"></tbody>
        </table>
      </div>
    `;

    if (editorPath) {
      html += `
        <button class="edit-btn" id="open-editor">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit this page
        </button>
        <div class="file-path">${editorPath.split('/').slice(-3).join('/')}</div>
      `;
    } else {
      html += `
        <button class="edit-btn" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit this page
        </button>
        <div class="disabled-msg">Navigate to a docs or blog page to edit</div>
      `;
    }

    html += '</div>';

    const contentWrapper = document.createElement('div');
    contentWrapper.innerHTML = html;
    windowEl.appendChild(contentWrapper);

    // ---- Presence table rendering ----

    const presenceBody = contentWrapper.querySelector('#presence-body') as HTMLTableSectionElement;
    const presenceCount = contentWrapper.querySelector('#presence-count') as HTMLSpanElement;

    function renderPresenceTable(users: any[]): void {
      presenceCount.textContent = String(users.length);

      presenceBody.innerHTML = users.map((u: any) => {
        const isYou = u.userId === identity.userId;
        const pagePath = u.currentPage || '/';
        const shortPage = pagePath === '/' ? '/' : pagePath.replace(/^\/docs/, '').replace(/\/$/, '').split('/').slice(-2).join('/') || '/';

        let pingClass = 'ping-good';
        if (u.latencyMs >= 300) pingClass = 'ping-bad';
        else if (u.latencyMs >= 100) pingClass = 'ping-ok';

        const pingText = u.latencyMs > 0 ? `${u.latencyMs}ms` : '-';

        return `<tr>
          <td><span class="presence-dot" style="background:${escapeHtml(u.color)}"></span>${escapeHtml(u.name)}${isYou ? '<span class="presence-you">(you)</span>' : ''}</td>
          <td title="${escapeHtml(pagePath)}">${escapeHtml(shortPage)}</td>
          <td class="${pingClass}">${pingText}</td>
          <td>${!isYou ? `<button class="jump-btn" data-page="${escapeHtml(pagePath)}">Jump</button>` : ''}</td>
        </tr>`;
      }).join('');

      presenceBody.querySelectorAll('.jump-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const page = (btn as HTMLElement).dataset.page;
          if (page) window.location.href = page;
        });
      });
    }

    setPresenceUpdateCallback(renderPresenceTable);
    renderPresenceTable(getPresenceUsers());

    // Close button
    const closeBtn = contentWrapper.querySelector('#close-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => app.toggleState({ state: false }));
    }

    // Open editor button
    const openBtn = contentWrapper.querySelector('#open-editor');
    if (openBtn && editorPath) {
      openBtn.addEventListener('click', () => {
        app.toggleState({ state: false });
        openFullScreenEditor(editorPath);
      });
    }

    canvas.appendChild(styles);
    canvas.appendChild(windowEl);
  },
};

// ---- Full-screen Editor Orchestrator ----

async function openFullScreenEditor(filePath: string) {
  const result = await createEditorOverlay(filePath);
  if (!result) return;

  // Mutable state owned by the orchestrator, accessed via ctx getters/setters
  let saveStatus: SaveStatus = 'saved';
  let yjsSynced = false;
  let isApplyingRemote = false;

  const ctx: EditorContext = {
    dom: result.dom,
    filePath,
    identity,
    getSaveStatus: () => saveStatus,
    setSaveStatus: (s) => { saveStatus = s; },
    getYjsSynced: () => yjsSynced,
    setYjsSynced: (v) => { yjsSynced = v; },
    getIsApplyingRemote: () => isApplyingRemote,
    setIsApplyingRemote: (v) => { isApplyingRemote = v; },
  };

  // Wire up subsystems in dependency order
  const cursors = initRemoteCursors(ctx);

  const scrollSync = initScrollSync(ctx, {
    repositionAllRemoteCursors: cursors.repositionAllRemoteCursors,
    highlightMarkdown,
  });

  const yjs = initYjsClient(ctx, {
    updateHighlight: scrollSync.updateHighlight,
    remeasureAllCursors: cursors.remeasureAllCursors,
    sendPresenceAction,
    setRenderUpdateCallback,
    getServerRenderInterval,
    getServerSseReconnect,
  });

  // ---- Resize handle ----

  const { overlay, resizeHandle, leftPane, rightPane } = ctx.dom;
  let isResizing = false;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeHandle.classList.add('dragging');
    e.preventDefault();
  });

  function onMouseMove(e: MouseEvent) {
    if (!isResizing) return;
    const bodyRect = overlay.querySelector('.editor-body')!.getBoundingClientRect();
    const offsetX = e.clientX - bodyRect.left;
    const totalWidth = bodyRect.width;
    const ratio = Math.max(0.2, Math.min(0.8, offsetX / totalWidth));
    leftPane.style.flex = `${ratio}`;
    rightPane.style.flex = `${1 - ratio}`;
  }

  function onMouseUp() {
    if (isResizing) {
      isResizing = false;
      resizeHandle.classList.remove('dragging');
      cursors.syncMirrorWidth();
      cursors.remeasureAllCursors();
    }
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // The yjs-client module handles cleanup of its own listeners + close button.
  // We need a MutationObserver to clean up resize listeners when overlay is removed.
  const overlayRemoved = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.removedNodes) {
        if (node === overlay) {
          // Overlay was removed — clean up everything
          cursors.cleanup();
          scrollSync.cleanup();
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          overlayRemoved.disconnect();
          return;
        }
      }
    }
  });
  overlayRemoved.observe(document.body, { childList: true });

  // Prevent the overlay from being affected by page scroll
  overlay.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
}
