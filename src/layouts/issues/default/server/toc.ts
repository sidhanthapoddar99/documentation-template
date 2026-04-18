/**
 * Extract headings from rendered markdown HTML and prefix their IDs so
 * multiple sub-docs coexisting in the same DOM (subtasks / notes /
 * agent-log panels) don't clash on ids like `#setup`.
 *
 * Returns the rewritten HTML plus a flat TOC list suitable for feeding the
 * right-sidebar TOC panel.
 */
export interface TocEntry {
  id: string;
  level: number;
  text: string;
}

export function extractAndPrefixToc(
  html: string,
  prefix: string,
): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const out = html.replace(
    /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_m, tag: string, attrs: string, text: string) => {
      const idMatch = /\bid="([^"]+)"/.exec(attrs);
      const rawId = idMatch ? idMatch[1] : '';
      if (!rawId) return `<h${tag}${attrs}>${text}</h${tag}>`;
      const newId = `${prefix}-${rawId}`;
      const newAttrs = attrs.replace(/\bid="[^"]+"/, `id="${newId}"`);
      const cleanText = text.replace(/<[^>]*>/g, '').trim();
      toc.push({ id: newId, level: parseInt(tag, 10), text: cleanText });
      return `<h${tag}${newAttrs}>${text}</h${tag}>`;
    },
  );
  return { html: out, toc };
}
