import { NeuralockClient } from '@neuralock/client';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';
import path from 'path';

// File storage service with streaming encryption
class SecureFileStorage {
  constructor(neuralockClient) {
    this.client = neuralockClient;
    this.chunkSize = 1024 * 1024; // 1MB chunks
    this.maxFileSize = 5 * 1024 * 1024 * 1024; // 5GB max
  }

  // Upload file with streaming encryption
  async uploadFile(filePath, userId, folderId = 'root', permissions = {}) {
    const fileStats = await fs.promises.stat(filePath);
    
    if (fileStats.size > this.maxFileSize) {
      throw new Error(`File too large. Max size is ${this.maxFileSize} bytes`);
    }

    const fileId = `file:${crypto.randomBytes(16).toString('hex')}`;
    const fileName = path.basename(filePath);
    const chunks = [];
    const chunkIds = [];

    // Create file metadata
    const metadata = {
      id: fileId,
      name: fileName,
      size: fileStats.size,
      mimeType: getMimeType(fileName),
      folderId: folderId,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      chunkCount: Math.ceil(fileStats.size / this.chunkSize),
      checksum: null, // Will be calculated during upload
      permissions: permissions
    };

    // Create read stream
    const readStream = createReadStream(filePath, {
      highWaterMark: this.chunkSize
    });

    const hash = crypto.createHash('sha256');
    let chunkIndex = 0;

    // Process file in chunks
    for await (const chunk of readStream) {
      // Update checksum
      hash.update(chunk);

      // Encrypt chunk
      const chunkId = `${fileId}:chunk:${chunkIndex}`;
      const encryptedChunk = await this.client.encrypt(
        chunk.toString('base64'),
        chunkId
      );

      // Store chunk reference
      chunks.push({
        index: chunkIndex,
        id: chunkId,
        size: chunk.length,
        encrypted: encryptedChunk
      });
      chunkIds.push(chunkId);

      chunkIndex++;

      // Progress callback
      if (this.onProgress) {
        this.onProgress({
          bytesUploaded: chunkIndex * this.chunkSize,
          totalBytes: fileStats.size,
          percentage: Math.round((chunkIndex * this.chunkSize / fileStats.size) * 100)
        });
      }
    }

    // Set final checksum
    metadata.checksum = hash.digest('hex');

    // Encrypt and store metadata
    const metadataId = `${fileId}:metadata`;
    const encryptedMetadata = await this.client.encrypt(
      JSON.stringify(metadata),
      metadataId
    );

    // Store all chunks and metadata
    await this.storeFileChunks(fileId, chunks);
    await this.storeFileMetadata(fileId, encryptedMetadata, metadata);

    // Set permissions for all chunks
    await this.setFilePermissions(fileId, chunkIds, metadataId, permissions);

    return {
      fileId,
      name: fileName,
      size: fileStats.size,
      checksum: metadata.checksum
    };
  }

  // Download file with streaming decryption
  async downloadFile(fileId, outputPath, userId) {
    // Fetch and decrypt metadata
    const metadataId = `${fileId}:metadata`;
    const encryptedMetadata = await this.fetchFileMetadata(fileId);
    
    const metadataJson = await this.client.decrypt(
      encryptedMetadata,
      metadataId
    );
    const metadata = JSON.parse(metadataJson);

    // Verify permissions
    if (!await this.checkFileAccess(fileId, userId, 'read')) {
      throw new Error('Access denied');
    }

    // Create write stream
    const writeStream = createWriteStream(outputPath);
    const hash = crypto.createHash('sha256');

    // Download and decrypt chunks in order
    for (let i = 0; i < metadata.chunkCount; i++) {
      const chunkId = `${fileId}:chunk:${i}`;
      
      // Fetch encrypted chunk
      const encryptedChunk = await this.fetchFileChunk(fileId, i);
      
      // Decrypt chunk
      const decryptedBase64 = await this.client.decrypt(
        encryptedChunk,
        chunkId
      );
      const chunkBuffer = Buffer.from(decryptedBase64, 'base64');

      // Update checksum
      hash.update(chunkBuffer);

      // Write to file
      await new Promise((resolve, reject) => {
        writeStream.write(chunkBuffer, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Progress callback
      if (this.onProgress) {
        this.onProgress({
          bytesDownloaded: (i + 1) * this.chunkSize,
          totalBytes: metadata.size,
          percentage: Math.round(((i + 1) / metadata.chunkCount) * 100)
        });
      }
    }

    writeStream.end();

    // Verify checksum
    const downloadedChecksum = hash.digest('hex');
    if (downloadedChecksum !== metadata.checksum) {
      throw new Error('Checksum mismatch - file may be corrupted');
    }

    return {
      name: metadata.name,
      size: metadata.size,
      checksum: downloadedChecksum
    };
  }

  // Create folder structure
  async createFolder(folderName, parentId = 'root', userId) {
    const folderId = `folder:${crypto.randomBytes(16).toString('hex')}`;
    
    const folderData = {
      id: folderId,
      name: folderName,
      parentId: parentId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      type: 'folder'
    };

    // Encrypt folder metadata
    const encryptedFolder = await this.client.encrypt(
      JSON.stringify(folderData),
      `${folderId}:metadata`
    );

    await this.storeFolderMetadata(folderId, encryptedFolder);

    return folderId;
  }

  // List folder contents
  async listFolder(folderId = 'root', userId) {
    // Check folder access
    if (!await this.checkFolderAccess(folderId, userId, 'read')) {
      throw new Error('Access denied');
    }

    // Fetch all items in folder
    const items = await this.fetchFolderContents(folderId);
    const decryptedItems = [];

    for (const item of items) {
      try {
        const metadataId = `${item.id}:metadata`;
        const decrypted = await this.client.decrypt(
          item.encryptedMetadata,
          metadataId
        );
        
        const metadata = JSON.parse(decrypted);
        decryptedItems.push({
          id: item.id,
          name: metadata.name,
          type: item.type,
          size: metadata.size || null,
          createdAt: metadata.createdAt,
          createdBy: metadata.createdBy
        });
      } catch (error) {
        // Skip items user doesn't have access to
        console.error(`Cannot decrypt item ${item.id}:`, error);
      }
    }

    return decryptedItems;
  }

  // Share file with granular permissions
  async shareFile(fileId, userId, shareWith, permissions = ['read']) {
    // Verify owner
    if (!await this.checkFileAccess(fileId, userId, 'admin')) {
      throw new Error('Only file owner can share');
    }

    // Fetch file metadata to get chunk count
    const metadataId = `${fileId}:metadata`;
    const encryptedMetadata = await this.fetchFileMetadata(fileId);
    const metadataJson = await this.client.decrypt(encryptedMetadata, metadataId);
    const metadata = JSON.parse(metadataJson);

    // Grant permissions to metadata
    await this.client.updatePermissions(metadataId, {
      add: { [shareWith]: permissions }
    });

    // Grant permissions to all chunks
    for (let i = 0; i < metadata.chunkCount; i++) {
      const chunkId = `${fileId}:chunk:${i}`;
      await this.client.updatePermissions(chunkId, {
        add: { [shareWith]: permissions }
      });
    }

    // Create share record
    const shareData = {
      fileId,
      sharedBy: userId,
      sharedWith,
      permissions,
      sharedAt: new Date().toISOString()
    };

    await this.createShareRecord(shareData);

    return {
      shareId: `share:${fileId}:${shareWith}`,
      ...shareData
    };
  }

  // Version control
  async createVersion(fileId, filePath, userId, comment = '') {
    // Check write access
    if (!await this.checkFileAccess(fileId, userId, 'write')) {
      throw new Error('Write access required');
    }

    // Get current file metadata
    const currentMetadata = await this.getFileMetadata(fileId);
    
    // Create version ID
    const versionId = `${fileId}:v${Date.now()}`;

    // Upload new version
    const newFile = await this.uploadFile(
      filePath,
      userId,
      currentMetadata.folderId,
      currentMetadata.permissions
    );

    // Create version record
    const versionData = {
      id: versionId,
      fileId: fileId,
      versionFileId: newFile.fileId,
      version: currentMetadata.version + 1,
      comment: comment,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      size: newFile.size,
      checksum: newFile.checksum
    };

    // Encrypt version data
    const encryptedVersion = await this.client.encrypt(
      JSON.stringify(versionData),
      versionId
    );

    await this.storeVersion(fileId, versionId, encryptedVersion);

    return versionData;
  }

  // Search files
  async searchFiles(query, userId, options = {}) {
    const {
      type = 'all', // all, file, folder
      folderId = null,
      startDate = null,
      endDate = null,
      sharedWith = null
    } = options;

    // Get all accessible items for user
    const accessibleItems = await this.getAccessibleItems(userId);
    const searchResults = [];

    for (const item of accessibleItems) {
      try {
        // Decrypt metadata
        const metadataId = `${item.id}:metadata`;
        const decrypted = await this.client.decrypt(
          item.encryptedMetadata,
          metadataId
        );
        const metadata = JSON.parse(decrypted);

        // Apply filters
        if (type !== 'all' && item.type !== type) continue;
        if (folderId && metadata.folderId !== folderId) continue;
        if (startDate && new Date(metadata.createdAt) < new Date(startDate)) continue;
        if (endDate && new Date(metadata.createdAt) > new Date(endDate)) continue;

        // Search in name and content
        if (metadata.name.toLowerCase().includes(query.toLowerCase())) {
          searchResults.push({
            id: item.id,
            name: metadata.name,
            type: item.type,
            size: metadata.size,
            folderId: metadata.folderId,
            createdAt: metadata.createdAt,
            relevance: 1.0
          });
        }
      } catch (error) {
        // Skip items that can't be decrypted
        continue;
      }
    }

    // Sort by relevance and date
    searchResults.sort((a, b) => {
      if (a.relevance !== b.relevance) {
        return b.relevance - a.relevance;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return searchResults;
  }

  // Bulk operations
  async bulkDownload(fileIds, outputDir, userId) {
    const results = [];

    for (const fileId of fileIds) {
      try {
        // Get file metadata
        const metadata = await this.getFileMetadata(fileId);
        const outputPath = path.join(outputDir, metadata.name);

        // Download file
        const result = await this.downloadFile(fileId, outputPath, userId);
        results.push({
          fileId,
          status: 'success',
          ...result
        });
      } catch (error) {
        results.push({
          fileId,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  async bulkDelete(fileIds, userId) {
    const results = [];

    for (const fileId of fileIds) {
      try {
        // Check delete permission
        if (!await this.checkFileAccess(fileId, userId, 'admin')) {
          throw new Error('Delete permission required');
        }

        // Get metadata
        const metadata = await this.getFileMetadata(fileId);

        // Revoke access to all chunks
        for (let i = 0; i < metadata.chunkCount; i++) {
          const chunkId = `${fileId}:chunk:${i}`;
          await this.client.revokeAccess(chunkId);
        }

        // Revoke access to metadata
        await this.client.revokeAccess(`${fileId}:metadata`);

        // Delete from storage
        await this.deleteFileRecord(fileId);

        results.push({
          fileId,
          status: 'deleted'
        });
      } catch (error) {
        results.push({
          fileId,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  // Helper methods
  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  async checkFileAccess(fileId, userId, permission) {
    // Implementation depends on your permission system
    return true;
  }

  async checkFolderAccess(folderId, userId, permission) {
    // Implementation depends on your permission system
    return true;
  }

  async getFileMetadata(fileId) {
    const metadataId = `${fileId}:metadata`;
    const encrypted = await this.fetchFileMetadata(fileId);
    const decrypted = await this.client.decrypt(encrypted, metadataId);
    return JSON.parse(decrypted);
  }

  async setFilePermissions(fileId, chunkIds, metadataId, permissions) {
    // Set permissions for metadata
    if (permissions.public) {
      await this.client.updatePermissions(metadataId, {
        add: { '*': ['read'] }
      });
    }

    // Set permissions for chunks
    for (const chunkId of chunkIds) {
      if (permissions.public) {
        await this.client.updatePermissions(chunkId, {
          add: { '*': ['read'] }
        });
      }
    }
  }

  // Storage backend methods (implement based on your backend)
  async storeFileChunks(fileId, chunks) {
    // Store chunks in your backend
  }

  async storeFileMetadata(fileId, encrypted, metadata) {
    // Store metadata in your backend
  }

  async fetchFileChunk(fileId, chunkIndex) {
    // Fetch chunk from your backend
  }

  async fetchFileMetadata(fileId) {
    // Fetch metadata from your backend
  }

  async storeFolderMetadata(folderId, encrypted) {
    // Store folder in your backend
  }

  async fetchFolderContents(folderId) {
    // Fetch folder contents from your backend
  }

  async createShareRecord(shareData) {
    // Create share record in your backend
  }

  async storeVersion(fileId, versionId, encrypted) {
    // Store version in your backend
  }

  async getAccessibleItems(userId) {
    // Get all items accessible to user
  }

  async deleteFileRecord(fileId) {
    // Delete file record from backend
  }
}

// Helper function to get MIME type
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.zip': 'application/zip',
    '.txt': 'text/plain'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Express API endpoints
import express from 'express';
import multer from 'multer';
import fs from 'fs';

const app = express();
const upload = multer({ dest: 'uploads/' });

const neuralockClient = new NeuralockClient({
  applicationContract: process.env.FILE_STORAGE_CONTRACT,
  signer: getWallet(),
  servers: [
    { nftId: 1 },
    { nftId: 2 },
    { nftId: 3 },
    { nftId: 4 }
  ]
});

const fileStorage = new SecureFileStorage(neuralockClient);

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { folderId = 'root', permissions = {} } = req.body;
    const userId = req.user.id;

    // Set progress callback
    fileStorage.setProgressCallback((progress) => {
      // Could use WebSocket to send real-time progress
      console.log(`Upload progress: ${progress.percentage}%`);
    });

    const result = await fileStorage.uploadFile(
      req.file.path,
      userId,
      folderId,
      permissions
    );

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download endpoint
app.get('/download/:fileId', async (req, res) => {
  try {
    const tempPath = `/tmp/${req.params.fileId}`;
    
    const result = await fileStorage.downloadFile(
      req.params.fileId,
      tempPath,
      req.user.id
    );

    // Stream file to response
    res.download(tempPath, result.name, () => {
      // Clean up temp file
      fs.unlinkSync(tempPath);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List folder endpoint
app.get('/folder/:folderId', async (req, res) => {
  try {
    const items = await fileStorage.listFolder(
      req.params.folderId,
      req.user.id
    );
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search endpoint
app.get('/search', async (req, res) => {
  try {
    const results = await fileStorage.searchFiles(
      req.query.q,
      req.user.id,
      req.query
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default SecureFileStorage;