/**
 * Theme Loader
 *
 * Loads theme configuration and generates CSS variables.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { ThemeConfig, ColorOverrides } from './types';

// ==================================
// Directory Paths
// ==================================

const STYLES_DIR = import.meta.env.STYLES_DIR || '../styles';
const astroDir = path.dirname(new URL(import.meta.url).pathname);
const resolvedStylesDir = path.resolve(astroDir, '..', '..', STYLES_DIR);

// ==================================
// Preset Theme Definitions
// ==================================

interface ThemePreset {
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  light: {
    background: { primary: string; secondary: string; tertiary: string };
    text: { primary: string; secondary: string; muted: string };
    border: { default: string; muted: string };
  };
  dark: {
    background: { primary: string; secondary: string; tertiary: string };
    text: { primary: string; secondary: string; muted: string };
    border: { default: string; muted: string };
  };
}

const presets: Record<string, ThemePreset> = {
  default: {
    brand: {
      primary: '#3b82f6',    // Blue-500
      secondary: '#8b5cf6',  // Purple-500
      accent: '#f59e0b',     // Amber-500
    },
    light: {
      background: { primary: '#ffffff', secondary: '#f8fafc', tertiary: '#f1f5f9' },
      text: { primary: '#0f172a', secondary: '#475569', muted: '#64748b' },
      border: { default: '#e2e8f0', muted: '#f1f5f9' },
    },
    dark: {
      background: { primary: '#0f172a', secondary: '#1e293b', tertiary: '#334155' },
      text: { primary: '#f8fafc', secondary: '#cbd5e1', muted: '#94a3b8' },
      border: { default: '#334155', muted: '#1e293b' },
    },
  },

  ocean: {
    brand: {
      primary: '#0891b2',    // Cyan-600
      secondary: '#0284c7',  // Sky-600
      accent: '#14b8a6',     // Teal-500
    },
    light: {
      background: { primary: '#ffffff', secondary: '#f0fdfa', tertiary: '#ccfbf1' },
      text: { primary: '#134e4a', secondary: '#115e59', muted: '#5eead4' },
      border: { default: '#99f6e4', muted: '#ccfbf1' },
    },
    dark: {
      background: { primary: '#042f2e', secondary: '#0d3d56', tertiary: '#155e75' },
      text: { primary: '#f0fdfa', secondary: '#99f6e4', muted: '#5eead4' },
      border: { default: '#155e75', muted: '#0d3d56' },
    },
  },

  forest: {
    brand: {
      primary: '#16a34a',    // Green-600
      secondary: '#15803d',  // Green-700
      accent: '#84cc16',     // Lime-500
    },
    light: {
      background: { primary: '#ffffff', secondary: '#f0fdf4', tertiary: '#dcfce7' },
      text: { primary: '#14532d', secondary: '#166534', muted: '#4ade80' },
      border: { default: '#86efac', muted: '#dcfce7' },
    },
    dark: {
      background: { primary: '#052e16', secondary: '#14532d', tertiary: '#166534' },
      text: { primary: '#f0fdf4', secondary: '#86efac', muted: '#4ade80' },
      border: { default: '#166534', muted: '#14532d' },
    },
  },

  sunset: {
    brand: {
      primary: '#ea580c',    // Orange-600
      secondary: '#dc2626',  // Red-600
      accent: '#f59e0b',     // Amber-500
    },
    light: {
      background: { primary: '#ffffff', secondary: '#fff7ed', tertiary: '#ffedd5' },
      text: { primary: '#7c2d12', secondary: '#9a3412', muted: '#fb923c' },
      border: { default: '#fed7aa', muted: '#ffedd5' },
    },
    dark: {
      background: { primary: '#431407', secondary: '#7c2d12', tertiary: '#9a3412' },
      text: { primary: '#fff7ed', secondary: '#fed7aa', muted: '#fb923c' },
      border: { default: '#9a3412', muted: '#7c2d12' },
    },
  },

  midnight: {
    brand: {
      primary: '#8b5cf6',    // Purple-500
      secondary: '#6366f1',  // Indigo-500
      accent: '#ec4899',     // Pink-500
    },
    light: {
      background: { primary: '#ffffff', secondary: '#faf5ff', tertiary: '#f3e8ff' },
      text: { primary: '#3b0764', secondary: '#581c87', muted: '#a855f7' },
      border: { default: '#e9d5ff', muted: '#f3e8ff' },
    },
    dark: {
      background: { primary: '#0c0a1d', secondary: '#1e1b4b', tertiary: '#312e81' },
      text: { primary: '#faf5ff', secondary: '#e9d5ff', muted: '#a855f7' },
      border: { default: '#312e81', muted: '#1e1b4b' },
    },
  },
};

// ==================================
// Theme Loading
// ==================================

let _themeConfig: ThemeConfig | null = null;

/**
 * Load theme configuration from YAML
 */
function loadThemeConfig(): ThemeConfig {
  if (_themeConfig) return _themeConfig;

  const themePath = path.join(resolvedStylesDir, 'theme.yaml');

  if (!fs.existsSync(themePath)) {
    console.warn('Theme config not found, using default preset');
    _themeConfig = { preset: 'default' };
    return _themeConfig;
  }

  const content = fs.readFileSync(themePath, 'utf-8');
  _themeConfig = yaml.load(content) as ThemeConfig;
  return _themeConfig;
}

/**
 * Get the theme configuration
 */
export function getThemeConfig(): ThemeConfig {
  return loadThemeConfig();
}

/**
 * Get the resolved theme (preset merged with overrides)
 */
export function getResolvedTheme(): ThemePreset {
  const config = loadThemeConfig();
  const preset = presets[config.preset] || presets.default;

  if (!config.overrides) {
    return preset;
  }

  // Deep merge overrides into preset
  return deepMerge(preset, config.overrides) as ThemePreset;
}

/**
 * Deep merge two objects
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (typeof target[key] === 'object' && !Array.isArray(target[key])) {
        result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
      } else {
        result[key] = source[key];
      }
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Generate CSS variables from theme
 */
export function generateThemeCSS(): string {
  const theme = getResolvedTheme();

  const cssLines: string[] = [
    ':root {',
    '  /* Brand Colors */',
    `  --color-brand-primary: ${theme.brand.primary};`,
    `  --color-brand-secondary: ${theme.brand.secondary};`,
    `  --color-brand-accent: ${theme.brand.accent};`,
    '',
    '  /* Light Mode (default) */',
    `  --theme-bg-primary: ${theme.light.background.primary};`,
    `  --theme-bg-secondary: ${theme.light.background.secondary};`,
    `  --theme-bg-tertiary: ${theme.light.background.tertiary};`,
    `  --theme-text-primary: ${theme.light.text.primary};`,
    `  --theme-text-secondary: ${theme.light.text.secondary};`,
    `  --theme-text-muted: ${theme.light.text.muted};`,
    `  --theme-border-default: ${theme.light.border.default};`,
    `  --theme-border-muted: ${theme.light.border.muted};`,
    '}',
    '',
    '[data-theme="dark"] {',
    '  /* Dark Mode */',
    `  --theme-bg-primary: ${theme.dark.background.primary};`,
    `  --theme-bg-secondary: ${theme.dark.background.secondary};`,
    `  --theme-bg-tertiary: ${theme.dark.background.tertiary};`,
    `  --theme-text-primary: ${theme.dark.text.primary};`,
    `  --theme-text-secondary: ${theme.dark.text.secondary};`,
    `  --theme-text-muted: ${theme.dark.text.muted};`,
    `  --theme-border-default: ${theme.dark.border.default};`,
    `  --theme-border-muted: ${theme.dark.border.muted};`,
    '}',
  ];

  return cssLines.join('\n');
}

/**
 * Get custom CSS file path if it exists
 */
export function getCustomCSSPath(): string | null {
  const customPath = path.join(resolvedStylesDir, 'custom.css');
  if (fs.existsSync(customPath)) {
    return customPath;
  }
  return null;
}

/**
 * Get custom CSS content if file exists
 */
export function getCustomCSS(): string | null {
  const customPath = getCustomCSSPath();
  if (customPath) {
    return fs.readFileSync(customPath, 'utf-8');
  }
  return null;
}

// ==================================
// Exports
// ==================================

export { presets, resolvedStylesDir };
export type { ThemePreset };
