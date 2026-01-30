/**
 * Theme Presets
 *
 * Pre-defined color themes for the documentation framework.
 * Each preset defines colors for both light and dark modes.
 */

export { defaultTheme } from './default';
export { oceanTheme } from './ocean';
export { forestTheme } from './forest';
export { sunsetTheme } from './sunset';
export { midnightTheme } from './midnight';

import { defaultTheme } from './default';
import { oceanTheme } from './ocean';
import { forestTheme } from './forest';
import { sunsetTheme } from './sunset';
import { midnightTheme } from './midnight';

export type ThemePreset = typeof defaultTheme;

export const presets: Record<string, ThemePreset> = {
  default: defaultTheme,
  ocean: oceanTheme,
  forest: forestTheme,
  sunset: sunsetTheme,
  midnight: midnightTheme,
};

export function getPreset(name: string): ThemePreset {
  return presets[name] || defaultTheme;
}
