const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Utility functions
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
  }
}

async function getFileHash(filePath) {
  try {
    const content = await fs.readFile(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch {
    return null;
  }
}

async function compareFiles(file1, file2) {
  const [hash1, hash2] = await Promise.all([
    getFileHash(file1),
    getFileHash(file2)
  ]);
  return hash1 === hash2;
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

// File scanning
async function scanDirectory(dir, basePath = '') {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and .git directories
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          files.push(...await scanDirectory(fullPath, relativePath));
        }
      } else {
        files.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
  
  return files;
}

module.exports = {
  fileExists,
  ensureDir,
  getFileHash,
  compareFiles,
  copyFile,
  scanDirectory
};