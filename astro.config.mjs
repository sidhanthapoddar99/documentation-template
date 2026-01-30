// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'url';
import path from 'path';
import { remarkAssets } from './src/plugins/remark-assets.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  integrations: [
    mdx({
      remarkPlugins: [remarkAssets],
    }),
  ],
  markdown: {
    remarkPlugins: [remarkAssets],
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
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@modules': path.resolve(__dirname, './src/modules'),
        '@mdx': path.resolve(__dirname, './src/mdx_components'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },
  },
});
