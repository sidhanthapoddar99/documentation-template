/**
 * Small server-side utilities shared across the detail-page components.
 * Kept here so the .astro files stay focused on templating.
 */
import type { IssueAgentLog, IssueSubtask, SubtaskState } from '@loaders/issues';

export const TERMINAL: SubtaskState[] = ['closed', 'cancelled'];

/** Pad a sequence number with a leading zero (`1` → `01`). Null → empty. */
export function pad(n: number | null): string {
  if (n === null) return '';
  return String(n).padStart(2, '0');
}

/** Sidebar subtask sort: active group (open | review) first, terminal group
 *  (closed | cancelled) after; within each group, ascending by sequence. */
const STATE_GROUP: Record<SubtaskState, number> = { open: 0, review: 0, closed: 1, cancelled: 1 };
export function sortSubtasksForSidebar(subtasks: IssueSubtask[]): IssueSubtask[] {
  return [...subtasks].sort((a, b) => {
    const g = STATE_GROUP[a.state] - STATE_GROUP[b.state];
    if (g !== 0) return g;
    const sa = a.sequence ?? Number.MAX_SAFE_INTEGER;
    const sb = b.sequence ?? Number.MAX_SAFE_INTEGER;
    return sa - sb;
  });
}

/** Where the terminal group starts in a sidebar-sorted list; used to insert
 *  the "is-group-start" divider between active and terminal subtasks. */
export function terminalStartIndex(sorted: IssueSubtask[]): number {
  return sorted.findIndex((s) => TERMINAL.includes(s.state));
}

/** Word-count cap past which a Comprehensive-panel item collapses. */
export const COMPREHENSIVE_WORD_CAP = 150;

/** Approximate word count of rendered HTML — strips tags + entities. */
export function wordCount(html: string): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&[#a-z0-9]+;/gi, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/** Stable color palette keyed by author name (used for thread avatars). */
const AVATAR_COLORS = ['#7aa2f7', '#bb9af7', '#f7768e', '#e0af68', '#9ece6a', '#2ac3de', '#ff9e64'];
export function avatarColor(name: string | null | undefined): string {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** First character of a name, uppercased — avatar fallback when no image. */
export function initial(name: string | null | undefined): string {
  return (name || '?').trim().charAt(0).toUpperCase();
}

/** Panel key for an agent-log entry. Used only on the overview detail page
 *  where multiple sub-docs share one DOM. Sub-doc pages (their own URL) use
 *  the URL path instead. Flat files: `log-<name>`; grouped: `log-<group>--<name>`. */
export function logPanelKey(log: IssueAgentLog): string {
  return log.group ? `log-${log.group}--${log.name}` : `log-${log.name}`;
}

// ===== Sub-doc URL helpers (subtask 17) =====
// Each sub-doc has its own URL so links are shareable / bookmarkable and
// every heading anchor works natively without id-prefixing.

function joinPath(base: string, ...parts: string[]): string {
  const b = base.replace(/\/+$/, '');
  const tail = parts.map((p) => p.replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
  return tail ? `${b}/${tail}` : b;
}

export function detailUrl(baseUrl: string, issueId: string): string {
  return joinPath(baseUrl, issueId);
}

export function subtaskUrl(baseUrl: string, issueId: string, subtask: IssueSubtask): string {
  return joinPath(baseUrl, issueId, 'subtasks', subtask.slug);
}

export function noteUrl(baseUrl: string, issueId: string, note: { name: string }): string {
  return joinPath(baseUrl, issueId, 'notes', note.name);
}

export function logUrl(baseUrl: string, issueId: string, log: IssueAgentLog): string {
  return log.group
    ? joinPath(baseUrl, issueId, 'agent-log', log.group, log.name)
    : joinPath(baseUrl, issueId, 'agent-log', log.name);
}

/** Group agent logs: { top: flat files, bySubgroup: Map<group, logs[]> } */
export function groupAgentLogs(logs: IssueAgentLog[]): {
  top: IssueAgentLog[];
  bySubgroup: Map<string, IssueAgentLog[]>;
} {
  const top: IssueAgentLog[] = [];
  const bySubgroup = new Map<string, IssueAgentLog[]>();
  for (const log of logs) {
    if (!log.group) top.push(log);
    else {
      if (!bySubgroup.has(log.group)) bySubgroup.set(log.group, []);
      bySubgroup.get(log.group)!.push(log);
    }
  }
  return { top, bySubgroup };
}
