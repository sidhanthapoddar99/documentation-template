// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'url';
import path from 'path';
import { devToolbarIntegration } from './src/dev-toolbar/integration.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
// Server mode in dev (enables layout switcher), static in production (fast CDN builds)
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  output: isDev ? 'server' : 'static',
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
