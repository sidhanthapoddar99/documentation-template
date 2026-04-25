#!/usr/bin/env bun
/**
 * docs/check.mjs — validate a docs section.
 *
 * Checks every folder + .md file inside a docs section follows the project
 * conventions documented in `references/docs-layout.md`:
 *
 *   • XX_ prefix on folders (except `assets/`) and .md files (except README.md)
 *   • settings.json present in every folder
 *   • frontmatter `title:` present on every .md file
 *   • XX_ prefixes don't collide within a folder
 *
 * Exit code 0 = clean, 1 = errors found.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];

if (!ROOT || ROOT === '--help' || ROOT === '-h') {
  console.error('Usage: docs-check-section <section-folder>\n');
  console.error('  Example: docs-check-section dynamic_data/data/user-guide\n');
  console.error('  Validates: XX_ prefix discipline · settings.json presence · frontmatter title · prefix collisions');
  process.exit(ROOT ? 0 : 1);
}

if (!fs.existsSync(ROOT)) {
  console.error(`Not found: ${ROOT}`);
  process.exit(1);
}
if (!fs.statSync(ROOT).isDirectory()) {
  console.error(`Not a directory: ${ROOT}`);
  process.exit(1);
}

const errors = [];
const warnings = [];
const PREFIX_RE = /^(\d{2})_(.+)$/;
const FRONTMATTER_TITLE_RE = /^---\r?\n[\s\S]*?^title:\s*\S+/m;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const prefixes = new Map();        // for collision detection within this folder
  const rel = path.relative(ROOT, dir) || '.';

  // Section root: must have a settings.json (sidebar label)
  if (dir !== ROOT && !fs.existsSync(path.join(dir, 'settings.json'))) {
    errors.push(`${rel}/settings.json: missing`);
  }

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const relPath = path.relative(ROOT, abs);

    if (entry.isDirectory()) {
      if (entry.name === 'assets') continue;             // assets/ excluded from sidebar
      if (entry.name.startsWith('.')) continue;          // hidden dirs

      const m = entry.name.match(PREFIX_RE);
      if (!m) {
        errors.push(`${relPath}/: folder missing XX_ prefix`);
      } else {
        const n = m[1];
        if (prefixes.has(n)) {
          errors.push(`${relPath}/: prefix ${n} collides with ${prefixes.get(n)}`);
        } else {
          prefixes.set(n, entry.name);
        }
      }
      walk(abs);
    } else if (entry.isFile()) {
      if (entry.name === 'settings.json' || entry.name === 'README.md') continue;
      if (entry.name.startsWith('.')) continue;
      if (entry.name.startsWith('__')) continue;        // __placeholder__ etc.

      // Asset files (non-md) inside a docs section
      if (!entry.name.endsWith('.md')) {
        // Allowed only inside assets/ folders — the walk skips assets/ entirely,
        // so reaching this branch means a non-md file is in a docs folder.
        warnings.push(`${relPath}: non-md file in docs folder (move to assets/?)`);
        continue;
      }

      const m = entry.name.match(PREFIX_RE);
      if (!m) {
        errors.push(`${relPath}: file missing XX_ prefix`);
      } else {
        const n = m[1];
        if (prefixes.has(n)) {
          errors.push(`${relPath}: prefix ${n} collides with ${prefixes.get(n)}`);
        } else {
          prefixes.set(n, entry.name);
        }
      }

      try {
        const content = fs.readFileSync(abs, 'utf-8');
        if (!FRONTMATTER_TITLE_RE.test(content)) {
          errors.push(`${relPath}: missing frontmatter \`title:\``);
        }
      } catch (e) {
        errors.push(`${relPath}: read error — ${e.message}`);
      }
    }
  }
}

walk(ROOT);

console.log(`# docs check: ${ROOT}`);
console.log('');
if (errors.length === 0 && warnings.length === 0) {
  console.log('✓ all checks passed');
  process.exit(0);
}
if (errors.length) {
  console.log(`## ${errors.length} error(s)`);
  for (const e of errors) console.log(`  ✗ ${e}`);
}
if (warnings.length) {
  if (errors.length) console.log('');
  console.log(`## ${warnings.length} warning(s)`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
process.exit(errors.length ? 1 : 0);
