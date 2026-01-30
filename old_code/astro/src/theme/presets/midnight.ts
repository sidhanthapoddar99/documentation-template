/**
 * Midnight Theme Preset
 *
 * A sophisticated theme with purple and indigo tones.
 * Evokes elegance and creativity.
 */

export const midnightTheme = {
  name: 'midnight',
  description: 'Sophisticated theme with purple and indigo tones',

  brand: {
    primary: '#8b5cf6',     // Purple-500
    secondary: '#6366f1',   // Indigo-500
    accent: '#ec4899',      // Pink-500
  },

  light: {
    background: {
      primary: '#ffffff',
      secondary: '#faf5ff',
      tertiary: '#f3e8ff',
    },
    text: {
      primary: '#3b0764',
      secondary: '#581c87',
      muted: '#a855f7',
    },
    border: {
      default: '#e9d5ff',
      muted: '#f3e8ff',
    },
  },

  dark: {
    background: {
      primary: '#0c0a1d',
      secondary: '#1e1b4b',
      tertiary: '#312e81',
    },
    text: {
      primary: '#faf5ff',
      secondary: '#e9d5ff',
      muted: '#a855f7',
    },
    border: {
      default: '#312e81',
      muted: '#1e1b4b',
    },
  },
};
