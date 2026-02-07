/**
 * Dev Toolbar - Live Documentation Editor
 *
 * Overleaf-style split-pane editor for docs/blog pages.
 * Left pane: syntax-highlighted markdown editor (textarea + highlight overlay)
 * Right pane: live-rendered HTML preview
 * Scroll sync: both panes scroll proportionally together
 *
 * Only active on pages with a `data-editor-path` attribute (docs/blog).
 * Full-screen overlay appended to document.body for proper viewport coverage.
 */

type SaveStatus = 'saved' | 'unsaved' | 'saving';

export default {
  id: 'doc-editor',
  name: 'Edit Page',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,

  async init(canvas: ShadowRoot, app: any, _server: any) {
    // Get the editor path from the document
    const editorPath = document.documentElement.getAttribute('data-editor-path');

    // Create the toolbar panel
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
        min-width: 220px;
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

// ============================================================================
// Markdown Syntax Highlighting
// ============================================================================

/**
 * Highlight markdown syntax by wrapping tokens in colored spans.
 * Input must be HTML-escaped first. Returns HTML string.
 */
function highlightMarkdown(text: string): string {
  // HTML-escape the raw text first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Process line by line to handle block-level syntax
  const lines = html.split('\n');
  let inCodeBlock = false;
  let inFrontmatter = false;
  let frontmatterDashCount = 0;

  const result = lines.map((line, i) => {
    // Frontmatter detection (--- at start and end)
    if (i === 0 && line === '---') {
      inFrontmatter = true;
      frontmatterDashCount = 1;
      return `<span class="hl-frontmatter">${line}</span>`;
    }
    if (inFrontmatter) {
      if (line === '---') {
        frontmatterDashCount++;
        if (frontmatterDashCount >= 2) inFrontmatter = false;
      }
      return `<span class="hl-frontmatter">${line}</span>`;
    }

    // Fenced code blocks
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return `<span class="hl-codeblock">${line}</span>`;
    }
    if (inCodeBlock) {
      return `<span class="hl-codeblock">${line}</span>`;
    }

    // Headings: # ## ### etc.
    const headingMatch = line.match(/^(#{1,6}\s)/);
    if (headingMatch) {
      return `<span class="hl-heading">${line}</span>`;
    }

    // Blockquotes: > text
    if (line.match(/^\s*&gt;\s/)) {
      return `<span class="hl-blockquote">${line}</span>`;
    }

    // Horizontal rule: --- or *** or ___
    if (line.match(/^\s*[-*_](\s*[-*_]){2,}\s*$/)) {
      return `<span class="hl-hr">${line}</span>`;
    }

    // List items: - item, * item, 1. item
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s/);
    if (listMatch) {
      const prefix = line.substring(0, listMatch[0].length);
      const rest = line.substring(listMatch[0].length);
      return `<span class="hl-list-marker">${prefix}</span>${highlightInline(rest)}`;
    }

    // Regular line — apply inline highlighting
    return highlightInline(line);
  });

  return result.join('\n');
}

/**
 * Highlight inline markdown syntax: bold, italic, code, links, images
 */
function highlightInline(line: string): string {
  // Process inline patterns with a single pass using replacements
  // Order matters: bold before italic, code before others

  // Inline code: `code`
  line = line.replace(/(`[^`]+`)/g, '<span class="hl-code">$1</span>');

  // Bold: **text** or __text__
  line = line.replace(/(\*\*[^*]+\*\*|__[^_]+__)/g, '<span class="hl-bold">$1</span>');

  // Italic: *text* or _text_ (but not inside bold/code spans)
  line = line.replace(/(?<![*_])(\*[^*]+\*|_[^_]+_)(?![*_])/g, '<span class="hl-italic">$1</span>');

  // Images: ![alt](url)
  line = line.replace(/(!\[[^\]]*\]\([^)]*\))/g, '<span class="hl-image">$1</span>');

  // Links: [text](url)
  line = line.replace(/(?<!!)(\[[^\]]*\]\([^)]*\))/g, '<span class="hl-link">$1</span>');

  return line;
}

// ============================================================================
// Full-screen editor overlay
// ============================================================================

async function openFullScreenEditor(filePath: string) {
  // Prevent duplicate overlays
  if (document.getElementById('doc-editor-overlay')) return;

  let saveStatus: SaveStatus = 'saved';
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

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

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'doc-editor-overlay';
  overlay.innerHTML = `
    <style>
      /* Inject site theme CSS variables so preview uses the real theme */
      ${themeCSS}

      #doc-editor-overlay {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        background: var(--color-bg-secondary, #1a1b26);
        color: var(--color-text-primary, #c0caf5);
        font-family: var(--font-family-base, system-ui, -apple-system, sans-serif);
      }

      .editor-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        background: var(--color-bg-primary, #16161e);
        border-bottom: 1px solid var(--color-border-default, #292e42);
        min-height: 44px;
        flex-shrink: 0;
      }

      .editor-filename {
        font-size: 13px;
        font-weight: 500;
        color: var(--color-brand-primary, #7aa2f7);
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .editor-status {
        font-size: 11px;
        padding: 3px 8px;
        border-radius: var(--border-radius-sm, 4px);
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .editor-status.saved {
        background: rgba(40, 167, 69, 0.15);
        color: var(--color-success, #73daca);
      }

      .editor-status.unsaved {
        background: rgba(255, 193, 7, 0.15);
        color: var(--color-warning, #ff9e64);
      }

      .editor-status.saving {
        background: rgba(255, 193, 7, 0.1);
        color: var(--color-info, #e0af68);
      }

      .editor-btn {
        padding: 6px 12px;
        border: 1px solid var(--color-border-default, #292e42);
        border-radius: var(--border-radius-sm, 4px);
        background: var(--color-bg-tertiary, #24283b);
        color: var(--color-text-primary, #c0caf5);
        cursor: pointer;
        font-size: 12px;
        transition: all var(--transition-fast, 0.15s ease);
      }

      .editor-btn:hover {
        background: var(--color-bg-secondary, #292e42);
        border-color: var(--color-border-light, #414868);
      }

      .editor-btn.primary {
        background: rgba(99, 102, 241, 0.25);
        border-color: rgba(99, 102, 241, 0.5);
        color: var(--color-brand-primary, #a5b4fc);
      }

      .editor-btn.primary:hover {
        background: rgba(99, 102, 241, 0.35);
      }

      .editor-body {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      .editor-pane-left {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .editor-pane-right {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .pane-header {
        padding: 6px 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-muted, #565f89);
        background: var(--color-bg-secondary, #1a1b26);
        border-bottom: 1px solid var(--color-border-default, #292e42);
        flex-shrink: 0;
      }

      /* Syntax-highlighted editor: textarea overlaid on a highlighted pre */
      .editor-input-wrap {
        position: relative;
        flex: 1;
        overflow: hidden;
      }

      .editor-highlight,
      .editor-textarea {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        padding: 16px;
        margin: 0;
        border: none;
        font-family: var(--font-family-mono, 'JetBrains Mono', 'Fira Code', monospace);
        font-size: 13px;
        line-height: 1.7;
        tab-size: 2;
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .editor-highlight {
        background: var(--color-bg-secondary, #1a1b26);
        color: var(--color-text-primary, #c0caf5);
        pointer-events: none;
        z-index: 0;
      }

      .editor-textarea {
        background: transparent;
        color: transparent;
        caret-color: var(--color-text-primary, #c0caf5);
        outline: none;
        resize: none;
        z-index: 1;
        -webkit-text-fill-color: transparent;
      }

      .editor-textarea::selection {
        background: rgba(99, 102, 241, 0.3);
        -webkit-text-fill-color: transparent;
      }

      /* Syntax highlight token colors */
      .hl-heading { color: #e0af68; font-weight: 600; }
      .hl-bold { color: #ff9e64; font-weight: 600; }
      .hl-italic { color: #bb9af7; font-style: italic; }
      .hl-code { color: #9ece6a; }
      .hl-codeblock { color: #9ece6a; }
      .hl-link { color: #7aa2f7; }
      .hl-image { color: #2ac3de; }
      .hl-blockquote { color: #565f89; font-style: italic; }
      .hl-list-marker { color: #f7768e; }
      .hl-hr { color: #565f89; }
      .hl-frontmatter { color: #565f89; }

      /* Preview pane - themed using site's CSS variables */
      .editor-preview {
        flex: 1;
        overflow-y: auto;
        background: var(--color-bg-primary, #1e1f2e);
        border-left: 1px solid var(--color-border-default, #292e42);
      }

      /* Resize handle */
      .editor-resize-handle {
        width: 5px;
        cursor: col-resize;
        background: var(--color-border-default, #292e42);
        transition: background var(--transition-fast, 0.15s ease);
        flex-shrink: 0;
      }

      .editor-resize-handle:hover,
      .editor-resize-handle.dragging {
        background: var(--color-brand-primary, #7aa2f7);
      }

      /* Loading state */
      .editor-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--color-text-muted, #565f89);
        font-size: 14px;
      }
    </style>

    <!-- Site content styles (markdown.css + docs body styles) scoped to preview -->
    <style>${contentCSS}</style>

    <div class="editor-header">
      <span class="editor-filename">${filePath.split('/').slice(-3).join('/')}</span>
      <span class="editor-status saved" id="editor-status">Saved</span>
      <button class="editor-btn primary" id="editor-save">Save</button>
      <button class="editor-btn" id="editor-close">Close</button>
    </div>
    <div class="editor-body">
      <div class="editor-pane-left">
        <div class="pane-header">Markdown</div>
        <div class="editor-input-wrap">
          <pre class="editor-highlight" id="editor-highlight" aria-hidden="true"></pre>
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

  // Apply the current dark/light mode to the overlay
  overlay.setAttribute('data-theme', currentTheme);

  document.body.appendChild(overlay);

  // Get DOM elements
  const textarea = overlay.querySelector('#editor-textarea') as HTMLTextAreaElement;
  const highlightPre = overlay.querySelector('#editor-highlight') as HTMLPreElement;
  const preview = overlay.querySelector('#editor-preview') as HTMLDivElement;
  const statusEl = overlay.querySelector('#editor-status') as HTMLSpanElement;
  const saveBtn = overlay.querySelector('#editor-save') as HTMLButtonElement;
  const closeBtn = overlay.querySelector('#editor-close') as HTMLButtonElement;
  const resizeHandle = overlay.querySelector('#editor-resize') as HTMLDivElement;

  // Sync highlight overlay with textarea content
  function updateHighlight() {
    // Add a trailing newline so the pre height always matches the textarea
    highlightPre.innerHTML = highlightMarkdown(textarea.value) + '\n';
  }

  // Sync highlight scroll with textarea scroll
  function syncHighlightScroll() {
    highlightPre.scrollTop = textarea.scrollTop;
    highlightPre.scrollLeft = textarea.scrollLeft;
  }

  textarea.addEventListener('scroll', syncHighlightScroll);

  // --- Synchronized scrolling between textarea and preview ---
  let scrollSyncSource: 'none' | 'textarea' | 'preview' = 'none';

  function onTextareaScroll() {
    if (scrollSyncSource === 'preview') return;
    scrollSyncSource = 'textarea';

    // Sync highlight overlay
    syncHighlightScroll();

    // Proportional scroll: map textarea scroll % to preview scroll %
    const maxScroll = textarea.scrollHeight - textarea.clientHeight;
    if (maxScroll > 0) {
      const ratio = textarea.scrollTop / maxScroll;
      const previewMax = preview.scrollHeight - preview.clientHeight;
      preview.scrollTop = ratio * previewMax;
    }

    requestAnimationFrame(() => { scrollSyncSource = 'none'; });
  }

  function onPreviewScroll() {
    if (scrollSyncSource === 'textarea') return;
    scrollSyncSource = 'preview';

    const maxScroll = preview.scrollHeight - preview.clientHeight;
    if (maxScroll > 0) {
      const ratio = preview.scrollTop / maxScroll;
      const textareaMax = textarea.scrollHeight - textarea.clientHeight;
      textarea.scrollTop = ratio * textareaMax;
      // Keep highlight in sync too
      syncHighlightScroll();
    }

    requestAnimationFrame(() => { scrollSyncSource = 'none'; });
  }

  textarea.addEventListener('scroll', onTextareaScroll);
  preview.addEventListener('scroll', onPreviewScroll);

  // Update status indicator
  function updateStatus(status: SaveStatus) {
    saveStatus = status;
    statusEl.className = `editor-status ${status}`;
    switch (status) {
      case 'saved':
        statusEl.textContent = 'Saved';
        break;
      case 'unsaved':
        statusEl.textContent = 'Unsaved changes';
        break;
      case 'saving':
        statusEl.textContent = 'Saving...';
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

  // Helper to wrap rendered HTML in docs-body for proper theme styling
  // Preserves scroll position across updates to avoid jarring jumps
  function setPreviewContent(html: string) {
    const scrollTop = preview.scrollTop;
    preview.innerHTML = `<div class="docs-content"><article class="docs-article"><div class="docs-body">${html}</div></article></div>`;
    preview.scrollTop = scrollTop;
  }

  // Open document
  editorFetch('open', { filePath }).then((data) => {
    textarea.value = data.raw;
    updateHighlight();
    setPreviewContent(data.rendered);
    updateStatus('saved');
    textarea.focus();
  }).catch((err) => {
    preview.innerHTML = `<div style="color: var(--color-error, #f7768e); padding: 16px;">Failed to open file: ${err.message}</div>`;
  });

  // Debounced update on keystroke
  textarea.addEventListener('input', () => {
    updateHighlight();
    updateStatus('unsaved');

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const data = await editorFetch('update', {
          filePath,
          content: textarea.value,
        });
        setPreviewContent(data.rendered);
      } catch (err: any) {
        console.error('[editor] Update failed:', err);
      }
    }, 300);
  });

  // Tab key support in textarea
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      updateHighlight();
      textarea.dispatchEvent(new Event('input'));
    }

    // Ctrl+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      doSave();
    }

    // Escape to close
    if (e.key === 'Escape') {
      e.preventDefault();
      doClose();
    }
  });

  // Save
  async function doSave() {
    if (saveStatus === 'saved' || saveStatus === 'saving') return;

    updateStatus('saving');
    try {
      // Send the latest content first, then save
      await editorFetch('update', { filePath, content: textarea.value });
      await editorFetch('save', { filePath });
      updateStatus('saved');
    } catch (err: any) {
      console.error('[editor] Save failed:', err);
      updateStatus('unsaved');
    }
  }

  // Close
  async function doClose() {
    // Clean up listeners and timers first to prevent anything firing after close
    cleanup();

    try {
      // If there are unsaved changes, send final update before close
      if (saveStatus === 'unsaved') {
        await editorFetch('update', { filePath, content: textarea.value });
      }
      await editorFetch('close', { filePath });
    } catch (err: any) {
      console.error('[editor] Close failed:', err);
    }

    overlay.remove();
    // Reload to reflect saved changes
    window.location.reload();
  }

  saveBtn.addEventListener('click', doSave);
  closeBtn.addEventListener('click', doClose);

  // Resize handle — use named handlers so we can remove them on close
  let isResizing = false;
  const leftPane = overlay.querySelector('.editor-pane-left') as HTMLDivElement;
  const rightPane = overlay.querySelector('.editor-pane-right') as HTMLDivElement;

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

    // Clamp between 20% and 80%
    const ratio = Math.max(0.2, Math.min(0.8, offsetX / totalWidth));

    leftPane.style.flex = `${ratio}`;
    rightPane.style.flex = `${1 - ratio}`;
  }

  function onMouseUp() {
    if (isResizing) {
      isResizing = false;
      resizeHandle.classList.remove('dragging');
    }
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // Cleanup function to remove document-level listeners and timers
  function cleanup() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    textarea.removeEventListener('scroll', onTextareaScroll);
    preview.removeEventListener('scroll', onPreviewScroll);
  }

  // Prevent the overlay from being affected by page scroll
  overlay.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
}
