#!/usr/bin/env bun
/**
 * subtasks.mjs — list subtasks for one issue, or across all issues.
 *
 * Default state filter: open + review (matches the AI default-search rule).
 */

import {
  DEFAULT_TRACKER, listIssueFolders, readIssueSubtasks,
  parseArgs, csv, printHelp, isValidState,
} from './_lib.mjs';

const args = parseArgs(process.argv.slice(2));
const positional = args._[0];

if (args.flags.help || (!positional && !args.flags.all)) {
  printHelp('subtasks', [
    '<issue-id|--all> [--state open,review,closed,cancelled] [--json] [--tracker <path>]',
    '',
    'List subtasks for one issue, or across all issues with --all.',
    'Default state filter: open + review.  Output: issue<TAB>file<TAB>state<TAB>title.',
  ]);
  process.exit(args.flags.help ? 0 : 1);
}

const tracker = args.flags.tracker || DEFAULT_TRACKER;
const stateFilter = csv(args.flags.state).filter(isValidState);
const scope = stateFilter.length ? stateFilter : ['open', 'review'];

const issueIds = (args.flags.all || positional === '--all')
  ? listIssueFolders(tracker)
  : [positional];

const matches = [];
for (const id of issueIds) {
  const subs = readIssueSubtasks(tracker, id);
  for (const s of subs) {
    if (!scope.includes(s.state)) continue;
    matches.push({ issue: id, file: s.fileName, state: s.state, title: s.title });
  }
}

if (args.flags.json) {
  console.log(JSON.stringify(matches, null, 2));
} else {
  for (const m of matches) console.log(`${m.issue}\t${m.file}\t${m.state}\t${m.title}`);
}
