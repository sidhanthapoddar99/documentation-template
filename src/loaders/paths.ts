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
const CONFIG_DIR = import.meta.env.CONFIG_DIR || './config';
const DATA_DIR = import.meta.env.DATA_DIR || './data';
const THEMES_DIR = import.meta.env.THEMES_DIR || './themes';

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
  themes: resolvePath(THEMES_DIR),
  src: path.resolve(projectRoot, 'src'),
  layouts: path.resolve(projectRoot, 'src/layouts'),
  loaders: path.resolve(projectRoot, 'src/loaders'),
  hooks: path.resolve(projectRoot, 'src/hooks'),
  modules: path.resolve(projectRoot, 'src/modules'),
  mdxComponents: path.resolve(projectRoot, 'src/mdx_components'),
  pages: path.resolve(projectRoot, 'src/pages'),
  styles: path.resolve(projectRoot, 'src/styles'),
  assets: path.resolve(projectRoot, 'src/assets'),
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

export default paths;
