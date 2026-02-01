/**
 * Content Cache Manager
 *
 * Provides in-memory caching for content loading with:
 * - Error/warning collection
 * - Selective cache invalidation
 * - File hash tracking for efficient updates
 */

import crypto from 'crypto';
import fs from 'fs';
import type { LoadedContent, ContentSettings } from '../parsers/types';

// ============================================
// Types
// ============================================

export type ErrorType = 'asset-missing' | 'frontmatter' | 'syntax' | 'config' | 'unknown';
export type WarningType = 'missing-description' | 'missing-image' | 'deprecated' | 'draft';

export interface ContentError {
  file: string;
  line?: number;
  type: ErrorType;
  message: string;
  suggestion?: string;
  timestamp: number;
}

export interface ContentWarning {
  file: string;
  line?: number;
  type: WarningType;
  message: string;
  suggestion?: string;
  timestamp: number;
}

export interface CacheEntry {
  content: LoadedContent[];
  settings?: ContentSettings;
  timestamp: number;
  fileHashes: Map<string, string>;
}

export interface ContentCacheState {
  entries: Map<string, CacheEntry>;
  errors: ContentError[];
  warnings: ContentWarning[];
  initialized: boolean;
  lastUpdate: number;
}

// ============================================
// Global Cache Instance (using globalThis for cross-module sharing)
// ============================================

// Use globalThis to ensure cache is shared across module instances
// This is necessary because Vite plugins and page rendering may use different module instances
const CACHE_KEY = '__astro_content_cache__';

function getCacheState(): ContentCacheState {
  if (!(globalThis as any)[CACHE_KEY]) {
    (globalThis as any)[CACHE_KEY] = {
      entries: new Map<string, CacheEntry>(),
      errors: [] as ContentError[],
      warnings: [] as ContentWarning[],
      initialized: false,
      lastUpdate: 0,
    };
  }
  return (globalThis as any)[CACHE_KEY];
}

// ============================================
// Cache Operations
// ============================================

/**
 * Check if caching should be used
 * In dev mode with server output, we always cache for performance
 */
export function shouldCache(): boolean {
  // Always cache in server mode for dev performance
  return true;
}

/**
 * Get cached content for a given key
 */
export function getCached(cacheKey: string): CacheEntry | undefined {
  return getCacheState().entries.get(cacheKey);
}

/**
 * Set cached content
 */
export function setCache(cacheKey: string, entry: CacheEntry): void {
  getCacheState().entries.set(cacheKey, entry);
  getCacheState().lastUpdate = Date.now();
  getCacheState().initialized = true;
}

/**
 * Invalidate cache for a specific key
 */
export function invalidateCache(cacheKey: string): void {
  getCacheState().entries.delete(cacheKey);
}

/**
 * Invalidate all caches
 */
export function invalidateAll(): void {
  getCacheState().entries.clear();
  getCacheState().errors = [];
  getCacheState().warnings = [];
  getCacheState().initialized = false;
}

/**
 * Compute hash for a file
 */
export function computeFileHash(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return crypto.createHash('md5').update(content).digest('hex');
  } catch {
    return '';
  }
}

/**
 * Check if a file has changed since last cache
 */
export function hasFileChanged(cacheKey: string, filePath: string): boolean {
  const entry = getCacheState().entries.get(cacheKey);
  if (!entry) return true;

  const currentHash = computeFileHash(filePath);
  const cachedHash = entry.fileHashes.get(filePath);

  return currentHash !== cachedHash;
}

// ============================================
// Error/Warning Management
// ============================================

/**
 * Add an error to the cache
 */
export function addError(error: Omit<ContentError, 'timestamp'>): void {
  // Avoid duplicates
  const exists = getCacheState().errors.some(
    e => e.file === error.file && e.message === error.message && e.line === error.line
  );

  if (!exists) {
    getCacheState().errors.push({
      ...error,
      timestamp: Date.now(),
    });
  }
}

/**
 * Add a warning to the cache
 */
export function addWarning(warning: Omit<ContentWarning, 'timestamp'>): void {
  // Avoid duplicates
  const exists = getCacheState().warnings.some(
    w => w.file === warning.file && w.message === warning.message
  );

  if (!exists) {
    getCacheState().warnings.push({
      ...warning,
      timestamp: Date.now(),
    });
  }
}

/**
 * Clear errors for a specific file
 */
export function clearErrorsForFile(filePath: string): void {
  getCacheState().errors = getCacheState().errors.filter(e => e.file !== filePath);
  getCacheState().warnings = getCacheState().warnings.filter(w => w.file !== filePath);
}

/**
 * Get all errors
 */
export function getErrors(): ContentError[] {
  return [...getCacheState().errors];
}

/**
 * Get all warnings
 */
export function getWarnings(): ContentWarning[] {
  return [...getCacheState().warnings];
}

/**
 * Get errors and warnings combined
 */
export function getAllIssues(): { errors: ContentError[]; warnings: ContentWarning[] } {
  return {
    errors: getErrors(),
    warnings: getWarnings(),
  };
}

/**
 * Get error count
 */
export function getErrorCount(): number {
  return getCacheState().errors.length;
}

/**
 * Get warning count
 */
export function getWarningCount(): number {
  return getCacheState().warnings.length;
}

/**
 * Check if cache is initialized
 */
export function isCacheInitialized(): boolean {
  return getCacheState().initialized;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  initialized: boolean;
  entryCount: number;
  errorCount: number;
  warningCount: number;
  lastUpdate: number;
} {
  return {
    initialized: getCacheState().initialized,
    entryCount: getCacheState().entries.size,
    errorCount: getCacheState().errors.length,
    warningCount: getCacheState().warnings.length,
    lastUpdate: getCacheState().lastUpdate,
  };
}

// ============================================
// Selective Update
// ============================================

/**
 * Update a single file in the cache
 */
export function updateCacheEntry(
  cacheKey: string,
  filePath: string,
  newContent: LoadedContent,
  newHash: string
): void {
  const entry = getCacheState().entries.get(cacheKey);
  if (!entry) return;

  // Find and update the content
  const index = entry.content.findIndex(c => c.filePath === filePath);
  if (index >= 0) {
    entry.content[index] = newContent;
  } else {
    entry.content.push(newContent);
  }

  // Update hash
  entry.fileHashes.set(filePath, newHash);
  entry.timestamp = Date.now();
  getCacheState().lastUpdate = Date.now();

  // Clear old errors for this file
  clearErrorsForFile(filePath);
}

/**
 * Remove a file from cache (when deleted)
 */
export function removeFromCache(cacheKey: string, filePath: string): void {
  const entry = getCacheState().entries.get(cacheKey);
  if (!entry) return;

  entry.content = entry.content.filter(c => c.filePath !== filePath);
  entry.fileHashes.delete(filePath);
  entry.timestamp = Date.now();
  getCacheState().lastUpdate = Date.now();

  // Clear errors for this file
  clearErrorsForFile(filePath);
}

// ============================================
// Export cache state for API endpoint
// ============================================

export { getCacheState };

export default {
  shouldCache,
  getCached,
  setCache,
  invalidateCache,
  invalidateAll,
  computeFileHash,
  hasFileChanged,
  addError,
  addWarning,
  clearErrorsForFile,
  getErrors,
  getWarnings,
  getAllIssues,
  getErrorCount,
  getWarningCount,
  isCacheInitialized,
  getCacheStats,
  updateCacheEntry,
  removeFromCache,
  getCacheState,
};
