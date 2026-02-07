/**
 * Dev Toolbar Integration
 *
 * Registers the layout & theme selector app with Astro's dev toolbar.
 * Only active during development (npm run start).
 *
 * Uses unified cache manager for selective invalidation:
 * - Content changes: invalidate content + sidebar
 * - Settings changes: invalidate sidebar + settings
 * - Theme changes: invalidate theme only
 * - Config changes: invalidate config (+ theme if site.yaml)
 */

import type { AstroIntegration } from 'astro';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import cacheManager from '../loaders/cache-manager';
import { EditorStore } from './editor/server';
import { setupEditorMiddleware } from './editor/middleware';
import { PresenceManager, type PresenceConfig } from './editor/presence';
import { YjsSync } from './editor/yjs-sync';


interface WatchPathsConfig {
  data: string;
  config: string;
  assets: string;
  themes: string;
}

/**
 * Read paths from .env file directly
 * This ensures we get the configured paths even during Vite plugin setup
 */
function getWatchPaths(): { paths: WatchPathsConfig; array: string[] } {
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

  const paths = {
    data: resolvePath(dataDir),
    config: resolvePath(configDir),
    assets: resolvePath(assetsDir),
    themes: resolvePath(themesDir),
  };

  return {
    paths,
    array: [paths.data, paths.config, paths.assets, paths.themes],
  };
}

/**
 * Read editor configuration from site.yaml.
 * Throws a clear error if editor.autosave_interval is missing.
 * Presence settings are optional with sensible defaults.
 */
function getEditorConfig(configDir: string): { autosaveInterval: number; presence: PresenceConfig } {
  const siteYamlPath = path.join(configDir, 'site.yaml');

  if (!fs.existsSync(siteYamlPath)) {
    throw new Error(
      `\n[CONFIG ERROR] site.yaml not found at: ${siteYamlPath}\n`
    );
  }

  const content = fs.readFileSync(siteYamlPath, 'utf-8');
  const config = yaml.load(content) as Record<string, any>;

  if (!config?.editor?.autosave_interval) {
    throw new Error(
      `\n[CONFIG ERROR] Missing required field "editor.autosave_interval" in site.yaml.\n` +
      `  Add the following to your site.yaml:\n\n` +
      `  editor:\n` +
      `    autosave_interval: 10000  # milliseconds\n`
    );
  }

  const autosaveInterval = Number(config.editor.autosave_interval);
  if (isNaN(autosaveInterval) || autosaveInterval < 1000) {
    throw new Error(
      `\n[CONFIG ERROR] "editor.autosave_interval" must be a number >= 1000 (ms).\n` +
      `  Current value: ${config.editor.autosave_interval}\n`
    );
  }

  // Presence config with defaults
  const p = config.editor?.presence || {};
  const presence: PresenceConfig = {
    pingInterval: Math.max(Number(p.ping_interval) || 5000, 1000),
    staleThreshold: Math.max(Number(p.stale_threshold) || 30000, 5000),
    cursorThrottle: Math.max(Number(p.cursor_throttle) || 100, 16),
    contentDebounce: Math.max(Number(p.content_debounce) || 150, 50),
    renderInterval: Math.max(Number(p.render_interval) || 5000, 1000),
    sseKeepalive: Math.max(Number(p.sse_keepalive) || 15000, 5000),
    sseReconnect: Math.max(Number(p.sse_reconnect) || 2000, 500),
  };

  return { autosaveInterval, presence };
}

export function devToolbarIntegration(): AstroIntegration {
  return {
    name: 'dev-toolbar-apps',
    hooks: {
      'astro:config:setup': ({ addDevToolbarApp, updateConfig }) => {
        // Get watch paths from .env configuration
        const { paths: watchPathsConfig, array: watchPaths } = getWatchPaths();

        // Configure cache manager with watch paths for file type detection
        cacheManager.setWatchPaths(watchPathsConfig);

        // Create editor store and presence manager
        const editorConfig = getEditorConfig(watchPathsConfig.config);
        const editorStore = new EditorStore({
          autosaveInterval: editorConfig.autosaveInterval,
          watchPaths,
        });
        const presenceManager = new PresenceManager(editorConfig.presence);

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
              (() => {
                // yjsSync is shared between configureServer and handleHotUpdate
                let yjsSync: YjsSync;
                return {
                name: 'cache-invalidation',
                configureServer(server) {
                  // Create Yjs sync manager and attach to HTTP server
                  yjsSync = new YjsSync();
                  yjsSync.setContentChangeHandler((filePath, raw) => {
                    editorStore.updateRaw(filePath, raw);
                  });
                  if (server.httpServer) {
                    yjsSync.attachToServer(server.httpServer);
                  }

                  // Set up editor middleware, presence, and start background save
                  setupEditorMiddleware(
                    server,
                    editorStore,
                    presenceManager,
                    yjsSync,
                  );
                  editorStore.startBackgroundSave();
                  presenceManager.startCleanup();

                  // Stop presence cleanup when server closes
                  server.httpServer?.on('close', () => {
                    presenceManager.stopCleanup();
                  });

                  // Explicitly add watch paths to Vite's watcher
                  // Vite only watches src/ by default, not external content directories
                  watchPaths.forEach(watchPath => {
                    server.watcher.add(watchPath);
                    console.log('[HMR] Watching:', watchPath);
                  });

                  // Watch for file additions
                  server.watcher.on('add', (file) => {
                    if (shouldTriggerReload(file)) {
                      const shortPath = file.split('/').slice(-3).join('/');
                      const { type, invalidated } = cacheManager.onFileAdd(file);
                      console.log(`[cache] File added (${type}):`, shortPath);
                      console.log(`[cache] Invalidated: ${invalidated.join(', ') || 'none'}`);

                      // Suppress reload if file is being edited
                      if (editorStore.isEditing(file)) {
                        if (!editorStore.isEditorSave(file)) {
                          console.log(`[editor] External file add detected: ${shortPath}`);
                          editorStore.reloadFromDisk(file).then(doc => {
                            yjsSync.resetContent(file, doc.raw);
                            presenceManager.broadcastRenderUpdate(file, doc.rendered);
                          }).catch(() => {});
                        }
                      } else {
                        server.ws.send({ type: 'full-reload' });
                      }
                    }
                  });

                  // Watch for file deletions
                  server.watcher.on('unlink', (file) => {
                    if (shouldTriggerReload(file)) {
                      const shortPath = file.split('/').slice(-3).join('/');
                      const { type, invalidated } = cacheManager.onFileDelete(file);
                      console.log(`[cache] File deleted (${type}):`, shortPath);
                      console.log(`[cache] Invalidated: ${invalidated.join(', ') || 'none'}`);

                      // Suppress reload if file is being edited
                      if (!editorStore.isEditing(file)) {
                        server.ws.send({ type: 'full-reload' });
                      }
                    }
                  });
                },
                async handleHotUpdate({ file, server }) {
                  // Check if file should trigger reload
                  if (!shouldTriggerReload(file)) return;

                  const shortPath = file.split('/').slice(-3).join('/');
                  const { type, invalidated } = cacheManager.onFileChange(file);
                  console.log(`[cache] File changed (${type}):`, shortPath);
                  console.log(`[cache] Invalidated: ${invalidated.join(', ') || 'none'}`);

                  // Suppress full-reload if file is being edited
                  // Caches are still cleared above, but we don't reload the page
                  if (editorStore.isEditing(file)) {
                    if (editorStore.isEditorSave(file)) {
                      // Our own save — just suppress HMR, no need to notify
                      console.log(`[editor] HMR suppressed (editor save): ${shortPath}`);
                    } else {
                      // External edit — reload from disk and push via Yjs
                      console.log(`[editor] External edit detected: ${shortPath}`);
                      try {
                        const doc = await editorStore.reloadFromDisk(file);
                        yjsSync.resetContent(file, doc.raw);
                        presenceManager.broadcastRenderUpdate(file, doc.rendered);
                      } catch (err) {
                        console.error(`[editor] Failed to reload from disk: ${shortPath}`, err);
                      }
                    }
                    return [];
                  }

                  // Send full page reload to browser
                  server.ws.send({ type: 'full-reload' });

                  // Return empty array to prevent Vite's default HMR
                  return [];
                },
              };
              })(),
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

        // Live Documentation Editor
        addDevToolbarApp({
          id: 'doc-editor',
          name: 'Edit Page',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
          entrypoint: './src/dev-toolbar/editor-app.ts',
        });
      },
    },
  };
}

export default devToolbarIntegration;
