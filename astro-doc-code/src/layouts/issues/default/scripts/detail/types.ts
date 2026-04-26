export type SubtaskState = 'open' | 'review' | 'closed' | 'cancelled';
export const CYCLE: SubtaskState[] = ['open', 'review', 'closed', 'cancelled'];
export const TERMINAL: SubtaskState[] = ['closed', 'cancelled'];

export type CompTab = 'open' | 'review' | 'closed' | 'cancelled' | 'all';

/** Read server-rendered SVG markup for each state from the JSON script tag. */
export function readIcons(): Record<SubtaskState, string> {
  const el = document.getElementById('subtask-state-icons');
  if (!el?.textContent) return { open: '', review: '', closed: '', cancelled: '' };
  try {
    return JSON.parse(el.textContent) as Record<SubtaskState, string>;
  } catch {
    return { open: '', review: '', closed: '', cancelled: '' };
  }
}
