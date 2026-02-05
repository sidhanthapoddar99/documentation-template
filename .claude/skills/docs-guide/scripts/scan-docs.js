#!/usr/bin/env node

/**
 * scan-docs.js - Scan a documentation directory for structure and frontmatter
 *
 * Usage: node scan-docs.js <docs-path>
 *
 * Outputs:
 * 1. Project structure (folders and md/mdx files)
 * 2. Frontmatter summary for each file
 */

import fs from 'fs';
import path from 'path';

const IGNORE_DIRS = new Set(['node_modules', '.git', 'assets', '.claude', 'dist', 'build']);
const MD_EXTENSIONS = new Set(['.md', '.mdx']);

/**
 * Parse YAML frontmatter from file content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const frontmatter = {};

  // Simple YAML parser for common frontmatter fields
  const lines = yaml.split('\n');
  let currentKey = null;
  let inArray = false;
  let arrayValues = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Array item
    if (trimmed.startsWith('- ') && currentKey && inArray) {
      arrayValues.push(trimmed.slice(2).trim());
      continue;
    }

    // Save previous array if we were in one
    if (inArray && currentKey) {
      frontmatter[currentKey] = arrayValues;
      inArray = false;
      arrayValues = [];
    }

    // Key-value pair
    const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      const [, key, value] = kvMatch;
      currentKey = key;

      if (value === '') {
        // Could be start of array or empty value
        inArray = true;
        arrayValues = [];
      } else {
        // Remove quotes if present
        frontmatter[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  }

  // Handle trailing array
  if (inArray && currentKey && arrayValues.length > 0) {
    frontmatter[currentKey] = arrayValues;
  }

  return frontmatter;
}

/**
 * Scan directory recursively and build structure
 */
function scanDirectory(dirPath, relativePath = '', depth = 0) {
  const result = {
    structure: [],
    files: []
  };

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    console.error(`Error reading directory: ${dirPath}`);
    return result;
  }

  // Sort: directories first, then files, both alphabetically
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    const entryRelative = path.join(relativePath, entry.name);
    const indent = '  '.repeat(depth);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;

      result.structure.push(`${indent}📁 ${entry.name}/`);

      // Check for settings.json
      const settingsPath = path.join(entryPath, 'settings.json');
      if (fs.existsSync(settingsPath)) {
        try {
          const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
          if (settings.label) {
            result.structure.push(`${indent}   └─ settings.json (label: "${settings.label}")`);
          }
        } catch {
          // Ignore parse errors
        }
      }

      // Recurse into subdirectory
      const subResult = scanDirectory(entryPath, entryRelative, depth + 1);
      result.structure.push(...subResult.structure);
      result.files.push(...subResult.files);

    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();

      if (MD_EXTENSIONS.has(ext)) {
        result.structure.push(`${indent}📄 ${entry.name}`);

        // Read and parse frontmatter
        try {
          const content = fs.readFileSync(entryPath, 'utf-8');
          const frontmatter = parseFrontmatter(content);

          result.files.push({
            path: entryRelative,
            name: entry.name,
            frontmatter: frontmatter || {}
          });
        } catch (err) {
          result.files.push({
            path: entryRelative,
            name: entry.name,
            frontmatter: {},
            error: err.message
          });
        }
      } else if (entry.name === 'settings.json' && depth === 0) {
        // Root settings.json
        result.structure.push(`${indent}⚙️  ${entry.name}`);
      }
    }
  }

  return result;
}

/**
 * Format frontmatter summary for output
 */
function formatFrontmatterSummary(files) {
  if (files.length === 0) {
    return 'No markdown files found.';
  }

  const lines = [];

  for (const file of files) {
    const fm = file.frontmatter;
    const parts = [];

    if (fm.title) parts.push(`title: "${fm.title}"`);
    if (fm.description) {
      const desc = fm.description.length > 60
        ? fm.description.slice(0, 60) + '...'
        : fm.description;
      parts.push(`desc: "${desc}"`);
    }
    if (fm.sidebar_label) parts.push(`sidebar: "${fm.sidebar_label}"`);
    if (fm.draft === 'true' || fm.draft === true) parts.push('DRAFT');
    if (fm.tags && Array.isArray(fm.tags)) parts.push(`tags: [${fm.tags.join(', ')}]`);

    const summary = parts.length > 0 ? parts.join(' | ') : '(no frontmatter)';
    lines.push(`  ${file.path}`);
    lines.push(`    └─ ${summary}`);
  }

  return lines.join('\n');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scan-docs.js <docs-path>');
    console.log('');
    console.log('Example: node scan-docs.js ./docs');
    process.exit(1);
  }

  const docsPath = path.resolve(args[0]);

  if (!fs.existsSync(docsPath)) {
    console.error(`Error: Path does not exist: ${docsPath}`);
    process.exit(1);
  }

  if (!fs.statSync(docsPath).isDirectory()) {
    console.error(`Error: Path is not a directory: ${docsPath}`);
    process.exit(1);
  }

  console.log('# Documentation Scan Results');
  console.log('');
  console.log(`Scanned: ${docsPath}`);
  console.log('');

  const result = scanDirectory(docsPath);

  // Output structure
  console.log('## Project Structure');
  console.log('');
  console.log('```');
  console.log(result.structure.join('\n'));
  console.log('```');
  console.log('');

  // Output frontmatter summary
  console.log('## Frontmatter Summary');
  console.log('');
  console.log(`Found ${result.files.length} markdown file(s)`);
  console.log('');
  console.log(formatFrontmatterSummary(result.files));
  console.log('');

  // Output statistics
  const withTitle = result.files.filter(f => f.frontmatter.title).length;
  const withDesc = result.files.filter(f => f.frontmatter.description).length;
  const drafts = result.files.filter(f => f.frontmatter.draft === 'true' || f.frontmatter.draft === true).length;
  const noFrontmatter = result.files.filter(f => Object.keys(f.frontmatter).length === 0).length;

  console.log('## Statistics');
  console.log('');
  console.log(`- Total files: ${result.files.length}`);
  console.log(`- With title: ${withTitle}`);
  console.log(`- With description: ${withDesc}`);
  console.log(`- Draft pages: ${drafts}`);
  console.log(`- Missing frontmatter: ${noFrontmatter}`);
}

main();
