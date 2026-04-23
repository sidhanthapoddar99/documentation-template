/**
 * Pure row-matching + sort helpers. No DOM state outside row data
 * attributes; all context flows in via arguments.
 */
import { CLOSED_STATUSES, FIELDS, MULTI_FIELDS } from './types';
import type { Config, FilterState, StateTab } from './types';

export function needsReview(row: HTMLElement): boolean {
  const status = row.dataset.status || '';
  if (status === 'review') return true;
  if (CLOSED_STATUSES.has(status)) return false;
  return row.dataset.hasReviewSubtask === '1';
}

export function rowMatchesStateTab(row: HTMLElement, tab: StateTab): boolean {
  if (tab === 'all') return true;
  const status = row.dataset.status || '';
  // Review covers explicit status=review AND open issues with any subtask in review.
  if (tab === 'review') return needsReview(row);
  // Open = not closed/cancelled and not already surfaced under Review.
  if (tab === 'open') return !CLOSED_STATUSES.has(status) && !needsReview(row);
  return status === tab;
}

/** Read a row's values for a field. Multi-valued fields (labels, component)
 * are space-joined in the dataset and split here. Single-valued fields
 * return a one-element array (or empty). */
export function rowValues(row: HTMLElement, field: string): string[] {
  if (MULTI_FIELDS.has(field)) {
    return (row.dataset[field as keyof DOMStringMap] as string || '').split(' ').filter(Boolean);
  }
  const v = row.dataset[field as keyof DOMStringMap] as string | undefined;
  return v ? [v] : [];
}

/** Global filters only — search + field chips. Used by the grouped view
 * where each group has its own independent state tab. */
export function rowMatchesGlobal(row: HTMLElement, state: FilterState): boolean {
  if (state.q) {
    const blob = row.dataset.search || '';
    if (!blob.includes(state.q.toLowerCase())) return false;
  }
  for (const f of FIELDS) {
    const selected = state.fields[f];
    if (selected.size === 0) continue;
    const vals = rowValues(row, f);
    if (!vals.some((v) => selected.has(v))) return false;
  }
  return true;
}

/** Full filter: state tab + search + chips, optionally excluding one field
 * (used when counting what each filter value would yield). */
export function rowMatchesExcluding(
  row: HTMLElement,
  state: FilterState,
  excludeField: string | null,
): boolean {
  if (!rowMatchesStateTab(row, state.state)) return false;
  if (state.q) {
    const blob = row.dataset.search || '';
    if (!blob.includes(state.q.toLowerCase())) return false;
  }
  for (const f of FIELDS) {
    if (f === excludeField) continue;
    const selected = state.fields[f];
    if (selected.size === 0) continue;
    const vals = rowValues(row, f);
    if (!vals.some((v) => selected.has(v))) return false;
  }
  return true;
}

export function sortValue(row: HTMLElement, field: string, cfg: Config): number | string {
  const ds = row.dataset;
  switch (field) {
    case 'priority': {
      const idx = cfg.priorityOrder.indexOf(ds.priority || '');
      return idx === -1 ? 999 : idx;
    }
    case 'status': {
      const idx = cfg.statusOrder.indexOf(ds.status || '');
      return idx === -1 ? 999 : idx;
    }
    case 'title':     return (ds.title || '').toLowerCase();
    // For multi-valued component, sort by the first value alphabetically —
    // good enough for column-sort ordering; group-by remains the proper view
    // when an issue spans several components.
    case 'component': return (ds.component || '').split(' ').filter(Boolean)[0] || '';
    case 'milestone': return ds.milestone || '';
    case 'due':       return ds.due || '9999-99-99';
    case 'created':   return ds.created || '';
    case 'updated':   return ds.updated || '';
    default:          return '';
  }
}
