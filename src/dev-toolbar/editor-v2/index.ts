/**
 * Editor V2 — Dev toolbar app (navigation only)
 *
 * The actual editor lives at /editor/[...slug].astro as a full page.
 * This toolbar app just provides a button to navigate there.
 */

export default {
  id: 'doc-editor-v2',
  name: 'Edit Page',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,

  init(canvas: ShadowRoot) {
    const currentPath = window.location.pathname.replace(/\/$/, '');
    const pathSegments = currentPath.split('/').filter(Boolean);
    const contentRoot = pathSegments[0] || '';
    const editorUrl = contentRoot ? `/editor?root=${contentRoot}` : '';

    const windowEl = document.createElement('astro-dev-toolbar-window');
    const styles = document.createElement('style');
    styles.textContent = `
      astro-dev-toolbar-window { max-height: 80vh !important; overflow: hidden !important; }
      .panel-content { padding: 12px; font-family: system-ui, sans-serif; min-width: 220px; }
      .edit-btn {
        display: block; width: 100%; padding: 10px 16px; margin: 8px 0;
        background: rgba(99, 102, 241, 0.3); border: 1px solid rgba(99, 102, 241, 0.5);
        border-radius: 6px; color: #c0caf5; font-size: 14px; font-weight: 500;
        cursor: pointer; text-align: center; transition: background 0.15s; text-decoration: none;
      }
      .edit-btn:hover { background: rgba(99, 102, 241, 0.45); }
      .edit-btn[aria-disabled="true"] { opacity: 0.5; cursor: default; pointer-events: none; }
      .panel-info { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 8px; }
    `;

    windowEl.innerHTML = `
      <div class="panel-content">
        <a class="edit-btn" href="${editorUrl || '#'}" ${!editorUrl ? 'aria-disabled="true"' : ''}>
          ${editorUrl ? 'Open Editor' : 'No editable page'}
        </a>
        <div class="panel-info">
          ${editorUrl ? `Opens /editor?root=${contentRoot}` : 'Navigate to a doc page to edit'}
        </div>
      </div>
    `;

    canvas.appendChild(styles);
    canvas.appendChild(windowEl);
  },
};
