const path = require('path');
const fs = require('fs').promises;
const { config, colors } = require('./config');
const { fileExists, scanDirectory, compareFiles } = require('./utils');

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');

// File comparison
async function compareCategories() {
  const comparison = {};
  
  for (const [key, category] of Object.entries(config.categories)) {
    comparison[key] = {
      name: category.name,
      files: {
        identical: [],
        changed: [],
        new: [],
        deleted: []
      }
    };
    
    for (const categoryPath of category.paths) {
      const tempPath = path.join(config.tempDir, categoryPath);
      const localPath = path.join(projectRoot, categoryPath);
      
      // Check if path is a file or directory
      const tempExists = await fileExists(tempPath);
      const localExists = await fileExists(localPath);
      
      if (!tempExists) continue;
      
      const tempStats = tempExists ? await fs.stat(tempPath) : null;
      
      if (tempStats && tempStats.isFile()) {
        // Handle single file
        // Check exclusions for single file
        if (category.exclude && category.exclude.some(excl => categoryPath.includes(excl))) {
          continue;
        }
        
        if (localExists) {
          const identical = await compareFiles(tempPath, localPath);
          if (identical) {
            comparison[key].files.identical.push(categoryPath);
          } else {
            comparison[key].files.changed.push(categoryPath);
          }
        } else {
          comparison[key].files.new.push(categoryPath);
        }
      } else {
        // Handle directory
        const tempFiles = await scanDirectory(tempPath);
        
        for (const file of tempFiles) {
          const fullTempPath = path.join(tempPath, file);
          const fullLocalPath = path.join(localPath, file);
          const fullRelativePath = path.join(categoryPath, file);
          
          // Check exclusions
          if (category.exclude && category.exclude.some(excl => file.includes(excl))) {
            continue;
          }
          
          if (await fileExists(fullLocalPath)) {
            const identical = await compareFiles(fullTempPath, fullLocalPath);
            if (identical) {
              comparison[key].files.identical.push(fullRelativePath);
            } else {
              comparison[key].files.changed.push(fullRelativePath);
            }
          } else {
            comparison[key].files.new.push(fullRelativePath);
          }
        }
        
        // Check for deleted files (in local but not in temp)
        if (localExists) {
          const localFiles = await scanDirectory(localPath);
          for (const file of localFiles) {
            // Check exclusions for deleted files
            if (category.exclude && category.exclude.some(excl => file.includes(excl))) {
              continue;
            }
            
            const fullTempPath = path.join(tempPath, file);
            const fullRelativePath = path.join(categoryPath, file);
            
            if (!(await fileExists(fullTempPath))) {
              comparison[key].files.deleted.push(fullRelativePath);
            }
          }
        }
      }
    }
  }
  
  return comparison;
}

// Display comparison
function displayComparison(comparison) {
  console.log(`\n${colors.bright}=== File Comparison Summary ===${colors.reset}\n`);
  
  for (const [key, data] of Object.entries(comparison)) {
    const { name, files } = data;
    const total = files.identical.length + files.changed.length + files.new.length;
    
    console.log(`${colors.cyan}${name}:${colors.reset}`);
    console.log(`  ${colors.green}✓ Identical: ${files.identical.length}${colors.reset}`);
    console.log(`  ${colors.yellow}↻ Changed: ${files.changed.length}${colors.reset}`);
    console.log(`  ${colors.blue}+ New: ${files.new.length}${colors.reset}`);
    console.log(`  ${colors.red}- Deleted: ${files.deleted.length}${colors.reset}`);
    console.log(`  Total: ${total} files\n`);
  }
}

module.exports = {
  compareCategories,
  displayComparison
};