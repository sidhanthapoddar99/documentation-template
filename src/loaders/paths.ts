/**
 * Path Resolver - Two-phase initialization
 *
 * Phase 1 (module load): Resolve internal structural paths (src, layouts, etc.).
 *   CONFIG_DIR may not be available yet (ES imports run before loadEnv()),
 *   so config/data/assets/themes are placeholders only.
 *
 * Phase 2 (initPaths): Called from astro.config.mjs after .env is loaded and
 *   site.yaml is parsed. Receives the authoritative configDir, reads the
 *   required `paths:` section, resolves relative to config dir. Errors on
 *   missing config — no silent fallbacks.
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
// Phase 1: Module-load (structural paths only)
// ============================================

// CONFIG_DIR is read from .env but may NOT be available at module load time
// (ES imports run before loadEnv() in astro.config.mjs). The authoritative
// config path is set later by initPaths(). Phase 1 only uses it as a
// best-effort initial value for paths.config — never rely on it directly.
const CONFIG_DIR_EARLY = getEnv('CONFIG_DIR', '');

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

// Phase 1 config dir: best-effort from env, overridden by initPaths()
const earlyConfigDir = CONFIG_DIR_EARLY
  ? resolvePath(CONFIG_DIR_EARLY)
  : path.resolve(projectRoot, 'dynamic_data/config');

/**
 * Resolved absolute paths for directories.
 * config/data/assets/themes are placeholders until initPaths() sets the real values.
 * Internal structural paths (src, layouts, etc.) are final at module load.
 */
export const paths: {
  root: string;
  config: string;
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
  config: earlyConfigDir,
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
const RESERVED_KEYS = new Set(['docs', 'blog', 'custom', 'navbar', 'footer', 'theme', 'config']);

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
 * Idempotent — repeated calls are no-ops.
 *
 * @param siteConfig.configDir - Required. Resolved absolute path to the config directory.
 *   Must be passed explicitly because CONFIG_DIR from .env isn't available during
 *   ES module load of paths.ts (before loadEnv() runs in astro.config.mjs).
 * @param siteConfig.paths     - The paths: section from site.yaml. Required — at minimum
 *   `data` and `assets` must be defined.
 */
export function initPaths(siteConfig: { paths?: Record<string, string>; configDir: string }): void {
  const state = getPathsState();
  if (state.initialized) return;
  state.initialized = true;

  // configDir is required — set paths.config to the authoritative value
  const newConfigDir = path.isAbsolute(siteConfig.configDir)
    ? siteConfig.configDir
    : path.resolve(paths.root, siteConfig.configDir);
  (paths as any).config = newConfigDir;

  const rawPaths = siteConfig.paths;

  if (!rawPaths || Object.keys(rawPaths).length === 0) {
    throw new Error(
      `[paths] Missing "paths:" section in site.yaml.\n` +
      `  site.yaml must define directory paths. Add at minimum:\n` +
      `    paths:\n` +
      `      data: "../data"\n` +
      `      assets: "../assets"\n` +
      `      themes: "../themes"\n` +
      `  (paths are relative to the config directory: ${newConfigDir})`
    );
  }

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
      throw new Error(
        `[paths] Directory not found for "${key}": ${absolutePath}\n` +
        `  Configured as "${value}" in site.yaml paths: section.\n` +
        `  Resolved relative to config directory: ${newConfigDir}\n` +
        `  Create the directory or fix the path in site.yaml.`
      );
    }

    const category = getPathCategory(key);
    state.userPaths.set(key, { key, absolutePath, category });
  }

  // Ensure required keys are defined
  if (!state.userPaths.has('data')) {
    throw new Error(
      `[paths] Missing required "data" key in site.yaml paths: section.\n` +
      `  Add: data: "../data"  (relative to config directory)`
    );
  }
  if (!state.userPaths.has('assets')) {
    throw new Error(
      `[paths] Missing required "assets" key in site.yaml paths: section.\n` +
      `  Add: assets: "../assets"  (relative to config directory)`
    );
  }

  // Register config path in user paths
  state.userPaths.set('config', { key: 'config', absolutePath: newConfigDir, category: 'config' });
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
