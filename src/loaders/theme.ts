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
import { paths, getThemePath } from './paths';
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
 * Resolve a theme alias to its actual path
 *
 * @param themeRef - Theme reference (e.g., "@theme/default" or "@theme/minimal")
 * @returns Resolved theme path information
 */
export function resolveThemeAlias(themeRef: string): ResolvedTheme {
  // Handle default theme
  if (themeRef === '@theme/default') {
    return {
      path: paths.styles,
      isDefault: true,
      name: 'default',
    };
  }

  // Handle custom themes
  if (themeRef.startsWith('@theme/')) {
    const themeName = themeRef.slice('@theme/'.length);
    return {
      path: getThemePath(themeName),
      isDefault: false,
      name: themeName,
    };
  }

  // Handle direct paths (fallback)
  return {
    path: themeRef,
    isDefault: false,
    name: path.basename(themeRef),
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
): { css: string; deps: string[] } {
  const cssFiles = manifest.files.filter((f) => f.endsWith('.css'));
  let combinedCSS = `/* Theme: ${manifest.name} v${manifest.version} */\n\n`;
  const deps: string[] = [];

  // Add theme.yaml as dependency
  const manifestPath = path.join(themePath, 'theme.yaml');
  if (fs.existsSync(manifestPath)) {
    deps.push(manifestPath);
  }

  for (const file of cssFiles) {
    const filePath = path.join(themePath, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      combinedCSS += `/* --- ${file} --- */\n${content}\n\n`;
      deps.push(filePath);
    } else {
      console.warn(`Theme CSS file not found: ${filePath}`);
    }
  }

  return { css: combinedCSS, deps };
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

    for (const variable of allRequired) {
      // Check if variable is defined (look for "variable-name:" pattern)
      const varPattern = new RegExp(`${variable.replace('--', '--')}\\s*:`);
      if (!varPattern.test(css)) {
        // Only warn if theme extends another (parent provides vars)
        if (manifest.extends) {
          warnings.push(`Variable ${variable} not defined, will inherit from parent theme`);
        } else {
          errors.push({
            type: 'missing-variable',
            message: `Required CSS variable not defined: ${variable}`,
            variable,
            suggestion: `Add "${variable}: <value>;" to your theme CSS`,
          });
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
export function loadThemeConfig(themeRef: string = '@theme/default'): ThemeConfig | null {
  // Check cache first (uses mtime-based validation)
  const cached = cacheManager.getCached<ThemeConfig>('theme', themeRef);
  if (cached) {
    return cached;
  }

  const resolved = resolveThemeAlias(themeRef);

  // Check if theme directory exists
  if (!fs.existsSync(resolved.path)) {
    console.error(`Theme directory not found: ${resolved.path}`);
    addError({
      file: themeRef,
      type: 'theme-not-found',
      message: `Theme not found: ${themeRef}`,
      suggestion: `Check that the theme exists at: ${resolved.path}`,
    });
    return null;
  }

  // Load manifest
  let manifest = loadThemeManifest(resolved.path);

  // For default theme without explicit manifest, create a basic one
  if (!manifest && resolved.isDefault) {
    manifest = {
      name: 'Default Theme',
      version: '1.0.0',
      description: 'Built-in default theme',
      extends: null,
      supports_dark_mode: true,
      files: ['index.css'],
    };
  }

  if (!manifest) {
    console.error(`Theme manifest not found: ${resolved.path}/theme.yaml`);
    addError({
      file: themeRef,
      type: 'theme-invalid-manifest',
      message: `Theme manifest (theme.yaml) not found in: ${themeRef}`,
      suggestion: 'Create a theme.yaml file with name, version, and files fields',
    });
    return null;
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
  const { css, deps } = loadThemeCSS(resolved.path, manifest);

  const config: ThemeConfig = {
    name: resolved.name,
    path: resolved.path,
    manifest,
    css,
    isDefault: resolved.isDefault,
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
export function getThemeCSS(themeRef: string = '@theme/default'): string {
  // Check combined CSS cache first
  const cssCache = getCombinedCSSCache();
  if (cssCache.has(themeRef)) {
    return cssCache.get(themeRef)!;
  }

  const theme = loadThemeConfig(themeRef);
  if (!theme) {
    // Return empty string if theme not found (errors already logged)
    return '';
  }

  let css = '';

  // If extends, load parent theme first (cascading)
  if (theme.manifest.extends) {
    css += getThemeCSS(theme.manifest.extends);
    css += '\n/* --- Child Theme Overrides --- */\n\n';
  }

  // Then add this theme's CSS (overrides parent)
  css += theme.css;

  // Cache the combined result
  cssCache.set(themeRef, css);

  return css;
}

/**
 * Get list of available themes
 *
 * @returns Array of theme names
 */
export function getAvailableThemes(): string[] {
  const themes: string[] = ['default'];

  // Check themes directory
  if (fs.existsSync(paths.themes)) {
    const entries = fs.readdirSync(paths.themes, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Check if it has a theme.yaml
        const manifestPath = path.join(paths.themes, entry.name, 'theme.yaml');
        if (fs.existsSync(manifestPath)) {
          themes.push(entry.name);
        }
      }
    }
  }

  return themes;
}

export default {
  resolveThemeAlias,
  loadThemeManifest,
  loadThemeCSS,
  validateTheme,
  loadThemeConfig,
  getThemeCSS,
  getAvailableThemes,
};
