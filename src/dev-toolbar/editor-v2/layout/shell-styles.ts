/**
 * Editor V2 CSS — Obsidian-style layout
 */

export function getShellCSS(): string {
  return `
    /* ---- Full-screen overlay ---- */
    #editor-v2-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      background: var(--color-bg-primary, #16161e);
      color: var(--color-text-primary, #c0caf5);
      font-family: system-ui, -apple-system, sans-serif;
      isolation: isolate;
      contain: layout style paint;
    }

    /* ---- Header ---- */
    .ev2-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      height: 40px;
      min-height: 40px;
      background: var(--color-bg-secondary, #1a1b26);
      border-bottom: 1px solid var(--color-border-default, #292e42);
      flex-shrink: 0;
    }
    .ev2-header-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-muted, #565f89);
      margin-right: auto;
    }
    .ev2-status {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 3px;
    }
    .ev2-status.saved { color: #9ece6a; }
    .ev2-status.unsaved { color: #e0af68; }
    .ev2-status.saving { color: #7aa2f7; }
    .ev2-btn {
      padding: 4px 10px;
      border: 1px solid var(--color-border-default, #292e42);
      border-radius: 4px;
      background: transparent;
      color: var(--color-text-primary, #c0caf5);
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .ev2-btn:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .ev2-btn.primary {
      background: rgba(99, 102, 241, 0.3);
      border-color: rgba(99, 102, 241, 0.5);
    }
    .ev2-btn.primary:hover {
      background: rgba(99, 102, 241, 0.45);
    }

    /* ---- Main body (sidebar + editor + preview) ---- */
    .ev2-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ---- Sidebar ---- */
    .ev2-sidebar {
      width: 240px;
      min-width: 180px;
      max-width: 400px;
      background: var(--color-bg-secondary, #1a1b26);
      border-right: 1px solid var(--color-border-default, #292e42);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex-shrink: 0;
    }
    .ev2-sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-muted, #565f89);
      border-bottom: 1px solid var(--color-border-default, #292e42);
    }
    .ev2-sidebar-actions {
      display: flex;
      gap: 4px;
    }
    .ev2-sidebar-actions button {
      background: none;
      border: none;
      color: var(--color-text-muted, #565f89);
      cursor: pointer;
      padding: 2px;
      border-radius: 3px;
      font-size: 14px;
      line-height: 1;
    }
    .ev2-sidebar-actions button:hover {
      color: var(--color-text-primary, #c0caf5);
      background: rgba(255, 255, 255, 0.08);
    }
    .ev2-tree-container {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 4px 0;
    }

    /* ---- File tree ---- */
    .ev2-tree {
      list-style: none;
      margin: 0;
      padding: 0;
      font-size: 13px;
    }
    .ev2-tree ul {
      list-style: none;
      margin: 0;
      padding: 0 0 0 16px;
    }
    .ev2-tree-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 12px 3px 8px;
      cursor: pointer;
      border-radius: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ev2-tree-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .ev2-tree-item.active {
      background: rgba(99, 102, 241, 0.15);
      color: #7aa2f7;
    }
    .ev2-tree-item .icon {
      flex-shrink: 0;
      width: 16px;
      text-align: center;
      font-size: 12px;
      opacity: 0.6;
    }
    .ev2-tree-item .name {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ev2-tree-folder > .ev2-tree-item .icon {
      transition: transform 0.15s;
    }
    .ev2-tree-folder.collapsed > .ev2-tree-item .icon {
      transform: rotate(-90deg);
    }
    .ev2-tree-folder.collapsed > ul {
      display: none;
    }

    /* ---- Resize handles ---- */
    .ev2-resize-handle {
      width: 4px;
      cursor: col-resize;
      background: transparent;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .ev2-resize-handle:hover,
    .ev2-resize-handle.dragging {
      background: rgba(99, 102, 241, 0.4);
    }

    /* ---- Editor pane ---- */
    .ev2-editor-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 300px;
    }
    .ev2-editor-container {
      flex: 1;
      overflow: hidden;
    }
    .ev2-editor-container .cm-editor {
      height: 100%;
    }

    /* ---- Preview pane ---- */
    .ev2-preview-pane {
      width: 45%;
      min-width: 250px;
      max-width: 60%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-left: 1px solid var(--color-border-default, #292e42);
    }
    .ev2-preview-pane.collapsed {
      display: none;
    }
    .ev2-preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-muted, #565f89);
      background: var(--color-bg-secondary, #1a1b26);
      border-bottom: 1px solid var(--color-border-default, #292e42);
      flex-shrink: 0;
    }
    .ev2-preview-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: var(--color-bg-primary, #16161e);
    }

    /* ---- Context menu ---- */
    .ev2-context-menu {
      position: fixed;
      z-index: 1000000;
      background: var(--color-bg-secondary, #1a1b26);
      border: 1px solid var(--color-border-default, #292e42);
      border-radius: 6px;
      padding: 4px 0;
      min-width: 180px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .ev2-context-menu-item {
      padding: 6px 12px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ev2-context-menu-item:hover {
      background: rgba(99, 102, 241, 0.15);
    }
    .ev2-context-menu-separator {
      height: 1px;
      background: var(--color-border-default, #292e42);
      margin: 4px 0;
    }
    .ev2-context-menu-item.danger {
      color: #f7768e;
    }

    /* ---- Modal ---- */
    .ev2-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000001;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ev2-modal {
      background: var(--color-bg-secondary, #1a1b26);
      border: 1px solid var(--color-border-default, #292e42);
      border-radius: 8px;
      padding: 20px;
      min-width: 320px;
      max-width: 480px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
    }
    .ev2-modal h3 {
      margin: 0 0 12px;
      font-size: 15px;
    }
    .ev2-modal input,
    .ev2-modal select {
      width: 100%;
      padding: 6px 10px;
      margin: 4px 0 12px;
      background: var(--color-bg-primary, #16161e);
      border: 1px solid var(--color-border-default, #292e42);
      border-radius: 4px;
      color: var(--color-text-primary, #c0caf5);
      font-size: 13px;
    }
    .ev2-modal-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 16px;
    }

    /* ---- Loading skeleton ---- */
    .ev2-skeleton {
      background: linear-gradient(90deg,
        var(--color-bg-secondary, #1a1b26) 25%,
        rgba(255,255,255,0.05) 50%,
        var(--color-bg-secondary, #1a1b26) 75%
      );
      background-size: 200% 100%;
      animation: ev2-shimmer 1.5s infinite;
      border-radius: 3px;
      height: 20px;
      margin: 4px 12px;
    }
    @keyframes ev2-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
}
