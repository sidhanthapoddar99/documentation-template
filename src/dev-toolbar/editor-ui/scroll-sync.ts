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

  // Attach shadow DOM to the highlight host so innerHTML mutations are
  // invisible to external MutationObservers (Astro's audit perf.js).
  const shadowRoot = highlightPre.attachShadow({ mode: 'open' });
  const shadowStyle = document.createElement('style');
  shadowStyle.textContent = `
    :host { display: block; }
    pre {
      margin: 0; padding: 0; border: none; background: none;
      font: inherit; white-space: inherit; word-wrap: inherit;
      color: inherit; overflow: visible;
    }
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
  `;
  shadowRoot.appendChild(shadowStyle);
  const innerPre = document.createElement('pre');
  shadowRoot.appendChild(innerPre);

  // Sync highlight overlay with textarea content (rAF-batched)
  let highlightRafId: number | null = null;

  function updateHighlight() {
    if (highlightRafId !== null) return;
    highlightRafId = requestAnimationFrame(() => {
      highlightRafId = null;
      innerPre.innerHTML = deps.highlightMarkdown(textarea.value) + '\n';
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
