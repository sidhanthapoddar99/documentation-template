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

type SaveStatus = 'saved' | 'unsaved' | 'saving';

// ============================================================================
// User Identity — persisted in sessionStorage so refreshes keep same identity
// ============================================================================

const ADJECTIVES = [
  'Swift', 'Bright', 'Calm', 'Deft', 'Keen',
  'Bold', 'Warm', 'Quick', 'Wise', 'Neat',
];

const ANIMALS = [
  'Otter', 'Falcon', 'Panda', 'Lynx', 'Heron',
  'Fox', 'Owl', 'Crane', 'Wolf', 'Finch',
];

const COLORS = [
  '#f7768e', '#ff9e64', '#e0af68', '#9ece6a', '#73daca',
  '#7aa2f7', '#bb9af7', '#2ac3de', '#7dcfff', '#c0caf5',
];

function getOrCreateIdentity(): { userId: string; name: string; color: string } {
  const stored = sessionStorage.getItem('__editor_identity');
  if (stored) {
    try { return JSON.parse(stored); } catch { /* regenerate */ }
  }

  const userId = crypto.randomUUID();
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const name = `${adj} ${animal}`;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  const identity = { userId, name, color };
  sessionStorage.setItem('__editor_identity', JSON.stringify(identity));
  return identity;
}

const identity = getOrCreateIdentity();

// ============================================================================
// HTML escaping for user-provided strings interpolated into innerHTML
// ============================================================================

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================================
// Global SSE Connection & Presence State
// ============================================================================

let eventSource: EventSource | null = null;
let pingIntervalTimer: ReturnType<typeof setInterval> | null = null;
let lastPingClientTime = 0;
let lastLatencyMs = 0;
let presenceUsers: any[] = [];
let presenceUpdateCallback: ((users: any[]) => void) | null = null;
let cursorUpdateCallback: ((data: any) => void) | null = null;
let textDiffCallback: ((data: any) => void) | null = null;
let renderUpdateCallback: ((data: any) => void) | null = null;
let fileChangedCallback: ((data: any) => void) | null = null;
let sseReconnectTimer: ReturnType<typeof setTimeout> | null = null;

// Server-provided config (from site.yaml via SSE config event)
// Defaults used until config event arrives
let serverPingInterval = 5000;
let serverCursorThrottle = 100;
let serverContentDebounce = 150;
let serverRenderInterval = 5000;
let serverSseReconnect = 2000;

function connectSSE(): void {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  eventSource = new EventSource(`/__editor/events?userId=${identity.userId}`);

  eventSource.addEventListener('config', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      if (data.pingInterval) serverPingInterval = data.pingInterval;
      if (data.cursorThrottle) serverCursorThrottle = data.cursorThrottle;
      if (data.contentDebounce) serverContentDebounce = data.contentDebounce;
      if (data.renderInterval) serverRenderInterval = data.renderInterval;
      if (data.sseReconnect) serverSseReconnect = data.sseReconnect;
      // Restart ping loop with new interval
      restartPingLoop();
    } catch { /* ignore parse errors */ }
  });

  eventSource.addEventListener('presence', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      presenceUsers = data.users || [];
      presenceUpdateCallback?.(presenceUsers);
    } catch { /* ignore parse errors */ }
  });

  eventSource.addEventListener('cursor', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      cursorUpdateCallback?.(data);
    } catch { /* ignore parse errors */ }
  });

  eventSource.addEventListener('text-diff', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      textDiffCallback?.(data);
    } catch { /* ignore parse errors */ }
  });

  eventSource.addEventListener('render-update', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      renderUpdateCallback?.(data);
    } catch { /* ignore parse errors */ }
  });

  eventSource.addEventListener('file-changed', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      fileChangedCallback?.(data);
    } catch { /* ignore parse errors */ }
  });

  eventSource.onerror = () => {
    eventSource?.close();
    eventSource = null;
    // Auto-reconnect with configurable delay
    if (sseReconnectTimer) clearTimeout(sseReconnectTimer);
    sseReconnectTimer = setTimeout(connectSSE, serverSseReconnect);
  };
}

function disconnectSSE(): void {
  if (sseReconnectTimer) {
    clearTimeout(sseReconnectTimer);
    sseReconnectTimer = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

function doPing(): void {
  const clientTime = Date.now();
  fetch('/__editor/ping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: identity.userId,
      clientTime,
      latencyMs: lastLatencyMs,
    }),
  }).then(res => {
    if (res.ok) return res.json();
  }).then(data => {
    if (data?.clientTime) {
      lastLatencyMs = Date.now() - data.clientTime;
    }
    lastPingClientTime = clientTime;
  }).catch(() => { /* ignore ping failures */ });
}

function startPingLoop(): void {
  if (pingIntervalTimer) return;
  pingIntervalTimer = setInterval(doPing, serverPingInterval);
}

function stopPingLoop(): void {
  if (pingIntervalTimer) {
    clearInterval(pingIntervalTimer);
    pingIntervalTimer = null;
  }
}

function restartPingLoop(): void {
  stopPingLoop();
  startPingLoop();
}

function sendPresenceAction(action: Record<string, any>): void {
  fetch('/__editor/presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: identity.userId, ...action }),
  }).catch(() => { /* ignore errors */ });
}

// ============================================================================
// Page lifecycle — join on load, leave on unload
// ============================================================================

function initPresence(): void {
  connectSSE();
  sendPresenceAction({
    type: 'join',
    name: identity.name,
    color: identity.color,
    page: window.location.pathname,
  });
  startPingLoop();
}

function teardownPresence(): void {
  stopPingLoop();
  disconnectSSE();
  // sendBeacon for reliable leave on page unload
  const blob = new Blob(
    [JSON.stringify({ type: 'leave', userId: identity.userId })],
    { type: 'application/json' }
  );
  navigator.sendBeacon('/__editor/presence', blob);
}

// Guard against HMR re-execution leaking connections/intervals.
// On re-execute, module-scope variables reset to null, orphaning running
// EventSource and ping intervals. beforeunload listeners also accumulate.
// We store a soft cleanup (no leave beacon) on window so the next execution
// can tear down the previous instance before re-initializing.
function softCleanup(): void {
  stopPingLoop();
  disconnectSSE();
  presenceUpdateCallback = null;
  cursorUpdateCallback = null;
  textDiffCallback = null;
  renderUpdateCallback = null;
  fileChangedCallback = null;
}
const HMR_KEY = '__editorPresenceCleanup';
if (typeof (window as any)[HMR_KEY] === 'function') {
  (window as any)[HMR_KEY]();
}
initPresence();
(window as any)[HMR_KEY] = softCleanup;

// Use a stable reference on window so we can remove/replace on re-execute
if ((window as any).__editorBeforeUnload) {
  window.removeEventListener('beforeunload', (window as any).__editorBeforeUnload);
}
(window as any).__editorBeforeUnload = teardownPresence;
window.addEventListener('beforeunload', teardownPresence);

// ============================================================================
// Toolbar App Export
// ============================================================================

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

    // Presence table rendering
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

      // Bind jump buttons
      presenceBody.querySelectorAll('.jump-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const page = (btn as HTMLElement).dataset.page;
          if (page) window.location.href = page;
        });
      });
    }

    // Register presence update callback
    presenceUpdateCallback = renderPresenceTable;
    // Render initial state
    renderPresenceTable(presenceUsers);

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
      .editor-cursors,
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

      .editor-cursors {
        background: transparent;
        pointer-events: none;
        z-index: 1;
        overflow: hidden;
        padding: 0;
      }

      .editor-textarea {
        background: transparent;
        color: transparent;
        caret-color: var(--color-text-primary, #c0caf5);
        outline: none;
        resize: none;
        z-index: 2;
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

      /* Remote cursors */
      .remote-cursor {
        position: absolute;
        pointer-events: none;
        z-index: 10;
        transition: top 0.1s ease, left 0.1s ease;
      }
      .remote-cursor-line {
        width: 2px;
        height: 1.7em;
        background: var(--cursor-color, #f7768e);
        border-radius: 1px;
      }
      .remote-cursor-label {
        position: absolute;
        bottom: 100%;
        left: 0;
        padding: 1px 5px;
        border-radius: 3px 3px 3px 0;
        background: var(--cursor-color, #f7768e);
        color: #fff;
        font-size: 9px;
        font-weight: 600;
        font-family: system-ui, -apple-system, sans-serif;
        white-space: nowrap;
        line-height: 1.4;
      }

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
      <button class="editor-btn" id="editor-refresh">Refresh Preview</button>
      <button class="editor-btn primary" id="editor-save">Save</button>
      <button class="editor-btn" id="editor-close">Close</button>
    </div>
    <div class="editor-body">
      <div class="editor-pane-left">
        <div class="pane-header">Markdown</div>
        <div class="editor-input-wrap">
          <pre class="editor-highlight" id="editor-highlight" aria-hidden="true"></pre>
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

  // Apply the current dark/light mode to the overlay
  overlay.setAttribute('data-theme', currentTheme);

  document.body.appendChild(overlay);

  // Get DOM elements
  const textarea = overlay.querySelector('#editor-textarea') as HTMLTextAreaElement;
  const highlightPre = overlay.querySelector('#editor-highlight') as HTMLPreElement;
  const cursorsDiv = overlay.querySelector('#editor-cursors') as HTMLDivElement;
  const preview = overlay.querySelector('#editor-preview') as HTMLDivElement;
  const statusEl = overlay.querySelector('#editor-status') as HTMLSpanElement;
  const refreshBtn = overlay.querySelector('#editor-refresh') as HTMLButtonElement;
  const saveBtn = overlay.querySelector('#editor-save') as HTMLButtonElement;
  const closeBtn = overlay.querySelector('#editor-close') as HTMLButtonElement;
  const resizeHandle = overlay.querySelector('#editor-resize') as HTMLDivElement;

  // ---- Remote Cursor Rendering ----
  // Measure monospace character dimensions for cursor positioning
  let charWidth = 7.8;
  let lineHeight = 22.1;

  function measureFont(): void {
    const probe = document.createElement('span');
    probe.style.cssText = `
      font-family: var(--font-family-mono, 'JetBrains Mono', 'Fira Code', monospace);
      font-size: 13px;
      line-height: 1.7;
      position: absolute;
      visibility: hidden;
      white-space: pre;
    `;
    probe.textContent = 'X';
    document.body.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    if (rect.width > 0) charWidth = rect.width;
    if (rect.height > 0) lineHeight = rect.height;
    probe.remove();
  }
  measureFont();

  // Remote cursor data and DOM elements
  const remoteCursorData = new Map<string, { name: string; color: string; cursor: { line: number; col: number; offset: number } }>();
  const remoteCursorElements = new Map<string, HTMLDivElement>();

  function positionRemoteCursor(el: HTMLDivElement, cursor: { line: number; col: number }, color: string, wrapRect?: DOMRect): void {
    const padding = 16; // matches editor padding
    const top = cursor.line * lineHeight + padding - textarea.scrollTop;
    const left = cursor.col * charWidth + padding - textarea.scrollLeft;

    // Hide if scrolled out of view
    const rect = wrapRect || cursorsDiv.getBoundingClientRect();
    if (top < -lineHeight || top > rect.height || left < -charWidth || left > rect.width) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
    }

    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    el.style.setProperty('--cursor-color', color);
  }

  function updateRemoteCursor(userId: string, name: string, color: string, cursor: { line: number; col: number; offset: number }): void {
    remoteCursorData.set(userId, { name, color, cursor });

    let el = remoteCursorElements.get(userId);
    if (!el) {
      el = document.createElement('div');
      el.className = 'remote-cursor';
      el.innerHTML = `<div class="remote-cursor-label">${escapeHtml(name)}</div><div class="remote-cursor-line"></div>`;
      cursorsDiv.appendChild(el);
      remoteCursorElements.set(userId, el);
    }

    positionRemoteCursor(el, cursor, color);
  }

  function removeRemoteCursor(userId: string): void {
    remoteCursorData.delete(userId);
    const el = remoteCursorElements.get(userId);
    if (el) {
      el.remove();
      remoteCursorElements.delete(userId);
    }
  }

  function repositionAllRemoteCursors(): void {
    const wrapRect = cursorsDiv.getBoundingClientRect();
    for (const [userId, data] of remoteCursorData) {
      const el = remoteCursorElements.get(userId);
      if (el) {
        positionRemoteCursor(el, data.cursor, data.color, wrapRect);
      }
    }
  }

  // Register cursor update callback for SSE events
  cursorUpdateCallback = (data: any) => {
    if (data.userId === identity.userId) return;
    if (data.file !== filePath) return;
    updateRemoteCursor(data.userId, data.name, data.color, data.cursor);
  };

  // ---- Local Cursor Tracking ----
  let cursorThrottleTimer: ReturnType<typeof setTimeout> | null = null;

  function getLocalCursorPosition(): { line: number; col: number; offset: number } {
    const offset = textarea.selectionStart;
    const text = textarea.value.substring(0, offset);
    const lines = text.split('\n');
    const line = lines.length - 1;
    const col = lines[lines.length - 1].length;
    return { line, col, offset };
  }

  function sendLocalCursor(): void {
    if (cursorThrottleTimer) return;
    cursorThrottleTimer = setTimeout(() => {
      cursorThrottleTimer = null;
      const cursor = getLocalCursorPosition();
      sendPresenceAction({
        type: 'cursor',
        file: filePath,
        cursor,
      });
    }, serverCursorThrottle);
  }

  function onCursorMove(): void {
    sendLocalCursor();
  }

  textarea.addEventListener('keyup', onCursorMove);
  textarea.addEventListener('mouseup', onCursorMove);
  textarea.addEventListener('click', onCursorMove);

  // Send initial cursor position when editor opens
  sendPresenceAction({
    type: 'cursor',
    file: filePath,
    cursor: { line: 0, col: 0, offset: 0 },
  });

  // Sync highlight overlay with textarea content (rAF-batched to avoid
  // redundant work when multiple updates arrive in the same frame)
  let highlightRafId: number | null = null;

  function updateHighlight() {
    if (highlightRafId !== null) return;
    highlightRafId = requestAnimationFrame(() => {
      highlightRafId = null;
      highlightPre.innerHTML = highlightMarkdown(textarea.value) + '\n';
    });
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

    // Reposition remote cursors on scroll
    repositionAllRemoteCursors();

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
      // Reposition remote cursors
      repositionAllRemoteCursors();
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

  // ---- Diff Utilities ----

  interface DiffOp {
    offset: number;
    deleteCount: number;
    insert: string;
  }

  function computeDiff(oldText: string, newText: string): DiffOp | null {
    if (oldText === newText) return null;

    // Find common prefix
    let prefixLen = 0;
    const minLen = Math.min(oldText.length, newText.length);
    while (prefixLen < minLen && oldText[prefixLen] === newText[prefixLen]) {
      prefixLen++;
    }

    // Find common suffix (from the end, not overlapping the prefix)
    let oldSuffixStart = oldText.length;
    let newSuffixStart = newText.length;
    while (
      oldSuffixStart > prefixLen &&
      newSuffixStart > prefixLen &&
      oldText[oldSuffixStart - 1] === newText[newSuffixStart - 1]
    ) {
      oldSuffixStart--;
      newSuffixStart--;
    }

    return {
      offset: prefixLen,
      deleteCount: oldSuffixStart - prefixLen,
      insert: newText.slice(prefixLen, newSuffixStart),
    };
  }

  function applyDiffToText(text: string, op: DiffOp): string {
    return text.slice(0, op.offset) + op.insert + text.slice(op.offset + op.deleteCount);
  }

  function adjustCursorForOp(cursorPos: number, op: DiffOp): number {
    if (cursorPos <= op.offset) return cursorPos;
    if (cursorPos <= op.offset + op.deleteCount) return op.offset + op.insert.length;
    return cursorPos - op.deleteCount + op.insert.length;
  }

  // ---- State for diff-based sync ----
  let previousContent = '';
  let contentChangedSinceLastRender = false;
  let isApplyingRemoteUpdate = false;
  let renderTimer: ReturnType<typeof setInterval> | null = null;

  // Request a server render and update preview
  async function requestRender(): Promise<void> {
    if (!contentChangedSinceLastRender) return;
    try {
      const data = await editorFetch('render', { filePath });
      setPreviewContent(data.rendered);
      contentChangedSinceLastRender = false;
    } catch (err: any) {
      console.error('[editor] Render request failed:', err);
    }
  }

  // Open document
  editorFetch('open', { filePath }).then((data) => {
    textarea.value = data.raw;
    previousContent = data.raw;
    updateHighlight();
    setPreviewContent(data.rendered);
    updateStatus('saved');
    textarea.focus();

    // Start render timer after document is loaded
    renderTimer = setInterval(requestRender, serverRenderInterval);
  }).catch((err) => {
    preview.innerHTML = `<div style="color: var(--color-error, #f7768e); padding: 16px;">Failed to open file: ${err.message}</div>`;
  });

  // ---- SSE event handlers ----

  // Remote text diff from a co-editor
  textDiffCallback = (data: any) => {
    if (data.userId === identity.userId) return;
    if (data.file !== filePath) return;

    const op = data.op as DiffOp;
    const selStart = textarea.selectionStart;
    const selEnd = textarea.selectionEnd;

    isApplyingRemoteUpdate = true;
    textarea.value = applyDiffToText(textarea.value, op);
    previousContent = textarea.value;
    updateHighlight();
    isApplyingRemoteUpdate = false;

    // Smart cursor adjustment
    textarea.selectionStart = adjustCursorForOp(selStart, op);
    textarea.selectionEnd = adjustCursorForOp(selEnd, op);

    contentChangedSinceLastRender = true;
  };

  // Rendered preview update from server
  renderUpdateCallback = (data: any) => {
    if (data.file !== filePath) return;
    setPreviewContent(data.rendered);
    contentChangedSinceLastRender = false;
  };

  // External file change (e.g. edited in VS Code)
  fileChangedCallback = (data: any) => {
    if (data.file !== filePath) return;

    const selStart = textarea.selectionStart;
    const selEnd = textarea.selectionEnd;

    isApplyingRemoteUpdate = true;
    textarea.value = data.raw;
    previousContent = data.raw;
    updateHighlight();
    isApplyingRemoteUpdate = false;

    // Clamp cursor
    textarea.selectionStart = Math.min(selStart, data.raw.length);
    textarea.selectionEnd = Math.min(selEnd, data.raw.length);

    // Trigger immediate render for the new content
    contentChangedSinceLastRender = true;
    requestRender();
  };

  // Debounced diff on keystroke
  textarea.addEventListener('input', () => {
    if (isApplyingRemoteUpdate) return;

    updateHighlight();
    updateStatus('unsaved');

    const currentContent = textarea.value;
    const diff = computeDiff(previousContent, currentContent);
    previousContent = currentContent;

    if (!diff) return;

    contentChangedSinceLastRender = true;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        await editorFetch('diff', {
          filePath,
          op: diff,
          userId: identity.userId,
        });
      } catch (err: any) {
        console.error('[editor] Diff send failed:', err);
      }
    }, serverContentDebounce);
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
      // Full content sync before disk write to ensure server has latest
      await editorFetch('update', { filePath, content: textarea.value });
      await editorFetch('save', { filePath });
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

  // Close
  async function doClose() {
    // Clean up listeners and timers first to prevent anything firing after close
    cleanup();

    try {
      // If there are unsaved changes, send final full content sync before close
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
    // Clear cursor tracking
    if (cursorThrottleTimer) {
      clearTimeout(cursorThrottleTimer);
      cursorThrottleTimer = null;
    }
    textarea.removeEventListener('keyup', onCursorMove);
    textarea.removeEventListener('mouseup', onCursorMove);
    textarea.removeEventListener('click', onCursorMove);

    // Send cursor-clear to indicate we're no longer editing
    sendPresenceAction({ type: 'cursor-clear' });

    // Unregister callbacks
    cursorUpdateCallback = null;
    textDiffCallback = null;
    renderUpdateCallback = null;
    fileChangedCallback = null;

    // Clear render timer
    if (renderTimer) {
      clearInterval(renderTimer);
      renderTimer = null;
    }

    // Remove all remote cursor elements
    for (const el of remoteCursorElements.values()) el.remove();
    remoteCursorElements.clear();
    remoteCursorData.clear();

    if (highlightRafId !== null) {
      cancelAnimationFrame(highlightRafId);
      highlightRafId = null;
    }
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
