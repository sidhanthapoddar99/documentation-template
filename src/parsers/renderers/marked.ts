/**
 * Marked Renderer Configuration
 * Configures the marked markdown parser with extensions and options
 * Includes syntax highlighting via shiki
 */

import { Marked, type TokenizerAndRendererExtension } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';

export interface MarkdownRendererOptions {
  /** Enable GitHub Flavored Markdown */
  gfm?: boolean;
  /** Enable line breaks */
  breaks?: boolean;
  /** Sanitize output (deprecated in marked, handled separately) */
  sanitize?: boolean;
  /** Custom extensions */
  extensions?: TokenizerAndRendererExtension[];
}

const defaultOptions: MarkdownRendererOptions = {
  gfm: true,
  breaks: false,
  sanitize: false,
};

const DIAGRAM_LANGS = new Set(['mermaid', 'dot', 'graphviz']);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Shared highlighter instance (lazy-initialized)
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: [
        'javascript', 'typescript', 'jsx', 'tsx',
        'html', 'css', 'scss', 'json', 'yaml',
        'python', 'bash', 'shell', 'sh',
        'rust', 'go', 'java', 'c', 'cpp',
        'sql', 'graphql', 'markdown',
        'ruby', 'php', 'swift', 'kotlin',
        'dockerfile', 'toml', 'xml',
      ],
    });
  }
  return highlighterPromise;
}

/**
 * Create an async markdown renderer with syntax highlighting
 */
export async function createMarkdownRendererAsync(
  options: MarkdownRendererOptions = {}
): Promise<(content: string) => string> {
  const mergedOptions = { ...defaultOptions, ...options };
  const highlighter = await getHighlighter();

  const instance = new Marked({
    gfm: mergedOptions.gfm,
    breaks: mergedOptions.breaks,
    renderer: {
      code({ text, lang }) {
        // Diagram code blocks — output raw containers for client-side rendering
        if (lang && DIAGRAM_LANGS.has(lang.toLowerCase())) {
          const type = lang.toLowerCase() === 'mermaid' ? 'mermaid' : 'graphviz';
          return `<div class="diagram diagram-${type}">${escapeHtml(text)}</div>`;
        }
        const language = lang && highlighter.getLoadedLanguages().includes(lang) ? lang : 'text';
        const html = highlighter.codeToHtml(text, {
          lang: language,
          themes: { light: 'github-light', dark: 'github-dark' },
        });
        // Add data-language for the code block label/copy button
        const displayLang = lang || 'text';
        return html.replace('<pre class="shiki', `<pre data-language="${displayLang}" class="shiki`);
      },
    },
  });

  if (mergedOptions.extensions && mergedOptions.extensions.length > 0) {
    instance.use({ extensions: mergedOptions.extensions });
  }

  return (content: string): string => {
    return instance.parse(content) as string;
  };
}

/**
 * Create a markdown renderer function (sync, no highlighting)
 */
export function createMarkdownRenderer(options: MarkdownRendererOptions = {}): (content: string) => string {
  const mergedOptions = { ...defaultOptions, ...options };

  const instance = new Marked({
    gfm: mergedOptions.gfm,
    breaks: mergedOptions.breaks,
  });

  if (mergedOptions.extensions && mergedOptions.extensions.length > 0) {
    instance.use({ extensions: mergedOptions.extensions });
  }

  return (content: string): string => {
    return instance.parse(content) as string;
  };
}

/**
 * Create a configured marked instance
 * Useful when you need more control over the parsing process
 */
export function createMarkedInstance(options: MarkdownRendererOptions = {}): Marked {
  const mergedOptions = { ...defaultOptions, ...options };

  const instance = new Marked({
    gfm: mergedOptions.gfm,
    breaks: mergedOptions.breaks,
  });

  if (mergedOptions.extensions && mergedOptions.extensions.length > 0) {
    instance.use({ extensions: mergedOptions.extensions });
  }

  return instance;
}

/**
 * Render markdown to HTML synchronously (no highlighting)
 */
export function renderMarkdown(content: string, options?: MarkdownRendererOptions): string {
  const render = createMarkdownRenderer(options);
  return render(content);
}

/**
 * Default renderer instance (sync, no highlighting)
 */
export const defaultRenderer = createMarkdownRenderer();
