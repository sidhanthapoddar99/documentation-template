// Configuration for sync tool
const path = require('path');

// Get the project root directory (parent of sync folder)
const projectRoot = path.resolve(__dirname, '..');

const config = {
  tempDir: path.join(projectRoot, 'git_temp'),
  changelogFile: path.join(projectRoot, 'CHANGELOG.md'),
  defaultRepo: 'https://github.com/sidhanthapoddar99/documentation-template',
  categories: {
    components: {
      name: 'Components',
      paths: [
        'docs/component-usage',
        'docs/docusaurus-guide',
        'src/components/elements'
      ],
      mode: 'replace'
    },
    images: {
      name: 'Images and Icons',
      paths: ['static/img'],
      mode: 'add-only',
      exclude: ['logo', 'favicon']
    },
    theme: {
      name: 'Theme',
      paths: ['src/theme'],
      mode: 'selective',
      exclude: ['colors.js'],
      options: ['all', 'selected', 'none']
    },
    colors: {
      name: 'Colors Configuration',
      paths: ['src/theme/colors.js'],
      mode: 'replace'
    },
    css: {
      name: 'Custom CSS',
      paths: ['src/css'],
      mode: 'replace'
    },
    configs: {
      name: 'Configuration Files',
      paths: ['docusaurus.config.js', 'package.json', 'tsconfig.json', '.gitignore'],
      mode: 'replace'
    },
    vscode: {
      name: 'VS Code Configuration',
      paths: ['.vscode'],
      mode: 'replace'
    },
    docs: {
      name: 'Documentation',
      paths: ['README.md', 'CLAUDE.md'],
      mode: 'replace'
    },
    syncTool: {
      name: 'Sync Tool',
      paths: ['sync'],
      mode: 'replace',
      // exclude: ['config.js'] // optinal to exclude this file from sync
    }
  }
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

module.exports = { config, colors, projectRoot };