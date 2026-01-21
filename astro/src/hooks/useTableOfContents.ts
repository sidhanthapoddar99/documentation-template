/**
 * Table of Contents Hook - TOC Extraction from Headings
 *
 * Provides:
 * - Heading extraction from content
 * - Active heading tracking
 * - Scroll-to-heading functionality
 */

export interface TOCItem {
  id: string;
  text: string;
  level: number;
  children?: TOCItem[];
}

/**
 * Extract headings from rendered HTML content
 * Call this client-side after content is rendered
 */
export function extractHeadings(
  container: HTMLElement,
  levels: number[] = [2, 3]
): TOCItem[] {
  const selector = levels.map(l => `h${l}`).join(', ');
  const headings = container.querySelectorAll(selector);
  const items: TOCItem[] = [];

  headings.forEach((heading) => {
    const id = heading.id || generateHeadingId(heading.textContent || '');
    const level = parseInt(heading.tagName[1], 10);

    // Ensure heading has an ID
    if (!heading.id) {
      heading.id = id;
    }

    items.push({
      id,
      text: heading.textContent || '',
      level,
    });
  });

  return items;
}

/**
 * Build nested TOC structure
 */
export function buildNestedTOC(items: TOCItem[]): TOCItem[] {
  const result: TOCItem[] = [];
  const stack: TOCItem[] = [];

  for (const item of items) {
    const newItem: TOCItem = { ...item, children: [] };

    // Find parent
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(newItem);
    } else {
      const parent = stack[stack.length - 1];
      if (!parent.children) parent.children = [];
      parent.children.push(newItem);
    }

    stack.push(newItem);
  }

  return result;
}

/**
 * Generate a heading ID from text
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Scroll to a heading by ID
 */
export function scrollToHeading(id: string, offset: number = 80): void {
  const element = document.getElementById(id);
  if (!element) return;

  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });

  // Update URL hash without triggering scroll
  history.pushState(null, '', `#${id}`);
}

/**
 * Get the currently active heading based on scroll position
 */
export function getActiveHeading(
  headingIds: string[],
  offset: number = 100
): string | null {
  if (typeof window === 'undefined') return null;

  const scrollY = window.scrollY;

  for (let i = headingIds.length - 1; i >= 0; i--) {
    const element = document.getElementById(headingIds[i]);
    if (element && element.offsetTop - offset <= scrollY) {
      return headingIds[i];
    }
  }

  return headingIds[0] || null;
}

/**
 * Create intersection observer for heading tracking
 */
export function createHeadingObserver(
  headingIds: string[],
  onActiveChange: (activeId: string | null) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined') return null;

  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '-80px 0px -80% 0px',
    threshold: 0,
    ...options,
  };

  const visibleHeadings = new Set<string>();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const id = entry.target.id;
      if (entry.isIntersecting) {
        visibleHeadings.add(id);
      } else {
        visibleHeadings.delete(id);
      }
    });

    // Find the topmost visible heading
    for (const id of headingIds) {
      if (visibleHeadings.has(id)) {
        onActiveChange(id);
        return;
      }
    }

    onActiveChange(null);
  }, defaultOptions);

  // Observe all headings
  headingIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      observer.observe(element);
    }
  });

  return observer;
}

/**
 * Client-side TOC initialization script
 */
export const tocInitScript = `
(function() {
  // Handle hash on page load
  if (window.location.hash) {
    const id = window.location.hash.slice(1);
    const element = document.getElementById(id);
    if (element) {
      setTimeout(() => {
        const top = element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }, 100);
    }
  }
})();
`;
