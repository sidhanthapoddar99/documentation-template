/**
 * Dev Toolbar Integration
 *
 * Registers the layout & theme selector app with Astro's dev toolbar.
 * Only active during development (npm run start).
 */

import type { AstroIntegration } from 'astro';
import type { ViteDevServer } from 'vite';
import { invalidateAll } from '../loaders/cache';
import { paths } from '../loaders/paths';

// Track the Vite dev server for sending reload messages
let viteServer: ViteDevServer | null = null;

export function devToolbarIntegration(): AstroIntegration {
  return {
    name: 'dev-toolbar-apps',
    hooks: {
      'astro:config:setup': ({ addDevToolbarApp, updateConfig }) => {
        // Get configured paths from .env (resolved to absolute paths)
        const watchPaths = [paths.data, paths.config, paths.assets];

        // Add Vite plugin to handle cache invalidation on file changes
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'cache-invalidation',
                configureServer(server) {
                  viteServer = server;
                },
                async handleHotUpdate({ file, server }) {
                  // Check if file is in any of the configured content paths
                  const isContentFile = watchPaths.some(p => file.startsWith(p));
                  if (!isContentFile) return;

                  // Only handle markdown and json files
                  if (!file.endsWith('.md') && !file.endsWith('.mdx') && !file.endsWith('.json')) return;

                  const shortPath = file.split('/').slice(-3).join('/');
                  console.log('[cache] File changed:', shortPath);

                  // Invalidate cache and trigger full reload
                  invalidateAll();
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
