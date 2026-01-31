/**
 * Marked Renderer Configuration
 * Configures the marked markdown parser with extensions and options
 */

import { marked, type MarkedOptions, type TokenizerAndRendererExtension } from 'marked';

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

/**
 * Create a markdown renderer function
 */
export function createMarkdownRenderer(options: MarkdownRendererOptions = {}): (content: string) => string {
  const mergedOptions = { ...defaultOptions, ...options };

  // Configure marked options
  const markedOptions: MarkedOptions = {
    gfm: mergedOptions.gfm,
    breaks: mergedOptions.breaks,
    async: false,
  };

  // Add extensions if provided
  if (mergedOptions.extensions && mergedOptions.extensions.length > 0) {
    marked.use({ extensions: mergedOptions.extensions });
  }

  // Return the render function
  return (content: string): string => {
    return marked.parse(content, markedOptions) as string;
  };
}

/**
 * Create a configured marked instance
 * Useful when you need more control over the parsing process
 */
export function createMarkedInstance(options: MarkdownRendererOptions = {}): typeof marked {
  const mergedOptions = { ...defaultOptions, ...options };

  // Create a new marked instance with options
  const instance = new marked.Marked({
    gfm: mergedOptions.gfm,
    breaks: mergedOptions.breaks,
  });

  // Add extensions if provided
  if (mergedOptions.extensions && mergedOptions.extensions.length > 0) {
    instance.use({ extensions: mergedOptions.extensions });
  }

  return instance as unknown as typeof marked;
}

/**
 * Render markdown to HTML synchronously
 */
export function renderMarkdown(content: string, options?: MarkdownRendererOptions): string {
  const render = createMarkdownRenderer(options);
  return render(content);
}

/**
 * Default renderer instance
 */
export const defaultRenderer = createMarkdownRenderer();
