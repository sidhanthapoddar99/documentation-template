// Highlight overlay sync + textarea/preview proportional scroll

import type { EditorContext, Disposable } from './types.js';

export interface ScrollSyncHandle extends Disposable {
  updateHighlight: () => void;
}

export function initScrollSync(ctx: EditorContext, deps: {
  repositionAllRemoteCursors: () => void;
  highlightMarkdown: (text: string) => string;
}): ScrollSyncHandle {
  const { textarea, highlightPre, preview } = ctx.dom;

  // Sync highlight overlay with textarea content (rAF-batched)
  let highlightRafId: number | null = null;

  function updateHighlight() {
    if (highlightRafId !== null) return;
    highlightRafId = requestAnimationFrame(() => {
      highlightRafId = null;
      highlightPre.innerHTML = deps.highlightMarkdown(textarea.value) + '\n';
    });
  }

  // Sync highlight scroll with textarea scroll
  function syncHighlightScroll() {
    highlightPre.scrollTop = textarea.scrollTop;
    highlightPre.scrollLeft = textarea.scrollLeft;
  }

  // --- Synchronized scrolling between textarea and preview ---
  let scrollSyncSource: 'none' | 'textarea' | 'preview' = 'none';

  function onTextareaScroll() {
    if (scrollSyncSource === 'preview') return;
    scrollSyncSource = 'textarea';

    syncHighlightScroll();
    deps.repositionAllRemoteCursors();

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
      syncHighlightScroll();
      deps.repositionAllRemoteCursors();
    }

    requestAnimationFrame(() => { scrollSyncSource = 'none'; });
  }

  textarea.addEventListener('scroll', onTextareaScroll);
  preview.addEventListener('scroll', onPreviewScroll);

  return {
    updateHighlight,
    cleanup() {
      if (highlightRafId !== null) {
        cancelAnimationFrame(highlightRafId);
        highlightRafId = null;
      }
      textarea.removeEventListener('scroll', onTextareaScroll);
      preview.removeEventListener('scroll', onPreviewScroll);
    },
  };
}
