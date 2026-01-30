/**
 * Sidebar Hook - Build sidebar tree from content
 */

import type { LoadedContent } from '@loaders/data';

export interface SidebarItem {
  title: string;
  href: string;
  slug: string;
  position: number;
  children?: SidebarItem[];
}

export interface SidebarSection {
  title: string;
  href?: string;
  slug?: string;
  position: number;
  items: SidebarItem[];
}

/**
 * Build a sidebar tree from flat content array
 */
export function buildSidebarTree(
  content: LoadedContent[],
  basePath: string = '/docs'
): SidebarSection[] {
  const sections = new Map<string, SidebarSection>();

  for (const item of content) {
    const parts = item.slug.split('/');
    const position = item.data.sidebar_position ?? 999;

    if (parts.length === 1) {
      // Top-level item
      const existing = sections.get(item.slug);
      if (existing) {
        // Update existing section with link
        existing.href = `${basePath}/${item.slug}`;
        existing.position = Math.min(existing.position, position);
      } else {
        sections.set(item.slug, {
          title: item.data.sidebar_label || item.data.title,
          href: `${basePath}/${item.slug}`,
          slug: item.slug,
          position,
          items: [],
        });
      }
    } else {
      // Nested item
      const sectionSlug = parts[0];
      const section = sections.get(sectionSlug) || {
        title: formatTitle(sectionSlug),
        slug: sectionSlug,
        position: 999,
        items: [],
      };

      section.items.push({
        title: item.data.sidebar_label || item.data.title,
        href: `${basePath}/${item.slug}`,
        slug: item.slug,
        position,
      });

      sections.set(sectionSlug, section);
    }
  }

  // Sort sections and their items
  const result = Array.from(sections.values())
    .sort((a, b) => a.position - b.position)
    .map(section => ({
      ...section,
      items: section.items.sort((a, b) => a.position - b.position),
    }));

  return result;
}

/**
 * Format a slug into a readable title
 */
function formatTitle(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Find the current item in sidebar
 */
export function findCurrentItem(
  sections: SidebarSection[],
  currentPath: string
): SidebarItem | SidebarSection | null {
  for (const section of sections) {
    if (section.href === currentPath) {
      return section;
    }
    for (const item of section.items) {
      if (item.href === currentPath) {
        return item;
      }
    }
  }
  return null;
}

/**
 * Get previous and next items for pagination
 */
export function getPrevNext(
  sections: SidebarSection[],
  currentPath: string
): { prev: SidebarItem | null; next: SidebarItem | null } {
  const flatItems: SidebarItem[] = [];

  for (const section of sections) {
    if (section.href) {
      flatItems.push({
        title: section.title,
        href: section.href,
        slug: section.slug || '',
        position: section.position,
      });
    }
    flatItems.push(...section.items);
  }

  const currentIndex = flatItems.findIndex(item => item.href === currentPath);

  return {
    prev: currentIndex > 0 ? flatItems[currentIndex - 1] : null,
    next: currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null,
  };
}

export default {
  buildSidebarTree,
  findCurrentItem,
  getPrevNext,
};
