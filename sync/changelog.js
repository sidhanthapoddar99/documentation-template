const fs = require('fs').promises;
const { config, colors } = require('./config');

// Generate changelog
async function generateChangelog(comparison, selections, updates) {
  const timestamp = new Date().toISOString();
  const changelogEntry = `
## Component Sync - ${timestamp}

### Summary
- Files replaced: ${updates.replaced.length}
- Files added: ${updates.added.length}
- Files merged: ${updates.merged.length}
- Files skipped: ${updates.skipped.length}
- Errors: ${updates.errors.length}

### Categories Updated
`;

  let content = changelogEntry;
  
  for (const [key, selected] of Object.entries(selections)) {
    if (selected) {
      const data = comparison[key];
      content += `\n#### ${data.name}\n`;
      
      if (data.files.changed.length > 0) {
        content += `**Changed files:**\n`;
        data.files.changed.forEach(file => {
          content += `- ${file}\n`;
        });
      }
      
      if (data.files.new.length > 0) {
        content += `\n**New files:**\n`;
        data.files.new.forEach(file => {
          content += `- ${file}\n`;
        });
      }
    }
  }
  
  if (updates.errors.length > 0) {
    content += `\n### Errors\n`;
    updates.errors.forEach(({ file, error }) => {
      content += `- ${file}: ${error}\n`;
    });
  }
  
  content += '\n---\n\n';
  
  // Prepend to existing changelog or create new one
  try {
    const existingChangelog = await fs.readFile(config.changelogFile, 'utf-8').catch(() => '');
    await fs.writeFile(config.changelogFile, content + existingChangelog);
    console.log(`${colors.green}✓ Changelog updated${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error writing changelog:${colors.reset}`, error.message);
  }
}

module.exports = {
  generateChangelog
};