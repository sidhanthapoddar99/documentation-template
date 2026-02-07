// Markdown syntax highlighting — pure functions, zero state

/**
 * Highlight markdown syntax by wrapping tokens in colored spans.
 * Input must be plain text (will be HTML-escaped). Returns HTML string.
 */
export function highlightMarkdown(text: string): string {
  // HTML-escape the raw text first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Process line by line to handle block-level syntax
  const lines = html.split('\n');
  let inCodeBlock = false;
  let inFrontmatter = false;
  let frontmatterDashCount = 0;

  const result = lines.map((line, i) => {
    // Frontmatter detection (--- at start and end)
    if (i === 0 && line === '---') {
      inFrontmatter = true;
      frontmatterDashCount = 1;
      return `<span class="hl-frontmatter">${line}</span>`;
    }
    if (inFrontmatter) {
      if (line === '---') {
        frontmatterDashCount++;
        if (frontmatterDashCount >= 2) inFrontmatter = false;
      }
      return `<span class="hl-frontmatter">${line}</span>`;
    }

    // Fenced code blocks
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return `<span class="hl-codeblock">${line}</span>`;
    }
    if (inCodeBlock) {
      return `<span class="hl-codeblock">${line}</span>`;
    }

    // Headings: # ## ### etc.
    const headingMatch = line.match(/^(#{1,6}\s)/);
    if (headingMatch) {
      return `<span class="hl-heading">${line}</span>`;
    }

    // Blockquotes: > text
    if (line.match(/^\s*&gt;\s/)) {
      return `<span class="hl-blockquote">${line}</span>`;
    }

    // Horizontal rule: --- or *** or ___
    if (line.match(/^\s*[-*_](\s*[-*_]){2,}\s*$/)) {
      return `<span class="hl-hr">${line}</span>`;
    }

    // List items: - item, * item, 1. item
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s/);
    if (listMatch) {
      const prefix = line.substring(0, listMatch[0].length);
      const rest = line.substring(listMatch[0].length);
      return `<span class="hl-list-marker">${prefix}</span>${highlightInline(rest)}`;
    }

    // Regular line — apply inline highlighting
    return highlightInline(line);
  });

  return result.join('\n');
}

/**
 * Highlight inline markdown syntax: bold, italic, code, links, images
 */
function highlightInline(line: string): string {
  // Inline code: `code`
  line = line.replace(/(`[^`]+`)/g, '<span class="hl-code">$1</span>');

  // Bold: **text** or __text__
  line = line.replace(/(\*\*[^*]+\*\*|__[^_]+__)/g, '<span class="hl-bold">$1</span>');

  // Italic: *text* or _text_ (but not inside bold/code spans)
  line = line.replace(/(?<![*_])(\*[^*]+\*|_[^_]+_)(?![*_])/g, '<span class="hl-italic">$1</span>');

  // Images: ![alt](url)
  line = line.replace(/(!\[[^\]]*\]\([^)]*\))/g, '<span class="hl-image">$1</span>');

  // Links: [text](url)
  line = line.replace(/(?<!!)(\[[^\]]*\]\([^)]*\))/g, '<span class="hl-link">$1</span>');

  return line;
}
