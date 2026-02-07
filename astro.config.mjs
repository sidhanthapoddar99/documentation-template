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

// CONFIG_DIR is required — it bootstraps the entire config system
if (!CONFIG_DIR) {
  throw new Error(
    '[config] CONFIG_DIR is not set in .env. This variable is required to locate site.yaml.\n' +
    '  Add to your .env file: CONFIG_DIR=./dynamic_data/config\n' +
    '  (relative to project root, or use an absolute path)'
  );
}

const resolvedConfigDir = path.resolve(process.cwd(), CONFIG_DIR);

if (!fs.existsSync(resolvedConfigDir)) {
  throw new Error(
    `[config] Config directory not found: ${resolvedConfigDir}\n` +
    `  CONFIG_DIR="${CONFIG_DIR}" (from .env) resolved to this path.\n` +
    `  Ensure the directory exists and contains site.yaml.`
  );
}

// Load site.yaml — required for paths and page definitions
const siteConfigPath = path.join(resolvedConfigDir, 'site.yaml');
if (!fs.existsSync(siteConfigPath)) {
  throw new Error(
    `[config] site.yaml not found at: ${siteConfigPath}\n` +
    `  CONFIG_DIR="${CONFIG_DIR}" (from .env) points to this directory.\n` +
    `  Ensure site.yaml exists in the config directory.`
  );
}

let siteConfig;
try {
  const content = fs.readFileSync(siteConfigPath, 'utf-8');
  siteConfig = yaml.load(content);
} catch (error) {
  throw new Error(
    `[config] Failed to parse site.yaml at: ${siteConfigPath}\n` +
    `  ${error.message}`
  );
}

// Initialize path system — pass resolvedConfigDir to fix timing gap where
// CONFIG_DIR from .env isn't available when paths.ts module first loads
initPaths({ paths: siteConfig?.paths, configDir: resolvedConfigDir });

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
