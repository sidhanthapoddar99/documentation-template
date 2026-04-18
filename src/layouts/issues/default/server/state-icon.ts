/**
 * SVG markup for the 4-state subtask status icon.
 *
 * Rendered server-side so the client can swap in place when a state cycles
 * without re-rendering the whole page. Also serialized into a JSON script
 * tag so `scripts/detail/client.ts` can fetch the same shapes for updates.
 */
import type { SubtaskState } from '@loaders/issues';

export function stateIconSvg(state: SubtaskState): string {
  switch (state) {
    case 'open':
      return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/></svg>';
    case 'review':
      return '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="4"/></svg>';
    case 'closed':
      return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l3 3 7-7"/></svg>';
    case 'cancelled':
      return '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
  }
}

export function allStateIcons() {
  return {
    open: stateIconSvg('open'),
    review: stateIconSvg('review'),
    closed: stateIconSvg('closed'),
    cancelled: stateIconSvg('cancelled'),
  };
}
