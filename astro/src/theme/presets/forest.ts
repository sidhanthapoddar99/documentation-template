/**
 * Forest Theme Preset
 *
 * A natural, earthy theme with green tones.
 * Evokes growth and sustainability.
 */

export const forestTheme = {
  name: 'forest',
  description: 'Natural, earthy theme with green tones',

  brand: {
    primary: '#16a34a',     // Green-600
    secondary: '#15803d',   // Green-700
    accent: '#84cc16',      // Lime-500
  },

  light: {
    background: {
      primary: '#ffffff',
      secondary: '#f0fdf4',
      tertiary: '#dcfce7',
    },
    text: {
      primary: '#14532d',
      secondary: '#166534',
      muted: '#22c55e',
    },
    border: {
      default: '#86efac',
      muted: '#dcfce7',
    },
  },

  dark: {
    background: {
      primary: '#052e16',
      secondary: '#14532d',
      tertiary: '#166534',
    },
    text: {
      primary: '#f0fdf4',
      secondary: '#86efac',
      muted: '#4ade80',
    },
    border: {
      default: '#166534',
      muted: '#14532d',
    },
  },
};
