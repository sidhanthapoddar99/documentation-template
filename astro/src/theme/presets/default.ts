/**
 * Default Theme Preset
 *
 * A clean, professional theme with blue accents.
 * Suitable for most documentation sites.
 */

export const defaultTheme = {
  name: 'default',
  description: 'Clean, professional theme with blue accents',

  brand: {
    primary: '#3b82f6',     // Blue-500
    secondary: '#8b5cf6',   // Purple-500
    accent: '#f59e0b',      // Amber-500
  },

  light: {
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#64748b',
    },
    border: {
      default: '#e2e8f0',
      muted: '#f1f5f9',
    },
  },

  dark: {
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      muted: '#94a3b8',
    },
    border: {
      default: '#334155',
      muted: '#1e293b',
    },
  },
};
