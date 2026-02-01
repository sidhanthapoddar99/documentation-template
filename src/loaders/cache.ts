/**
 * Content Cache Manager
 *
 * Provides in-memory caching for content loading with:
 * - Error/warning collection
 * - Full cache invalidation on file changes (via HMR)
 */

import crypto from 'crypto';
import fs from 'fs';
import type { LoadedContent, ContentSettings } from '../parsers/types';

// ============================================
// Types
// ============================================

export type ErrorType =
  | 'asset-missing'
  | 'frontmatter'
  | 'syntax'
  | 'config'
  | 'unknown'
  // Theme-related errors
  | 'theme-not-found'
  | 'theme-missing-file'
  | 'theme-missing-variable'
  | 'theme-invalid-manifest'
  | 'theme-circular-extends';
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
    console.log('[CACHE] Initializing new cache state');
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
  addError,
  addWarning,
  getErrors,
  getWarnings,
  getAllIssues,
  getErrorCount,
  getWarningCount,
  isCacheInitialized,
  getCacheStats,
  getCacheState,
};
