/**
 * Preview Panel — collapsible live preview with rendered HTML
 */

import type { Disposable } from '../types.js';

export interface PreviewPanelHandle extends Disposable {
  setContent: (html: string) => void;
  toggle: () => void;
  isCollapsed: () => boolean;
}

export function initPreviewPanel(
  previewPane: HTMLDivElement,
  previewContent: HTMLElement,
  toggleBtn: HTMLButtonElement,
): PreviewPanelHandle {
  let lastHtml = '';

  function setContent(html: string) {
    if (html === lastHtml) return;
    lastHtml = html;
    const scrollTop = previewContent.scrollTop;
    previewContent.innerHTML = `<div class="docs-content"><article class="docs-article"><div class="docs-body markdown-content">${html}</div></article></div>`;
    previewContent.scrollTop = scrollTop;
    document.dispatchEvent(new CustomEvent('diagrams:render'));
  }

  function toggle() {
    const collapsed = previewPane.classList.toggle('collapsed');
    localStorage.setItem('ev2-preview-collapsed', String(collapsed));
    toggleBtn.textContent = collapsed ? 'Show Preview' : 'Preview';
  }

  function isCollapsed() {
    return previewPane.classList.contains('collapsed');
  }

  // Initialize toggle button text
  toggleBtn.textContent = isCollapsed() ? 'Show Preview' : 'Preview';
  toggleBtn.addEventListener('click', toggle);

  return {
    setContent,
    toggle,
    isCollapsed,
    cleanup() {
      toggleBtn.removeEventListener('click', toggle);
    },
  };
}
