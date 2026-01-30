/**
 * Config Loader - Loads and validates YAML configuration files
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { paths, getConfigPath } from './paths';

// ============================================
// Type Definitions
// ============================================

export interface SiteMetadata {
  name: string;
  title: string;
  description: string;
  logo?: {
    src: string;
    alt: string;
  };
}

export type PageType = 'docs' | 'blog' | 'custom';

export interface PageConfig {
  base_url: string;
  type: PageType;
  layout: string;
  data: string;
}

export interface SiteConfig {
  site: SiteMetadata;
  pages: Record<string, PageConfig>;
}

export interface NavItem {
  label: string;
  href?: string;
  page?: string;
  children?: NavItem[];
  external?: boolean;
  icon?: string;
}

export interface NavbarConfig {
  layout: string;
  items: NavItem[];
}

export interface FooterLink {
  label: string;
  href?: string;
  page?: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: string;
  href: string;
}

export interface FooterConfig {
  layout: string;
  copyright: string;
  columns?: FooterColumn[];
  social?: SocialLink[];
}

// ============================================
// Loader Functions
// ============================================

/**
 * Load a YAML file and parse it
 */
function loadYaml<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Config file not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return yaml.load(content) as T;
  } catch (error) {
    console.error(`Error loading config file ${filePath}:`, error);
    return null;
  }
}

/**
 * Load site configuration
 */
export function loadSiteConfig(): SiteConfig {
  const config = loadYaml<SiteConfig>(getConfigPath('site.yaml'));

  if (!config) {
    // Return default config if file not found
    return {
      site: {
        name: 'Documentation',
        title: 'Documentation Site',
        description: 'Modern documentation built with Astro',
      },
      pages: {},
    };
  }

  return config;
}

/**
 * Load navbar configuration
 */
export function loadNavbarConfig(): NavbarConfig {
  const config = loadYaml<NavbarConfig>(getConfigPath('navbar.yaml'));

  if (!config) {
    // Return default config
    return {
      layout: '@navbar/style1',
      items: [],
    };
  }

  return config;
}

/**
 * Load footer configuration
 */
export function loadFooterConfig(): FooterConfig {
  const config = loadYaml<FooterConfig>(getConfigPath('footer.yaml'));

  if (!config) {
    // Return default config
    return {
      layout: '@footer/default',
      copyright: '© {year} All rights reserved.',
      columns: [],
      social: [],
    };
  }

  return config;
}

/**
 * Get all page configurations
 */
export function getPages(): Record<string, PageConfig> {
  const config = loadSiteConfig();
  return config.pages || {};
}

/**
 * Get a specific page configuration by name
 */
export function getPage(pageName: string): PageConfig | undefined {
  const pages = getPages();
  return pages[pageName];
}

/**
 * Resolve page reference in navbar/footer links
 * Converts page name to actual URL
 */
export function resolvePageUrl(pageName: string): string {
  const page = getPage(pageName);
  if (!page) {
    console.warn(`Page not found: ${pageName}`);
    return '#';
  }
  return page.base_url;
}

/**
 * Process copyright string with dynamic year
 */
export function processCopyright(copyright: string): string {
  const year = new Date().getFullYear().toString();
  return copyright.replace('{year}', year);
}

/**
 * Validate route configuration (no overlapping routes except /)
 */
export function validateRoutes(pages: Record<string, PageConfig>): string[] {
  const errors: string[] = [];
  const routes = Object.entries(pages).map(([name, config]) => ({
    name,
    url: config.base_url,
  }));

  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const routeA = routes[i];
      const routeB = routes[j];

      // Skip root route check
      if (routeA.url === '/' || routeB.url === '/') {
        continue;
      }

      // Check for overlapping routes
      if (
        routeA.url.startsWith(routeB.url + '/') ||
        routeB.url.startsWith(routeA.url + '/')
      ) {
        errors.push(
          `Overlapping routes: "${routeA.name}" (${routeA.url}) and "${routeB.name}" (${routeB.url})`
        );
      }
    }
  }

  return errors;
}

export default {
  loadSiteConfig,
  loadNavbarConfig,
  loadFooterConfig,
  getPages,
  getPage,
  resolvePageUrl,
  processCopyright,
  validateRoutes,
};
