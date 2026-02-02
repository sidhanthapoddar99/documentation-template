/**
 * Dev Toolbar Integration
 *
 * Registers the layout & theme selector app with Astro's dev toolbar.
 * Only active during development (npm run start).
 */

import type { AstroIntegration } from 'astro';
import type { ViteDevServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { invalidateAll } from '../loaders/cache';
import { invalidateSidebarCache } from '../hooks/useSidebar';

// Track the Vite dev server for sending reload messages
let viteServer: ViteDevServer | null = null;

/**
 * Read paths from .env file directly
 * This ensures we get the configured paths even during Vite plugin setup
 */
function getWatchPaths(): string[] {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectRoot = path.resolve(__dirname, '../..');
  const envPath = path.join(projectRoot, '.env');

  // Default paths relative to project root
  let configDir = './dynamic_data/config';
  let dataDir = './dynamic_data/data';
  let assetsDir = './dynamic_data/assets';
  let themesDir = './dynamic_data/themes';

  // Read from .env if it exists
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;

      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();

      switch (key.trim()) {
        case 'CONFIG_DIR': configDir = value; break;
        case 'DATA_DIR': dataDir = value; break;
        case 'ASSETS_DIR': assetsDir = value; break;
        case 'THEMES_DIR': themesDir = value; break;
      }
    }
  }

  // Resolve paths (handle both relative and absolute)
  const resolvePath = (p: string) => path.isAbsolute(p) ? p : path.resolve(projectRoot, p);

  return [
    resolvePath(dataDir),
    resolvePath(configDir),
    resolvePath(assetsDir),
    resolvePath(themesDir),
  ];
}

export function devToolbarIntegration(): AstroIntegration {
  return {
    name: 'dev-toolbar-apps',
    hooks: {
      'astro:config:setup': ({ addDevToolbarApp, updateConfig }) => {
        // Get watch paths from .env configuration
        const watchPaths = getWatchPaths();

        // Extensions to ignore (temp files, system files, etc.)
        const ignoreExtensions = ['.DS_Store', '.gitkeep', '.tmp', '.swp', '.bak'];

        // Helper to check if file should trigger reload
        const shouldTriggerReload = (file: string): boolean => {
          const isInWatchPath = watchPaths.some(p => file.startsWith(p));
          const isIgnored = ignoreExtensions.some(ext => file.endsWith(ext));
          return isInWatchPath && !isIgnored;
        };

        // Add Vite plugin to handle cache invalidation on file changes
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'cache-invalidation',
                configureServer(server) {
                  viteServer = server;

                  // Explicitly add watch paths to Vite's watcher
                  // Vite only watches src/ by default, not external content directories
                  watchPaths.forEach(watchPath => {
                    server.watcher.add(watchPath);
                    console.log('[HMR] Watching:', watchPath);
                  });

                  // Watch for file additions and deletions
                  server.watcher.on('add', (file) => {
                    if (shouldTriggerReload(file)) {
                      const shortPath = file.split('/').slice(-3).join('/');
                      console.log('[cache] File added:', shortPath);
                      invalidateAll();
                      invalidateSidebarCache();
                      console.log('[cache] Cache invalidated, triggering reload...');
                      server.ws.send({ type: 'full-reload' });
                    }
                  });

                  server.watcher.on('unlink', (file) => {
                    if (shouldTriggerReload(file)) {
                      const shortPath = file.split('/').slice(-3).join('/');
                      console.log('[cache] File deleted:', shortPath);
                      invalidateAll();
                      invalidateSidebarCache();
                      console.log('[cache] Cache invalidated, triggering reload...');
                      server.ws.send({ type: 'full-reload' });
                    }
                  });
                },
                async handleHotUpdate({ file, server }) {
                  // Check if file should trigger reload
                  if (!shouldTriggerReload(file)) return;

                  const shortPath = file.split('/').slice(-3).join('/');
                  console.log('[cache] File changed:', shortPath);

                  // Invalidate cache and trigger full reload
                  invalidateAll();
                  invalidateSidebarCache();
                  console.log('[cache] Cache invalidated, triggering reload...');

                  // Send full page reload to browser
                  server.ws.send({ type: 'full-reload' });

                  // Return empty array to prevent Vite's default HMR
                  return [];
                },
              },
            ],
          },
        });
        // Layout & Theme Selector
        addDevToolbarApp({
          id: 'layout-theme-selector',
          name: 'Layout & Theme',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
          entrypoint: './src/dev-toolbar/layout-selector.ts',
        });

        // Error Logger
        addDevToolbarApp({
          id: 'error-logger',
          name: 'Doc Errors',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
          entrypoint: './src/dev-toolbar/error-logger.ts',
        });
      },
    },
  };
}

export default devToolbarIntegration;
