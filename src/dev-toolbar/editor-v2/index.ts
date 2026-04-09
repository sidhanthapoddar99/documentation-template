/**
 * Editor V2 — Obsidian-style documentation editor
 *
 * Astro dev toolbar app entry point. Lazy-loads CodeMirror 6 on first open.
 * Layout: sidebar (file tree) | editor (CM6) | preview (collapsible)
 */

import type { EditorView } from '@codemirror/view';
import type { OpenFile, SaveStatus, Identity } from './types.js';
import { createShell } from './layout/shell.js';
import { initPreviewPanel } from './layout/preview-panel.js';
import { initResizeHandle } from './layout/resize-handles.js';
import { initYjsClientV2, type YjsV2Handle } from './sync/yjs-client-v2.js';

// ---- Identity (reused from v1 pattern) ----

function getOrCreateIdentity(): Identity {
  const stored = sessionStorage.getItem('editor-identity');
  if (stored) {
    try { return JSON.parse(stored); } catch { /* regenerate */ }
  }

  const adjectives = ['Swift', 'Bright', 'Calm', 'Bold', 'Keen', 'Warm', 'Cool', 'Sharp'];
  const animals = ['Falcon', 'Owl', 'Fox', 'Wolf', 'Bear', 'Hawk', 'Lynx', 'Crane'];
  const colors = ['#7aa2f7', '#9ece6a', '#e0af68', '#f7768e', '#bb9af7', '#2ac3de', '#ff9e64', '#73daca'];

  const identity: Identity = {
    userId: crypto.randomUUID(),
    name: `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${animals[Math.floor(Math.random() * animals.length)]}`,
    color: colors[Math.floor(Math.random() * colors.length)],
  };

  sessionStorage.setItem('editor-identity', JSON.stringify(identity));
  return identity;
}

const identity = getOrCreateIdentity();

// ---- Editor state ----

let activeFile: OpenFile | null = null;
let activeView: EditorView | null = null;
let activeYjs: YjsV2Handle | null = null;
let cleanupFns: (() => void)[] = [];

// ---- Toolbar app export ----

export default {
  id: 'doc-editor-v2',
  name: 'Edit Page',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,

  init(canvas: ShadowRoot, _app: any) {
    const editorPath = document.documentElement.getAttribute('data-editor-path');

    // Panel UI (minimal — just the "Edit" button in the toolbar panel)
    const windowEl = document.createElement('astro-dev-toolbar-window');
    const styles = document.createElement('style');
    styles.textContent = `
      astro-dev-toolbar-window { max-height: 80vh !important; overflow: hidden !important; }
      .panel-content { padding: 12px; font-family: system-ui, sans-serif; min-width: 220px; }
      .edit-btn {
        display: block; width: 100%; padding: 10px 16px; margin: 8px 0;
        background: rgba(99, 102, 241, 0.3); border: 1px solid rgba(99, 102, 241, 0.5);
        border-radius: 6px; color: #c0caf5; font-size: 14px; font-weight: 500;
        cursor: pointer; text-align: center; transition: background 0.15s;
      }
      .edit-btn:hover { background: rgba(99, 102, 241, 0.45); }
      .edit-btn:disabled { opacity: 0.5; cursor: default; }
      .panel-info { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 8px; }
    `;

    windowEl.innerHTML = `
      <div class="panel-content">
        <button class="edit-btn" id="ev2-open-btn" ${!editorPath ? 'disabled' : ''}>
          ${editorPath ? 'Open Editor' : 'No editable page'}
        </button>
        <div class="panel-info">
          ${editorPath ? editorPath.split('/').slice(-3).join('/') : 'Navigate to a doc page to edit'}
        </div>
      </div>
    `;

    canvas.appendChild(styles);
    canvas.appendChild(windowEl);

    const openBtn = windowEl.querySelector('#ev2-open-btn') as HTMLButtonElement;
    if (editorPath) {
      openBtn.addEventListener('click', () => openEditor(editorPath));
    }
  },
};

// ---- Open full-screen editor ----

async function openEditor(filePath: string) {
  // Determine content root from the file path
  const pathParts = filePath.split('/');
  let contentRootName = 'Documents';
  for (let i = pathParts.length - 1; i >= 0; i--) {
    if (['docs', 'blog', 'user-guide', 'dev-docs'].some(k => pathParts[i].includes(k))) {
      contentRootName = pathParts[i].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      break;
    }
  }

  const dom = createShell(contentRootName);
  if (!dom) return;

  // ---- Init subsystems ----

  // Preview panel
  const previewContent = dom.previewPanel.querySelector('#ev2-preview-content') as HTMLElement;
  const preview = initPreviewPanel(dom.previewPanel, previewContent, dom.previewToggle);
  cleanupFns.push(preview.cleanup);

  // Resize handles
  const sidebarResize = initResizeHandle(dom.sidebarResizeHandle, dom.sidebar, 'left', 'ev2-sidebar-width');
  const previewResize = initResizeHandle(dom.previewResizeHandle, dom.previewPanel, 'right', 'ev2-preview-width');
  cleanupFns.push(sidebarResize.cleanup, previewResize.cleanup);

  // Status indicator
  function updateStatus(status: SaveStatus) {
    dom.statusIndicator.className = `ev2-status ${status}`;
    dom.statusIndicator.textContent = status === 'saved' ? 'Saved' : status === 'unsaved' ? 'Unsaved' : 'Saving...';
  }

  // ---- Open file in CodeMirror ----

  await openFile(filePath, dom.editorContainer, preview, updateStatus);

  // ---- Save button ----

  const saveBtn = dom.headerBar.querySelector('#ev2-save-btn') as HTMLButtonElement;
  saveBtn.addEventListener('click', () => activeYjs?.save());

  // ---- Close button ----

  dom.closeBtn.addEventListener('click', closeEditor);

  // ---- Escape key (global) ----

  function onEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && !document.querySelector('.ev2-modal-backdrop')) {
      closeEditor();
    }
  }
  document.addEventListener('keydown', onEscape);
  cleanupFns.push(() => document.removeEventListener('keydown', onEscape));
}

// ---- Open a file in the editor pane ----

async function openFile(
  filePath: string,
  container: HTMLElement,
  preview: ReturnType<typeof initPreviewPanel>,
  updateStatus: (s: SaveStatus) => void,
) {
  // Cleanup previous file
  if (activeView) { activeView.destroy(); activeView = null; }
  if (activeYjs) { await activeYjs.close(); activeYjs = null; }

  // Clear container
  container.innerHTML = '<div style="padding:16px;color:var(--color-text-muted,#565f89)">Loading editor...</div>';

  // Start Yjs sync (opens server room)
  const yjs = initYjsClientV2({
    filePath,
    identity,
    onSynced: async () => {
      console.log('[editor-v2] Yjs synced, ytext length:', yjs.ytext.toString().length);
      // Yjs sync complete — mount CodeMirror
      container.innerHTML = '';

      try {
        // Lazy-load CodeMirror
        const { createEditorView, readOnlyCompartment } = await import('./core/codemirror-setup.js');
        const { createYjsExtensions } = await import('./core/codemirror-yjs.js');

        console.log('[editor-v2] CM6 modules loaded, creating extensions...');
        const yjsExtensions = createYjsExtensions(yjs.ytext, yjs.awareness);

        const initialContent = yjs.ytext.toString();
        console.log('[editor-v2] Creating EditorView in container:', container.id, container.offsetWidth, 'x', container.offsetHeight, 'initialDoc:', initialContent.length);
        const view = createEditorView({
          parent: container,
          onSave: () => yjs.save(),
          onClose: () => closeEditor(),
          readOnly: false,
          extensions: yjsExtensions,
          initialDoc: initialContent,
        });

        // Unlock editing
        view.dispatch({
          effects: readOnlyCompartment.reconfigure(
            (await import('@codemirror/state')).EditorState.readOnly.of(false)
          ),
        });

        console.log('[editor-v2] EditorView created, doc length:', view.state.doc.length);

        activeView = view;
        activeFile = {
          filePath,
          fileName: filePath.split('/').pop() || 'untitled',
          view,
          saveStatus: 'saved',
          dirty: false,
        };
      } catch (err) {
        console.error('[editor-v2] Failed to mount CodeMirror:', err);
        container.innerHTML = `<div style="padding:16px;color:#f7768e">Editor failed to load: ${err}</div>`;
      }
    },
    onRender: (html) => preview.setContent(html),
    onStatusChange: updateStatus,
  });

  activeYjs = yjs;
}

// ---- Close editor ----

async function closeEditor() {
  if (activeView) { activeView.destroy(); activeView = null; }
  if (activeYjs) { await activeYjs.close(); activeYjs = null; }
  activeFile = null;

  for (const fn of cleanupFns) fn();
  cleanupFns = [];

  const overlay = document.getElementById('editor-v2-overlay');
  if (overlay) overlay.remove();
}
