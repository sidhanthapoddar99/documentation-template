/**
 * Comprehensive-panel behaviour:
 *   - Filter tabs (Review / Open / Closed / Cancelled / All) — also filters
 *     the right-sidebar subtasks index so they stay in sync.
 *   - Word-capped expand/collapse for items past COMPREHENSIVE_WORD_CAP.
 */
import type { CompTab, SubtaskState } from './types';

let currentCompTab: CompTab = 'review';

export function applyComprehensiveTabFilter() {
  document.querySelectorAll<HTMLElement>('.issue-comprehensive__item').forEach((i) => {
    const s = i.dataset.state as SubtaskState;
    i.style.display = currentCompTab === 'all' || currentCompTab === s ? '' : 'none';
  });
  document.querySelectorAll<HTMLElement>('.issue-meta-index__link').forEach((a) => {
    const s = a.dataset.state as SubtaskState;
    (a.parentElement as HTMLElement).style.display =
      currentCompTab === 'all' || currentCompTab === s ? '' : 'none';
  });
}

export function wireComprehensive() {
  document.querySelectorAll<HTMLElement>('[data-comprehensive-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentCompTab = btn.dataset.comprehensiveTab as CompTab;
      document.querySelectorAll<HTMLElement>('[data-comprehensive-tab]').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
      });
      applyComprehensiveTabFilter();
    });
  });

  // Expand / collapse for clippable comprehensive items (>150 words)
  document.querySelectorAll<HTMLElement>('[data-comprehensive-expand]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest<HTMLElement>('.issue-comprehensive__item');
      if (!item) return;
      const clipped = item.classList.toggle('is-clipped');
      btn.setAttribute('aria-expanded', clipped ? 'false' : 'true');
      btn.setAttribute('aria-label', clipped ? 'Expand subtask' : 'Collapse subtask');
    });
  });

  applyComprehensiveTabFilter();
}
