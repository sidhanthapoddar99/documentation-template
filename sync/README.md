# Sync Tool

This directory contains the component synchronization tool that helps you pull updates from the base template while preserving your customizations.

## Structure

```
sync/
├── index.js           # Main entry point
├── config.js          # Configuration and categories
├── utils.js           # Utility functions
├── git-operations.js  # Git clone and cleanup
├── comparison.js      # File comparison logic
├── prompts.js         # Interactive CLI prompts
├── update-operations.js # File update and merge logic
├── changelog.js       # Changelog generation
└── README.md          # This file
```

## Configuration

Edit `config.js` to:
- Set your default repository URL
- Modify update categories
- Add exclusion patterns
- Customize file paths

## Usage

From the project root:

```bash
# Use default repository
node sync

# Use specific repository
node sync --repo=https://github.com/org/repo.git

# Use specific branch
node sync --branch=develop

# Dry run mode
node sync --dry-run
```

## Categories

The tool organizes updates into these categories:

1. **Components** - UI components and their documentation
2. **Images/Icons** - Static assets (add-only mode)
3. **Theme** - Docusaurus theme customizations
4. **Colors** - Color configuration file
5. **Custom CSS** - Stylesheets
6. **Config Files** - Project configuration with merging
7. **Documentation** - README and CLAUDE files
8. **Sync Tool** - Self-update capability

## Self-Update

The sync tool can update itself! When running sync, it will check for updates to the sync tool files (except config.js which contains your settings).

## Customization

### Adding a New Category

In `config.js`, add to the categories object:

```javascript
myCategory: {
  name: 'My Category',
  paths: ['path/to/files'],
  mode: 'replace', // or 'add-only', 'merge', 'selective'
  exclude: ['file-to-exclude'],
  options: ['all', 'selected', 'none'] // optional
}
```

### Modes

- **replace**: Overwrites local files with base version
- **add-only**: Only adds new files, skips existing
- **merge**: Smart merging (currently for package.json)
- **selective**: Allows choosing specific items

## Development

To modify the sync tool:

1. Edit the relevant module file
2. Test your changes locally
3. The tool will preserve your config.js during self-updates