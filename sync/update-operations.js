const path = require('path');
const fs = require('fs').promises;
const { config, colors } = require('./config');
const { copyFile } = require('./utils');
const { prompt } = require('./prompts');

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');

// Package.json merge functionality
async function mergePackageJson(srcPath, destPath) {
  try {
    const srcContent = JSON.parse(await fs.readFile(srcPath, 'utf-8'));
    const destContent = JSON.parse(await fs.readFile(destPath, 'utf-8'));
    
    // Merge dependencies
    destContent.dependencies = {
      ...destContent.dependencies,
      ...srcContent.dependencies
    };
    
    // Merge devDependencies
    destContent.devDependencies = {
      ...destContent.devDependencies,
      ...srcContent.devDependencies
    };
    
    // Merge scripts (ask for confirmation for overwrites)
    for (const [key, value] of Object.entries(srcContent.scripts || {})) {
      if (destContent.scripts && destContent.scripts[key] && destContent.scripts[key] !== value) {
        const answer = await prompt(`Script "${key}" exists. Overwrite? (y/n): `);
        if (answer === 'y' || answer === 'yes') {
          destContent.scripts[key] = value;
        }
      } else {
        destContent.scripts = destContent.scripts || {};
        destContent.scripts[key] = value;
      }
    }
    
    await fs.writeFile(destPath, JSON.stringify(destContent, null, 2) + '\n');
    return true;
  } catch (error) {
    console.error(`Error merging package.json: ${error.message}`);
    return false;
  }
}

// Apply updates
async function applyUpdates(comparison, selections) {
  const updates = {
    replaced: [],
    added: [],
    deleted: [],
    skipped: [],
    merged: [],
    errors: []
  };
  
  for (const [key, selected] of Object.entries(selections)) {
    if (!selected) continue;
    
    const category = config.categories[key];
    const data = comparison[key];
    
    // Handle selective updates
    let filesToProcess = {
      changed: data.files.changed || [],
      new: data.files.new || [],
      deleted: data.files.deleted || []
    };
    
    if (selected.type === 'selected') {
      // Filter files based on selection
      if (key === 'theme') {
        filesToProcess.changed = data.files.changed.filter(file => {
          return selected.items.some(item => {
            if (item === 'generateColors.js') {
              return file.includes('generateColors.js');
            }
            return file.includes(`src/theme/${item}/`);
          });
        });
        filesToProcess.new = data.files.new.filter(file => {
          return selected.items.some(item => {
            if (item === 'generateColors.js') {
              return file.includes('generateColors.js');
            }
            return file.includes(`src/theme/${item}/`);
          });
        });
        filesToProcess.deleted = data.files.deleted.filter(file => {
          return selected.items.some(item => {
            if (item === 'generateColors.js') {
              return file.includes('generateColors.js');
            }
            return file.includes(`src/theme/${item}/`);
          });
        });
      } else if (key === 'configs') {
        filesToProcess.changed = data.files.changed.filter(file => 
          selected.items.includes(file)
        );
        filesToProcess.new = data.files.new.filter(file => 
          selected.items.includes(file)
        );
        filesToProcess.deleted = data.files.deleted.filter(file => 
          selected.items.includes(file)
        );
      }
    }
    
    // Process changed files
    for (const file of filesToProcess.changed) {
      try {
        const srcPath = path.join(config.tempDir, file);
        const destPath = path.join(projectRoot, file);
        
        if (category.mode === 'merge' && file.endsWith('package.json')) {
          const merged = await mergePackageJson(srcPath, destPath);
          if (merged) {
            updates.merged.push(file);
          } else {
            updates.errors.push({ file, error: 'Merge failed' });
          }
        } else if (category.mode === 'replace' || category.mode === 'selective') {
          await copyFile(srcPath, destPath);
          updates.replaced.push(file);
        } else if (category.mode === 'add-only') {
          updates.skipped.push(file);
        }
      } catch (error) {
        updates.errors.push({ file, error: error.message });
      }
    }
    
    // Process new files
    for (const file of filesToProcess.new) {
      try {
        const srcPath = path.join(config.tempDir, file);
        const destPath = path.join(projectRoot, file);
        
        // Skip excluded files for images
        if (category.exclude && category.exclude.some(excl => file.includes(excl))) {
          updates.skipped.push(file);
          continue;
        }
        
        await copyFile(srcPath, destPath);
        updates.added.push(file);
      } catch (error) {
        updates.errors.push({ file, error: error.message });
      }
    }
    
    // Process missing files (delete them in replace mode or when explicitly selected)
    const shouldDeleteMissing = category.mode === 'replace' || 
                                (category.mode === 'selective' && selected !== false && 
                                 (selected === true || (selected.type && selected.type === 'all')));
    
    if (shouldDeleteMissing) {
      for (const file of filesToProcess.deleted) {
        try {
          const destPath = path.join(projectRoot, file);
          
          // Check if file exists before trying to delete
          try {
            await fs.access(destPath);
            await fs.unlink(destPath);
            updates.deleted.push(file);
          } catch (accessError) {
            // File doesn't exist, skip silently
            updates.skipped.push(file);
          }
        } catch (error) {
          updates.errors.push({ file, error: error.message });
        }
      }
    }
  }
  
  return updates;
}

module.exports = {
  mergePackageJson,
  applyUpdates
};