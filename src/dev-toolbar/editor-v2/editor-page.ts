/**
 * Editor V2 — Page-based entry point
 *
 * Mounts into #editor-root at /editor?root=...
 * Pure black/white theme, Lucide icons, file tree, auto-open.
 */

import type { EditorView } from '@codemirror/view';
import type { SaveStatus, Identity } from './types.js';
import { initResizeHandle } from './layout/resize-handles.js';
import { initMenuBar, type ViewMode } from './layout/menubar.js';
import { initYjsClientV2, type YjsV2Handle } from './sync/yjs-client-v2.js';
import { getShellCSS } from './layout/shell-styles.js';
import { icon, fileIcon } from './layout/icons.js';
import { editorFetch } from './util/dom-helpers.js';

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

  // Inject shell CSS
  const styleEl = document.createElement('style');
  styleEl.textContent = getShellCSS();
  document.head.appendChild(styleEl);
  cleanupFns.push(() => styleEl.remove());

  // Load content CSS for the preview panel (markdown styles, code blocks, etc.)
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

  // Inject preview dark/light overrides for code blocks
  const previewThemeEl = document.createElement('style');
  previewThemeEl.textContent = getPreviewThemeCSS();
  document.head.appendChild(previewThemeEl);
  cleanupFns.push(() => previewThemeEl.remove());

  // Build shell
  root.innerHTML = `
    <div class="ev2-menubar-container" id="ev2-menubar-container"></div>
    <div class="ev2-header">
      <button class="ev2-icon-btn" id="ev2-sidebar-toggle" title="Toggle Sidebar">${icon('panel-left', 16)}</button>
      <span class="ev2-header-title">${opts.contentRootKey}</span>
      <span class="ev2-active-file" id="ev2-active-file"></span>
      <span style="flex:1"></span>
      <span class="ev2-status saved" id="ev2-status">Saved</span>
      <span class="ev2-user-badge" id="ev2-user-badge" style="background:${identity.color}15;color:${identity.color}">${identity.name}</span>
      <button class="ev2-icon-btn" id="ev2-theme-toggle" title="Toggle Theme">${icon(currentTheme === 'dark' ? 'sun' : 'moon', 16)}</button>
      <button class="ev2-btn primary" id="ev2-save-btn">${icon('save', 14)} Save</button>
      <button class="ev2-icon-btn" id="ev2-close-btn" title="Close">${icon('x', 16)}</button>
    </div>

    <div class="ev2-body">
      <div class="ev2-sidebar" id="ev2-sidebar">
        <div class="ev2-sidebar-header">
          <span>Explorer</span>
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
  `;

  // ---- DOM refs ----
  const sidebar = root.querySelector('#ev2-sidebar') as HTMLDivElement;
  const editorContainer = root.querySelector('#ev2-editor-container') as HTMLDivElement;
  const previewPane = root.querySelector('#ev2-preview-pane') as HTMLDivElement;
  const previewContent = root.querySelector('#ev2-preview-content') as HTMLElement;
  const menubarContainer = root.querySelector('#ev2-menubar-container') as HTMLDivElement;
  const editorPane = root.querySelector('.ev2-editor-pane') as HTMLDivElement;
  const wysiwygPane = root.querySelector('#ev2-wysiwyg-pane') as HTMLDivElement;
  const statusEl = root.querySelector('#ev2-status') as HTMLSpanElement;
  const activeFileEl = root.querySelector('#ev2-active-file') as HTMLSpanElement;
  const saveBtn = root.querySelector('#ev2-save-btn') as HTMLButtonElement;
  const closeBtn = root.querySelector('#ev2-close-btn') as HTMLButtonElement;
  const sidebarToggle = root.querySelector('#ev2-sidebar-toggle') as HTMLButtonElement;
  const themeToggle = root.querySelector('#ev2-theme-toggle') as HTMLButtonElement;
  const sidebarResizeHandle = root.querySelector('#ev2-sidebar-resize') as HTMLDivElement;
  const previewResizeHandle = root.querySelector('#ev2-preview-resize') as HTMLDivElement;
  const treeContainer = root.querySelector('#ev2-tree-container') as HTMLDivElement;

  // ---- Preview content handler ----
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
    toggle() { menubar.setViewMode(menubar.getViewMode() === 'split' ? 'source' : 'split'); },
    isCollapsed() { return menubar.getViewMode() === 'source' || menubar.getViewMode() === 'wysiwyg'; },
    cleanup() {},
  };

  // ---- View mode logic ----
  function applyViewMode(mode: ViewMode) {
    const showEditor = mode === 'source' || mode === 'split';
    const showPreview = mode === 'preview' || mode === 'split';
    const showWysiwyg = mode === 'wysiwyg';

    editorPane.style.display = showEditor ? 'flex' : 'none';
    previewPane.style.display = showPreview ? 'flex' : 'none';
    previewResizeHandle.style.display = (mode === 'split') ? 'block' : 'none';
    wysiwygPane.style.display = showWysiwyg ? 'flex' : 'none';

    if (mode === 'preview') {
      previewPane.style.width = '100%';
      previewPane.style.maxWidth = '100%';
      previewPane.style.borderLeft = 'none';
    } else {
      previewPane.style.width = '';
      previewPane.style.maxWidth = '';
      previewPane.style.borderLeft = '';
    }
  }

  // ---- Menu bar ----
  const menubar = initMenuBar(menubarContainer, {
    onSave: () => activeYjs?.save(),
    onClose: () => {
      closeCurrentFile();
      for (const fn of cleanupFns) fn();
      cleanupFns = [];
      window.location.href = opts.returnUrl;
    },
    onNewFile: () => { /* TODO: new file dialog */ },
    onViewModeChange: applyViewMode,
    onToggleSidebar: () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('ev2-sidebar-collapsed', String(sidebar.classList.contains('collapsed')));
    },
    onToggleTheme: toggleTheme,
    onUndo: () => { /* CM6 handles Ctrl+Z natively */ },
    onRedo: () => { /* CM6 handles Ctrl+Y natively */ },
    onFind: () => { /* CM6 handles Ctrl+F natively */ },
  });
  cleanupFns.push(menubar.cleanup);

  // Apply saved view mode
  applyViewMode(menubar.getViewMode());

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

  // ---- Theme toggle ----
  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-editor-theme', currentTheme);
    localStorage.setItem('ev2-theme', currentTheme);
    themeToggle.innerHTML = icon(currentTheme === 'dark' ? 'sun' : 'moon', 16);
    if (activeFilePath && activeYjs) {
      const fp = activeFilePath;
      openFile(fp, editorContainer, preview, updateStatus, activeFileEl, identity, currentTheme, previewContent);
    }
  }
  themeToggle.addEventListener('click', toggleTheme);

  // ---- File tree ----
  let treeData: any = null;
  try {
    const res = await fetch(`/__editor/tree?root=${encodeURIComponent(opts.contentRoot)}`);
    if (res.ok) {
      treeData = await res.json();
      renderFileTree(treeContainer, treeData, (filePath: string) => {
        openFile(filePath, editorContainer, preview, updateStatus, activeFileEl, identity, currentTheme, previewContent);
      });
    } else {
      treeContainer.innerHTML = `<div style="padding:12px;color:var(--ev-danger);font-size:12px">Failed to load tree</div>`;
    }
  } catch (err) {
    console.error('[editor-v2] Tree load failed:', err);
    treeContainer.innerHTML = `<div style="padding:12px;color:var(--ev-danger);font-size:12px">Failed to load tree</div>`;
  }

  // ---- Auto-open: find matching file from referrer ----
  if (treeData) {
    const referrer = document.referrer;
    if (referrer) {
      try {
        const refPath = new URL(referrer).pathname.replace(/\/$/, '');
        const file = findFileByUrlPath(treeData, refPath, opts.returnUrl);
        if (file) {
          highlightTreeItem(treeContainer, file.path);
          openFile(file.path, editorContainer, preview, updateStatus, activeFileEl, identity, currentTheme, previewContent);
        }
      } catch {}
    }
  }

  // ---- Save ----
  saveBtn.addEventListener('click', () => activeYjs?.save());

  // ---- Close ----
  closeBtn.addEventListener('click', () => {
    closeCurrentFile();
    for (const fn of cleanupFns) fn();
    cleanupFns = [];
    window.location.href = opts.returnUrl;
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

// ---- File tree rendering ----

function renderFileTree(container: HTMLElement, tree: any, onSelect: (path: string) => void) {
  container.innerHTML = '';
  const ul = document.createElement('ul');
  ul.className = 'ev2-tree';
  const children = tree.children || [];
  for (const node of children) {
    ul.appendChild(createTreeNode(node, onSelect));
  }
  container.appendChild(ul);
}

function createTreeNode(node: any, onSelect: (path: string) => void): HTMLLIElement {
  const li = document.createElement('li');

  if (node.type === 'folder') {
    li.className = 'ev2-tree-folder';
    const item = document.createElement('div');
    item.className = 'ev2-tree-item';
    item.innerHTML = `<span class="tree-chevron">${icon('chevron-right', 12)}</span><span class="tree-icon">${icon('folder', 15)}</span><span class="tree-name">${node.displayName || node.name}</span>`;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      li.classList.toggle('collapsed');
    });
    li.appendChild(item);

    if (node.children?.length) {
      const childUl = document.createElement('ul');
      for (const child of node.children) {
        childUl.appendChild(createTreeNode(child, onSelect));
      }
      li.appendChild(childUl);
    }
  } else {
    const item = document.createElement('div');
    item.className = 'ev2-tree-item';
    item.dataset.path = node.path;
    const displayName = node.frontmatter?.sidebar_label || node.frontmatter?.title || node.displayName || node.name;
    item.innerHTML = `<span class="tree-icon">${fileIcon(node.extension || '', 15)}</span><span class="tree-name">${displayName}</span>`;
    item.addEventListener('click', () => {
      document.querySelectorAll('.ev2-tree-item.active').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      onSelect(node.path);
    });
    li.appendChild(item);
  }

  return li;
}

function highlightTreeItem(container: HTMLElement, filePath: string) {
  const item = container.querySelector(`.ev2-tree-item[data-path="${CSS.escape(filePath)}"]`);
  if (item) {
    document.querySelectorAll('.ev2-tree-item.active').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
  }
}

function findFileByUrlPath(tree: any, urlPath: string, baseUrl: string): any | null {
  // Try matching URL path segments to file names
  const urlSlug = urlPath.replace(baseUrl + '/', '').replace(baseUrl, '');
  if (!urlSlug) return null;

  const slugParts = urlSlug.split('/').filter(Boolean);

  function search(nodes: any[]): any | null {
    for (const node of nodes) {
      if (node.type === 'file' && (node.extension === '.md' || node.extension === '.mdx')) {
        // Match by slug: remove XX_ prefix and extension from filename
        const nameSlug = node.name.replace(/^\d+_/, '').replace(/\.(md|mdx)$/, '');
        if (slugParts[slugParts.length - 1] === nameSlug) return node;
      }
      if (node.children) {
        const found = search(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  return search(tree.children || []);
}

// ---- Open file ----

async function openFile(
  filePath: string,
  container: HTMLElement,
  preview: ReturnType<typeof initPreviewPanel>,
  updateStatus: (s: SaveStatus) => void,
  activeFileEl: HTMLElement,
  identity: Identity,
  theme: 'dark' | 'light',
  previewContentEl?: HTMLElement,
) {
  await closeCurrentFile();

  activeFilePath = filePath;
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
          extensions: [...yjsExtensions, ...themeExtensions],
          initialDoc: yjs.ytext.toString(),
        });

        view.dispatch({
          effects: readOnlyCompartment.reconfigure(
            (await import('@codemirror/state')).EditorState.readOnly.of(false)
          ),
        });

        activeView = view;

        // Set up scroll sync between editor and preview
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

// ---- Preview theme CSS ----

function getPreviewThemeCSS(): string {
  return `
    /* Preview dark mode overrides */
    [data-editor-theme="dark"] .ev2-preview-content {
      color: #e0e0e0;
    }
    [data-editor-theme="dark"] .ev2-preview-content pre,
    [data-editor-theme="dark"] .ev2-preview-content code {
      background: #161616 !important;
      color: #e0e0e0 !important;
      border-color: #222 !important;
    }
    [data-editor-theme="dark"] .ev2-preview-content pre {
      padding: 12px 16px;
      border-radius: 4px;
      overflow-x: auto;
    }
    [data-editor-theme="dark"] .ev2-preview-content code {
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    [data-editor-theme="dark"] .ev2-preview-content pre code {
      padding: 0;
      background: transparent !important;
    }
    [data-editor-theme="dark"] .ev2-preview-content blockquote {
      border-left: 3px solid #333;
      color: #999;
    }
    [data-editor-theme="dark"] .ev2-preview-content table th,
    [data-editor-theme="dark"] .ev2-preview-content table td {
      border-color: #222;
    }
    [data-editor-theme="dark"] .ev2-preview-content table th {
      background: #161616;
    }
    [data-editor-theme="dark"] .ev2-preview-content table tr:nth-child(even) td {
      background: #111;
    }
    [data-editor-theme="dark"] .ev2-preview-content table tr:nth-child(odd) td {
      background: transparent;
    }
    [data-editor-theme="dark"] .ev2-preview-content a {
      color: #7aa2f7;
    }
    [data-editor-theme="dark"] .ev2-preview-content h1,
    [data-editor-theme="dark"] .ev2-preview-content h2,
    [data-editor-theme="dark"] .ev2-preview-content h3,
    [data-editor-theme="dark"] .ev2-preview-content h4,
    [data-editor-theme="dark"] .ev2-preview-content h5,
    [data-editor-theme="dark"] .ev2-preview-content h6 {
      color: #ffffff;
    }
    [data-editor-theme="dark"] .ev2-preview-content hr {
      border-color: #222;
    }
    [data-editor-theme="dark"] .ev2-preview-content img {
      border-radius: 4px;
    }
    /* Shiki dark mode */
    [data-editor-theme="dark"] .ev2-preview-content .shiki,
    [data-editor-theme="dark"] .ev2-preview-content .shiki span {
      color: var(--shiki-dark, inherit) !important;
      background-color: var(--shiki-dark-bg, #161616) !important;
    }

    /* Preview light mode */
    [data-editor-theme="light"] .ev2-preview-content {
      color: #1a1a1a;
    }
    [data-editor-theme="light"] .ev2-preview-content pre,
    [data-editor-theme="light"] .ev2-preview-content code {
      background: #f5f5f5 !important;
      border-color: #e5e5e5 !important;
    }
    [data-editor-theme="light"] .ev2-preview-content pre {
      padding: 12px 16px;
      border-radius: 4px;
      overflow-x: auto;
    }
    [data-editor-theme="light"] .ev2-preview-content code {
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    [data-editor-theme="light"] .ev2-preview-content pre code {
      padding: 0;
      background: transparent !important;
    }

    /* Preview content spacing */
    .ev2-preview-content .docs-body {
      max-width: none;
      padding: 0;
    }
    .ev2-preview-content .docs-body h1 { font-size: 1.8em; margin: 0.8em 0 0.4em; }
    .ev2-preview-content .docs-body h2 { font-size: 1.4em; margin: 0.7em 0 0.35em; }
    .ev2-preview-content .docs-body h3 { font-size: 1.15em; margin: 0.6em 0 0.3em; }
    .ev2-preview-content .docs-body p { margin: 0.5em 0; line-height: 1.6; }
    .ev2-preview-content .docs-body ul,
    .ev2-preview-content .docs-body ol { margin: 0.5em 0; padding-left: 1.5em; }
    .ev2-preview-content .docs-body li { margin: 0.25em 0; line-height: 1.6; }
    .ev2-preview-content .docs-body pre { margin: 0.8em 0; }
    .ev2-preview-content .docs-body table { margin: 0.8em 0; border-collapse: collapse; width: 100%; }
    .ev2-preview-content .docs-body table th,
    .ev2-preview-content .docs-body table td { padding: 6px 12px; border: 1px solid; text-align: left; }
    .ev2-preview-content .docs-body blockquote { margin: 0.8em 0; padding: 0.5em 1em; }
    .ev2-preview-content .docs-body hr { margin: 1.5em 0; border: none; border-top: 1px solid; }
  `;
}

// ---- Close ----

async function closeCurrentFile() {
  if (scrollSyncCleanup) scrollSyncCleanup();
  if (activeView) { activeView.destroy(); activeView = null; }
  if (activeYjs) { await activeYjs.close(); activeYjs = null; }
  activeFilePath = null;
}
