const readline = require('readline');
const { config, colors } = require('./config');

// Basic prompt
async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

// Multi-choice prompt
async function promptMultiChoice(question, choices) {
  console.log(question);
  choices.forEach((choice, index) => {
    console.log(`  ${index + 1}. ${choice}`);
  });
  
  const answer = await prompt('Select option (number): ');
  const selection = parseInt(answer);
  
  if (selection >= 1 && selection <= choices.length) {
    return selection - 1;
  }
  return 0;
}

// Multi-select prompt
async function promptMultiSelect(items, question) {
  console.log(question);
  items.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item}`);
  });
  console.log(`  ${items.length + 1}. All`);
  console.log(`  ${items.length + 2}. None`);
  
  const answer = await prompt('Select options (comma-separated numbers): ');
  const selections = answer.split(',').map(s => parseInt(s.trim()));
  
  if (selections.includes(items.length + 1)) {
    return items;
  }
  if (selections.includes(items.length + 2)) {
    return [];
  }
  
  return items.filter((_, index) => selections.includes(index + 1));
}

// Get theme folders from comparison
async function getThemeFolders(themeComparison) {
  const folders = new Set();
  
  [...themeComparison.files.changed, ...themeComparison.files.new].forEach(file => {
    // Extract folder from path like src/theme/Navbar/index.js -> Navbar
    const match = file.match(/src\/theme\/([^\/]+)\//);
    if (match) {
      folders.add(match[1]);
    }
  });
  
  // Always include generateColors.js if changed
  if ([...themeComparison.files.changed, ...themeComparison.files.new].some(f => f.includes('generateColors.js'))) {
    folders.add('generateColors.js');
  }
  
  return Array.from(folders).sort();
}

// Category prompt
async function promptCategory(category, comparison) {
  const data = comparison[category];
  const categoryConfig = config.categories[category];
  
  // Debug: Check what's in the data
  console.log(`\nDEBUG: ${category} data:`, JSON.stringify(data.files, null, 2));
  
  const hasChanges = data.files.changed.length > 0 || data.files.new.length > 0 || (data.files.missing && data.files.missing.length > 0);
  
  if (!hasChanges) {
    console.log(`${colors.dim}No changes in ${data.name}${colors.reset}`);
    return null;
  }
  
  console.log(`\n${colors.bright}${data.name}${colors.reset}`);
  console.log(`  Changed files: ${data.files.changed.length}`);
  console.log(`  New files: ${data.files.new.length}`);
  if (data.files.missing && data.files.missing.length > 0) {
    console.log(`  Missing files (will be deleted): ${data.files.missing.length}`);
  }
  
  // Handle categories with options
  if (categoryConfig.options) {
    const choice = await promptMultiChoice(
      `How would you like to update ${data.name}?`,
      categoryConfig.options
    );
    
    if (categoryConfig.options[choice] === 'none') {
      return false;
    }
    
    if (categoryConfig.options[choice] === 'selected') {
      // For theme, show available folders
      if (category === 'theme') {
        const themeFolders = await getThemeFolders(comparison[category]);
        const selected = await promptMultiSelect(
          themeFolders,
          'Select theme folders to update:'
        );
        return { type: 'selected', items: selected };
      }
      // For configs, show available files
      if (category === 'configs') {
        const configFiles = categoryConfig.paths;
        const selected = await promptMultiSelect(
          configFiles,
          'Select config files to update:'
        );
        return { type: 'selected', items: selected };
      }
    }
    
    return true; // 'all' option
  }
  
  // Simple yes/no for other categories
  const answer = await prompt(`Update ${data.name}? (y/n): `);
  return answer === 'y' || answer === 'yes';
}

module.exports = {
  prompt,
  promptMultiChoice,
  promptMultiSelect,
  promptCategory,
  getThemeFolders
};