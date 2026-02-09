/**
 * Theme Loader
 *
 * Loads, validates, and provides theme CSS for the documentation framework.
 * Uses unified cache manager with mtime-based validation and dependency tracking.
 * Supports theme inheritance and both default and custom themes.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { paths } from './paths';
import { getThemePaths } from './config';
import { resolveAliasPath, extractPrefix } from './alias';
import { addError } from './cache';
import cacheManager from './cache-manager';
import type {
  ThemeManifest,
  ThemeConfig,
  ThemeValidationError,
  ThemeValidationResult,
  ResolvedTheme,
} from './theme-types';

// Re-export for backward compatibility
export { clearThemeCache } from './cache-manager';

/**
 * Resolve a theme name (or alias like "@theme/default") to an absolute path.
 *
 * - `"default"` or `"@theme/default"` → built-in styles directory (paths.styles)
 * - `"<name>"` or `"@theme/<name>"` → scan theme-category dirs for matching subdirectory
 * - Any other `@` alias → resolve via resolveAliasPath()
 * - Absolute path → returned as-is
 *
 * Used at config load time to resolve theme references once.
 */
export function resolveThemeName(name: string): string {
  // Absolute path — already resolved
  if (path.isAbsolute(name)) {
    return name;
  }

  // Strip @theme/ prefix if present
  const themeName = name.startsWith('@theme/')
    ? name.slice('@theme/'.length)
    : name.startsWith('@')
      ? null  // Other @ alias — resolve generically
      : name;

  // Other @ alias (e.g. @data/mytheme) — resolve via generic alias system
  if (themeName === null) {
    return resolveAliasPath(name);
  }

  // "default" → built-in styles directory
  if (themeName === 'default') {
    return paths.styles;
  }

  // Scan theme-category directories for a matching subdirectory
  const themeDirs = getThemePaths();
  for (const dir of themeDirs) {
    const candidate = path.join(dir, themeName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Theme "${name}" not found. Searched theme directories: ${themeDirs.join(', ') || '(none)'}. ` +
    `Check the "theme" value in site.yaml.`
  );
}

/**
 * Resolve a theme alias to its actual path.
 *
 * Accepts any alias path (e.g. "@theme/minimal", "@themes/minimal", "@data/mytheme")
 * as long as the resolved directory contains a valid theme.yaml manifest.
 *
 * - `@theme/default` maps to the built-in styles directory (paths.styles)
 * - `@theme/<name>` maps via resolveThemeName (theme-category directory)
 * - Any other `@` alias is resolved via the generic alias resolver
 * - Non-alias paths are resolved as absolute/relative paths
 *
 * @param themeRef - Theme reference string
 * @returns Resolved theme path information
 */
export function resolveThemeAlias(themeRef: string): ResolvedTheme {
  // @theme/<name> or @theme/default — resolve via resolveThemeName
  if (themeRef.startsWith('@theme/')) {
    const themeName = themeRef.slice('@theme/'.length);
    return {
      path: resolveThemeName(themeRef),
      name: themeName,
    };
  }

  // Any other @ alias — resolve via generic alias system
  if (themeRef.startsWith('@')) {
    const prefix = extractPrefix(themeRef);
    if (!prefix) {
      throw new Error(
        `Unknown alias prefix in theme reference: "${themeRef}". ` +
        `Check your site.yaml "theme" value. Available aliases can be defined in site.yaml "paths".`
      );
    }
    const resolved = resolveAliasPath(themeRef);
    return {
      path: resolved,
      name: path.basename(resolved),
    };
  }

  // Non-alias: treat as absolute or relative path
  const resolved = path.isAbsolute(themeRef) ? themeRef : path.resolve(themeRef);
  return {
    path: resolved,
    name: path.basename(resolved),
  };
}

/**
 * Load and parse theme manifest (theme.yaml)
 *
 * @param themePath - Absolute path to theme directory
 * @returns Parsed manifest or null if not found/invalid
 */
export function loadThemeManifest(themePath: string): ThemeManifest | null {
  const manifestPath = path.join(themePath, 'theme.yaml');

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = yaml.load(content) as ThemeManifest;

    // Validate basic structure
    if (!manifest.name || !manifest.version || !manifest.files) {
      console.error(`Invalid theme manifest: ${manifestPath} - missing required fields`);
      return null;
    }

    // Validate override_mode if present
    if (manifest.override_mode !== undefined) {
      const validModes = ['merge', 'override', 'replace'];
      if (!validModes.includes(manifest.override_mode)) {
        throw new Error(
          `Invalid override_mode "${manifest.override_mode}" in ${manifestPath}. ` +
          `Must be one of: ${validModes.join(', ')}`
        );
      }
    }

    return manifest;
  } catch (error) {
    console.error(`Error loading theme manifest: ${manifestPath}`, error);
    return null;
  }
}

/**
 * Load and combine CSS files from a theme
 * Returns CSS content and list of file paths (for dependency tracking)
 *
 * @param themePath - Absolute path to theme directory
 * @param manifest - Theme manifest
 * @returns Combined CSS content and file dependencies
 */
export function loadThemeCSS(
  themePath: string,
  manifest: ThemeManifest
): { css: string; deps: string[]; perFile: Map<string, string> } {
  const cssFiles = manifest.files.filter((f) => f.endsWith('.css'));
  let combinedCSS = `/* Theme: ${manifest.name} v${manifest.version} */\n\n`;
  const deps: string[] = [];
  const perFile = new Map<string, string>();

  // Add theme.yaml as dependency
  const manifestPath = path.join(themePath, 'theme.yaml');
  if (fs.existsSync(manifestPath)) {
    deps.push(manifestPath);
  }

  for (const file of cssFiles) {
    const filePath = path.join(themePath, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileCSS = `/* --- ${file} --- */\n${content}\n\n`;
      combinedCSS += fileCSS;
      perFile.set(file, fileCSS);
      deps.push(filePath);
    } else {
      console.warn(`Theme CSS file not found: ${filePath}`);
    }
  }

  return { css: combinedCSS, deps, perFile };
}

/**
 * Validate theme structure and required variables
 *
 * @param themePath - Absolute path to theme directory
 * @param manifest - Theme manifest
 * @returns Validation result
 */
export function validateTheme(
  themePath: string,
  manifest: ThemeManifest
): ThemeValidationResult {
  const errors: ThemeValidationError[] = [];
  const warnings: string[] = [];

  // Check required files exist
  for (const file of manifest.files) {
    const filePath = path.join(themePath, file);
    if (!fs.existsSync(filePath)) {
      errors.push({
        type: 'missing-file',
        message: `Theme file not found: ${file}`,
        file,
        suggestion: `Create the file at: ${filePath}`,
      });
    }
  }

  // Check for required CSS variables
  if (manifest.required_variables) {
    const { css } = loadThemeCSS(themePath, manifest);
    const allRequired = [
      ...(manifest.required_variables.colors || []),
      ...(manifest.required_variables.fonts || []),
      ...(manifest.required_variables.elements || []),
    ];

    const overrideMode = manifest.override_mode || 'merge';

    for (const variable of allRequired) {
      // Check if variable is defined (look for "variable-name:" pattern)
      const varPattern = new RegExp(`${variable.replace('--', '--')}\\s*:`);
      if (!varPattern.test(css)) {
        if (!manifest.extends || overrideMode === 'replace') {
          // No parent or replace mode — parent won't be loaded, so this is an error
          errors.push({
            type: 'missing-variable',
            message: `Required CSS variable not defined: ${variable}`,
            variable,
            suggestion: `Add "${variable}: <value>;" to your theme CSS`,
          });
        } else if (overrideMode === 'override') {
          warnings.push(
            `Variable ${variable} not defined — if it was provided by an overridden parent file, you must redefine it`
          );
        } else {
          // merge mode — parent provides vars via cascade
          warnings.push(`Variable ${variable} not defined, will inherit from parent theme`);
        }
      }
    }
  }

  // Check for circular extends
  if (manifest.extends) {
    const visited = new Set<string>();
    let current: string | null | undefined = manifest.extends;

    while (current) {
      if (visited.has(current)) {
        errors.push({
          type: 'circular-extends',
          message: `Circular theme inheritance detected: ${current}`,
          suggestion: 'Remove the circular extends reference',
        });
        break;
      }
      visited.add(current);

      const resolved = resolveThemeAlias(current);
      const parentManifest = loadThemeManifest(resolved.path);
      current = parentManifest?.extends;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Load complete theme configuration with mtime-based caching
 *
 * @param themeRef - Theme reference (default: "@theme/default")
 * @returns Theme configuration or null if not found
 */
export function loadThemeConfig(themeRef: string): ThemeConfig {
  // Check cache first (uses mtime-based validation)
  const cached = cacheManager.getCached<ThemeConfig>('theme', themeRef);
  if (cached) {
    return cached;
  }

  // If already an absolute path (resolved at config load time), use directly
  const resolved = path.isAbsolute(themeRef)
    ? { path: themeRef, name: path.basename(themeRef) }
    : resolveThemeAlias(themeRef);

  // Check if theme directory exists — throw instead of silent fallback
  if (!fs.existsSync(resolved.path)) {
    throw new Error(
      `Theme directory not found: "${resolved.path}" (from theme ref "${themeRef}"). ` +
      `Check the "theme" value in site.yaml and ensure the directory exists.`
    );
  }

  // Load manifest — every theme MUST have a theme.yaml
  const manifest = loadThemeManifest(resolved.path);

  if (!manifest) {
    throw new Error(
      `Theme manifest (theme.yaml) not found or invalid in: "${resolved.path}" (from theme ref "${themeRef}"). ` +
      `Every theme must have a theme.yaml with name, version, and files fields.`
    );
  }

  // Validate theme in development mode
  if (import.meta.env?.DEV) {
    const validation = validateTheme(resolved.path, manifest);
    if (!validation.valid) {
      for (const error of validation.errors) {
        addError({
          file: themeRef,
          type: error.type as any,
          message: error.message,
          suggestion: error.suggestion,
        });
      }
    }
    for (const warning of validation.warnings) {
      console.warn(`[theme] ${themeRef}: ${warning}`);
    }
  }

  // Load CSS with dependency tracking
  const { css, deps, perFile } = loadThemeCSS(resolved.path, manifest);

  const config: ThemeConfig = {
    name: resolved.name,
    path: resolved.path,
    manifest,
    css,
    cssPerFile: perFile,
  };

  // Cache with file dependencies (theme.yaml + CSS files)
  cacheManager.setCache('theme', themeRef, config, deps);

  return config;
}

// Cache for combined CSS (with inheritance resolved)
const COMBINED_CSS_CACHE_KEY = '__theme_combined_css__';

function getCombinedCSSCache(): Map<string, string> {
  if (!(globalThis as any)[COMBINED_CSS_CACHE_KEY]) {
    (globalThis as any)[COMBINED_CSS_CACHE_KEY] = new Map<string, string>();
  }
  return (globalThis as any)[COMBINED_CSS_CACHE_KEY];
}

/**
 * Get combined theme CSS for injection (handles inheritance)
 * Result is cached to avoid rebuilding on every call.
 *
 * @param themeRef - Theme reference (default: "@theme/default")
 * @returns Combined CSS string (parent + child)
 */
export function getThemeCSS(themeRef: string): string {
  // Check combined CSS cache first
  const cssCache = getCombinedCSSCache();
  if (cssCache.has(themeRef)) {
    return cssCache.get(themeRef)!;
  }

  const theme = loadThemeConfig(themeRef);
  const overrideMode = theme.manifest.override_mode || 'merge';

  let css = '';

  if (theme.manifest.extends) {
    switch (overrideMode) {
      case 'replace':
        // Skip parent entirely — child is standalone
        break;

      case 'override': {
        // Load parent chain but skip files that the child provides
        const childFileNames = new Set(theme.cssPerFile.keys());
        css += getThemeCSSWithSkip(theme.manifest.extends, childFileNames);
        css += '\n/* --- Child Theme Overrides --- */\n\n';
        break;
      }

      case 'merge':
      default:
        // Current behavior: parent CSS loaded first, child appended
        css += getThemeCSS(theme.manifest.extends);
        css += '\n/* --- Child Theme Overrides --- */\n\n';
        break;
    }
  }

  // Then add this theme's CSS
  css += theme.css;

  // Cache the combined result
  cssCache.set(themeRef, css);

  return css;
}

/**
 * Load parent theme chain CSS while skipping specified filenames.
 * Used by override mode to exclude parent files that the child replaces.
 *
 * @param themeRef - Parent theme reference
 * @param skipFiles - Set of filenames to skip (e.g. "element.css")
 * @returns CSS string with skipped files excluded
 */
function getThemeCSSWithSkip(themeRef: string, skipFiles: Set<string>): string {
  const theme = loadThemeConfig(themeRef);

  let css = '';

  // Recurse into grandparent if present (propagate skip set)
  if (theme.manifest.extends) {
    const parentMode = theme.manifest.override_mode || 'merge';

    if (parentMode === 'replace') {
      // Parent itself is standalone — don't load its parent
    } else if (parentMode === 'override') {
      // Parent also overrides its own parent — merge skip sets
      const combinedSkip = new Set([...skipFiles, ...theme.cssPerFile.keys()]);
      css += getThemeCSSWithSkip(theme.manifest.extends, combinedSkip);
      css += '\n/* --- Child Theme Overrides --- */\n\n';
    } else {
      // Parent uses merge — still apply our skip set up the chain
      css += getThemeCSSWithSkip(theme.manifest.extends, skipFiles);
      css += '\n/* --- Child Theme Overrides --- */\n\n';
    }
  }

  // Add this theme's CSS, skipping files in the skip set
  css += `/* Theme: ${theme.manifest.name} v${theme.manifest.version} */\n\n`;
  for (const [filename, fileCSS] of theme.cssPerFile) {
    if (!skipFiles.has(filename)) {
      css += fileCSS;
    }
  }

  return css;
}

/**
 * Get list of available themes
 *
 * @returns Array of theme names
 */
export function getAvailableThemes(): string[] {
  const themes: string[] = [];
  const seen = new Set<string>();

  // Check built-in styles directory for a theme.yaml
  if (fs.existsSync(path.join(paths.styles, 'theme.yaml'))) {
    themes.push('default');
    seen.add('default');
  }

  // Scan all theme-category directories
  const themeDirs = getThemePaths();
  for (const themeDir of themeDirs) {
    if (!fs.existsSync(themeDir)) continue;
    const entries = fs.readdirSync(themeDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !seen.has(entry.name)) {
        const manifestPath = path.join(themeDir, entry.name, 'theme.yaml');
        if (fs.existsSync(manifestPath)) {
          themes.push(entry.name);
          seen.add(entry.name);
        }
      }
    }
  }

  return themes;
}

export default {
  resolveThemeName,
  resolveThemeAlias,
  loadThemeManifest,
  loadThemeCSS,
  validateTheme,
  loadThemeConfig,
  getThemeCSS,
  getAvailableThemes,
};
