#!/usr/bin/env bun
/**
 * list.mjs — list issues matching multi-field filters.
 *
 * Default scope: open + review (skips closed/cancelled). Override with
 * --status, or --include-cancelled to see everything. AND across fields,
 * OR within a field.
 */

import {
  DEFAULT_TRACKER, listIssueFolders, readIssueMeta, readIssueSubtasks,
  parseArgs, csv, printHelp,
} from './_lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (args.flags.help || args.flags.h) {
  printHelp('list', [
    '[--status open,review,...] [--priority X,Y] [--component X,Y] [--milestone X,Y] [--label X,Y]',
    '[--has-review-subtasks] [--include-cancelled] [--json] [--tracker <path>]',
    '',
    'AND across fields, OR within a field. Default scope: open + review.',
    'Output (default): id<TAB>status<TAB>title.  --json prints full records.',
  ]);
  process.exit(0);
}

const tracker = args.flags.tracker || DEFAULT_TRACKER;
const filterStatus = csv(args.flags.status);
const filterPriority = csv(args.flags.priority);
const filterComponent = csv(args.flags.component);
const filterMilestone = csv(args.flags.milestone);
const filterLabel = csv(args.flags.label);
const requireReviewSub = !!args.flags['has-review-subtasks'];

const scope = filterStatus.length
  ? filterStatus
  : (args.flags['include-cancelled']
      ? ['open', 'review', 'closed', 'cancelled']
      : ['open', 'review']);

const matches = [];
for (const id of listIssueFolders(tracker)) {
  const meta = readIssueMeta(tracker, id);
  if (!meta) continue;
  if (!scope.includes(meta.status)) continue;
  if (filterPriority.length && !filterPriority.includes(meta.priority)) continue;
  if (filterMilestone.length && !filterMilestone.includes(meta.milestone)) continue;
  if (filterComponent.length) {
    const comps = Array.isArray(meta.component)
      ? meta.component
      : (typeof meta.component === 'string' && meta.component ? [meta.component] : []);
    if (!comps.some((v) => filterComponent.includes(v))) continue;
  }
  if (filterLabel.length) {
    const labels = Array.isArray(meta.labels) ? meta.labels : [];
    if (!labels.some((v) => filterLabel.includes(v))) continue;
  }
  if (requireReviewSub) {
    const subs = readIssueSubtasks(tracker, id);
    if (!subs.some((s) => s.state === 'review')) continue;
  }
  matches.push({
    id,
    status: meta.status,
    priority: meta.priority,
    milestone: meta.milestone,
    component: Array.isArray(meta.component) ? meta.component : [],
    labels: Array.isArray(meta.labels) ? meta.labels : [],
    title: meta.title,
  });
}

if (args.flags.json) {
  console.log(JSON.stringify(matches, null, 2));
} else {
  for (const m of matches) console.log(`${m.id}\t${m.status}\t${m.title}`);
}
