/**
 * Lazy-loaded language extensions for non-markdown files
 */

import type { LanguageSupport } from '@codemirror/language';

type LanguageLoader = () => Promise<LanguageSupport>;

const loaders: Record<string, LanguageLoader> = {
  '.js':   () => import('@codemirror/lang-javascript').then(m => m.javascript()),
  '.jsx':  () => import('@codemirror/lang-javascript').then(m => m.javascript({ jsx: true })),
  '.ts':   () => import('@codemirror/lang-javascript').then(m => m.javascript({ typescript: true })),
  '.tsx':  () => import('@codemirror/lang-javascript').then(m => m.javascript({ typescript: true, jsx: true })),
  '.json': () => import('@codemirror/lang-json').then(m => m.json()),
  '.css':  () => import('@codemirror/lang-css').then(m => m.css()),
  '.html': () => import('@codemirror/lang-html').then(m => m.html()),
  '.yaml': () => import('@codemirror/lang-yaml').then(m => m.yaml()),
  '.yml':  () => import('@codemirror/lang-yaml').then(m => m.yaml()),
};

const cache = new Map<string, LanguageSupport>();

export async function getLanguageForFile(filePath: string): Promise<LanguageSupport | null> {
  const ext = filePath.match(/\.[^.]+$/)?.[0]?.toLowerCase();
  if (!ext) return null;

  // Markdown is loaded eagerly in codemirror-setup.ts
  if (ext === '.md' || ext === '.mdx') return null;

  const cached = cache.get(ext);
  if (cached) return cached;

  const loader = loaders[ext];
  if (!loader) return null;

  const lang = await loader();
  cache.set(ext, lang);
  return lang;
}

export function getSupportedExtensions(): string[] {
  return ['.md', '.mdx', ...Object.keys(loaders)];
}
