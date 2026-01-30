/**
 * Sunset Theme Preset
 *
 * A warm theme with orange and red tones.
 * Evokes energy and creativity.
 */

export const sunsetTheme = {
  name: 'sunset',
  description: 'Warm theme with orange and red tones',

  brand: {
    primary: '#ea580c',     // Orange-600
    secondary: '#dc2626',   // Red-600
    accent: '#f59e0b',      // Amber-500
  },

  light: {
    background: {
      primary: '#ffffff',
      secondary: '#fff7ed',
      tertiary: '#ffedd5',
    },
    text: {
      primary: '#7c2d12',
      secondary: '#9a3412',
      muted: '#f97316',
    },
    border: {
      default: '#fed7aa',
      muted: '#ffedd5',
    },
  },

  dark: {
    background: {
      primary: '#431407',
      secondary: '#7c2d12',
      tertiary: '#9a3412',
    },
    text: {
      primary: '#fff7ed',
      secondary: '#fed7aa',
      muted: '#fb923c',
    },
    border: {
      default: '#9a3412',
      muted: '#7c2d12',
    },
  },
};
