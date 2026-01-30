/**
 * YAML Configuration Loader
 *
 * Loads configuration from external YAML files in the CONFIG_DIR.
 * This allows users to modify configuration without touching the astro/ directory.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type {
  SiteConfig,
  PagesConfig,
  PageConfig,
  NavbarConfig,
  FooterConfig,
  NavItem,
  NavbarItem,
  NavbarGroup,
  ResolvedPageConfig,
} from './types';

// ==================================
// Directory Paths
// ==================================

// Get paths from environment or use defaults
const CONFIG_DIR = import.meta.env.CONFIG_DIR || '../config';
const DATA_DIR = import.meta.env.DATA_DIR || '../data';

// Resolve paths relative to the astro directory
const astroDir = path.dirname(new URL(import.meta.url).pathname);
const resolvedConfigDir = path.resolve(astroDir, '..', '..', CONFIG_DIR);
const resolvedDataDir = path.resolve(astroDir, '..', '..', DATA_DIR);

// ==================================
// YAML Loading
// ==================================

/**
 * Load and parse a YAML file
 */
function loadYaml<T>(filename: string, directory: string = resolvedConfigDir): T {
  const filePath = path.join(directory, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Configuration file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return yaml.load(content) as T;
}

// ==================================
// Configuration Instances
// ==================================

// Cache loaded configs
let _siteConfig: SiteConfig | null = null;
let _pagesConfig: PagesConfig | null = null;
let _navbarConfig: NavbarConfig | null = null;
let _footerConfig: FooterConfig | null = null;

/**
 * Get site configuration
 */
export function getSiteConfig(): SiteConfig {
  if (!_siteConfig) {
    _siteConfig = loadYaml<SiteConfig>('site.yaml');
  }
  return _siteConfig;
}

/**
 * Get pages configuration
 */
export function getPagesConfig(): PagesConfig {
  if (!_pagesConfig) {
    _pagesConfig = loadYaml<PagesConfig>('pages.yaml');
  }
  return _pagesConfig;
}

/**
 * Get navbar configuration
 */
export function getNavbarConfig(): NavbarConfig {
  if (!_navbarConfig) {
    _navbarConfig = loadYaml<NavbarConfig>('navbar.yaml');
  }
  return _navbarConfig;
}

/**
 * Get footer configuration
 */
export function getFooterConfig(): FooterConfig {
  if (!_footerConfig) {
    _footerConfig = loadYaml<FooterConfig>('footer.yaml');
  }
  return _footerConfig;
}

// ==================================
// Helper Functions
// ==================================

/**
 * Get site metadata (name, title, description, logo)
 */
export function getSiteMetadata() {
  const config = getSiteConfig();
  return {
    name: config.name,
    title: config.title,
    description: config.description,
    logo: config.logo,
  };
}

/**
 * Get default component variants
 */
export function getDefaults() {
  return getSiteConfig().defaults;
}

/**
 * Get a specific page configuration by name
 */
export function getPageConfig(pageName: string): PageConfig | undefined {
  const pagesConfig = getPagesConfig();
  return pagesConfig.pages[pageName];
}

/**
 * Get resolved page configuration with defaults applied
 */
export function getResolvedPageConfig(pageName: string): ResolvedPageConfig | undefined {
  const pageConfig = getPageConfig(pageName);
  if (!pageConfig) return undefined;

  const defaults = getDefaults();

  return {
    ...pageConfig,
    resolvedNavbar: pageConfig.navbar || defaults.navbar,
    resolvedSidebar: pageConfig.sidebar || defaults.sidebar,
    resolvedFooter: pageConfig.footer || defaults.footer,
    resolvedOutline: pageConfig.outline || defaults.outline,
  };
}

/**
 * Get all pages of a specific type
 */
export function getPagesByType(type: PageConfig['type']): Record<string, PageConfig> {
  const pagesConfig = getPagesConfig();
  const filtered: Record<string, PageConfig> = {};

  for (const [name, page] of Object.entries(pagesConfig.pages)) {
    if (page.type === type) {
      filtered[name] = page;
    }
  }

  return filtered;
}

/**
 * Get all doc-type pages
 */
export function getDocPages() {
  return getPagesByType('doc');
}

/**
 * Find page name by URL
 */
export function getPageNameByUrl(url: string): string | undefined {
  const pagesConfig = getPagesConfig();
  const normalizedUrl = url.replace(/\/$/, '') || '/';

  for (const [name, page] of Object.entries(pagesConfig.pages)) {
    const pageUrl = page.url.replace(/\/$/, '') || '/';

    // Exact match
    if (pageUrl === normalizedUrl) {
      return name;
    }

    // Prefix match for doc/blog pages
    if ((page.type === 'doc' || page.type === 'blog') && normalizedUrl.startsWith(pageUrl + '/')) {
      return name;
    }
  }

  return undefined;
}

/**
 * Check if a URL is external
 */
function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Check if an item is a navbar group
 */
function isNavbarGroup(item: NavbarItem): item is NavbarGroup {
  return 'group' in item && 'items' in item;
}

/**
 * Transform navbar config into NavItem array for components
 */
export function getNavItems(): NavItem[] {
  const navbarConfig = getNavbarConfig();
  const pagesConfig = getPagesConfig();

  function resolveNavItem(item: NavbarItem): NavItem | null {
    if (isNavbarGroup(item)) {
      // It's a dropdown group
      const children = item.items
        .map(child => resolveNavItem(child))
        .filter((child): child is NavItem => child !== null);

      return {
        label: item.group,
        href: '#',
        children,
      };
    }

    // It's a single item
    if (item.page) {
      const pageConfig = pagesConfig.pages[item.page];
      if (!pageConfig) {
        console.warn(`Navbar: page "${item.page}" not found in pages.yaml`);
        return null;
      }

      return {
        label: item.label || pageConfig.title,
        href: pageConfig.url,
        external: pageConfig.external || isExternalUrl(pageConfig.url),
        icon: item.icon,
      };
    }

    if (item.href) {
      return {
        label: item.label || item.href,
        href: item.href,
        external: item.external || isExternalUrl(item.href),
        icon: item.icon,
      };
    }

    return null;
  }

  return navbarConfig.items
    .map(item => resolveNavItem(item))
    .filter((item): item is NavItem => item !== null);
}

/**
 * Get resolved footer configuration with page references resolved
 */
export function getResolvedFooterConfig() {
  const footerConfig = getFooterConfig();
  const pagesConfig = getPagesConfig();

  // Resolve page references in columns
  const resolvedColumns = footerConfig.columns?.map(column => ({
    title: column.title,
    links: column.links.map(link => {
      if (link.page) {
        const pageConfig = pagesConfig.pages[link.page];
        if (pageConfig) {
          return {
            label: link.label,
            href: pageConfig.url,
          };
        }
      }
      return {
        label: link.label,
        href: link.href || '#',
      };
    }),
  }));

  // Process copyright with year placeholder
  const copyright = footerConfig.copyright.replace('{year}', new Date().getFullYear().toString());

  return {
    style: footerConfig.style,
    copyright,
    columns: resolvedColumns,
    social: footerConfig.social,
  };
}

// ==================================
// Exports
// ==================================

export { resolvedConfigDir, resolvedDataDir };
export type { SiteConfig, PagesConfig, PageConfig, NavbarConfig, FooterConfig, NavItem };
