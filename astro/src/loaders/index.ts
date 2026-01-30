/**
 * Loaders Module
 *
 * Central export for all configuration loaders.
 * Import from '@loaders' or '../loaders' in your Astro components.
 */

// Config loaders
export {
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
  resolvedConfigDir,
  resolvedDataDir,
} from './config';

// Theme loaders
export {
  getThemeConfig,
  getResolvedTheme,
  generateThemeCSS,
  getCustomCSSPath,
  getCustomCSS,
  presets as themePresets,
  resolvedStylesDir,
} from './theme';

// Page loaders
export {
  getUserPagesDir,
  userPageExists,
  getUserPagePath,
  getCustomPagesWithComponents,
  getPageProps,
  getDocsContentDir,
  getBlogContentDir,
  getAssetsDir,
} from './pages';

// Types
export type {
  SiteConfig,
  PagesConfig,
  PageConfig,
  NavbarConfig,
  FooterConfig,
  ThemeConfig,
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
} from './types';
