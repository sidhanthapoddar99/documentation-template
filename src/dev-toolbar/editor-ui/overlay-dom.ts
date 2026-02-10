// Build the full-screen editor overlay DOM and return typed refs

import type { EditorDom } from './types.js';
import { getEditorCSS } from './styles.js';

export interface OverlayResult {
  dom: EditorDom;
  themeCSS: string;
  contentCSS: string;
}

/**
 * Creates the full-screen editor overlay, appends it to document.body,
 * and returns all DOM refs needed by other modules.
 * Returns null if an overlay already exists (duplicate guard).
 */
export async function createEditorOverlay(filePath: string): Promise<OverlayResult | null> {
  if (document.getElementById('doc-editor-overlay')) return null;

  // Grab site theme CSS from the page (contains all CSS variables for light/dark)
  const themeStyleEl = document.getElementById('theme-styles');
  const themeCSS = themeStyleEl ? themeStyleEl.innerHTML : '';

  // Detect current color mode
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

  // Fetch content styles (markdown.css + docs body styles) from server
  let contentCSS = '';
  try {
    const res = await fetch('/__editor/styles');
    if (res.ok) contentCSS = await res.text();
  } catch { /* use fallback */ }

  const overlay = document.createElement('div');
  overlay.id = 'doc-editor-overlay';
  overlay.innerHTML = `
    <style>
      /* Inject site theme CSS variables so preview uses the real theme */
      ${themeCSS}
      ${getEditorCSS()}
    </style>

    <!-- Site content styles (markdown.css + docs body styles) scoped to preview -->
    <style>#doc-editor-overlay .editor-preview { ${contentCSS} }</style>
    <!-- Shiki dark mode override for editor preview (CSS nesting can't express ancestor data-theme) -->
    <style>
      #doc-editor-overlay[data-theme="dark"] .shiki,
      #doc-editor-overlay[data-theme="dark"] .shiki span {
        color: var(--shiki-dark) !important;
        background-color: var(--shiki-dark-bg) !important;
      }
    </style>

    <div class="editor-header">
      <span class="editor-filename">${filePath.split('/').slice(-3).join('/')}</span>
      <span class="editor-status saved" id="editor-status">Saved</span>
      <button class="editor-btn" id="editor-refresh">Refresh Preview</button>
      <button class="editor-btn primary" id="editor-save">Save</button>
      <button class="editor-btn" id="editor-close">Close</button>
    </div>
    <div class="editor-body">
      <div class="editor-pane-left">
        <div class="pane-header">Markdown</div>
        <div class="editor-input-wrap">
          <div class="editor-highlight" id="editor-highlight" aria-hidden="true"></div>
          <div class="editor-cursors" id="editor-cursors"></div>
          <textarea class="editor-textarea" id="editor-textarea" spellcheck="false"></textarea>
        </div>
      </div>
      <div class="editor-resize-handle" id="editor-resize"></div>
      <div class="editor-pane-right">
        <div class="pane-header">Preview</div>
        <div class="editor-preview" id="editor-preview">
          <div class="editor-loading">Loading...</div>
        </div>
      </div>
    </div>
  `;

  overlay.setAttribute('data-theme', currentTheme);
  document.body.appendChild(overlay);

  const dom: EditorDom = {
    overlay,
    textarea: overlay.querySelector('#editor-textarea') as HTMLTextAreaElement,
    highlightPre: overlay.querySelector('#editor-highlight') as HTMLDivElement,
    cursorsDiv: overlay.querySelector('#editor-cursors') as HTMLDivElement,
    preview: overlay.querySelector('#editor-preview') as HTMLDivElement,
    statusEl: overlay.querySelector('#editor-status') as HTMLSpanElement,
    refreshBtn: overlay.querySelector('#editor-refresh') as HTMLButtonElement,
    saveBtn: overlay.querySelector('#editor-save') as HTMLButtonElement,
    closeBtn: overlay.querySelector('#editor-close') as HTMLButtonElement,
    resizeHandle: overlay.querySelector('#editor-resize') as HTMLDivElement,
    leftPane: overlay.querySelector('.editor-pane-left') as HTMLDivElement,
    rightPane: overlay.querySelector('.editor-pane-right') as HTMLDivElement,
  };

  return { dom, themeCSS, contentCSS };
}
