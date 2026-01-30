/**
 * User Page Component Loader
 *
 * Loads custom .astro page components from the DATA_DIR/pages/ directory.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getPagesConfig, getResolvedPageConfig, getSiteMetadata } from './config';
import type { PageConfig, ResolvedPageConfig } from './types';

// ==================================
// Directory Paths
// ==================================

const DATA_DIR = import.meta.env.DATA_DIR || '../data';
const astroDir = path.dirname(new URL(import.meta.url).pathname);
const resolvedDataDir = path.resolve(astroDir, '..', '..', DATA_DIR);

/**
 * Get the path to user pages directory
 */
export function getUserPagesDir(): string {
  return path.join(resolvedDataDir, 'pages');
}

/**
 * Check if a user page component exists
 */
export function userPageExists(componentName: string): boolean {
  const componentPath = path.join(getUserPagesDir(), componentName);
  return fs.existsSync(componentPath);
}

/**
 * Get the full path to a user page component
 */
export function getUserPagePath(componentName: string): string {
  return path.join(getUserPagesDir(), componentName);
}

/**
 * Get all custom pages that have components
 */
export function getCustomPagesWithComponents(): Array<{
  name: string;
  config: PageConfig;
  componentPath: string;
}> {
  const pagesConfig = getPagesConfig();
  const result: Array<{
    name: string;
    config: PageConfig;
    componentPath: string;
  }> = [];

  for (const [name, config] of Object.entries(pagesConfig.pages)) {
    // Check for home or custom types with component defined
    if ((config.type === 'home' || config.type === 'custom') && config.component) {
      // Skip external links
      if (config.external) continue;

      const componentPath = getUserPagePath(config.component);
      if (fs.existsSync(componentPath)) {
        result.push({ name, config, componentPath });
      } else {
        console.warn(`Page "${name}": component "${config.component}" not found at ${componentPath}`);
      }
    }
  }

  return result;
}

/**
 * Get props to pass to a user page component
 */
export function getPageProps(pageName: string) {
  const siteConfig = getSiteMetadata();
  const pageConfig = getResolvedPageConfig(pageName);

  return {
    siteConfig,
    pageConfig,
    pageName,
  };
}

/**
 * Get path to docs content directory
 */
export function getDocsContentDir(contentDir?: string): string {
  if (contentDir) {
    return path.join(resolvedDataDir, contentDir);
  }
  return path.join(resolvedDataDir, 'docs');
}

/**
 * Get path to blog content directory
 */
export function getBlogContentDir(contentDir?: string): string {
  if (contentDir) {
    return path.join(resolvedDataDir, contentDir);
  }
  return path.join(resolvedDataDir, 'blog');
}

/**
 * Get path to assets directory
 */
export function getAssetsDir(): string {
  return path.join(resolvedDataDir, 'assets');
}

// ==================================
// Exports
// ==================================

export { resolvedDataDir };
