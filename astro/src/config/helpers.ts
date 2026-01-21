/**
 * Configuration helper functions
 */

import { siteConfig } from './site.config';
import type {
  NavItem,
  PageConfig,
  NavbarVariant,
  SidebarVariant,
  FooterVariant,
  OutlineVariant,
  NavbarGroup,
} from './types';

/**
 * Check if a navbar item is a group (dropdown)
 */
function isNavbarGroup(item: string | NavbarGroup): item is NavbarGroup {
  return typeof item === 'object' && 'group' in item;
}

/**
 * Convert navbar config to NavItem[] format for navbar components
 */
export function getNavItems(): NavItem[] {
  return siteConfig.navbar.map((item) => {
    if (isNavbarGroup(item)) {
      // It's a dropdown group
      const children = item.pages
        .map((pageName) => {
          const page = siteConfig.pages[pageName];
          if (!page) return null;
          return {
            label: page.title,
            href: page.url,
            external: page.url.startsWith('http'),
          };
        })
        .filter((child): child is NavItem => child !== null);

      // Use the first child's href as the group href
      const firstChild = children[0];
      return {
        label: item.group,
        href: firstChild?.href || '#',
        children,
      };
    } else {
      // It's a direct page link
      const page = siteConfig.pages[item];
      if (!page) {
        return {
          label: item,
          href: '#',
        };
      }
      return {
        label: page.title,
        href: page.url,
        external: page.url.startsWith('http'),
      };
    }
  });
}

/**
 * Get page config with defaults applied
 */
export function getPageConfig(pageName: string): PageConfig & {
  resolvedNavbar: NavbarVariant;
  resolvedSidebar: SidebarVariant;
  resolvedFooter: FooterVariant;
  resolvedOutline: OutlineVariant;
} {
  const page = siteConfig.pages[pageName];

  if (!page) {
    // Return defaults for unknown pages
    return {
      type: 'custom',
      title: 'Unknown',
      url: '/',
      resolvedNavbar: siteConfig.defaults.navbar,
      resolvedSidebar: siteConfig.defaults.sidebar,
      resolvedFooter: siteConfig.defaults.footer,
      resolvedOutline: siteConfig.defaults.outline,
    };
  }

  return {
    ...page,
    resolvedNavbar: page.navbar ?? siteConfig.defaults.navbar,
    resolvedSidebar: page.sidebar ?? siteConfig.defaults.sidebar,
    resolvedFooter: page.footer ?? siteConfig.defaults.footer,
    resolvedOutline: page.outline ?? siteConfig.defaults.outline,
  };
}

/**
 * Find page name by URL path
 */
export function getPageNameByUrl(url: string): string | null {
  // Normalize URL
  const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;

  for (const [pageName, page] of Object.entries(siteConfig.pages)) {
    const pageUrl = page.url.endsWith('/') ? page.url.slice(0, -1) : page.url;

    // Exact match
    if (pageUrl === normalizedUrl) {
      return pageName;
    }

    // For doc pages, check if URL starts with page URL
    if (page.type === 'doc' && normalizedUrl.startsWith(pageUrl + '/')) {
      return pageName;
    }
  }

  return null;
}

/**
 * Get all doc-type pages
 */
export function getDocPages(): Array<{ name: string } & PageConfig> {
  return Object.entries(siteConfig.pages)
    .filter(([_, config]) => config.type === 'doc' && config.data_location)
    .map(([name, config]) => ({ name, ...config }));
}

/**
 * Get site metadata
 */
export function getSiteMetadata() {
  return siteConfig.site;
}

/**
 * Get footer config
 */
export function getFooterConfig() {
  return siteConfig.footer;
}

/**
 * Get default components
 */
export function getDefaults() {
  return siteConfig.defaults;
}
