// CSS for the full-screen editor overlay

export function getEditorCSS(): string {
  return `
      #doc-editor-overlay {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        background: var(--color-bg-secondary, #1a1b26);
        color: var(--color-text-primary, #c0caf5);
        font-family: var(--font-family-base, system-ui, -apple-system, sans-serif);
        contain: layout style paint;
        isolation: isolate;
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
        contain: layout style paint;
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
  `;
}
