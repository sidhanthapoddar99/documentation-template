/**
 * Path Resolver - Reads paths from .env and resolves to absolute paths
 */
import path from 'path';
import { fileURLToPath } from 'url';

// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// Read from environment with defaults
// Use process.env for server-side code, import.meta.env for client-side
const getEnv = (key: string, fallback: string): string => {
  // Try process.env first (Node.js / server-side)
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key]!;
  }
  // Fall back to import.meta.env (Vite)
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  return fallback;
};

const CONFIG_DIR = getEnv('CONFIG_DIR', './config');
const DATA_DIR = getEnv('DATA_DIR', './data');
const ASSETS_DIR = getEnv('ASSETS_DIR', './assets');
const THEMES_DIR = getEnv('THEMES_DIR', './themes');

/**
 * Resolve a path relative to project root
 */
export function resolvePath(relativePath: string): string {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  return path.resolve(projectRoot, relativePath);
}

/**
 * Resolved absolute paths for external directories
 */
export const paths = {
  root: projectRoot,
  config: resolvePath(CONFIG_DIR),
  data: resolvePath(DATA_DIR),
  assets: resolvePath(ASSETS_DIR),
  themes: resolvePath(THEMES_DIR),
  src: path.resolve(projectRoot, 'src'),
  layouts: path.resolve(projectRoot, 'src/layouts'),
  loaders: path.resolve(projectRoot, 'src/loaders'),
  hooks: path.resolve(projectRoot, 'src/hooks'),
  modules: path.resolve(projectRoot, 'src/modules'),
  mdxComponents: path.resolve(projectRoot, 'src/mdx_components'),
  pages: path.resolve(projectRoot, 'src/pages'),
  styles: path.resolve(projectRoot, 'src/styles'),
  srcAssets: path.resolve(projectRoot, 'src/assets'),
} as const;

/**
 * Get path to a config file
 */
export function getConfigPath(filename: string): string {
  return path.join(paths.config, filename);
}

/**
 * Get path to a data file/directory
 */
export function getDataPath(subpath: string): string {
  return path.join(paths.data, subpath);
}

/**
 * Get path to an asset file
 */
export function getAssetsPath(subpath?: string): string {
  return subpath ? path.join(paths.assets, subpath) : paths.assets;
}

/**
 * Get path to a theme file
 */
export function getThemePath(subpath: string): string {
  return path.join(paths.themes, subpath);
}

/**
 * Get path to a layout package
 */
export function getLayoutPath(type: string, name: string): string {
  return path.join(paths.layouts, type, name);
}

/**
 * Convert an absolute path to an alias-based path for display
 * e.g., /Users/.../dynamic_data/data/docs/file.md → @data/docs/file.md
 */
export function toAliasPath(absolutePath: string): string {
  // Normalize the path for consistent comparison
  const normalizedPath = path.normalize(absolutePath);

  // Pattern-based matching for common directory structures
  // This is more robust than relying on env vars at module load time

  // Match /dynamic_data/data/ or /data/ patterns for @data alias
  const dataMatch = normalizedPath.match(/[/\\](dynamic_data[/\\])?data[/\\](.+)$/);
  if (dataMatch) {
    return '@data/' + dataMatch[2];
  }

  // Match /dynamic_data/config/ or /config/ patterns for @config alias
  const configMatch = normalizedPath.match(/[/\\](dynamic_data[/\\])?config[/\\](.+)$/);
  if (configMatch) {
    return '@config/' + configMatch[2];
  }

  // Match /dynamic_data/assets/ or /assets/ patterns for @assets alias
  const assetsMatch = normalizedPath.match(/[/\\](dynamic_data[/\\])?assets[/\\](.+)$/);
  if (assetsMatch) {
    return '@assets/' + assetsMatch[2];
  }

  // Match /src/ for @src alias
  const srcMatch = normalizedPath.match(/[/\\]src[/\\](.+)$/);
  if (srcMatch) {
    return '@src/' + srcMatch[1];
  }

  // Return relative to project root if no alias matches
  const normalizedRoot = path.normalize(paths.root);
  if (normalizedPath.startsWith(normalizedRoot + path.sep)) {
    return normalizedPath.slice(normalizedRoot.length + 1);
  }

  return absolutePath;
}

export default paths;
