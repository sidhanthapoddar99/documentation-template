/**
 * Alias Resolver - Resolves @ prefix references to actual paths
 */
import path from 'path';
import { paths, getDataPath } from './paths';

// ============================================
// Type Definitions
// ============================================

export type AliasPrefix =
  | '@docs'
  | '@blog'
  | '@custom'
  | '@navbar'
  | '@footer'
  | '@data'
  | '@mdx';

export interface ResolvedAlias {
  type: AliasPrefix;
  name: string;
  fullPath: string;
}

// ============================================
// Alias Mapping
// ============================================

const aliasMap: Record<AliasPrefix, string> = {
  '@docs': path.join(paths.layouts, 'docs'),
  '@blog': path.join(paths.layouts, 'blogs'),
  '@custom': path.join(paths.layouts, 'custom'),
  '@navbar': path.join(paths.layouts, 'navbar'),
  '@footer': path.join(paths.layouts, 'footer'),
  '@data': paths.data,
  '@mdx': paths.mdxComponents,
};

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
 * Extract the alias prefix from a path
 */
export function extractPrefix(aliasPath: string): AliasPrefix | null {
  const prefixes: AliasPrefix[] = [
    '@docs',
    '@blog',
    '@custom',
    '@navbar',
    '@footer',
    '@data',
    '@mdx',
  ];

  for (const prefix of prefixes) {
    if (aliasPath.startsWith(prefix)) {
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

  // Extract the name part after the prefix
  const name = aliasPath.slice(prefix.length + 1); // +1 for the '/'
  const basePath = aliasMap[prefix];
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
 * - '@data/pages/home.yaml' -> '/path/to/data/pages/home.yaml'
 */
export function resolveDataPath(dataRef: string): string | null {
  if (!dataRef.startsWith('@data')) {
    // If not a @data reference, treat as relative to data dir
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

export default {
  isAliasPath,
  extractPrefix,
  resolveAlias,
  resolveAliasPath,
  resolveLayoutPath,
  resolveDataPath,
  getLayoutType,
  getLayoutName,
};
