/**
 * Editor V2 — Page-based entry point
 *
 * Mounts into #editor-root at /editor?root=...
 * Pure black/white theme, Lucide icons, file tree, auto-open.
 */

import type { EditorView } from '@codemirror/view';
import type { SaveStatus, Identity } from './types.js';
import { initPreviewPanel } from './layout/preview-panel.js';
import { initResizeHandle } from './layout/resize-handles.js';
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

  // Inject CSS
  const styleEl = document.createElement('style');
  styleEl.textContent = getShellCSS();
  document.head.appendChild(styleEl);
  cleanupFns.push(() => styleEl.remove());

  // Build shell
  root.innerHTML = `
    <div class="ev2-header">
      <button class="ev2-icon-btn" id="ev2-sidebar-toggle" title="Toggle Explorer">${icon('panel-left', 16)}</button>
      <span class="ev2-header-title">${opts.contentRootKey}</span>
      <span class="ev2-active-file" id="ev2-active-file"></span>
      <span style="flex:1"></span>
      <span class="ev2-status saved" id="ev2-status">Saved</span>
      <span class="ev2-user-badge" id="ev2-user-badge" style="background:${identity.color}15;color:${identity.color}">${identity.name}</span>
      <button class="ev2-icon-btn" id="ev2-theme-toggle" title="Toggle Theme">${icon(currentTheme === 'dark' ? 'sun' : 'moon', 16)}</button>
      <button class="ev2-btn" id="ev2-preview-toggle">${icon('eye', 14)} Preview</button>
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
          <div style="color:var(--ev-text-faint);padding:16px;font-style:italic">Open a file to preview</div>
        </div>
      </div>
    </div>
  `;

  // ---- DOM refs ----
  const sidebar = root.querySelector('#ev2-sidebar') as HTMLDivElement;
  const editorContainer = root.querySelector('#ev2-editor-container') as HTMLDivElement;
  const previewPane = root.querySelector('#ev2-preview-pane') as HTMLDivElement;
  const previewContent = root.querySelector('#ev2-preview-content') as HTMLElement;
  const previewToggleBtn = root.querySelector('#ev2-preview-toggle') as HTMLButtonElement;
  const statusEl = root.querySelector('#ev2-status') as HTMLSpanElement;
  const activeFileEl = root.querySelector('#ev2-active-file') as HTMLSpanElement;
  const saveBtn = root.querySelector('#ev2-save-btn') as HTMLButtonElement;
  const closeBtn = root.querySelector('#ev2-close-btn') as HTMLButtonElement;
  const sidebarToggle = root.querySelector('#ev2-sidebar-toggle') as HTMLButtonElement;
  const themeToggle = root.querySelector('#ev2-theme-toggle') as HTMLButtonElement;
  const sidebarResizeHandle = root.querySelector('#ev2-sidebar-resize') as HTMLDivElement;
  const previewResizeHandle = root.querySelector('#ev2-preview-resize') as HTMLDivElement;
  const treeContainer = root.querySelector('#ev2-tree-container') as HTMLDivElement;

  // ---- Preview ----
  const preview = initPreviewPanel(previewPane, previewContent, previewToggleBtn);
  cleanupFns.push(preview.cleanup);

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
  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-editor-theme', currentTheme);
    localStorage.setItem('ev2-theme', currentTheme);
    themeToggle.innerHTML = icon(currentTheme === 'dark' ? 'sun' : 'moon', 16);
    // Recreate CM6 view with new theme if a file is open
    if (activeFilePath && activeYjs) {
      const fp = activeFilePath;
      openFile(fp, editorContainer, preview, updateStatus, activeFileEl, identity, currentTheme);
    }
  });

  // ---- File tree ----
  let treeData: any = null;
  try {
    const res = await fetch(`/__editor/tree?root=${encodeURIComponent(opts.contentRoot)}`);
    if (res.ok) {
      treeData = await res.json();
      renderFileTree(treeContainer, treeData, (filePath: string) => {
        openFile(filePath, editorContainer, preview, updateStatus, activeFileEl, identity, currentTheme);
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
          openFile(file.path, editorContainer, preview, updateStatus, activeFileEl, identity, currentTheme);
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

// ---- Close ----

async function closeCurrentFile() {
  if (activeView) { activeView.destroy(); activeView = null; }
  if (activeYjs) { await activeYjs.close(); activeYjs = null; }
  activeFilePath = null;
}
