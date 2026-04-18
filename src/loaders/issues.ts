/**
 * Issues Loader
 *
 * Folder-per-issue content loader. Each issue lives at
 *   <dataPath>/YYYY-MM-DD-<slug>/
 *     settings.json          (metadata, required)
 *     issue.md               (body, required)
 *     comments/NNN_*.md      (thread, optional)
 *     subtasks/*.md          (checklist items — frontmatter {title, done}, optional)
 *     notes/*.md             (supporting documents, optional)
 *     agent-log/NNN_*.md    (iterative AI agent notes — frontmatter {iteration, agent, status, date}, optional)
 *
 * The root <dataPath>/settings.json defines the tag vocabulary (status, priority,
 * type, component, milestone, labels, authors) — returned as `vocabulary`.
 *
 * Draft handling matches loadContent(): per-issue `"draft": true` or root-level
 * `"draft": true` both filter out in production (via import.meta.env.PROD).
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createIssuesParser } from '../parsers/content-types/issues';

export interface IssueMetadata {
  title: string;
  description?: string;
  status: string;
  priority: string;
  component: string;
  milestone: string;
  labels: string[];
  author: string;
  assignees: string[];
  updated: string;
  due: string | null;
  draft?: boolean;
}

export interface IssueComment {
  /** e.g. "001_2026-04-17_sid" */
  name: string;
  /** e.g. 1 */
  sequence: number;
  /** e.g. "2026-04-17" */
  date: string | null;
  /** e.g. "sid" */
  author: string | null;
  /** rendered HTML */
  html: string;
  filePath: string;
}

export interface IssueNote {
  /** e.g. "design" (filename without extension) */
  name: string;
  filePath: string;
  relativePath: string;
  /** Rendered HTML */
  html: string;
}

export interface IssueAgentLog {
  /** Filename without extension, e.g. "001_initial-triage" */
  name: string;
  /** Numeric prefix if filename starts with "NNN_", else the sort order.
   *  In a subgroup, sequence resets per subgroup (001, 002, … per folder). */
  sequence: number;
  /** Frontmatter `iteration` field (falls back to sequence) */
  iteration: number | null;
  /** Frontmatter `agent` — which agent wrote this log */
  agent: string | null;
  /** Frontmatter `status` — free-form (in-progress / success / failed / …) */
  status: string | null;
  /** Frontmatter `date` */
  date: string | null;
  /** Subgroup folder name (e.g. "exploration"), or null for top-level
   *  files. Max depth is 1 — anything deeper is warned + ignored. */
  group: string | null;
  filePath: string;
  /** Path relative to the issue folder — includes the group when grouped
   *  (e.g. "agent-log/exploration/001_approach-a.md"). */
  relativePath: string;
  /** Rendered HTML of the body */
  html: string;
}

export type SubtaskState = 'open' | 'review' | 'closed' | 'cancelled';

export interface IssueSubtask {
  /** Filename without extension, used as stable id within the issue */
  slug: string;
  /** Numeric prefix parsed from slug (e.g. "01_foo" → 1). null when absent. */
  sequence: number | null;
  /** Display title (from frontmatter `title`, or derived from slug) */
  title: string;
  /** Canonical 4-state status. Reads `state` first, falls back to `done`. */
  state: SubtaskState;
  /** Legacy boolean alias — true for terminal states (closed | cancelled). */
  done: boolean;
  /** Absolute path — used by the toggle endpoint */
  filePath: string;
  /** Relative path from dataPath — safer wire format */
  relativePath: string;
  /** Rendered HTML of the body (markdown below the frontmatter) */
  html: string;
}

export interface Issue {
  /** Folder name, e.g. "2026-04-17-editor-performance" — the canonical id */
  id: string;
  /** Creation date from folder prefix */
  created: string;
  /** Slug portion of folder name */
  slug: string;
  /** Absolute path to the issue folder */
  folderPath: string;
  /** Metadata from settings.json */
  meta: IssueMetadata;
  /** Rendered HTML of issue.md */
  html: string;
  /** Sorted comments (by filename) */
  comments: IssueComment[];
  /** Subtasks (sorted by filename) */
  subtasks: IssueSubtask[];
  /** Notes — supporting markdown docs under notes/ */
  notes: IssueNote[];
  /** Agent logs — iterative AI execution notes under agent-log/ */
  agentLogs: IssueAgentLog[];
}

export interface IssuesVocabularyField {
  values: string[];
  colors?: Record<string, string>;
}

export interface IssuesPresetView {
  name: string;
  filters?: Record<string, string[]>;
  state?: string;
  group?: string;
  search?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
}

export interface IssuesVocabulary {
  label?: string;
  draft?: boolean;
  fields: Record<string, IssuesVocabularyField>;
  authors?: string[];
  /** Preset views defined in root settings.json — subtask 13 */
  views?: IssuesPresetView[];
}

export interface LoadedIssues {
  vocabulary: IssuesVocabulary;
  /** Root-level draft flag — if true, the whole tracker is dev-only */
  rootDraft: boolean;
  issues: Issue[];
}

const FOLDER_PATTERN = /^(\d{4}-\d{2}-\d{2})-([a-z0-9][a-z0-9-]*)$/;
const COMMENT_PATTERN = /^(\d+)_(\d{4}-\d{2}-\d{2})_([a-z0-9-]+)\.md$/i;

// ============================================================================
// In-memory cache (dev-server process lifetime)
// Invalidated when the signature — a summed mtime over every tracked file —
// changes. Scan is O(N_files) stat calls; ~sub-ms for ~100 issues and cheap
// enough to run per request.
// ============================================================================

interface CacheEntry {
  signature: number;
  data: LoadedIssues;
}
const cache = new Map<string, CacheEntry>();

function statMtime(p: string): number {
  try {
    return fs.statSync(p).mtimeMs;
  } catch {
    return 0;
  }
}

function computeSignature(dataPath: string): number {
  let sig = statMtime(path.join(dataPath, 'settings.json'));
  sig += statMtime(dataPath); // folder listing changes

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dataPath, { withFileTypes: true });
  } catch {
    return sig;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || !FOLDER_PATTERN.test(entry.name)) continue;
    const folder = path.join(dataPath, entry.name);
    sig += statMtime(folder);
    sig += statMtime(path.join(folder, 'settings.json'));
    sig += statMtime(path.join(folder, 'issue.md'));

    for (const sub of ['comments', 'subtasks', 'notes', 'agent-log']) {
      const subDir = path.join(folder, sub);
      sig += statMtime(subDir);
      try {
        const items = fs.readdirSync(subDir, { withFileTypes: true });
        for (const item of items) {
          const abs = path.join(subDir, item.name);
          if (item.isFile() && item.name.endsWith('.md')) {
            sig += statMtime(abs);
          } else if (item.isDirectory() && sub === 'agent-log') {
            // One level of nesting in agent-log for subgroups.
            sig += statMtime(abs);
            try {
              for (const f of fs.readdirSync(abs)) {
                if (f.endsWith('.md')) sig += statMtime(path.join(abs, f));
              }
            } catch { /* empty group */ }
          }
        }
      } catch { /* dir absent */ }
    }
  }

  return sig;
}

/** Invalidate the in-memory issues cache for a given dataPath (or all paths if omitted). */
export function invalidateIssuesCache(dataPath?: string): void {
  if (dataPath) cache.delete(dataPath);
  else cache.clear();
}

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

// Single shared parser — initialized lazily
let parser: ReturnType<typeof createIssuesParser> | null = null;
function getParser() {
  if (!parser) parser = createIssuesParser();
  return parser;
}

async function renderMarkdown(filePath: string, basePath: string): Promise<string> {
  const parsed = await getParser().parse(filePath, basePath);
  return parsed?.content ?? '';
}

function readComments(commentsDir: string): IssueComment[] {
  if (!fs.existsSync(commentsDir)) return [];
  const entries = fs.readdirSync(commentsDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name)
    .sort();
  return files.map((name) => {
    const match = name.match(COMMENT_PATTERN);
    return {
      name: name.replace(/\.md$/, ''),
      sequence: match ? parseInt(match[1], 10) : 0,
      date: match ? match[2] : null,
      author: match ? match[3] : null,
      html: '',
      filePath: path.join(commentsDir, name),
    };
  });
}

async function loadIssueFolder(folderPath: string, dataPath: string): Promise<Issue | null> {
  const id = path.basename(folderPath);
  const match = id.match(FOLDER_PATTERN);
  if (!match) return null;

  const settingsPath = path.join(folderPath, 'settings.json');
  const meta = readJson<IssueMetadata>(settingsPath);
  if (!meta) {
    console.warn(`[issues] Skipping "${id}" — missing or invalid settings.json`);
    return null;
  }

  const issuePath = path.join(folderPath, 'issue.md');
  const html = fs.existsSync(issuePath) ? await renderMarkdown(issuePath, dataPath) : '';

  // Comments
  const commentsDir = path.join(folderPath, 'comments');
  const comments = readComments(commentsDir);
  for (const c of comments) {
    c.html = await renderMarkdown(c.filePath, dataPath);
  }

  // Subtasks: frontmatter-driven files under subtasks/ (body optional)
  const subtasks = await readSubtasks(path.join(folderPath, 'subtasks'), dataPath);

  // Notes: rendered markdown under notes/
  const notes: IssueNote[] = [];
  const notesDir = path.join(folderPath, 'notes');
  if (fs.existsSync(notesDir)) {
    const noteEntries = fs
      .readdirSync(notesDir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name)
      .sort();
    for (const name of noteEntries) {
      const abs = path.join(notesDir, name);
      notes.push({
        name: name.replace(/\.md$/, ''),
        filePath: abs,
        relativePath: path.relative(dataPath, abs),
        html: await renderMarkdown(abs, dataPath),
      });
    }
  }

  // Agent logs: flat top-level files + one level of subgroup folders.
  // Each subgroup has its own reset sequence counter. Anything nested
  // deeper than <group>/<file>.md is warned and ignored.
  const agentLogs = await readAgentLogs(path.join(folderPath, 'agent-log'), dataPath, id);

  // Warn on stray root-level *.md (users upgrading from the old layout)
  const stray = fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md') && e.name !== 'issue.md')
    .map((e) => e.name);
  if (stray.length) {
    console.warn(
      `[issues] "${id}" has loose .md files at the folder root — move them into notes/: ${stray.join(', ')}`,
    );
  }

  return {
    id,
    created: match[1],
    slug: match[2],
    folderPath,
    meta: {
      ...meta,
      labels: Array.isArray(meta.labels) ? meta.labels : [],
      assignees: Array.isArray(meta.assignees) ? meta.assignees : [],
    },
    html,
    comments,
    subtasks,
    notes,
    agentLogs,
  };
}

async function readAgentLogs(
  logsDir: string,
  dataPath: string,
  issueId: string,
): Promise<IssueAgentLog[]> {
  if (!fs.existsSync(logsDir)) return [];

  async function makeLog(abs: string, group: string | null, fallbackSeq: number): Promise<IssueAgentLog> {
    const base = path.basename(abs).replace(/\.md$/, '');
    const prefixMatch = base.match(/^(\d+)[_-]/);
    const sequence = prefixMatch ? parseInt(prefixMatch[1], 10) : fallbackSeq;
    let fm: { iteration?: number; agent?: string; status?: string; date?: string } = {};
    try { fm = matter(fs.readFileSync(abs, 'utf-8')).data as typeof fm; } catch {}
    return {
      name: base,
      sequence,
      iteration: typeof fm.iteration === 'number' ? fm.iteration : null,
      agent: fm.agent || null,
      status: fm.status || null,
      date: fm.date || null,
      group,
      filePath: abs,
      relativePath: path.relative(dataPath, abs),
      html: await renderMarkdown(abs, dataPath),
    };
  }

  const out: IssueAgentLog[] = [];
  const entries = fs.readdirSync(logsDir, { withFileTypes: true });

  // 1. Flat top-level files (group: null)
  const topFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name)
    .sort();
  let topI = 0;
  for (const name of topFiles) {
    out.push(await makeLog(path.join(logsDir, name), null, ++topI));
  }

  // 2. One level of subgroup folders — per-subgroup reset sequence
  const subFolders = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  for (const folder of subFolders) {
    const subDir = path.join(logsDir, folder);
    let subEntries: fs.Dirent[];
    try { subEntries = fs.readdirSync(subDir, { withFileTypes: true }); }
    catch { continue; }

    const subFiles = subEntries
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name)
      .sort();
    let subI = 0;
    for (const name of subFiles) {
      out.push(await makeLog(path.join(subDir, name), folder, ++subI));
    }

    // Warn on nesting deeper than 1 — per spec, anything below
    // agent-log/<group>/<file>.md is ignored (keeps the mental model flat).
    const deeperDirs = subEntries.filter((e) => e.isDirectory()).map((e) => e.name);
    if (deeperDirs.length > 0) {
      console.warn(
        `[issues] "${issueId}": agent-log/${folder}/ contains nested subdirs (${deeperDirs.join(', ')}); ignored — max depth is 1`,
      );
    }
  }

  return out;
}

async function readSubtasks(subtasksDir: string, dataPath: string): Promise<IssueSubtask[]> {
  if (!fs.existsSync(subtasksDir)) return [];
  const files = fs
    .readdirSync(subtasksDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name)
    .sort();
  const out: IssueSubtask[] = [];
  for (const name of files) {
    const abs = path.join(subtasksDir, name);
    const slug = name.replace(/\.md$/, '');
    const prefixMatch = slug.match(/^(\d+)[-_]/);
    const sequence = prefixMatch ? parseInt(prefixMatch[1], 10) : null;
    let title = slug.replace(/^\d+[-_]?/, '').replace(/[-_]/g, ' ');
    let state: SubtaskState = 'open';
    try {
      const parsed = matter(fs.readFileSync(abs, 'utf-8'));
      const fm = parsed.data as { title?: string; done?: boolean; state?: string };
      if (fm.title) title = fm.title;
      if (fm.state === 'open' || fm.state === 'review' || fm.state === 'closed' || fm.state === 'cancelled') {
        state = fm.state;
      } else if (fm.done === true) {
        state = 'closed';
      }
    } catch {
      // malformed frontmatter — fall back to defaults
    }
    const done = state === 'closed' || state === 'cancelled';
    const html = await renderMarkdown(abs, dataPath);
    out.push({
      slug,
      sequence,
      title,
      state,
      done,
      filePath: abs,
      relativePath: path.relative(dataPath, abs),
      html,
    });
  }
  return out;
}

/**
 * Load all issues from a directory. Filters drafts in production unless
 * `includeDrafts` is true. If the root settings.json has `"draft": true`
 * and we're in production, returns an empty issues list.
 */
export async function loadIssues(
  dataPath: string,
  options: { includeDrafts?: boolean } = {},
): Promise<LoadedIssues> {
  if (!path.isAbsolute(dataPath)) {
    throw new Error(`Expected absolute data path for issues, got "${dataPath}".`);
  }

  const { includeDrafts = !import.meta.env.PROD } = options;

  // Cache lookup — key includes includeDrafts so dev and prod can coexist
  const cacheKey = `${dataPath}::${includeDrafts ? 'd' : ''}`;
  const signature = computeSignature(dataPath);
  const cached = cache.get(cacheKey);
  if (cached && cached.signature === signature) {
    return cached.data;
  }

  const vocabulary = readJson<IssuesVocabulary>(path.join(dataPath, 'settings.json')) ?? {
    fields: {},
  };
  const rootDraft = !!vocabulary.draft;

  if (!fs.existsSync(dataPath)) {
    const empty: LoadedIssues = { vocabulary, rootDraft, issues: [] };
    cache.set(cacheKey, { signature, data: empty });
    return empty;
  }

  if (rootDraft && !includeDrafts) {
    const empty: LoadedIssues = { vocabulary, rootDraft, issues: [] };
    cache.set(cacheKey, { signature, data: empty });
    return empty;
  }

  const entries = fs.readdirSync(dataPath, { withFileTypes: true });
  const folders = entries
    .filter((e) => e.isDirectory() && FOLDER_PATTERN.test(e.name))
    .map((e) => path.join(dataPath, e.name));

  const issues: Issue[] = [];
  for (const folder of folders) {
    const issue = await loadIssueFolder(folder, dataPath);
    if (!issue) continue;
    if (!includeDrafts && issue.meta.draft) continue;
    issues.push(issue);
  }

  issues.sort((a, b) => {
    const ua = a.meta.updated || a.created;
    const ub = b.meta.updated || b.created;
    return ub.localeCompare(ua);
  });

  const result: LoadedIssues = { vocabulary, rootDraft, issues };
  cache.set(cacheKey, { signature, data: result });
  return result;
}

/**
 * Load a single issue by folder name. Served from the shared cache whenever
 * possible so repeated detail-page visits are instant.
 */
export async function loadIssue(dataPath: string, id: string): Promise<Issue | null> {
  if (!path.isAbsolute(dataPath)) {
    throw new Error(`Expected absolute data path for issues, got "${dataPath}".`);
  }
  if (!FOLDER_PATTERN.test(id)) return null;

  const { issues } = await loadIssues(dataPath);
  const hit = issues.find((i) => i.id === id);
  if (hit) return hit;

  // Not in the filtered set (e.g. draft excluded); fall back to direct read
  const folderPath = path.join(dataPath, id);
  if (!fs.existsSync(folderPath)) return null;
  return loadIssueFolder(folderPath, dataPath);
}
