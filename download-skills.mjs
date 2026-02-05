#!/usr/bin/env node

/**
 * Documentation Template Skills Downloader
 *
 * Downloads docs-guide and docs-settings skills from the documentation-template
 * GitHub repository and installs them to your project's .claude/skills folder.
 *
 * Usage:
 *   node download-skills.mjs [options]
 *
 * Options:
 *   -d, --dest DIR    Destination .claude directory (default: ./.claude)
 *   -r, --repo URL    GitHub repo URL
 *   -b, --branch NAME Branch to download from (default: main)
 *   -f, --force       Overwrite existing skills without prompting
 *   -h, --help        Show this help message
 *
 * Example:
 *   node download-skills.mjs --dest /path/to/project/.claude
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import { createInterface } from 'readline';
import { execSync } from 'child_process';

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_REPO = 'https://github.com/sidhanthapoddar99/documentation-template';
const DEFAULT_BRANCH = 'main';
const SKILLS = ['docs-guide', 'docs-settings'];

// Colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// =============================================================================
// Helper Functions
// =============================================================================

function print(color, symbol, message) {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

const printSuccess = (msg) => print('green', '✓', msg);
const printWarning = (msg) => print('yellow', '⚠', msg);
const printError = (msg) => print('red', '✗', msg);
const printInfo = (msg) => print('blue', 'ℹ', msg);

function printHeader() {
  console.log(colors.blue);
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       Documentation Template Skills Downloader                ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

function showHelp() {
  console.log(`
Documentation Template Skills Downloader

Downloads docs-guide and docs-settings skills from GitHub.

Usage:
  node download-skills.mjs [options]

Options:
  -d, --dest DIR    Destination .claude directory (default: ./.claude)
  -r, --repo URL    GitHub repo URL
  -b, --branch NAME Branch to download from (default: main)
  -f, --force       Overwrite existing skills without prompting
  -h, --help        Show this help message

Example:
  node download-skills.mjs --dest /path/to/project/.claude --repo https://github.com/user/documentation-template
`);
  process.exit(0);
}

function parseArgs(args) {
  const options = {
    dest: './.claude',
    repo: DEFAULT_REPO,
    branch: DEFAULT_BRANCH,
    force: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-d':
      case '--dest':
        options.dest = args[++i];
        break;
      case '-r':
      case '--repo':
        options.repo = args[++i];
        break;
      case '-b':
      case '--branch':
        options.branch = args[++i];
        break;
      case '-f':
      case '--force':
        options.force = true;
        break;
      case '-h':
      case '--help':
        showHelp();
        break;
      default:
        if (args[i].startsWith('-')) {
          printError(`Unknown option: ${args[i]}`);
          process.exit(1);
        }
    }
  }

  return options;
}

async function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const request = (url) => {
      https.get(url, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          request(response.headers.location);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: Failed to download ${url}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    };

    request(url);
  });
}

function extractRepoPath(url) {
  const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
  return match ? match[1].replace(/\.git$/, '') : null;
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function listFiles(dir, prefix = '') {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(prefix, entry.name);

    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  printHeader();

  const options = parseArgs(process.argv.slice(2));

  // Validate repo URL
  if (!options.repo) {
    printError('Repository URL is required.');
    process.exit(1);
  }

  const repoPath = extractRepoPath(options.repo);
  if (!repoPath) {
    printError(`Invalid GitHub URL: ${options.repo}`);
    process.exit(1);
  }

  printInfo(`Repository: ${repoPath}`);
  printInfo(`Branch: ${options.branch}`);
  printInfo(`Destination: ${options.dest}`);
  console.log('');

  // Create destination directory
  const skillsDir = path.join(options.dest, 'skills');
  fs.mkdirSync(skillsDir, { recursive: true });

  // Create temp directory
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-'));

  try {
    // Download repository archive
    printInfo('Downloading repository archive...');
    const archiveUrl = `https://github.com/${repoPath}/archive/refs/heads/${options.branch}.tar.gz`;

    const archiveData = await downloadFile(archiveUrl);
    const archivePath = path.join(tmpDir, 'repo.tar.gz');
    fs.writeFileSync(archivePath, archiveData);
    printSuccess('Archive downloaded');

    // Extract archive using tar
    printInfo('Extracting archive...');
    execSync(`tar -xzf "${archivePath}" -C "${tmpDir}"`, { stdio: 'pipe' });
    printSuccess('Archive extracted');
    console.log('');

    // Find extracted directory
    const extractedDirs = fs.readdirSync(tmpDir).filter(f =>
      fs.statSync(path.join(tmpDir, f)).isDirectory()
    );
    const extractedDir = path.join(tmpDir, extractedDirs[0]);

    // Process each skill
    let installedCount = 0;
    let skippedCount = 0;

    for (const skill of SKILLS) {
      console.log('━'.repeat(64));
      console.log(`${colors.blue}Processing skill: ${colors.reset}${skill}`);
      console.log('');

      const sourcePath = path.join(extractedDir, '.claude', 'skills', skill);
      const destPath = path.join(skillsDir, skill);

      // Check if skill exists in repo
      if (!fs.existsSync(sourcePath)) {
        printWarning(`Skill '${skill}' not found in repository`);
        continue;
      }

      // Check if skill already exists
      if (fs.existsSync(destPath)) {
        printWarning(`Skill '${skill}' already exists at: ${destPath}`);

        if (options.force) {
          printInfo('Force mode: Overwriting existing skill');
          fs.rmSync(destPath, { recursive: true });
        } else {
          console.log('');
          console.log('Options:');
          console.log('  [o] Overwrite - Replace existing skill with downloaded version');
          console.log('  [b] Backup    - Backup existing skill and install new one');
          console.log('  [s] Skip      - Keep existing skill, don\'t install');
          console.log('');

          const choice = await prompt('What would you like to do? [o/b/s]: ');

          switch (choice.toLowerCase()) {
            case 'o':
              printInfo('Overwriting existing skill...');
              fs.rmSync(destPath, { recursive: true });
              break;
            case 'b':
              const backupPath = `${destPath}.backup.${Date.now()}`;
              printInfo(`Backing up to: ${backupPath}`);
              fs.renameSync(destPath, backupPath);
              break;
            case 's':
            default:
              printInfo(`Skipping ${skill}`);
              skippedCount++;
              console.log('');
              continue;
          }
        }
      }

      // Copy the skill
      copyDirSync(sourcePath, destPath);
      printSuccess(`Installed skill: ${skill}`);

      // List installed files
      console.log('');
      console.log('  Files installed:');
      const files = listFiles(destPath);
      for (const file of files) {
        console.log(`    - ${skill}/${file}`);
      }

      installedCount++;
      console.log('');
    }

    // Post-installation
    console.log('━'.repeat(64));
    console.log('');

    if (installedCount > 0) {
      printSuccess('Installation complete!');
      console.log('');
      console.log(`  Installed: ${installedCount} skill(s)`);
      if (skippedCount > 0) {
        console.log(`  Skipped:   ${skippedCount} skill(s)`);
      }
      console.log('');

      console.log(`${colors.yellow}Next Steps:${colors.reset}`);
      console.log('');
      console.log('1. Add skill permissions to your Claude settings.');
      console.log(`   Edit: ${path.join(options.dest, 'settings.local.json')}`);
      console.log('');
      console.log('   Add these to the \'allow\' array:');
      console.log('');
      console.log('   "Skill(docs-guide)",');
      console.log('   "Skill(docs-settings)",');
      console.log('');
      console.log('2. Restart Claude Code to load the new skills.');
      console.log('');
      console.log('3. Use the skills:');
      console.log('   - /docs-guide - For writing documentation content');
      console.log('   - /docs-settings - For configuring documentation sites');
      console.log('');
    } else {
      printInfo('No new skills were installed.');
    }

  } finally {
    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  printError(error.message);
  process.exit(1);
});
