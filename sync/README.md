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

# Dry run mode (generates dryrun-changelogs.md)
node sync --dry-run
```

## Categories

The tool organizes updates into these categories:

1. **Components** - UI components and their documentation
2. **Images/Icons** - Static assets (add-only mode)
3. **Theme** - Docusaurus theme customizations
4. **Colors** - Color configuration file
5. **Custom CSS** - Stylesheets
6. **Config Files** - Project configuration with merging (includes .gitignore)
7. **Documentation** - README and CLAUDE files
8. **Sync Tool** - Self-update capability
9. **VS Code Configuration** - Workspace settings and debugging configs

## What Gets Synced vs. What Doesn't

### ✅ **Files That Get Synced**

#### **Components** (replace mode)
- `docs/component-usage/` - All component documentation
- `docs/docusaurus-guide/` - Docusaurus guide documentation  
- `src/components/elements/` - All UI components

#### **Images and Icons** (add-only mode)
- `static/img/` - All images and icons
- **Excludes**: logo and favicon files (preserved)

#### **Theme** (selective mode)
- `src/theme/` - All theme files
- **Excludes**: `colors.js` (preserved for customization)

#### **Colors Configuration** (replace mode)
- `src/theme/colors.js` - Color definitions file

#### **Custom CSS** (replace mode)
- `src/css/` - All CSS files including custom.css and generated-colors.css

#### **Configuration Files** (merge mode)
- `docusaurus.config.js` - Main Docusaurus configuration
- `package.json` - Package dependencies (smart merge)
- `tsconfig.json` - TypeScript configuration
- `.gitignore` - Git ignore patterns (smart merge)

#### **Documentation** (replace mode)
- `README.md` - Project documentation
- `CLAUDE.md` - Project instructions

#### **VS Code Configuration** (selective mode)
- `.vscode/` - VS Code workspace settings, launch configurations, debugging setups

#### **Sync Tool** (replace mode)
- `sync/` - All sync tool files
- **Excludes**: `config.js` (preserved for user settings)

### ❌ **Files That Don't Get Synced**

#### **Project-Specific Content**
- `docs/overview/` - Your overview documentation
- `docs/platform/` - Your platform-specific docs
- `docs/roadmap/` - Your roadmap content
- `docs/developers/` - Your developer documentation
- `blog/` - Your blog posts

#### **User Customizations**
- `sync/config.js` - Your sync tool configuration
- Logo and favicon files in `static/img/`
- `src/theme/colors.js` when using selective theme mode

#### **Build/Runtime Files**
- `node_modules/` - Dependencies
- Build output directories
- Cache files
- Git history and configuration

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

## Sync Modes Explained

- **replace**: Overwrites local files completely with base version
- **add-only**: Only adds new files, preserves existing ones (useful for assets)
- **merge**: Smart merging for configuration files (currently for package.json)
- **selective**: Interactive selection - you choose what to update

### Mode Examples

- **Components** use `replace` mode - ensures you get latest UI updates
- **Images** use `add-only` mode - adds new icons without overwriting your logos
- **Theme** uses `selective` mode - lets you choose which theme files to update
- **Config files** use `merge` mode - intelligently combines package dependencies and .gitignore patterns
- **VS Code** uses `selective` mode - you control which workspace settings to sync

## Changelog Generation

The sync tool automatically generates detailed changelogs:

- **Actual syncs**: Creates/updates `CHANGELOG.md`
- **Dry runs**: Creates/updates `dryrun-changelogs.md`

Both files are automatically added to `.gitignore` to prevent accidental commits.

### Changelog Features

- **Detailed file listings**: Shows exactly which files would be/were changed
- **Mode descriptions**: Explains what action each sync mode performs
- **Category organization**: Groups changes by sync category
- **Timestamp tracking**: Records when each sync operation occurred
- **Dry run previews**: See exactly what would happen before making changes

## Development

To modify the sync tool:

1. Edit the relevant module file
2. Test your changes locally
3. The tool will preserve your config.js during self-updates