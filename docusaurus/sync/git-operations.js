const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const execAsync = promisify(exec);
const { config, colors } = require('./config');

// Git operations
async function archiveRepository(repoUrl, branch = 'main') {
  console.log(`${colors.blue}Archiving repository...${colors.reset}`);
  
  // Clean up any existing temp directory
  await cleanup();
  
  try {
    // Clone the repository
    await execAsync(`git clone --depth 1 --branch ${branch} ${repoUrl} ${config.tempDir}`);
    console.log(`${colors.green}✓ Repository archived successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error archiving repository:${colors.reset}`, error.message);
    throw error;
  }
}

// Cleanup
async function cleanup() {
  try {
    await fs.rm(config.tempDir, { recursive: true, force: true });
    console.log(`${colors.dim}Cleaned up temporary files${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error during cleanup:${colors.reset}`, error.message);
  }
}

module.exports = {
  archiveRepository,
  cleanup
};