// Loaders - Data and configuration loading modules

// Path resolver
export {
  paths,
  resolvePath,
  getConfigPath,
  getDataPath,
  getThemePath,
  getLayoutPath,
} from './paths';

// Config loader
export {
  loadSiteConfig,
  loadNavbarConfig,
  loadFooterConfig,
  getPages,
  getPage,
  resolvePageUrl,
  processCopyright,
  validateRoutes,
  type SiteConfig,
  type SiteMetadata,
  type PageConfig,
  type PageType,
  type NavbarConfig,
  type NavItem,
  type FooterConfig,
  type FooterColumn,
  type FooterLink,
  type SocialLink,
} from './config';

// Data loader
export {
  loadContent,
  loadFile,
  loadSettings,
  loadContentWithSettings,
  DataLoaderError,
  type LoadedContent,
  type LoadOptions,
  type ContentSettings,
} from './data';

// Alias resolver
export {
  isAliasPath,
  extractPrefix,
  resolveAlias,
  resolveAliasPath,
  resolveLayoutPath,
  resolveDataPath,
  getLayoutType,
  getLayoutName,
  type AliasPrefix,
  type ResolvedAlias,
} from './alias';
