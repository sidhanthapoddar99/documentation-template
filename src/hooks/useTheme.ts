/**
 * Theme Hook - Theme management utilities
 *
 * Note: These are primarily for server-side use in Astro.
 * Client-side theme switching is handled in navbar components.
 */

export type Theme = 'light' | 'dark' | 'system';

/**
 * Get the default theme based on environment
 */
export function getDefaultTheme(): Theme {
  const enableDarkMode = import.meta.env.ENABLE_DARK_MODE;

  if (enableDarkMode === 'false') {
    return 'light';
  }

  return 'system';
}

/**
 * Generate the inline script for preventing theme flash
 */
export function getThemeScript(): string {
  return `
    (function() {
      const theme = (() => {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
          return localStorage.getItem('theme');
        }
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
        return 'light';
      })();

      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    })();
  `.trim();
}

/**
 * CSS variables for theming
 * These can be used to generate theme files
 */
export const themeVariables = {
  light: {
    'color-bg-primary': '#ffffff',
    'color-bg-secondary': '#f8f9fa',
    'color-bg-tertiary': '#e9ecef',
    'color-text-primary': '#212529',
    'color-text-secondary': '#495057',
    'color-text-muted': '#6c757d',
    'color-border-default': '#dee2e6',
    'color-border-light': '#e9ecef',
    'color-brand-primary': '#0066cc',
    'color-brand-secondary': '#0052a3',
  },
  dark: {
    'color-bg-primary': '#1a1a2e',
    'color-bg-secondary': '#16213e',
    'color-bg-tertiary': '#0f3460',
    'color-text-primary': '#eaeaea',
    'color-text-secondary': '#b8b8b8',
    'color-text-muted': '#888888',
    'color-border-default': '#2d2d44',
    'color-border-light': '#3d3d5c',
    'color-brand-primary': '#4da6ff',
    'color-brand-secondary': '#80bfff',
  },
} as const;

export default {
  getDefaultTheme,
  getThemeScript,
  themeVariables,
};
