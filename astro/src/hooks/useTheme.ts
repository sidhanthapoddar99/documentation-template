/**
 * Theme Hook - Dark/Light Mode Toggle
 *
 * Provides theme state management with:
 * - System preference detection
 * - LocalStorage persistence
 * - Toggle functionality
 */

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme-preference';

/**
 * Get the current theme from localStorage or system preference
 */
export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system';

  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored;
  }
  return 'system';
}

/**
 * Get the resolved theme (actual light/dark, not 'system')
 */
export function getResolvedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  const theme = getTheme();
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

/**
 * Set the theme and update DOM
 */
export function setTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEY, theme);

  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  document.documentElement.setAttribute('data-theme', resolved);

  // Dispatch custom event for other components to listen
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme, resolved } }));
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): void {
  const current = getResolvedTheme();
  setTheme(current === 'light' ? 'dark' : 'light');
}

/**
 * Initialize theme on page load
 * Call this in a client-side script
 */
export function initTheme(): void {
  if (typeof window === 'undefined') return;

  // Set initial theme
  const resolved = getResolvedTheme();
  document.documentElement.setAttribute('data-theme', resolved);

  // Listen for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    const currentTheme = getTheme();
    if (currentTheme === 'system') {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      window.dispatchEvent(new CustomEvent('theme-change', {
        detail: { theme: 'system', resolved: e.matches ? 'dark' : 'light' }
      }));
    }
  });
}

/**
 * Script to inject in <head> for preventing flash of wrong theme
 * This runs before the page renders
 */
export const themeInitScript = `
(function() {
  const stored = localStorage.getItem('${STORAGE_KEY}');
  let theme = stored || 'system';
  if (theme === 'system') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
`;
