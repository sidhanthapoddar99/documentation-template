/**
 * Shared utilities for scripts/issues/*.mjs
 *
 * Read-only helpers + safe surgical mutators. Mirrors the production
 * loadIssues() shape (src/loaders/issues.ts) but stays read-light:
 * no markdown rendering, no caching, no Astro coupling.
 *
 * Run with bun (preferred) or node — both support .mjs + node:* imports.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

// ---------- Paths & validation ----------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Walk up from SCRIPT_DIR looking for the project root marker (`dynamic_data/`).
 * Works whether the skill is installed project-local (`<repo>/.claude/skills/…`)
 * or user-level (`~/.claude/skills/…` with cwd inside the project). Override
 * with the DOCS_PROJECT_ROOT env var if auto-detect ever guesses wrong.
 */
function findProjectRoot(startDir) {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'dynamic_data'))) return dir;
    dir = path.dirname(dir);
  }
  if (fs.existsSync(path.join(process.cwd(), 'dynamic_data'))) return process.cwd();
  return process.cwd();
}

export const PROJECT_ROOT = process.env.DOCS_PROJECT_ROOT || findProjectRoot(SCRIPT_DIR);
export const DEFAULT_TRACKER = path.join(PROJECT_ROOT, 'dynamic_data', 'data', 'todo');

const FOLDER_PATTERN = /^(\d{4}-\d{2}-\d{2})-([a-z0-9][a-z0-9-]*)$/;
const COMMENT_PATTERN = /^(\d+)_(\d{4}-\d{2}-\d{2})_([a-z0-9-]+)\.md$/i;
const VALID_STATES = ['open', 'review', 'closed', 'cancelled'];

export function isValidState(s) {
  return VALID_STATES.includes(s);
}

/** Allow-list: refuse to write anywhere outside dynamic_data/. */
export function isInsideAllowed(filePath) {
  const abs = path.resolve(filePath);
  const allowed = path.join(PROJECT_ROOT, 'dynamic_data');
  return abs === allowed || abs.startsWith(allowed + path.sep);
}

// ---------- Args parsing ----------------------------------------------------

/**
 * Tiny CLI parser. Supports `--key value`, `--key=value`, bare flags, and
 * positional args (collected in `_`). No external dep.
 */
export function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) {
        args.flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('--')) {
          args.flags[key] = true;
        } else {
          args.flags[key] = next;
          i++;
        }
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

export function csv(s) {
  if (typeof s !== 'string') return [];
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

// ---------- Read helpers ----------------------------------------------------

export function readJson(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
  catch { return null; }
}

export function readVocabulary(trackerPath) {
  return readJson(path.join(trackerPath, 'settings.json')) ?? { fields: {} };
}

export function listIssueFolders(trackerPath) {
  if (!fs.existsSync(trackerPath)) return [];
  return fs
    .readdirSync(trackerPath, { withFileTypes: true })
    .filter((e) => e.isDirectory() && FOLDER_PATTERN.test(e.name))
    .map((e) => e.name)
    .sort();
}

export function readIssueMeta(trackerPath, issueId) {
  return readJson(path.join(trackerPath, issueId, 'settings.json'));
}

export function readIssueSubtasks(trackerPath, issueId) {
  const dir = path.join(trackerPath, issueId, 'subtasks');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((n) => n.endsWith('.md')).sort();
  return files.map((name) => {
    const abs = path.join(dir, name);
    const slug = name.replace(/\.md$/, '');
    const prefixMatch = slug.match(/^(\d+)[_-]/);
    const sequence = prefixMatch ? parseInt(prefixMatch[1], 10) : null;
    let title = slug.replace(/^\d+[-_]?/, '').replace(/[-_]/g, ' ');
    let state = 'open';
    try {
      const fm = matter(fs.readFileSync(abs, 'utf-8')).data;
      if (fm.title) title = fm.title;
      if (VALID_STATES.includes(fm.state)) state = fm.state;
      else if (fm.done === true) state = 'closed';
    } catch { /* malformed frontmatter — keep defaults */ }
    const done = state === 'closed' || state === 'cancelled';
    return { slug, sequence, title, state, done, filePath: abs, fileName: name };
  });
}

export function readIssueComments(trackerPath, issueId) {
  const dir = path.join(trackerPath, issueId, 'comments');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((n) => n.endsWith('.md'))
    .sort()
    .map((name) => {
      const abs = path.join(dir, name);
      const m = name.match(COMMENT_PATTERN);
      let date = null, author = null, sequence = 0;
      if (m) {
        sequence = parseInt(m[1], 10);
        date = m[2];
        author = m[3];
      } else {
        const seq = name.match(/^(\d+)/);
        if (seq) sequence = parseInt(seq[1], 10);
        try {
          const fm = matter(fs.readFileSync(abs, 'utf-8')).data;
          if (fm.author) author = fm.author;
          if (fm.date) date = fm.date;
        } catch {}
      }
      return { name: name.replace(/\.md$/, ''), sequence, date, author, filePath: abs };
    });
}

function makeAgentLog(abs, group) {
  const base = path.basename(abs).replace(/\.md$/, '');
  const prefixMatch = base.match(/^(\d+)[_-]/);
  const sequence = prefixMatch ? parseInt(prefixMatch[1], 10) : 0;
  let fm = {};
  try { fm = matter(fs.readFileSync(abs, 'utf-8')).data; } catch {}
  return {
    name: base,
    sequence,
    iteration: typeof fm.iteration === 'number' ? fm.iteration : null,
    agent: fm.agent || null,
    status: fm.status || null,
    date: fm.date || null,
    group,
    filePath: abs,
  };
}

export function readIssueAgentLogs(trackerPath, issueId) {
  const dir = path.join(trackerPath, issueId, 'agent-log');
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // 1. Top-level files
  const topFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.md')).map((e) => e.name).sort();
  for (const name of topFiles) out.push(makeAgentLog(path.join(dir, name), null));

  // 2. One level of subgroup folders (max depth 1; deeper is ignored)
  const subDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  for (const sub of subDirs) {
    const subDir = path.join(dir, sub);
    let names = [];
    try { names = fs.readdirSync(subDir).filter((n) => n.endsWith('.md')).sort(); }
    catch { continue; }
    for (const name of names) out.push(makeAgentLog(path.join(subDir, name), sub));
  }

  return out;
}

// ---------- Filename helpers ------------------------------------------------

export function nextNumericPrefix(dir) {
  if (!fs.existsSync(dir)) return 1;
  let max = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const m = name.match(/^(\d+)[_-]/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

export function pad(n, width = 3) {
  return String(n).padStart(width, '0');
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- Surgical mutators ----------------------------------------------

/**
 * Set a frontmatter field via surgical regex. Preserves formatting, key
 * order, line endings, and surrounding content. If the field doesn't
 * exist, append to the end of the frontmatter block.
 */
export function setFrontmatterField(filePath, field, value) {
  if (!fs.existsSync(filePath)) {
    return { ok: false, message: `File not found: ${filePath}` };
  }
  const original = fs.readFileSync(filePath, 'utf-8');
  const fmMatch = original.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!fmMatch) {
    return { ok: false, message: `No frontmatter block in ${filePath}` };
  }
  const [, openDelim, fmBlock, closeDelim] = fmMatch;
  const newLine = `${field}: ${formatYamlScalar(value)}`;
  const re = new RegExp(`^(${field})\\s*:\\s*.*$`, 'm');
  const newFmBlock = re.test(fmBlock)
    ? fmBlock.replace(re, newLine)
    : `${fmBlock}\n${newLine}`;
  const replaced = original.replace(fmMatch[0], `${openDelim}${newFmBlock}${closeDelim}`);
  fs.writeFileSync(filePath, replaced);
  return { ok: true, message: `Set ${field}: ${value} in ${path.relative(PROJECT_ROOT, filePath)}` };
}

function formatYamlScalar(v) {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (/^[a-zA-Z0-9_.-]+$/.test(v)) return v;
  return `"${String(v).replace(/"/g, '\\"')}"`;
}

/**
 * Set a top-level scalar field in a JSON file via surgical regex. Only
 * handles simple scalar values (string, number, boolean, null). Preserves
 * formatting and key order.
 */
export function setJsonField(filePath, field, value) {
  if (!fs.existsSync(filePath)) {
    return { ok: false, message: `File not found: ${filePath}` };
  }
  const original = fs.readFileSync(filePath, 'utf-8');
  const formatted = formatJsonScalar(value);
  const re = new RegExp(`("${field}"\\s*:\\s*)("[^"]*"|-?\\d+(?:\\.\\d+)?|true|false|null)`);
  if (!re.test(original)) {
    return { ok: false, message: `Field "${field}" not found in ${filePath}` };
  }
  const replaced = original.replace(re, `$1${formatted}`);
  fs.writeFileSync(filePath, replaced);
  return { ok: true, message: `Set ${field}: ${value} in ${path.relative(PROJECT_ROOT, filePath)}` };
}

function formatJsonScalar(v) {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (v === null) return 'null';
  return JSON.stringify(String(v));
}

// ---------- CLI helpers ----------------------------------------------------

export function printHelp(name, lines) {
  console.error(`Usage: bun .claude/skills/documentation-guide/scripts/issues/${name}.mjs ${lines[0]}\n`);
  for (const line of lines.slice(1)) console.error('  ' + line);
}

export function relForLog(p) {
  return path.relative(process.cwd(), p);
}
