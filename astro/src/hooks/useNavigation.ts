/**
 * Navigation Hook - Page Registry and Navigation State
 *
 * Provides:
 * - Page registry with tags (doc/blog/home/roadmap)
 * - Ordered navigation items
 * - Active state detection
 * - Nested navigation support
 */

export type PageTag = 'home' | 'doc' | 'blog' | 'roadmap' | 'external';

export interface NavItem {
  label: string;
  href: string;
  tag: PageTag;
  order: number;
  children?: NavItem[];
  external?: boolean;
  icon?: string;
}

export interface NavSection {
  label: string;
  tag: PageTag;
  items: NavItem[];
}

/**
 * Page registry - define all navigable pages
 * This can be imported and modified in your config
 */
export const defaultPageRegistry: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    tag: 'home',
    order: 0,
  },
  {
    label: 'Documentation',
    href: '/docs',
    tag: 'doc',
    order: 1,
    children: [
      {
        label: 'Configuration',
        href: '/docs/configuration',
        tag: 'doc',
        order: 0,
        children: [
          { label: 'Overview', href: '/docs/configuration', tag: 'doc', order: 0 },
          { label: 'Themes', href: '/docs/configuration/themes', tag: 'doc', order: 1 },
          { label: 'Layouts', href: '/docs/configuration/layouts', tag: 'doc', order: 2 },
          { label: 'Navbar', href: '/docs/configuration/navbar', tag: 'doc', order: 3 },
          { label: 'MDX Components', href: '/docs/configuration/mdx-components', tag: 'doc', order: 4 },
          { label: 'Modules', href: '/docs/configuration/modules', tag: 'doc', order: 5 },
          { label: 'Backend', href: '/docs/configuration/backend', tag: 'doc', order: 6 },
          { label: 'Pages', href: '/docs/configuration/pages', tag: 'doc', order: 7 },
        ],
      },
      {
        label: 'Components',
        href: '/docs/components',
        tag: 'doc',
        order: 1,
        children: [
          { label: 'Overview', href: '/docs/components', tag: 'doc', order: 0 },
          { label: 'Cards', href: '/docs/components/cards', tag: 'doc', order: 1 },
          { label: 'Callouts', href: '/docs/components/callouts', tag: 'doc', order: 2 },
          { label: 'Code Blocks', href: '/docs/components/code-blocks', tag: 'doc', order: 3 },
          { label: 'Tabs', href: '/docs/components/tabs', tag: 'doc', order: 4 },
          { label: 'Navbar', href: '/docs/components/navbar', tag: 'doc', order: 5 },
          { label: 'Footer', href: '/docs/components/footer', tag: 'doc', order: 6 },
          { label: 'Sidebar', href: '/docs/components/sidebar', tag: 'doc', order: 7 },
        ],
      },
    ],
  },
  {
    label: 'Blog',
    href: '/blog',
    tag: 'blog',
    order: 2,
  },
  {
    label: 'Roadmap',
    href: '/roadmap',
    tag: 'roadmap',
    order: 3,
  },
  {
    label: 'GitHub',
    href: 'https://github.com',
    tag: 'external',
    order: 99,
    external: true,
  },
];

/**
 * Get sorted navigation items
 */
export function getSortedNavItems(items: NavItem[] = defaultPageRegistry): NavItem[] {
  return [...items].sort((a, b) => a.order - b.order);
}

/**
 * Get items by tag
 */
export function getItemsByTag(tag: PageTag, items: NavItem[] = defaultPageRegistry): NavItem[] {
  return items.filter(item => item.tag === tag);
}

/**
 * Check if a path is active (exact or starts with)
 */
export function isActivePath(currentPath: string, itemPath: string, exact: boolean = false): boolean {
  if (exact) {
    return currentPath === itemPath;
  }
  // For home, require exact match
  if (itemPath === '/') {
    return currentPath === '/';
  }
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
}

/**
 * Get breadcrumb trail for a path
 */
export function getBreadcrumbs(
  currentPath: string,
  items: NavItem[] = defaultPageRegistry
): NavItem[] {
  const breadcrumbs: NavItem[] = [];

  function findPath(navItems: NavItem[], path: string[]): boolean {
    for (const item of navItems) {
      if (currentPath === item.href || currentPath.startsWith(item.href + '/')) {
        breadcrumbs.push(item);
        if (item.children) {
          findPath(item.children, path);
        }
        return true;
      }
    }
    return false;
  }

  findPath(items, currentPath.split('/').filter(Boolean));
  return breadcrumbs;
}

/**
 * Flatten navigation tree to a single list
 */
export function flattenNavItems(items: NavItem[]): NavItem[] {
  const result: NavItem[] = [];

  function flatten(navItems: NavItem[]) {
    for (const item of navItems) {
      result.push(item);
      if (item.children) {
        flatten(item.children);
      }
    }
  }

  flatten(items);
  return result;
}

/**
 * Get previous and next navigation items
 */
export function getPrevNextItems(
  currentPath: string,
  items: NavItem[] = defaultPageRegistry
): { prev: NavItem | null; next: NavItem | null } {
  const flatItems = flattenNavItems(items).filter(item => !item.external && !item.children?.length);
  const currentIndex = flatItems.findIndex(item => item.href === currentPath);

  return {
    prev: currentIndex > 0 ? flatItems[currentIndex - 1] : null,
    next: currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null,
  };
}

/**
 * Group items by tag for navbar sections
 */
export function groupByTag(items: NavItem[] = defaultPageRegistry): NavSection[] {
  const groups = new Map<PageTag, NavItem[]>();

  for (const item of items) {
    const existing = groups.get(item.tag) || [];
    existing.push(item);
    groups.set(item.tag, existing);
  }

  const sections: NavSection[] = [];
  const tagLabels: Record<PageTag, string> = {
    home: 'Home',
    doc: 'Documentation',
    blog: 'Blog',
    roadmap: 'Roadmap',
    external: 'External',
  };

  for (const [tag, tagItems] of groups) {
    sections.push({
      label: tagLabels[tag],
      tag,
      items: getSortedNavItems(tagItems),
    });
  }

  return sections;
}
