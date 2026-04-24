#!/usr/bin/env bun
/**
 * add-agent-log.mjs — append an agent-log entry for an issue.
 * Auto-increments iteration if not provided.
 *
 * Optional --group <name> places the file under agent-log/<group>/
 * (max nesting depth 1 — matches the loader's expectation).
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_TRACKER, isInsideAllowed, nextNumericPrefix, pad, todayISO,
  readIssueAgentLogs, parseArgs, printHelp, relForLog,
} from './_lib.mjs';

const args = parseArgs(process.argv.slice(2));
const id = args._[0];

if (args.flags.help || !id || !args.flags.body) {
  printHelp('add-agent-log', [
    '<issue-id> --body <markdown> [--status in-progress|success|failed] [--iteration N]',
    '[--agent <name>] [--date YYYY-MM-DD] [--slug <short-slug>] [--group <subgroup>] [--tracker <path>]',
    '',
    'Append an agent-log file under <issue>/agent-log/ (or .../<group>/ with --group).',
    'Iteration auto-increments from the highest existing iteration / sequence + 1.',
    'Default status: in-progress.  Default agent: claude.  Default slug: iter-<N>.',
  ]);
  process.exit(id && args.flags.body ? 0 : 1);
}

const tracker = args.flags.tracker || DEFAULT_TRACKER;
const baseDir = path.join(tracker, id, 'agent-log');
const dir = args.flags.group ? path.join(baseDir, args.flags.group) : baseDir;
if (!isInsideAllowed(dir)) {
  console.error(`Refusing to write outside dynamic_data/: ${dir}`);
  process.exit(1);
}
fs.mkdirSync(dir, { recursive: true });

const existing = readIssueAgentLogs(tracker, id);
const inferIter = existing.length
  ? Math.max(...existing.map((l) => (l.iteration ?? l.sequence ?? 0))) + 1
  : 1;
const iteration = args.flags.iteration ? parseInt(args.flags.iteration, 10) : inferIter;
const next = nextNumericPrefix(dir);
const date = args.flags.date || todayISO();
const status = args.flags.status || 'in-progress';
const agent = args.flags.agent || 'claude';
const slug = args.flags.slug || `iter-${iteration}`;
const fileName = `${pad(next)}_${slug}.md`;
const abs = path.join(dir, fileName);

const body = `---\niteration: ${iteration}\nagent: ${agent}\nstatus: ${status}\ndate: ${date}\n---\n\n${args.flags.body}\n`;
fs.writeFileSync(abs, body);
console.log(`Wrote ${relForLog(abs)}`);
