/**
 * Issues Loader
 *
 * Folder-per-issue content loader. Each issue lives at
 *   <dataPath>/YYYY-MM-DD-<slug>/
 *     settings.json          (metadata, required)
 *     issue.md               (body, required)
 *     comments/NNN_*.md      (thread, optional)
 *     *.md                   (supporting docs, optional)
 *
 * The root <dataPath>/settings.json defines the tag vocabulary (status, priority,
 * type, component, milestone, labels, authors) — returned as `vocabulary`.
 *
 * Draft handling matches loadContent(): per-issue `"draft": true` or root-level
 * `"draft": true` both filter out in production (via import.meta.env.PROD).
 */

import fs from 'fs';
import path from 'path';
import { createIssuesParser } from '../parsers/content-types/issues';

export interface IssueMetadata {
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
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

export interface IssueSupportingDoc {
  /** e.g. "design" (filename without extension) */
  name: string;
  filePath: string;
  relativePath: string;
  /** Rendered HTML */
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
  /** Supporting .md docs other than issue.md */
  supportingDocs: IssueSupportingDoc[];
}

export interface IssuesVocabularyField {
  values: string[];
  colors?: Record<string, string>;
}

export interface IssuesVocabulary {
  label?: string;
  draft?: boolean;
  fields: Record<string, IssuesVocabularyField>;
  authors?: string[];
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

    // Comments dir + each comment file
    const commentsDir = path.join(folder, 'comments');
    sig += statMtime(commentsDir);
    try {
      for (const f of fs.readdirSync(commentsDir)) {
        if (f.endsWith('.md')) sig += statMtime(path.join(commentsDir, f));
      }
    } catch { /* no comments dir */ }

    // Root-level supporting .md files
    try {
      for (const f of fs.readdirSync(folder)) {
        if (f.endsWith('.md') && f !== 'issue.md') sig += statMtime(path.join(folder, f));
      }
    } catch { /* skip */ }
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

  // Supporting docs: *.md at the folder root, excluding issue.md
  const supportingDocs: IssueSupportingDoc[] = [];
  const rootEntries = fs.readdirSync(folderPath, { withFileTypes: true });
  const docEntries = rootEntries
    .filter((e) => e.isFile() && e.name.endsWith('.md') && e.name !== 'issue.md')
    .map((e) => e.name)
    .sort();
  for (const name of docEntries) {
    const abs = path.join(folderPath, name);
    supportingDocs.push({
      name: name.replace(/\.md$/, ''),
      filePath: abs,
      relativePath: path.relative(dataPath, abs),
      html: await renderMarkdown(abs, dataPath),
    });
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
    supportingDocs,
  };
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
