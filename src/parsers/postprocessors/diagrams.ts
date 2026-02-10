/**
 * Diagrams Postprocessor
 * Transforms mermaid/dot/graphviz code blocks into diagram containers
 * that the client-side script can pick up and render lazily.
 */

import type { Processor, ProcessContext } from '../types';

/**
 * Decode HTML entities back to raw text for diagram renderers
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Create diagrams postprocessor
 */
export function createDiagramsPostprocessor(): Processor {
  return {
    name: 'diagrams',
    process(content: string, _context: ProcessContext): string {
      return content.replace(
        /<pre><code class="language-(mermaid|dot|graphviz)">([\s\S]*?)<\/code><\/pre>/gi,
        (_match, lang, encoded) => {
          const type = lang.toLowerCase() === 'mermaid' ? 'mermaid' : 'graphviz';
          const decoded = decodeHtmlEntities(encoded);
          return `<div class="diagram diagram-${type}">${decoded}</div>`;
        }
      );
    },
  };
}

// Default instance
export const diagramsPostprocessor = createDiagramsPostprocessor();
