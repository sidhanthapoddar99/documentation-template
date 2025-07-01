const fs = require('fs').promises;
const path = require('path');
const { config, colors, projectRoot } = require('./config');

// Generate detailed changelog for both dry runs and actual updates
async function generateChangelog(comparison, selections, updates, isDryRun = false) {
  const timestamp = new Date().toISOString();
  const runType = isDryRun ? 'DRY RUN' : 'ACTUAL SYNC';
  
  let changelogEntry = `
## Component Sync ${runType} - ${timestamp}

### Summary
`;

  if (isDryRun) {
    // For dry runs, calculate what would happen based on comparison and selections
    let wouldReplace = 0, wouldAdd = 0, wouldMerge = 0, wouldSkip = 0;
    
    for (const [key, selected] of Object.entries(selections)) {
      if (selected) {
        const data = comparison[key];
        const categoryConfig = config.categories[key];
        
        if (categoryConfig.mode === 'replace') {
          wouldReplace += (data.files.changed?.length || 0) + (data.files.new?.length || 0);
        } else if (categoryConfig.mode === 'add-only') {
          wouldAdd += (data.files.new?.length || 0);
          wouldSkip += (data.files.changed?.length || 0);
        } else if (categoryConfig.mode === 'merge') {
          wouldMerge += (data.files.changed?.length || 0) + (data.files.new?.length || 0);
        } else if (categoryConfig.mode === 'selective') {
          wouldReplace += (data.files.changed?.length || 0) + (data.files.new?.length || 0);
        }
      }
    }
    
    changelogEntry += `- Files that would be replaced: ${wouldReplace}
- Files that would be added: ${wouldAdd}
- Files that would be merged: ${wouldMerge}
- Files that would be skipped: ${wouldSkip}
- Total changes planned: ${wouldReplace + wouldAdd + wouldMerge}

### Planned Changes by Category
`;
  } else {
    changelogEntry += `- Files replaced: ${updates.replaced.length}
- Files added: ${updates.added.length}
- Files merged: ${updates.merged.length}
- Files skipped: ${updates.skipped.length}
- Errors: ${updates.errors.length}

### Categories Updated
`;
  }

  let content = changelogEntry;
  
  for (const [key, selected] of Object.entries(selections)) {
    if (selected) {
      const data = comparison[key];
      const categoryConfig = config.categories[key];
      content += `\n#### ${data.name} (${categoryConfig.mode} mode)\n`;
      
      if (isDryRun) {
        content += `**Action**: ${getModeDescription(categoryConfig.mode)}\n\n`;
      }
      
      if (data.files.changed && data.files.changed.length > 0) {
        const actionWord = isDryRun ? 'Would update' : 'Updated';
        content += `**${actionWord} files:**\n`;
        data.files.changed.forEach(file => {
          content += `- ${file}\n`;
        });
      }
      
      if (data.files.new && data.files.new.length > 0) {
        const actionWord = isDryRun ? 'Would add' : 'Added';
        content += `\n**${actionWord} files:**\n`;
        data.files.new.forEach(file => {
          content += `- ${file}\n`;
        });
      }
      
      if (data.files.missing && data.files.missing.length > 0 && isDryRun) {
        content += `\n**Would remove (missing in source):**\n`;
        data.files.missing.forEach(file => {
          content += `- ${file}\n`;
        });
      }
    }
  }
  
  if (updates && updates.errors && updates.errors.length > 0) {
    content += `\n### Errors\n`;
    updates.errors.forEach(({ file, error }) => {
      content += `- ${file}: ${error}\n`;
    });
  }
  
  content += '\n---\n\n';
  
  // Choose the appropriate changelog file
  const changelogFile = isDryRun 
    ? path.join(projectRoot, 'dryrun-changelogs.md')
    : config.changelogFile;
  
  // Prepend to existing changelog or create new one
  try {
    const existingChangelog = await fs.readFile(changelogFile, 'utf-8').catch(() => '');
    await fs.writeFile(changelogFile, content + existingChangelog);
    const logType = isDryRun ? 'Dry run changelog' : 'Changelog';
    console.log(`${colors.green}✓ ${logType} updated${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error writing changelog:${colors.reset}`, error.message);
  }
}

// Helper function to describe sync modes
function getModeDescription(mode) {
  switch (mode) {
    case 'replace':
      return 'Completely replace local files with source versions';
    case 'add-only':
      return 'Add new files only, preserve existing files';
    case 'merge':
      return 'Intelligently merge configuration files';
    case 'selective':
      return 'User-selected files will be replaced';
    default:
      return 'Unknown mode';
  }
}

// Generate dry run changelog without updates object
async function generateDryRunChangelog(comparison, selections) {
  await generateChangelog(comparison, selections, { replaced: [], added: [], merged: [], skipped: [], errors: [] }, true);
}

module.exports = {
  generateChangelog,
  generateDryRunChangelog
};