/**
 * Editor V2 CSS — Minimalistic, no tint
 *
 * Dark: pure black (#0a0a0a), white text
 * Light: pure white (#ffffff), black text
 * CSS custom properties for theme switching
 */

export function getShellCSS(): string {
  return `
    /* ---- Theme variables ---- */
    [data-editor-theme="dark"] {
      --ev-bg: #0a0a0a;
      --ev-surface: #111111;
      --ev-border: #222222;
      --ev-text: #e0e0e0;
      --ev-text-muted: #666666;
      --ev-text-faint: #444444;
      --ev-hover: rgba(255, 255, 255, 0.05);
      --ev-active: rgba(255, 255, 255, 0.08);
      --ev-accent: #e0e0e0;
      --ev-scrollbar: #333333;
      --ev-scrollbar-hover: #444444;
      --ev-danger: #e55561;
      --ev-success: #7ec699;
    }
    [data-editor-theme="light"] {
      --ev-bg: #ffffff;
      --ev-surface: #fafafa;
      --ev-border: #e5e5e5;
      --ev-text: #1a1a1a;
      --ev-text-muted: #999999;
      --ev-text-faint: #cccccc;
      --ev-hover: rgba(0, 0, 0, 0.03);
      --ev-active: rgba(0, 0, 0, 0.06);
      --ev-accent: #1a1a1a;
      --ev-scrollbar: #cccccc;
      --ev-scrollbar-hover: #aaaaaa;
      --ev-danger: #d32f2f;
      --ev-success: #2e7d32;
    }

    /* ---- Root ---- */
    #editor-root {
      background: var(--ev-bg);
      color: var(--ev-text);
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif;
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
    }

    /* ---- Menu bar ---- */
    .ev2-menubar-container {
      flex-shrink: 0;
    }
    .ev2-menubar {
      display: flex;
      align-items: center;
      height: 28px;
      background: var(--ev-surface);
      border-bottom: 1px solid var(--ev-border);
      padding: 0 4px;
      user-select: none;
    }
    .ev2-menu {
      position: relative;
    }
    .ev2-menu-trigger {
      background: none;
      border: none;
      color: var(--ev-text-muted);
      font-size: 13px;
      padding: 4px 10px;
      cursor: pointer;
      border-radius: 3px;
      transition: all 0.1s;
    }
    .ev2-menu-trigger:hover,
    .ev2-menu.open .ev2-menu-trigger {
      color: var(--ev-text);
      background: var(--ev-hover);
    }
    .ev2-menu-dropdown {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      min-width: 200px;
      background: var(--ev-surface);
      border: 1px solid var(--ev-border);
      border-radius: 4px;
      padding: 4px 0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      z-index: 10000;
    }
    .ev2-menu.open .ev2-menu-dropdown {
      display: block;
    }
    .ev2-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 12px;
      font-size: 13px;
      cursor: pointer;
      color: var(--ev-text);
      transition: background 0.1s;
    }
    .ev2-menu-item:hover {
      background: var(--ev-hover);
    }
    .ev2-menu-item.disabled {
      color: var(--ev-text-faint);
      cursor: default;
    }
    .ev2-menu-item.disabled:hover {
      background: transparent;
    }
    .ev2-menu-item svg {
      width: 14px;
      height: 14px;
      color: var(--ev-text-muted);
      flex-shrink: 0;
    }
    .ev2-menu-item span:first-of-type {
      flex: 1;
    }
    .ev2-shortcut {
      font-size: 11px;
      color: var(--ev-text-faint);
      margin-left: auto;
    }
    .ev2-check {
      font-size: 12px;
      width: 14px;
      text-align: center;
      color: var(--ev-success);
    }
    .ev2-menu-separator {
      height: 1px;
      background: var(--ev-border);
      margin: 4px 0;
    }

    /* ---- Global scrollbar ---- */
    #editor-root ::-webkit-scrollbar { width: 6px; height: 6px; }
    #editor-root ::-webkit-scrollbar-track { background: transparent; }
    #editor-root ::-webkit-scrollbar-thumb { background: var(--ev-scrollbar); border-radius: 3px; }
    #editor-root ::-webkit-scrollbar-thumb:hover { background: var(--ev-scrollbar-hover); }

    /* ---- Header ---- */
    .ev2-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      height: 38px;
      min-height: 38px;
      background: var(--ev-surface);
      border-bottom: 1px solid var(--ev-border);
      flex-shrink: 0;
      user-select: none;
    }
    .ev2-header-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--ev-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .ev2-active-file {
      font-size: 13px;
      color: var(--ev-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 300px;
    }
    .ev2-status {
      font-size: 12px;
      padding: 1px 6px;
      border-radius: 3px;
      font-weight: 500;
    }
    .ev2-status.saved { color: var(--ev-success); }
    .ev2-status.unsaved { color: #d4a017; }
    .ev2-status.saving { color: var(--ev-text-muted); }

    /* ---- Buttons ---- */
    .ev2-btn {
      padding: 4px 10px;
      border: 1px solid var(--ev-border);
      border-radius: 3px;
      background: transparent;
      color: var(--ev-text-muted);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.1s;
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }
    .ev2-btn:hover {
      background: var(--ev-hover);
      color: var(--ev-text);
      border-color: var(--ev-text-faint);
    }
    .ev2-btn.primary {
      color: var(--ev-text);
      border-color: var(--ev-text-faint);
    }
    .ev2-btn.primary:hover {
      background: var(--ev-active);
    }
    .ev2-btn svg { width: 14px; height: 14px; }
    .ev2-icon-btn {
      background: none;
      border: none;
      color: var(--ev-text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.1s;
    }
    .ev2-icon-btn:hover {
      color: var(--ev-text);
      background: var(--ev-hover);
    }
    .ev2-icon-btn svg { width: 16px; height: 16px; }

    /* ---- Main body ---- */
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
      background: var(--ev-surface);
      border-right: 1px solid var(--ev-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex-shrink: 0;
      transition: width 0.15s;
    }
    .ev2-sidebar.collapsed {
      width: 0 !important;
      min-width: 0 !important;
      border-right: none;
      overflow: hidden;
      padding: 0;
    }
    .ev2-sidebar.collapsed + .ev2-resize-handle {
      display: none;
    }
    .ev2-sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--ev-text-muted);
      border-bottom: 1px solid var(--ev-border);
      flex-shrink: 0;
    }
    .ev2-sidebar-actions {
      display: flex;
      gap: 2px;
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
    }
    .ev2-tree ul {
      list-style: none;
      margin: 0;
      padding: 0 0 0 12px;
    }
    .ev2-tree-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 12px 2px 6px;
      cursor: pointer;
      border-radius: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 13px;
      color: var(--ev-text);
      margin: 0 4px;
      transition: background 0.1s;
    }
    .ev2-tree-item:hover {
      background: var(--ev-hover);
    }
    .ev2-tree-item.active {
      background: var(--ev-active);
    }
    .ev2-tree-item .tree-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      color: var(--ev-text-muted);
    }
    .ev2-tree-item .tree-icon svg {
      width: 15px;
      height: 15px;
    }
    .ev2-tree-item .tree-chevron {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      color: var(--ev-text-faint);
      transition: transform 0.1s;
    }
    .ev2-tree-item .tree-chevron svg {
      width: 12px;
      height: 12px;
    }
    .ev2-tree-item .tree-name {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ev2-tree-folder.collapsed > .ev2-tree-item .tree-chevron {
      transform: rotate(0deg);
    }
    .ev2-tree-folder:not(.collapsed) > .ev2-tree-item .tree-chevron {
      transform: rotate(90deg);
    }
    .ev2-tree-folder.collapsed > ul {
      display: none;
    }

    /* ---- Resize handles ---- */
    .ev2-resize-handle {
      width: 5px;
      cursor: col-resize;
      background: transparent;
      flex-shrink: 0;
      position: relative;
    }
    /* Wider invisible hit area */
    .ev2-resize-handle::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: -4px;
      right: -4px;
    }
    .ev2-resize-handle:hover,
    .ev2-resize-handle.dragging {
      background: var(--ev-text-faint);
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
    .ev2-editor-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--ev-text-faint);
      font-size: 14px;
    }

    /* ---- Preview pane ---- */
    .ev2-preview-pane {
      width: 40%;
      min-width: 250px;
      max-width: 50%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-left: 1px solid var(--ev-border);
    }
    .ev2-preview-pane.collapsed {
      display: none;
    }
    .ev2-preview-header {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--ev-text-muted);
      background: var(--ev-surface);
      border-bottom: 1px solid var(--ev-border);
      flex-shrink: 0;
    }
    .ev2-preview-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
      background: var(--ev-bg);
    }

    /* ---- WYSIWYG pane (placeholder) ---- */
    .ev2-wysiwyg-pane {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ev-bg);
      min-width: 300px;
    }

    /* ---- Context menu ---- */
    .ev2-context-menu {
      position: fixed;
      z-index: 10000;
      background: var(--ev-surface);
      border: 1px solid var(--ev-border);
      border-radius: 4px;
      padding: 4px 0;
      min-width: 160px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    .ev2-context-menu-item {
      padding: 5px 12px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--ev-text);
    }
    .ev2-context-menu-item:hover {
      background: var(--ev-hover);
    }
    .ev2-context-menu-item svg { width: 14px; height: 14px; color: var(--ev-text-muted); }
    .ev2-context-menu-separator {
      height: 1px;
      background: var(--ev-border);
      margin: 4px 0;
    }
    .ev2-context-menu-item.danger { color: var(--ev-danger); }
    .ev2-context-menu-item.danger svg { color: var(--ev-danger); }

    /* ---- Modal ---- */
    .ev2-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10001;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ev2-modal {
      background: var(--ev-surface);
      border: 1px solid var(--ev-border);
      border-radius: 6px;
      padding: 20px;
      min-width: 320px;
      max-width: 480px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .ev2-modal h3 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
    }
    .ev2-modal label {
      display: block;
      font-size: 12px;
      color: var(--ev-text-muted);
      margin-bottom: 4px;
    }
    .ev2-modal input,
    .ev2-modal select {
      width: 100%;
      padding: 6px 8px;
      margin-bottom: 12px;
      background: var(--ev-bg);
      border: 1px solid var(--ev-border);
      border-radius: 3px;
      color: var(--ev-text);
      font-size: 13px;
      outline: none;
    }
    .ev2-modal input:focus,
    .ev2-modal select:focus {
      border-color: var(--ev-text-muted);
    }
    .ev2-modal-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 16px;
    }

    /* ---- Skeleton loader ---- */
    .ev2-skeleton {
      background: var(--ev-border);
      border-radius: 3px;
      height: 16px;
      margin: 6px 12px;
      opacity: 0.5;
    }

    /* ---- User badge ---- */
    .ev2-user-badge {
      font-size: 11px;
      padding: 1px 6px;
      border-radius: 3px;
      font-weight: 500;
    }
  `;
}
