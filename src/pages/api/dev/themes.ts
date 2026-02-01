/**
 * Dev API Endpoint: Themes
 *
 * Returns all available themes and the currently configured theme.
 * Only available in development mode.
 */

import type { APIRoute } from 'astro';
import { getAvailableThemes, loadThemeConfig } from '../../../loaders/theme';
import { getTheme } from '../../../loaders/config';

export const GET: APIRoute = async () => {
  // Only available in dev mode
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const themes = getAvailableThemes();
  const currentThemeRef = getTheme();
  const currentConfig = loadThemeConfig(currentThemeRef);

  // Get details for each available theme
  const themeDetails = themes.map((themeName) => {
    const themeRef = themeName === 'default' ? '@theme/default' : `@theme/${themeName}`;
    const config = loadThemeConfig(themeRef);

    return {
      name: themeName,
      ref: themeRef,
      displayName: config?.manifest.name || themeName,
      description: config?.manifest.description || '',
      version: config?.manifest.version || 'unknown',
      extends: config?.manifest.extends || null,
      supportsDarkMode: config?.manifest.supports_dark_mode ?? true,
    };
  });

  return new Response(
    JSON.stringify({
      current: {
        ref: currentThemeRef,
        name: currentConfig?.manifest.name || 'Unknown',
      },
      themes: themeDetails,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
};
