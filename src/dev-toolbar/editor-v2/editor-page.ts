/**
 * Editor V2 — Page-based entry point
 *
 * Mounts into #editor-root at /editor?root=...
 * Orchestrates: menubar, file tree, CM6 editor, Yjs sync, preview.
 */

import type { EditorView } from '@codemirror/view';
import type { SaveStatus, Identity } from './types.js';
import { initResizeHandle } from './layout/resize-handles.js';
import { initMenuBar, type ViewMode, type SplitDirection } from './layout/menubar.js';
import { initYjsClientV2, type YjsV2Handle } from './sync/yjs-client-v2.js';
import { renderFileTree, highlightTreeItem, findFileByUrlPath, filePathToUrl } from './file-tree/file-tree.js';
import { icon } from './layout/icons.js';

// CSS — Vite injects these as <style> tags
import './styles/editor.css';
import './styles/preview.css';

// ---- Identity ----

function getOrCreateIdentity(): Identity {
  const stored = sessionStorage.getItem('editor-identity');
  if (stored) { try { return JSON.parse(stored); } catch {} }
  const adj = ['Swift','Bright','Calm','Bold','Keen','Warm','Cool','Sharp'];
  const animals = ['Falcon','Owl','Fox','Wolf','Bear','Hawk','Lynx','Crane'];
  const colors = ['#7ec699','#d4bfff','#f0c674','#e55561','#7aa2f7','#a8cc8c','#d4a017','#e0e0e0'];
  const identity: Identity = {
    userId: crypto.randomUUID(),
    name: `${adj[Math.floor(Math.random()*adj.length)]} ${animals[Math.floor(Math.random()*animals.length)]}`,
    color: colors[Math.floor(Math.random()*colors.length)],
  };
  sessionStorage.setItem('editor-identity', JSON.stringify(identity));
  return identity;
}

// ---- State ----
let activeView: EditorView | null = null;
let activeYjs: YjsV2Handle | null = null;
let activeFilePath: string | null = null;
let cleanupFns: (() => void)[] = [];

export interface MountOptions {
  contentRoot: string;
  contentRootKey: string;
  slug: string;
  returnUrl: string;
}

export async function mountEditor(root: HTMLElement, opts: MountOptions) {
  const identity = getOrCreateIdentity();

  // Theme: respect saved preference or system
  const savedTheme = localStorage.getItem('ev2-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let currentTheme: 'dark' | 'light' = (savedTheme as any) || (prefersDark ? 'dark' : 'light');
  root.setAttribute('data-editor-theme', currentTheme);

  // Load content CSS for the preview panel (markdown styles from the site theme)
  try {
    const cssRes = await fetch('/__editor/styles');
    if (cssRes.ok) {
      const contentCSS = await cssRes.text();
      const contentStyleEl = document.createElement('style');
      contentStyleEl.textContent = contentCSS;
      document.head.appendChild(contentStyleEl);
      cleanupFns.push(() => contentStyleEl.remove());
    }
  } catch {}

  // Build shell
  root.innerHTML = `
    <div class="ev2-menubar-container" id="ev2-menubar-container"></div>

    <div class="ev2-body">
      <div class="ev2-sidebar" id="ev2-sidebar">
        <div class="ev2-sidebar-header">
          <span>${opts.contentRootKey}</span>
          <div class="ev2-sidebar-actions">
            <button class="ev2-icon-btn" id="ev2-new-file" title="New File">${icon('plus', 14)}</button>
          </div>
        </div>
        <div class="ev2-tree-container" id="ev2-tree-container">
          <div class="ev2-skeleton"></div>
          <div class="ev2-skeleton" style="width:70%"></div>
          <div class="ev2-skeleton" style="width:85%"></div>
          <div class="ev2-skeleton" style="width:60%"></div>
        </div>
      </div>

      <div class="ev2-resize-handle" id="ev2-sidebar-resize"></div>

      <button class="ev2-sidebar-float-toggle" id="ev2-sidebar-toggle" title="Toggle Sidebar">${icon('chevron-left', 14)}</button>

      <div class="ev2-split-area" id="ev2-split-area">
        <div class="ev2-editor-pane">
          <div class="ev2-editor-container" id="ev2-editor-container">
            <div class="ev2-editor-empty">Select a file from the explorer</div>
          </div>
        </div>

        <div class="ev2-resize-handle" id="ev2-preview-resize"></div>

        <div class="ev2-preview-pane" id="ev2-preview-pane">
          <div class="ev2-preview-header"><span>Preview</span></div>
          <div class="ev2-preview-content" id="ev2-preview-content">
            <div style="color:var(--ev-text-faint);padding:24px;font-style:italic">Open a file to preview</div>
          </div>
        </div>

        <div class="ev2-wysiwyg-pane" id="ev2-wysiwyg-pane" style="display:none">
          <div class="ev2-wysiwyg-placeholder">
            <div style="text-align:center;padding:48px 24px;">
              <div style="font-size:32px;margin-bottom:12px;opacity:0.3">${icon('heading', 32)}</div>
              <div style="font-size:15px;font-weight:500;margin-bottom:6px;color:var(--ev-text)">WYSIWYG Mode</div>
              <div style="font-size:13px;color:var(--ev-text-muted)">Rich text editing coming soon.</div>
              <div style="font-size:12px;color:var(--ev-text-faint);margin-top:4px">Use Source or Preview mode for now.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ---- DOM refs ----
  const sidebar = root.querySelector('#ev2-sidebar') as HTMLDivElement;
  const editorContainer = root.querySelector('#ev2-editor-container') as HTMLDivElement;
  const previewPane = root.querySelector('#ev2-preview-pane') as HTMLDivElement;
  const previewContent = root.querySelector('#ev2-preview-content') as HTMLElement;
  const menubarContainer = root.querySelector('#ev2-menubar-container') as HTMLDivElement;
  const editorPane = root.querySelector('.ev2-editor-pane') as HTMLDivElement;
  const wysiwygPane = root.querySelector('#ev2-wysiwyg-pane') as HTMLDivElement;
  const sidebarToggle = root.querySelector('#ev2-sidebar-toggle') as HTMLButtonElement;
  const sidebarResizeHandle = root.querySelector('#ev2-sidebar-resize') as HTMLDivElement;
  const previewResizeHandle = root.querySelector('#ev2-preview-resize') as HTMLDivElement;
  const treeContainer = root.querySelector('#ev2-tree-container') as HTMLDivElement;

  // ---- Preview ----
  let lastPreviewHtml = '';
  const preview = {
    setContent(html: string) {
      if (html === lastPreviewHtml) return;
      lastPreviewHtml = html;
      const scrollTop = previewContent.scrollTop;
      previewContent.innerHTML = `<div class="docs-content"><article class="docs-article"><div class="docs-body markdown-content">${html}</div></article></div>`;
      previewContent.scrollTop = scrollTop;
      document.dispatchEvent(new CustomEvent('diagrams:render'));
    },
  };

  // ---- Split direction ----
  const splitArea = root.querySelector('#ev2-split-area') as HTMLDivElement;
  let currentSplitDir: SplitDirection = (localStorage.getItem('ev2-split-dir') as SplitDirection) || 'vertical';

  function applySplitDirection(dir: SplitDirection) {
    currentSplitDir = dir;
    splitArea.classList.toggle('horizontal', dir === 'horizontal');
  }

  // ---- View mode ----
  function applyViewMode(mode: ViewMode) {
    const showEditor = mode === 'source' || mode === 'split';
    const showPreview = mode === 'preview' || mode === 'split';
    const showWysiwyg = mode === 'wysiwyg';

    editorPane.style.display = showEditor ? 'flex' : 'none';
    previewPane.style.display = showPreview ? 'flex' : 'none';
    previewResizeHandle.style.display = (mode === 'split') ? 'block' : 'none';
    wysiwygPane.style.display = showWysiwyg ? 'flex' : 'none';

    if (mode === 'preview') {
      previewPane.style.width = '';
      previewPane.style.maxWidth = '';
      previewPane.style.height = '';
      previewPane.style.borderLeft = 'none';
      previewPane.style.borderTop = 'none';
      editorPane.style.display = 'none';
    } else if (mode === 'split') {
      applySplitDirection(currentSplitDir);
      previewPane.style.borderLeft = '';
      previewPane.style.borderTop = '';
    } else {
      previewPane.style.width = '';
      previewPane.style.maxWidth = '';
      previewPane.style.height = '';
      previewPane.style.borderLeft = '';
      previewPane.style.borderTop = '';
    }
  }

  // ---- Word wrap ----
  async function toggleWordWrap(wrap: boolean) {
    if (!activeView) return;
    const { lineWrappingCompartment } = await import('./core/codemirror-setup.js');
    const { EditorView: EV } = await import('@codemirror/view');
    if (!activeView) return;
    activeView.dispatch({
      effects: lineWrappingCompartment.reconfigure(wrap ? EV.lineWrapping : []),
    });
  }

  // ---- Theme toggle ----
  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-editor-theme', currentTheme);
    localStorage.setItem('ev2-theme', currentTheme);
    themeToggle.innerHTML = icon(currentTheme === 'dark' ? 'sun' : 'moon', 16);
    if (activeFilePath && activeYjs) {
      openFile(activeFilePath, editorContainer, preview, updateStatus, activeFileEl, identity, currentTheme, previewContent, menubar.getWordWrap());
    }
  }

  // ---- Menu bar ----
  const menubar = initMenuBar(menubarContainer, {
    onSave: () => activeYjs?.save(),
    onClose: () => {
      const returnTo = activeFilePath
        ? filePathToUrl(activeFilePath, opts.contentRoot, opts.returnUrl)
        : opts.returnUrl;
      sessionStorage.removeItem('ev2-open-file');
      closeCurrentFile();
      for (const fn of cleanupFns) fn();
      cleanupFns = [];
      window.location.href = returnTo;
    },
    onNewFile: () => { /* TODO: new file dialog */ },
    onViewModeChange: applyViewMode,
    onToggleSidebar: () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('ev2-sidebar-collapsed', String(sidebar.classList.contains('collapsed')));
    },
    onToggleTheme: toggleTheme,
    onToggleWordWrap: toggleWordWrap,
    onSplitDirectionChange: (dir) => {
      currentSplitDir = dir;
      applySplitDirection(dir);
    },
    onUndo: () => {},
    onRedo: () => {},
    onFind: () => {},
  });
  cleanupFns.push(menubar.cleanup);

  // ---- Menubar right side ----
  const menubarRight = root.querySelector('#ev2-menubar-right') as HTMLDivElement;
  menubarRight.innerHTML = `
    <span class="ev2-active-file" id="ev2-active-file"></span>
    <span class="ev2-status saved" id="ev2-status">Saved</span>
    <span class="ev2-user-badge" id="ev2-user-badge" style="background:${identity.color}15;color:${identity.color}">${identity.name}</span>
    <button class="ev2-icon-btn" id="ev2-theme-toggle" title="Toggle Theme">${icon(currentTheme === 'dark' ? 'sun' : 'moon', 16)}</button>
    <button class="ev2-btn primary" id="ev2-save-btn">${icon('save', 14)} Save</button>
    <button class="ev2-icon-btn" id="ev2-close-btn" title="Close">${icon('x', 16)}</button>
  `;
  const statusEl = root.querySelector('#ev2-status') as HTMLSpanElement;
  const activeFileEl = root.querySelector('#ev2-active-file') as HTMLSpanElement;
  const saveBtn = root.querySelector('#ev2-save-btn') as HTMLButtonElement;
  const closeBtn = root.querySelector('#ev2-close-btn') as HTMLButtonElement;
  const themeToggle = root.querySelector('#ev2-theme-toggle') as HTMLButtonElement;

  applyViewMode(menubar.getViewMode());
  applySplitDirection(menubar.getSplitDirection());

  // ---- Resize handles ----
  const sr = initResizeHandle(sidebarResizeHandle, sidebar, 'left', 'ev2-sidebar-width');
  const pr = initResizeHandle(previewResizeHandle, previewPane, 'right', 'ev2-preview-width');
  cleanupFns.push(sr.cleanup, pr.cleanup);

  // ---- Status ----
  function updateStatus(status: SaveStatus) {
    statusEl.className = `ev2-status ${status}`;
    statusEl.textContent = status === 'saved' ? 'Saved' : status === 'unsaved' ? 'Unsaved' : 'Saving...';
  }

  // ---- Sidebar toggle ----
  const sidebarCollapsed = localStorage.getItem('ev2-sidebar-collapsed') === 'true';
  if (sidebarCollapsed) sidebar.classList.add('collapsed');
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('ev2-sidebar-collapsed', String(sidebar.classList.contains('collapsed')));
  });

  // ---- Theme toggle button ----
  themeToggle.addEventListener('click', toggleTheme);

  // ---- File tree ----
  let treeData: any = null;
  try {
    const res = await fetch(`/__editor/tree?root=${encodeURIComponent(opts.contentRoot)}`);
    if (res.ok) {
      treeData = await res.json();
      renderFileTree(treeContainer, treeData, {
        onSelect: (filePath: string) => {
          openFile(filePath, editorContainer, preview, updateStatus, activeFileEl, identity, currentTheme, previewContent, menubar.getWordWrap());
        },
      });
    } else {
      treeContainer.innerHTML = `<div style="padding:12px;color:var(--ev-danger);font-size:12px">Failed to load tree</div>`;
    }
  } catch (err) {
    console.error('[editor-v2] Tree load failed:', err);
    treeContainer.innerHTML = `<div style="padding:12px;color:var(--ev-danger);font-size:12px">Failed to load tree</div>`;
  }

  // ---- Auto-open: session (HMR) > last doc page > referrer ----
  if (treeData) {
    let autoOpenPath: string | null = null;

    // 1. Session — same file was open before HMR / reload
    const sessionFile = sessionStorage.getItem('ev2-open-file');
    if (sessionFile) {
      autoOpenPath = sessionFile;
    }

    // 2. Last doc page — stored by the toolbar when navigating to editor
    if (!autoOpenPath) {
      const lastDocPath = sessionStorage.getItem('ev2-last-doc-path');
      if (lastDocPath) {
        const file = findFileByUrlPath(treeData, lastDocPath, opts.returnUrl);
        if (file) autoOpenPath = file.path;
      }
    }

    // 3. Referrer — came from a doc page
    if (!autoOpenPath && document.referrer) {
      try {
        const refPath = new URL(document.referrer).pathname.replace(/\/$/, '');
        const file = findFileByUrlPath(treeData, refPath, opts.returnUrl);
        if (file) autoOpenPath = file.path;
      } catch {}
    }

    if (autoOpenPath) {
      highlightTreeItem(treeContainer, autoOpenPath);
      openFile(autoOpenPath, editorContainer, preview, updateStatus, activeFileEl, identity, currentTheme, previewContent, menubar.getWordWrap());
    }
  }

  // ---- Save / Close buttons ----
  saveBtn.addEventListener('click', () => activeYjs?.save());
  closeBtn.addEventListener('click', () => {
    const returnTo = activeFilePath
      ? filePathToUrl(activeFilePath, opts.contentRoot, opts.returnUrl)
      : opts.returnUrl;
    sessionStorage.removeItem('ev2-open-file');
    closeCurrentFile();
    for (const fn of cleanupFns) fn();
    cleanupFns = [];
    window.location.href = returnTo;
  });

  // ---- Keyboard shortcuts ----
  function onKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      activeYjs?.save();
    }
  }
  document.addEventListener('keydown', onKeydown);
  cleanupFns.push(() => document.removeEventListener('keydown', onKeydown));
}

// ---- Open file ----

interface PreviewHandle { setContent(html: string): void }

async function openFile(
  filePath: string,
  container: HTMLElement,
  preview: PreviewHandle,
  updateStatus: (s: SaveStatus) => void,
  activeFileEl: HTMLElement,
  identity: Identity,
  theme: 'dark' | 'light',
  previewContentEl?: HTMLElement,
  wordWrap?: boolean,
) {
  await closeCurrentFile();

  activeFilePath = filePath;
  // Persist to session so HMR and navigation preserve state
  sessionStorage.setItem('ev2-open-file', filePath);
  const shortName = filePath.split('/').slice(-2).join('/');
  activeFileEl.textContent = shortName;
  container.innerHTML = '<div class="ev2-editor-empty">Loading...</div>';

  const yjs = initYjsClientV2({
    filePath,
    identity,
    onSynced: async () => {
      container.innerHTML = '';
      try {
        const { createEditorView, readOnlyCompartment } = await import('./core/codemirror-setup.js');
        const { createYjsExtensions } = await import('./core/codemirror-yjs.js');
        const { darkTheme, lightTheme } = await import('./core/editor-theme.js');

        const yjsExtensions = createYjsExtensions(yjs.ytext, yjs.awareness);
        const themeExtensions = theme === 'dark' ? darkTheme() : lightTheme();

        const view = createEditorView({
          parent: container,
          onSave: () => yjs.save(),
          onClose: () => {},
          readOnly: false,
          wordWrap: wordWrap !== false,
          extensions: [...yjsExtensions, ...themeExtensions],
          initialDoc: yjs.ytext.toString(),
        });

        view.dispatch({
          effects: readOnlyCompartment.reconfigure(
            (await import('@codemirror/state')).EditorState.readOnly.of(false)
          ),
        });

        activeView = view;

        if (previewContentEl) setupScrollSync(view, previewContentEl);
      } catch (err) {
        console.error('[editor-v2] Failed to mount:', err);
        container.innerHTML = `<div class="ev2-editor-empty" style="color:var(--ev-danger)">Failed: ${err}</div>`;
      }
    },
    onRender: (html) => preview.setContent(html),
    onStatusChange: updateStatus,
  });

  activeYjs = yjs;
}

// ---- Scroll sync ----

let scrollSyncSource: 'none' | 'editor' | 'preview' = 'none';
let scrollSyncCleanup: (() => void) | null = null;

function setupScrollSync(view: EditorView, previewEl: HTMLElement) {
  if (scrollSyncCleanup) scrollSyncCleanup();

  const editorScroller = view.scrollDOM;

  function onEditorScroll() {
    if (scrollSyncSource === 'preview') return;
    scrollSyncSource = 'editor';
    const maxScroll = editorScroller.scrollHeight - editorScroller.clientHeight;
    if (maxScroll > 0) {
      const ratio = editorScroller.scrollTop / maxScroll;
      const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
      previewEl.scrollTop = ratio * previewMax;
    }
    requestAnimationFrame(() => { scrollSyncSource = 'none'; });
  }

  function onPreviewScroll() {
    if (scrollSyncSource === 'editor') return;
    scrollSyncSource = 'preview';
    const maxScroll = previewEl.scrollHeight - previewEl.clientHeight;
    if (maxScroll > 0) {
      const ratio = previewEl.scrollTop / maxScroll;
      const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
      editorScroller.scrollTop = ratio * editorMax;
    }
    requestAnimationFrame(() => { scrollSyncSource = 'none'; });
  }

  editorScroller.addEventListener('scroll', onEditorScroll);
  previewEl.addEventListener('scroll', onPreviewScroll);

  scrollSyncCleanup = () => {
    editorScroller.removeEventListener('scroll', onEditorScroll);
    previewEl.removeEventListener('scroll', onPreviewScroll);
    scrollSyncCleanup = null;
  };
}

// ---- Close ----

async function closeCurrentFile() {
  if (scrollSyncCleanup) scrollSyncCleanup();
  if (activeView) { activeView.destroy(); activeView = null; }
  if (activeYjs) { await activeYjs.close(); activeYjs = null; }
  activeFilePath = null;
}
