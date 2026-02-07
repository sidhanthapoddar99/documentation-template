/**
 * Alias Resolver - Resolves @ prefix references to actual paths
 *
 * Merges reserved layout aliases (@docs, @blog, etc.) with dynamic user
 * path aliases (@data, @data2, @assets, @themes, etc.) from initPaths().
 * Longest-prefix matching ensures @data2 resolves before @data.
 */
import path from 'path';
import { paths, getDataPath, getUserPaths } from './paths';

// ============================================
// Type Definitions
// ============================================

export type AliasPrefix = string;

export interface ResolvedAlias {
  type: AliasPrefix;
  name: string;
  fullPath: string;
}

// ============================================
// Reserved (internal) layout aliases
// ============================================

function getReservedAliases(): Record<string, string> {
  return {
    '@docs': path.join(paths.layouts, 'docs'),
    '@blog': path.join(paths.layouts, 'blogs'),
    '@custom': path.join(paths.layouts, 'custom'),
    '@navbar': path.join(paths.layouts, 'navbar'),
    '@footer': path.join(paths.layouts, 'footer'),
  };
}

// ============================================
// Dynamic alias map
// ============================================

/**
 * Build the full alias map by merging reserved layout aliases
 * with user-defined path aliases from initPaths().
 */
export function getAliasMap(): Record<string, string> {
  const map: Record<string, string> = { ...getReservedAliases() };

  // Add user paths as @key → absolutePath
  for (const [key, entry] of getUserPaths()) {
    const alias = `@${key}`;
    if (!map[alias]) {
      map[alias] = entry.absolutePath;
    }
  }

  return map;
}

// ============================================
// Resolver Functions
// ============================================

/**
 * Check if a string starts with an @ prefix
 */
export function isAliasPath(value: string): boolean {
  return value.startsWith('@');
}

/**
 * Extract the alias prefix from a path.
 * Iterates keys sorted longest-first so @data2 matches before @data.
 */
export function extractPrefix(aliasPath: string): AliasPrefix | null {
  const map = getAliasMap();
  // Sort keys longest-first for correct prefix matching
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);

  for (const prefix of keys) {
    if (aliasPath.startsWith(prefix + '/') || aliasPath === prefix) {
      return prefix;
    }
  }

  return null;
}

/**
 * Resolve an alias path to an absolute path
 *
 * Examples:
 * - '@docs/doc_style1' -> '/path/to/src/layouts/docs/doc_style1'
 * - '@data/docs' -> '/path/to/data/docs'
 * - '@data2/test' -> '/path/to/other/data/test'
 * - '@navbar/style1' -> '/path/to/src/layouts/navbar/style1'
 */
export function resolveAlias(aliasPath: string): ResolvedAlias | null {
  if (!isAliasPath(aliasPath)) {
    return null;
  }

  const prefix = extractPrefix(aliasPath);
  if (!prefix) {
    console.warn(`Unknown alias prefix in: ${aliasPath}`);
    return null;
  }

  const map = getAliasMap();
  // Extract the name part after the prefix
  const name = aliasPath.length > prefix.length
    ? aliasPath.slice(prefix.length + 1) // +1 for the '/'
    : '';
  const basePath = map[prefix];
  const fullPath = name ? path.join(basePath, name) : basePath;

  return {
    type: prefix,
    name,
    fullPath,
  };
}

/**
 * Resolve an alias path to just the absolute path string
 */
export function resolveAliasPath(aliasPath: string): string {
  const resolved = resolveAlias(aliasPath);
  if (!resolved) {
    // Return as-is if not an alias
    return aliasPath;
  }
  return resolved.fullPath;
}

/**
 * Resolve a layout reference
 *
 * Examples:
 * - '@docs/doc_style1' -> '/path/to/src/layouts/docs/doc_style1/index.astro'
 * - '@navbar/style1' -> '/path/to/src/layouts/navbar/style1/index.astro'
 */
export function resolveLayoutPath(layoutRef: string): string | null {
  const resolved = resolveAlias(layoutRef);
  if (!resolved) {
    return null;
  }

  // Layout references should point to a directory with an index.astro
  return path.join(resolved.fullPath, 'index.astro');
}

/**
 * Resolve a data reference
 *
 * Examples:
 * - '@data/docs' -> '/path/to/data/docs'
 * - '@data2/test' -> '/path/to/other/data/test'
 * - '@data/pages/home.yaml' -> '/path/to/data/pages/home.yaml'
 */
export function resolveDataPath(dataRef: string): string | null {
  if (!dataRef.startsWith('@')) {
    // If not an alias reference, treat as relative to primary data dir
    return getDataPath(dataRef);
  }

  const resolved = resolveAlias(dataRef);
  if (!resolved) {
    return null;
  }

  return resolved.fullPath;
}

/**
 * Get the layout type from a layout reference
 *
 * Examples:
 * - '@docs/doc_style1' -> 'docs'
 * - '@blog/blog_style1' -> 'blog'
 */
export function getLayoutType(layoutRef: string): string | null {
  const prefix = extractPrefix(layoutRef);
  if (!prefix) {
    return null;
  }

  // Remove the @ prefix
  return prefix.slice(1);
}

/**
 * Get the layout name from a layout reference
 *
 * Examples:
 * - '@docs/doc_style1' -> 'doc_style1'
 * - '@navbar/style1' -> 'style1'
 */
export function getLayoutName(layoutRef: string): string | null {
  const resolved = resolveAlias(layoutRef);
  if (!resolved) {
    return null;
  }
  return resolved.name;
}

/**
 * Resolve an asset alias path to a web-accessible URL.
 * Handles @assets/ and any additional asset-category aliases.
 *
 * Examples:
 * - '@assets/logo.svg' -> '/assets/logo.svg'
 * - '@assets2/icon.png' -> '/assets/icon.png' (served via /assets/ route)
 * - '/logo.svg' -> '/logo.svg' (passthrough)
 * - 'logo.svg' -> '/assets/logo.svg' (relative to assets)
 */
export function resolveAssetUrl(assetPath: string | undefined): string | undefined {
  if (!assetPath) {
    return undefined;
  }

  // If it's an absolute URL or starts with /, return as-is
  if (assetPath.startsWith('http') || assetPath.startsWith('/')) {
    return assetPath;
  }

  // If it starts with @assets, convert to web URL
  if (assetPath.startsWith('@assets')) {
    // Handle @assets/file or @assets2/file — extract filename after the alias prefix
    const prefix = extractPrefix(assetPath);
    if (prefix) {
      const filename = assetPath.slice(prefix.length + 1);
      return `/assets/${filename}`;
    }
  }

  // For other relative paths, assume they're in /assets/
  return `/assets/${assetPath}`;
}

export default {
  isAliasPath,
  extractPrefix,
  resolveAlias,
  resolveAliasPath,
  resolveLayoutPath,
  resolveDataPath,
  resolveAssetUrl,
  getLayoutType,
  getLayoutName,
  getAliasMap,
};
