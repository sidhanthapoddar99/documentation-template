// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { loadEnv } from 'vite';
import yaml from 'js-yaml';
import { devToolbarIntegration } from './src/dev-toolbar/integration.ts';
import { initPaths } from './src/loaders/paths.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const { PORT, HOST, CONFIG_DIR } = env;

// Load site config for server.allowedHosts and paths initialization

function loadSiteConfigForServer() {
  const configDir = CONFIG_DIR || './dynamic_data/config';
  const siteConfigPath = path.resolve(process.cwd(), configDir, 'site.yaml');
  try {
    if (fs.existsSync(siteConfigPath)) {
      const content = fs.readFileSync(siteConfigPath, 'utf-8');
      return yaml.load(content);
    }
  } catch (error) {
    console.warn('Could not load site.yaml for server config:', error.message);
  }
  return null;
}

const siteConfig = loadSiteConfigForServer();

// Initialize path system from site.yaml's paths: section (or env var defaults)
initPaths(siteConfig ? { paths: siteConfig.paths } : undefined);

// https://astro.build/config
// Server mode in dev (enables layout switcher), static in production (fast CDN builds)
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  output: isDev ? 'server' : 'static',
  server: {
    port: PORT ? parseInt(PORT, 10) : 4321,
    host: HOST === 'true' || HOST === '1',
    allowedHosts: siteConfig?.server?.allowedHosts ?? true,
  },
  integrations: [
    mdx(),
    devToolbarIntegration(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
  vite: {
    server: {
      // allowedHosts can be: array of hostnames, true (allow all), or undefined
      allowedHosts: siteConfig?.server?.allowedHosts ?? true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@layouts': path.resolve(__dirname, './src/layouts'),
        '@loaders': path.resolve(__dirname, './src/loaders'),
        '@parsers': path.resolve(__dirname, './src/parsers'),
        '@custom-tags': path.resolve(__dirname, './src/custom-tags'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@modules': path.resolve(__dirname, './src/modules'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },
  },
});
