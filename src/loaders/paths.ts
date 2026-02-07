/**
 * Path Resolver - Two-phase initialization
 *
 * Phase 1 (module load): Resolve CONFIG_DIR from env + internal structural paths.
 *   paths.data/assets/themes are set to hardcoded defaults (relative to config dir).
 *
 * Phase 2 (initPaths): Called from astro.config.mjs after site.yaml is parsed.
 *   Reads the `paths:` section, resolves relative to config dir, populates
 *   the user paths map. Only CONFIG_DIR comes from .env (bootstrap).
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ============================================
// Project root resolution
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// ============================================
// Env helper
// ============================================

const getEnv = (key: string, fallback: string): string => {
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key]!;
  }
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  return fallback;
};

// ============================================
// Types
// ============================================

export type PathCategory = 'content' | 'asset' | 'theme' | 'config';

interface UserPathEntry {
  key: string;
  absolutePath: string;
  category: PathCategory;
}

// ============================================
// Phase 1: Module-load defaults
// ============================================

// Only CONFIG_DIR comes from .env — it's the bootstrap to find site.yaml
const CONFIG_DIR = getEnv('CONFIG_DIR', './dynamic_data/config');

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
 * Resolve a path relative to the config directory (where site.yaml lives).
 * Absolute paths are returned as-is.
 */
export function resolvePathFromConfig(relativePath: string): string {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  return path.resolve(paths.config, relativePath);
}

const resolvedConfigDir = resolvePath(CONFIG_DIR);

/**
 * Resolved absolute paths for directories.
 * data/assets/themes default to sibling dirs of config; initPaths() overrides them.
 */
export const paths: {
  root: string;
  config: string;
  data: string;
  assets: string;
  themes: string;
  src: string;
  layouts: string;
  loaders: string;
  hooks: string;
  modules: string;

  pages: string;
  styles: string;
  srcAssets: string;
} = {
  root: projectRoot,
  config: resolvedConfigDir,
  // Defaults: sibling directories of config dir (overridden by initPaths)
  data: path.resolve(resolvedConfigDir, '../data'),
  assets: path.resolve(resolvedConfigDir, '../assets'),
  themes: path.resolve(resolvedConfigDir, '../themes'),
  src: path.resolve(projectRoot, 'src'),
  layouts: path.resolve(projectRoot, 'src/layouts'),
  loaders: path.resolve(projectRoot, 'src/loaders'),
  hooks: path.resolve(projectRoot, 'src/hooks'),
  modules: path.resolve(projectRoot, 'src/modules'),

  pages: path.resolve(projectRoot, 'src/pages'),
  styles: path.resolve(projectRoot, 'src/styles'),
  srcAssets: path.resolve(projectRoot, 'src/assets'),
};

// ============================================
// Phase 2: Dynamic user paths
// ============================================

/** Reserved alias keys that cannot be used in paths: section */
const RESERVED_KEYS = new Set(['docs', 'blog', 'custom', 'navbar', 'footer']);

// Use globalThis to persist state across Vite module reloads
// (astro.config.mjs and runtime may load this as separate module instances)
const PATHS_STATE_KEY = '__paths_state__';

interface PathsState {
  initialized: boolean;
  userPaths: Map<string, UserPathEntry>;
}

function getPathsState(): PathsState {
  if (!(globalThis as any)[PATHS_STATE_KEY]) {
    (globalThis as any)[PATHS_STATE_KEY] = {
      initialized: false,
      userPaths: new Map<string, UserPathEntry>(),
    };
  }
  return (globalThis as any)[PATHS_STATE_KEY];
}

/**
 * Infer category from key name.
 *  - keys starting with "data" or "content" → content
 *  - keys starting with "asset" → asset
 *  - keys starting with "theme" → theme
 *  - "config" → config
 *  - anything else → content (safe default)
 */
export function getPathCategory(key: string): PathCategory {
  const k = key.toLowerCase();
  if (k === 'config') return 'config';
  if (k.startsWith('asset')) return 'asset';
  if (k.startsWith('theme')) return 'theme';
  // data*, content*, or anything else defaults to content
  return 'content';
}

/**
 * Initialize user paths from site.yaml's `paths:` section.
 * Relative paths are resolved from the config directory (where site.yaml lives).
 * Falls back to hardcoded defaults when called without args or with empty paths.
 * Idempotent — repeated calls are no-ops.
 */
export function initPaths(siteConfig?: { paths?: Record<string, string> }): void {
  const state = getPathsState();
  if (state.initialized) return;
  state.initialized = true;

  const rawPaths = siteConfig?.paths;

  if (rawPaths && Object.keys(rawPaths).length > 0) {
    // site.yaml paths: section — resolve relative to config dir
    for (const [key, value] of Object.entries(rawPaths)) {
      if (RESERVED_KEYS.has(key)) {
        throw new Error(
          `[paths] Reserved alias key "${key}" cannot be used in site.yaml paths: section. ` +
          `Reserved keys: ${[...RESERVED_KEYS].join(', ')}`
        );
      }

      const absolutePath = resolvePathFromConfig(value);

      if (!fs.existsSync(absolutePath)) {
        console.warn(`[paths] Warning: path "${key}" does not exist: ${absolutePath}`);
      }

      const category = getPathCategory(key);
      state.userPaths.set(key, { key, absolutePath, category });

      // Update the legacy paths object for the primary keys
      if (key === 'data') (paths as any).data = absolutePath;
      if (key === 'assets') (paths as any).assets = absolutePath;
      if (key === 'themes') (paths as any).themes = absolutePath;
      if (key === 'config') (paths as any).config = absolutePath;
    }
  } else {
    // No paths: section — register defaults as user paths
    state.userPaths.set('data', { key: 'data', absolutePath: paths.data, category: 'content' });
    state.userPaths.set('assets', { key: 'assets', absolutePath: paths.assets, category: 'asset' });
    state.userPaths.set('themes', { key: 'themes', absolutePath: paths.themes, category: 'theme' });
    state.userPaths.set('config', { key: 'config', absolutePath: paths.config, category: 'config' });
  }
}

/**
 * Get all user-defined paths (available after initPaths).
 * Returns a new Map copy.
 */
export function getUserPaths(): Map<string, UserPathEntry> {
  return new Map(getPathsState().userPaths);
}

/**
 * Get absolute paths for a given category.
 */
export function getPathsByCategory(category: PathCategory): string[] {
  const result: string[] = [];
  for (const entry of getPathsState().userPaths.values()) {
    if (entry.category === category) {
      result.push(entry.absolutePath);
    }
  }
  return result;
}

/**
 * Whether initPaths() has been called.
 */
export function isInitialized(): boolean {
  return getPathsState().initialized;
}

// ============================================
// Path helpers (unchanged API)
// ============================================

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
 * Convert an absolute path to an alias-based path for display.
 * Uses the dynamic userPaths map (longest match first) when initialized,
 * with fallback to structural pattern matching.
 */
export function toAliasPath(absolutePath: string): string {
  const normalizedPath = path.normalize(absolutePath);

  // Try user paths first (sorted longest-path-first to match @data2 before @data)
  const { userPaths } = getPathsState();
  if (userPaths.size > 0) {
    const sorted = [...userPaths.entries()].sort(
      (a, b) => b[1].absolutePath.length - a[1].absolutePath.length
    );
    for (const [key, entry] of sorted) {
      const dir = entry.absolutePath + path.sep;
      if (normalizedPath.startsWith(dir)) {
        return `@${key}/` + normalizedPath.slice(dir.length);
      }
      if (normalizedPath === entry.absolutePath) {
        return `@${key}`;
      }
    }
  }

  // Match /src/styles/ for @theme/default alias
  const stylesMatch = normalizedPath.match(/[/\\]src[/\\]styles[/\\](.+)$/);
  if (stylesMatch) {
    return '@theme/default/' + stylesMatch[1];
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
