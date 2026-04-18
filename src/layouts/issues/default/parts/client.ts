/**
 * Issues index client-side behaviour
 *
 * Reads server-injected config from <script id="issues-config" type="application/json">,
 * wires up filter chips, column sort, view toggle, pagination, and URL persistence.
 * View preference + per-page size live in localStorage; everything else in query params.
 */

type StateTab = 'open' | 'closed' | 'cancelled' | 'all';

type FilterState = {
  q: string;
  fields: Record<string, Set<string>>;
  sort: string | null;
  dir: 'asc' | 'desc' | null;
  page: number;
  state: StateTab;
};

const CLOSED_STATUSES = new Set(['closed', 'cancelled']);

function rowMatchesStateTab(row: HTMLElement, tab: StateTab): boolean {
  if (tab === 'all') return true;
  const status = row.dataset.status || '';
  if (tab === 'open') return !CLOSED_STATUSES.has(status);
  return status === tab; // 'closed' or 'cancelled'
}

type ViewMode = 'cards' | 'table';

interface Config {
  priorityOrder: string[];
  statusOrder: string[];
  colorsByField: Record<string, Record<string, string>>;
}

const FIELDS = ['priority', 'component', 'milestone', 'labels'] as const;
const VIEW_KEY = 'issues-view-mode';
const PAGESIZE_KEY = 'issues-page-size';

function readConfig(): Config {
  const el = document.getElementById('issues-config');
  if (!el?.textContent) return { priorityOrder: [], statusOrder: [], colorsByField: {} };
  try {
    return JSON.parse(el.textContent) as Config;
  } catch {
    return { priorityOrder: [], statusOrder: [], colorsByField: {} };
  }
}

function readState(): FilterState {
  const params = new URLSearchParams(location.search);
  const rawTab = params.get('state');
  const tab: StateTab =
    rawTab === 'closed' || rawTab === 'cancelled' || rawTab === 'all' ? rawTab : 'open';
  const state: FilterState = {
    q: params.get('q') || '',
    fields: {},
    sort: params.get('sort'),
    dir: (params.get('dir') as 'asc' | 'desc' | null) || null,
    page: Math.max(1, parseInt(params.get('page') || '1', 10) || 1),
    state: tab,
  };
  for (const f of FIELDS) {
    const raw = params.get(f);
    state.fields[f] = new Set(raw ? raw.split(',').filter(Boolean) : []);
  }
  return state;
}

function writeState(state: FilterState) {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  for (const f of FIELDS) {
    const vals = Array.from(state.fields[f]);
    if (vals.length > 0) params.set(f, vals.join(','));
  }
  if (state.state !== 'open') params.set('state', state.state);
  if (state.sort && state.dir) {
    params.set('sort', state.sort);
    params.set('dir', state.dir);
  }
  if (state.page > 1) params.set('page', String(state.page));
  const qs = params.toString();
  const url = qs ? `${location.pathname}?${qs}` : location.pathname;
  history.replaceState(null, '', url);
}

function activeView(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.issues-view.is-active');
}

function pageSize(): number {
  try {
    const v = parseInt(localStorage.getItem(PAGESIZE_KEY) || '25', 10);
    return [10, 25, 50, 100].includes(v) ? v : 25;
  } catch { return 25; }
}

function rowMatchesExcluding(
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
    if (f === 'labels') {
      const labels = (row.dataset.labels || '').split(' ').filter(Boolean);
      if (!labels.some((l) => selected.has(l))) return false;
    } else {
      const val = row.dataset[f as keyof DOMStringMap] || '';
      if (!selected.has(val as string)) return false;
    }
  }
  return true;
}

function sortValue(row: HTMLElement, field: string, cfg: Config): number | string {
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
    case 'component': return ds.component || '';
    case 'milestone': return ds.milestone || '';
    case 'due':       return ds.due || '9999-99-99';
    case 'created':   return ds.created || '';
    case 'updated':   return ds.updated || '';
    default:          return '';
  }
}

function renderActiveTags(state: FilterState, cfg: Config, onToggle: (f: string, v: string) => void) {
  for (const field of FIELDS) {
    const container = document.querySelector(`[data-tags-for="${field}"]`);
    if (!container) continue;
    container.innerHTML = '';
    const values = Array.from(state.fields[field]);
    for (const v of values) {
      const chip = document.createElement('span');
      chip.className = 'issues-filters__tag';
      const color = cfg.colorsByField?.[field]?.[v];
      if (color) chip.style.setProperty('--chip-color', color);
      chip.innerHTML = `
        <span class="issues-filters__tag-dot" aria-hidden="true"></span>
        <span class="issues-filters__tag-label">${v}</span>
        <button type="button" class="issues-filters__tag-remove" aria-label="Remove filter">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="3.5" y1="3.5" x2="12.5" y2="12.5"/>
            <line x1="12.5" y1="3.5" x2="3.5" y2="12.5"/>
          </svg>
        </button>
      `;
      chip.querySelector('.issues-filters__tag-remove')?.addEventListener('click', () => {
        onToggle(field, v);
      });
      container.appendChild(chip);
    }
    const clearBtn = document.querySelector<HTMLElement>(`[data-clear-field="${field}"]`);
    if (clearBtn) clearBtn.hidden = values.length === 0;
  }
}

function renderStateTabs(state: FilterState, allRows: HTMLElement[]) {
  const counts: Record<StateTab, number> = { open: 0, closed: 0, cancelled: 0, all: 0 };
  // Count using all filters except the state tab itself, so counts reflect
  // what each tab would show with the current search/chip filters applied.
  const stateNeutralState = { ...state, state: 'all' as StateTab };
  for (const row of allRows) {
    if (!rowMatchesExcluding(row, stateNeutralState, null)) continue;
    counts.all++;
    const status = row.dataset.status || '';
    if (status === 'closed') counts.closed++;
    else if (status === 'cancelled') counts.cancelled++;
    else counts.open++;
  }
  document.querySelectorAll<HTMLElement>('[data-state-tab]').forEach((btn) => {
    const tab = btn.dataset.stateTab as StateTab;
    const active = tab === state.state;
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  for (const tab of ['open', 'closed', 'cancelled', 'all'] as StateTab[]) {
    const el = document.querySelector<HTMLElement>(`[data-state-count="${tab}"]`);
    if (el) el.textContent = String(counts[tab]);
  }
  // Hide Status column unless on the All tab — the tab itself encodes status.
  document.querySelectorAll<HTMLElement>('.issues-table').forEach((tbl) => {
    tbl.classList.toggle('is-hide-status', state.state !== 'all');
  });
}

function renderAddMenus(state: FilterState, allRows: HTMLElement[]) {
  for (const field of FIELDS) {
    const menu = document.querySelector(`[data-add-menu="${field}"]`);
    if (!menu) continue;
    menu.querySelectorAll<HTMLButtonElement>('[data-add-value]').forEach((opt) => {
      const value = opt.dataset.addValue!;
      const already = state.fields[field].has(value);
      opt.classList.toggle('is-selected', already);
      opt.disabled = already;

      let count = 0;
      for (const row of allRows) {
        if (!rowMatchesExcluding(row, state, field)) continue;
        if (field === 'labels') {
          const labels = (row.dataset.labels || '').split(' ').filter(Boolean);
          if (labels.includes(value)) count++;
        } else {
          if (row.dataset[field as keyof DOMStringMap] === value) count++;
        }
      }
      const countEl = opt.querySelector<HTMLElement>('[data-add-count]');
      if (countEl) countEl.textContent = String(count);
      opt.classList.toggle('is-empty', count === 0 && !already);
    });
  }
}

function apply(cfg: Config) {
  const state = readState();
  const view = activeView();
  if (!view) return;
  const rows = Array.from(view.querySelectorAll<HTMLElement>('[data-issue]'));

  const visibleRows = rows.filter((r) => rowMatchesExcluding(r, state, null));

  if (state.sort && state.dir) {
    const dirMul = state.dir === 'asc' ? 1 : -1;
    visibleRows.sort((a, b) => {
      const va = sortValue(a, state.sort!, cfg);
      const vb = sortValue(b, state.sort!, cfg);
      if (va < vb) return -1 * dirMul;
      if (va > vb) return 1 * dirMul;
      return 0;
    });
  }

  rows.forEach((r) => { r.style.display = 'none'; });

  const ps = pageSize();
  const total = visibleRows.length;
  const totalPages = Math.max(1, Math.ceil(total / ps));
  const curPage = Math.min(state.page, totalPages);
  const start = (curPage - 1) * ps;
  const end = start + ps;
  const shown = visibleRows.slice(start, end);

  const parent = view.matches('.issues-view--table')
    ? view.querySelector('tbody')!
    : view;
  shown.forEach((r) => {
    r.style.display = '';
    parent.appendChild(r);
  });

  const countEl = document.getElementById('issues-count');
  if (countEl) countEl.textContent = String(total);

  const emptyEl = document.getElementById('issues-empty');
  if (emptyEl) {
    const anyFilter = state.q || state.state !== 'open' || FIELDS.some((f) => state.fields[f].size > 0);
    emptyEl.hidden = !(total === 0 && anyFilter);
  }

  const pagiEl = document.getElementById('issues-pagination');
  if (pagiEl) pagiEl.hidden = total === 0;
  const rangeEl = document.getElementById('issues-range');
  if (rangeEl) {
    rangeEl.textContent = total === 0 ? '0 of 0' : `${start + 1}–${Math.min(end, total)} of ${total}`;
  }
  const pageNumEl = document.getElementById('issues-page-num');
  if (pageNumEl) pageNumEl.textContent = String(curPage);
  const pageTotalEl = document.getElementById('issues-page-total');
  if (pageTotalEl) pageTotalEl.textContent = String(totalPages);
  const prevBtn = document.getElementById('issues-prev') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('issues-next') as HTMLButtonElement | null;
  if (prevBtn) prevBtn.disabled = curPage <= 1;
  if (nextBtn) nextBtn.disabled = curPage >= totalPages;

  document.querySelectorAll<HTMLElement>('[data-sort-icon]').forEach((el) => {
    const field = el.dataset.sortIcon!;
    if (state.sort === field && state.dir) {
      el.textContent = state.dir === 'asc' ? '↑' : '↓';
      el.classList.add('is-active');
    } else {
      el.textContent = '⇅';
      el.classList.remove('is-active');
    }
  });

  renderActiveTags(state, cfg, toggleFieldValue);
  renderAddMenus(state, rows);
  renderStateTabs(state, rows);

  const searchEl = document.getElementById('issues-search') as HTMLInputElement | null;
  if (searchEl && searchEl.value !== state.q) searchEl.value = state.q;
  const psSel = document.getElementById('issues-page-size') as HTMLSelectElement | null;
  if (psSel && psSel.value !== String(ps)) psSel.value = String(ps);
}

// Note: we reference `config` via closure after init(); placeholders bound to init's cfg.
let _cfg: Config = { priorityOrder: [], statusOrder: [], colorsByField: {} };

function toggleFieldValue(field: string, value: string) {
  const state = readState();
  const set = state.fields[field];
  if (set.has(value)) set.delete(value);
  else set.add(value);
  state.page = 1;
  writeState(state);
  apply(_cfg);
}

function clearField(field: string) {
  const state = readState();
  state.fields[field] = new Set();
  state.page = 1;
  writeState(state);
  apply(_cfg);
}

function toggleSort(field: string) {
  const state = readState();
  if (state.sort !== field) {
    state.sort = field;
    state.dir = 'asc';
  } else if (state.dir === 'asc') {
    state.dir = 'desc';
  } else {
    state.sort = null;
    state.dir = null;
  }
  state.page = 1;
  writeState(state);
  apply(_cfg);
}

function setView(mode: ViewMode) {
  document.querySelectorAll<HTMLElement>('.issues-view').forEach((v) => {
    v.classList.toggle('is-active', v.id === `view-${mode}`);
  });
  document.querySelectorAll<HTMLElement>('.issues-view-toggle__btn').forEach((b) => {
    const active = b.dataset.view === mode;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  try { localStorage.setItem(VIEW_KEY, mode); } catch {}
  apply(_cfg);
}

function closeAllAddMenus() {
  document.querySelectorAll('.issues-filters__add.is-open').forEach((el) => {
    el.classList.remove('is-open');
  });
}

export function initIssuesIndex() {
  _cfg = readConfig();

  // "Add filter" dropdowns
  document.querySelectorAll<HTMLElement>('[data-add-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const field = btn.dataset.addToggle!;
      const wrap = document.querySelector<HTMLElement>(`[data-add-wrap="${field}"]`);
      if (!wrap) return;
      const wasOpen = wrap.classList.contains('is-open');
      closeAllAddMenus();
      if (!wasOpen) wrap.classList.add('is-open');
    });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-add-value]').forEach((opt) => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      if (opt.disabled) return;
      toggleFieldValue(opt.dataset.addField!, opt.dataset.addValue!);
    });
  });
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.issues-filters__add')) closeAllAddMenus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllAddMenus();
  });

  // Per-field clear
  document.querySelectorAll<HTMLElement>('[data-clear-field]').forEach((btn) => {
    btn.addEventListener('click', () => clearField(btn.dataset.clearField!));
  });

  // Sort
  document.querySelectorAll<HTMLElement>('[data-sort]').forEach((btn) => {
    btn.addEventListener('click', () => toggleSort(btn.dataset.sort!));
  });

  // Search (debounced)
  const searchInput = document.getElementById('issues-search') as HTMLInputElement | null;
  if (searchInput) {
    let t: number | undefined;
    searchInput.addEventListener('input', () => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        const state = readState();
        state.q = searchInput.value;
        state.page = 1;
        writeState(state);
        apply(_cfg);
      }, 80);
    });
  }

  // View toggle
  document.querySelectorAll<HTMLElement>('.issues-view-toggle__btn').forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.dataset.view as ViewMode));
  });

  // State tabs (Open / Closed / All)
  document.querySelectorAll<HTMLElement>('[data-state-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.stateTab as StateTab;
      const state = readState();
      state.state = tab;
      state.page = 1;
      writeState(state);
      apply(_cfg);
    });
  });

  // Table row click → navigate (skip if user clicked an interactive child)
  document.querySelectorAll<HTMLElement>('.issues-table__row').forEach((row) => {
    row.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a, input, button, label')) return;
      const href = row.dataset.href;
      if (href) location.href = href;
    });
  });

  // Pagination
  document.getElementById('issues-prev')?.addEventListener('click', () => {
    const s = readState(); s.page = Math.max(1, s.page - 1); writeState(s); apply(_cfg);
  });
  document.getElementById('issues-next')?.addEventListener('click', () => {
    const s = readState(); s.page = s.page + 1; writeState(s); apply(_cfg);
  });
  document.getElementById('issues-page-size')?.addEventListener('change', (e) => {
    const n = parseInt((e.target as HTMLSelectElement).value, 10);
    try { localStorage.setItem(PAGESIZE_KEY, String(n)); } catch {}
    const s = readState(); s.page = 1; writeState(s); apply(_cfg);
  });

  // Clear all
  const clearAll = (e?: Event) => {
    e?.preventDefault();
    history.replaceState(null, '', location.pathname);
    if (searchInput) searchInput.value = '';
    apply(_cfg);
  };
  document.getElementById('issues-clear')?.addEventListener('click', clearAll);
  document.getElementById('issues-reset')?.addEventListener('click', clearAll);

  // Restore view preference (default: table)
  let savedView: ViewMode = 'table';
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === 'table' || v === 'cards') savedView = v;
  } catch {}
  setView(savedView);
}
