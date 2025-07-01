#!/usr/bin/env node

const { config, colors } = require('./config');
const { archiveRepository, cleanup } = require('./git-operations');
const { compareCategories, displayComparison } = require('./comparison');
const { prompt, promptCategory } = require('./prompts');
const { applyUpdates } = require('./update-operations');
const { generateChangelog, generateDryRunChangelog } = require('./changelog');

// Main function
async function main() {
  console.log(`${colors.bright}Component Sync Tool${colors.reset}\n`);
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  let repoUrl = args.find(arg => arg.startsWith('--repo='))?.split('=')[1] || 
                args.find(arg => arg.startsWith('-r='))?.split('=')[1];
  const branch = args.find(arg => arg.startsWith('--branch='))?.split('=')[1] || 'main';
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  // Use default repo if none provided
  if (!repoUrl) {
    if (config.defaultRepo && config.defaultRepo !== '<git:repo:default>') {
      repoUrl = config.defaultRepo;
      console.log(`${colors.dim}Using default repository: ${repoUrl}${colors.reset}`);
    } else {
      console.error(`${colors.red}Error: Repository URL is required${colors.reset}`);
      console.log('Usage: node sync [--repo=<repository-url>] [--branch=<branch>] [--dry-run]');
      console.log('Or set a default repository in sync/config.js');
      process.exit(1);
    }
  }
  
  try {
    // Step 1: Archive repository
    await archiveRepository(repoUrl, branch);
    
    // Step 2: Compare files
    console.log(`\n${colors.blue}Comparing files...${colors.reset}`);
    const comparison = await compareCategories();
    
    // Step 3: Display comparison
    displayComparison(comparison);
    
    // Step 4: Interactive selection
    const selections = {};
    const proceed = await prompt('\nProceed with updates? (y/n): ');
    
    if (proceed !== 'y' && proceed !== 'yes') {
      console.log('Update cancelled.');
      await cleanup();
      return;
    }
    
    for (const key of Object.keys(config.categories)) {
      selections[key] = await promptCategory(key, comparison);
    }
    
    // Step 5: Apply updates (unless dry run)
    if (!dryRun) {
      console.log(`\n${colors.blue}Applying updates...${colors.reset}`);
      const updates = await applyUpdates(comparison, selections);
      
      console.log(`\n${colors.green}✓ Updates completed${colors.reset}`);
      console.log(`  Replaced: ${updates.replaced.length} files`);
      console.log(`  Added: ${updates.added.length} files`);
      console.log(`  Merged: ${updates.merged.length} files`);
      console.log(`  Skipped: ${updates.skipped.length} files`);
      
      if (updates.errors.length > 0) {
        console.log(`  ${colors.red}Errors: ${updates.errors.length}${colors.reset}`);
      }
      
      // Step 6: Generate changelog
      await generateChangelog(comparison, selections, updates);
    } else {
      console.log(`\n${colors.yellow}Dry run mode - no files were modified${colors.reset}`);
      // Generate dry run changelog
      await generateDryRunChangelog(comparison, selections);
    }
    
  } catch (error) {
    console.error(`\n${colors.red}Error:${colors.reset}`, error.message);
    process.exit(1);
  } finally {
    // Step 7: Cleanup
    await cleanup();
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
    process.exit(1);
  });
}