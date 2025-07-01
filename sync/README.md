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

### Basic Usage

```bash
# Using npm scripts (recommended)
npm run sync                                    # Sync from default repository
npm run sync:dry                                # Dry run mode

# With custom parameters (note the -- before arguments)
npm run sync -- --repo=https://github.com/org/repo.git
npm run sync -- --branch=develop
npm run sync -- --repo=https://github.com/org/repo.git --branch=main --dry-run

# Direct node execution (from project root)
node sync                                       # Sync from default repository
node sync --repo=https://github.com/org/repo.git
node sync --branch=develop
node sync --dry-run
```

#### Important Notes on npm Scripts

**Directory handling**: No issues! When using `npm run sync`, npm automatically runs from the project root directory, so all path operations work correctly.

**Parameter passing**: When using npm scripts with custom arguments, you need to use `--` to separate npm's arguments from the script's arguments:

```bash
# ✅ Correct ways to pass arguments:
npm run sync -- --repo=https://github.com/org/repo.git
npm run sync -- --branch=develop --dry-run

# ❌ This won't work:
npm run sync --repo=https://github.com/org/repo.git
```

The `--` tells npm to pass everything after it to the script being run.

#### Quick Usage Examples

1. **Simple sync**: `npm run sync`
2. **Dry run**: `npm run sync:dry`
3. **Custom repo**: `npm run sync -- --repo=https://github.com/org/repo.git`
4. **All options**: `npm run sync -- --repo=https://github.com/org/repo.git --branch=main --dry-run`

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

<table border="1" style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr>
      <th style=" padding: 12px; text-align: left; width: 20%;">Category</th>
      <th style=" padding: 12px; text-align: left; width: 60%;">Files & Description</th>
      <th style=" padding: 12px; text-align: left; width: 20%;">Sync Mode</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 12px; vertical-align: top;"><strong>✅ Components</strong></td>
      <td style="padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><code>docs/component-usage/</code> - All component documentation</li>
          <li><code>docs/docusaurus-guide/</code> - Docusaurus guide documentation</li>
          <li><code>src/components/elements/</code> - All UI components</li>
        </ul>
      </td>
      <td style="padding: 12px; vertical-align: top; text-align: center;"><strong>Replace</strong><br/><em>Overwrites completely</em></td>
    </tr>
    <tr >
      <td style="padding: 12px; vertical-align: top;"><strong>✅ Images & Icons</strong></td>
      <td style="padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><code>static/img/</code> - All images and icons</li>
          <li><strong>Excludes:</strong> logo and favicon files (preserved)</li>
        </ul>
      </td>
      <td style="padding: 12px; vertical-align: top; text-align: center;"><strong>Add-Only</strong><br/><em>Preserves existing</em></td>
    </tr>
    <tr>
      <td style="padding: 12px; vertical-align: top;"><strong>✅ Theme</strong></td>
      <td style="padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><code>src/theme/</code> - All theme files</li>
          <li><strong>Excludes:</strong> <code>colors.js</code> (preserved for customization)</li>
        </ul>
      </td>
      <td style="padding: 12px; vertical-align: top; text-align: center;"><strong>Selective</strong><br/><em>Choose what to update</em></td>
    </tr>
    <tr >
      <td style="padding: 12px; vertical-align: top;"><strong>✅ Colors</strong></td>
      <td style="padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><code>src/theme/colors.js</code> - Color definitions file</li>
        </ul>
      </td>
      <td style="padding: 12px; vertical-align: top; text-align: center;"><strong>Replace</strong><br/><em>Overwrites completely</em></td>
    </tr>
    <tr>
      <td style="padding: 12px; vertical-align: top;"><strong>✅ Custom CSS</strong></td>
      <td style="padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><code>src/css/</code> - All CSS files including custom.css and generated-colors.css</li>
        </ul>
      </td>
      <td style="padding: 12px; vertical-align: top; text-align: center;"><strong>Replace</strong><br/><em>Overwrites completely</em></td>
    </tr>
    <tr >
      <td style="padding: 12px; vertical-align: top;"><strong>✅ Configuration</strong></td>
      <td style="padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><code>docusaurus.config.js</code> - Main Docusaurus configuration</li>
          <li><code>package.json</code> - Package dependencies (smart merge)</li>
          <li><code>tsconfig.json</code> - TypeScript configuration</li>
          <li><code>.gitignore</code> - Git ignore patterns (smart merge)</li>
        </ul>
      </td>
      <td style="padding: 12px; vertical-align: top; text-align: center;"><strong>Merge</strong><br/><em>Intelligent combining</em></td>
    </tr>
    <tr>
      <td style="padding: 12px; vertical-align: top;"><strong>✅ Documentation</strong></td>
      <td style="padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><code>README.md</code> - Project documentation</li>
          <li><code>CLAUDE.md</code> - Project instructions</li>
        </ul>
      </td>
      <td style="padding: 12px; vertical-align: top; text-align: center;"><strong>Replace</strong><br/><em>Overwrites completely</em></td>
    </tr>
    <tr >
      <td style="padding: 12px; vertical-align: top;"><strong>✅ VS Code Config</strong></td>
      <td style="padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><code>.vscode/</code> - VS Code workspace settings, launch configurations, debugging setups</li>
        </ul>
      </td>
      <td style="padding: 12px; vertical-align: top; text-align: center;"><strong>Selective</strong><br/><em>Choose what to update</em></td>
    </tr>
    <tr>
      <td style="padding: 12px; vertical-align: top;"><strong>✅ Sync Tool</strong></td>
      <td style="padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><code>sync/</code> - All sync tool files</li>
          <li><strong>Excludes:</strong> <code>config.js</code> (preserved for user settings)</li>
        </ul>
      </td>
      <td style="padding: 12px; vertical-align: top; text-align: center;"><strong>Replace</strong><br/><em>Overwrites completely</em></td>
    </tr>
  </tbody>
</table>

### ❌ **Files That Don't Get Synced**

<table border="1" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
  <thead>
    <tr>
      <th style=" padding: 12px; text-align: left; width: 30%;">Category</th>
      <th style=" padding: 12px; text-align: left; width: 70%;">Files & Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 12px; vertical-align: top;"><strong>Project-Specific Content</strong></td>
      <td style="padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><code>docs/overview/</code> - Your overview documentation</li>
          <li><code>docs/platform/</code> - Your platform-specific docs</li>
          <li><code>docs/roadmap/</code> - Your roadmap content</li>
          <li><code>docs/developers/</code> - Your developer documentation</li>
          <li><code>blog/</code> - Your blog posts</li>
        </ul>
      </td>
    </tr>
    <tr >
      <td style="padding: 12px; vertical-align: top;"><strong>User Customizations</strong></td>
      <td style="padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><code>sync/config.js</code> - Your sync tool configuration</li>
          <li>Logo and favicon files in <code>static/img/</code></li>
          <li><code>src/theme/colors.js</code> when using selective theme mode</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td style="padding: 12px; vertical-align: top;"><strong>Build/Runtime Files</strong></td>
      <td style="padding: 12px; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><code>node_modules/</code> - Dependencies</li>
          <li>Build output directories</li>
          <li>Cache files</li>
          <li>Git history and configuration</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

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

## Tool Structure

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
└── README.md          # This documentation file
```

## Interactive Update Process

When you run the sync tool, it will:

1. **Show a comparison summary** of all categories:
   ```
   === File Comparison Summary ===
   
   Components:
     ✓ Identical: 15
     ↻ Changed: 3
     + New: 2
     - Deleted: 0
   ```

2. **Ask for confirmation** to proceed with updates

3. **Present update options** for each category:
   - **Components**: Update component files and documentation
   - **Images/Icons**: Add new images (won't overwrite existing)
   - **Theme**: Choose all, selected folders, or none
   - **Colors**: Update the color configuration file
   - **Custom CSS**: Update stylesheets
   - **Config Files**: Merge package.json, update configs
   - **Documentation**: Update README and CLAUDE.md
   - **Sync Tool**: Update the sync tool itself (preserves your config.js)

## Category-Specific Behaviors

### Components (Replace Mode)
Updates all component files in:
- `docs/component-usage/`
- `docs/docusaurus-guide/`
- `src/components/elements/`

### Images/Icons (Add-Only Mode)
- Only adds new images to `static/img/`
- Skips existing files
- Excludes logo and favicon files

### Theme (Selective Mode)
Offers three options:
1. **All**: Update all theme files
2. **Selected**: Choose specific folders (Navbar, DocPage, etc.)
3. **None**: Skip theme updates

Special handling for:
- `generateColors.js` is included in updates
- `colors.js` is a separate category for explicit control

### Configuration Files (Merge Mode)
- **package.json**: Intelligently merges dependencies and scripts
- **docusaurus.config.js**: Replace mode with confirmation
- **tsconfig.json**: Add-only mode
- **.gitignore**: Smart merge of ignore patterns

## Example Workflow

```bash
# 1. Run the sync tool
$ node sync

Component Sync Tool

Using default repository: https://github.com/neuralabs/template.git
Archiving repository...
✓ Repository archived successfully

Comparing files...

=== File Comparison Summary ===

Components:
  ✓ Identical: 20
  ↻ Changed: 5
  + New: 3
  Total: 28 files

Theme:
  ✓ Identical: 10
  ↻ Changed: 2
  + New: 1
  Total: 13 files

Proceed with updates? (y/n): y

# 2. Select what to update
Components
  Changed files: 5
  New files: 3
Update Components? (y/n): y

Theme
  Changed files: 2
  New files: 1
How would you like to update Theme?
  1. all
  2. selected
  3. none
Select option (number): 2

Select theme folders to update:
  1. Navbar
  2. DocPage
  3. generateColors.js
  4. All
  5. None
Select options (comma-separated numbers): 1,3

# 3. Review results
✓ Updates completed
  Replaced: 7 files
  Added: 4 files
  Merged: 1 files
  Skipped: 0 files

✓ Changelog updated
Cleaned up temporary files
```

## Changelog

The tool automatically generates detailed changelogs:

### For Actual Syncs (`CHANGELOG.md`)

```markdown
## Component Sync - 2024-01-15T10:30:00.000Z

### Summary
- Files replaced: 7
- Files added: 4
- Files merged: 1
- Files skipped: 0
- Errors: 0

### Categories Updated

#### Components
**Changed files:**
- src/components/elements/Card/Card.js
- src/components/elements/Card/Card.css
...

**New files:**
- src/components/elements/Timeline/Timeline.js
...
```

### For Dry Runs (`dryrun-changelogs.md`)

```markdown
## Component Sync DRY RUN - 2024-01-15T10:30:00.000Z

### Summary
- Files that would be replaced: 7
- Files that would be added: 4
- Files that would be merged: 1
- Files that would be skipped: 0
- Total changes planned: 12

### Planned Changes by Category

#### Components (replace mode)
**Action**: Completely replace local files with source versions

**Would update files:**
- src/components/elements/Card/Card.js
- src/components/elements/Card/Card.css
...

**Would add files:**
- src/components/elements/Timeline/Timeline.js
...
```

## Best Practices

1. **Commit Before Syncing**: Always commit your current changes before running the sync tool
2. **Review Changes**: Use `--dry-run` to preview what will be updated
3. **Selective Updates**: Use the selective options for themes and configs to maintain customizations
4. **Test After Sync**: Run `npm start` to ensure everything works after updates
5. **Check the Changelog**: Review `CHANGELOG.md` to understand what was updated

## Troubleshooting

**Git clone fails:**
- Ensure you have access to the repository
- Check your git credentials
- Verify the repository URL

**Merge conflicts in package.json:**
- The tool will prompt for each script conflict
- Choose whether to keep your version or update

**Missing dependencies after sync:**
- Run `npm install` after syncing
- Check for any peer dependency warnings

**Styling issues after theme updates:**
- Regenerate colors: `node src/theme/generateColors.js`
- Check for CSS variable changes in updated files

## Development

To modify the sync tool:

1. Edit the relevant module file
2. Test your changes locally
3. The tool will preserve your config.js during self-updates