/**
 * Configuration exports
 *
 * This module now re-exports from the new YAML-based loaders.
 * The old site.config.ts is kept for reference but the YAML files
 * in config/ are the primary source of configuration.
 */

// Re-export everything from the new loaders
export {
  // Config loaders
  getSiteConfig,
  getPagesConfig,
  getNavbarConfig,
  getFooterConfig,
  getSiteMetadata,
  getDefaults,
  getPageConfig,
  getResolvedPageConfig,
  getPagesByType,
  getDocPages,
  getPageNameByUrl,
  getNavItems,
  getResolvedFooterConfig,
} from '../loaders';

// Re-export types
export type {
  SiteConfig,
  PagesConfig,
  PageConfig,
  NavbarConfig,
  FooterConfig,
  NavItem,
  NavbarVariant,
  SidebarVariant,
  FooterVariant,
  OutlineVariant,
  ResolvedPageConfig,
  LogoConfig,
  DefaultComponents,
  FooterColumn,
  SocialLink,
} from '../loaders';

// Legacy export for backward compatibility
export { siteConfig } from './site.config';
