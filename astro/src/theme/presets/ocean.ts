/**
 * Ocean Theme Preset
 *
 * A calm, aquatic theme with teal and cyan tones.
 * Evokes clarity and depth.
 */

export const oceanTheme = {
  name: 'ocean',
  description: 'Calm, aquatic theme with teal and cyan tones',

  brand: {
    primary: '#0891b2',     // Cyan-600
    secondary: '#0284c7',   // Sky-600
    accent: '#14b8a6',      // Teal-500
  },

  light: {
    background: {
      primary: '#ffffff',
      secondary: '#f0fdfa',
      tertiary: '#ccfbf1',
    },
    text: {
      primary: '#134e4a',
      secondary: '#115e59',
      muted: '#0d9488',
    },
    border: {
      default: '#99f6e4',
      muted: '#ccfbf1',
    },
  },

  dark: {
    background: {
      primary: '#042f2e',
      secondary: '#0d3d56',
      tertiary: '#155e75',
    },
    text: {
      primary: '#f0fdfa',
      secondary: '#99f6e4',
      muted: '#5eead4',
    },
    border: {
      default: '#155e75',
      muted: '#0d3d56',
    },
  },
};
