/**
 * Configuration exports
 */

// Types
export type {
  SiteConfig,
  PageConfig,
  PageType,
  NavbarVariant,
  SidebarVariant,
  FooterVariant,
  OutlineVariant,
  NavItem,
  NavbarItem,
  NavbarGroup,
  LogoConfig,
  SiteMetadata,
  DefaultComponents,
  FooterConfig,
  FooterLink,
} from './types';

// Config
export { siteConfig } from './site.config';

// Helpers
export {
  getNavItems,
  getPageConfig,
  getPageNameByUrl,
  getDocPages,
  getSiteMetadata,
  getFooterConfig,
  getDefaults,
} from './helpers';
