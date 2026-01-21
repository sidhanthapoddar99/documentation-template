/**
 * Configuration types for the documentation framework
 */

// Page types - determines layout behavior
export type PageType = 'home' | 'doc' | 'blog' | 'custom';

// Component variants
export type NavbarVariant = 'minimal' | 'style1' | 'style2' | 'style3';
export type SidebarVariant = 'default' | 'none';
export type FooterVariant = 'default' | 'none';
export type OutlineVariant = 'default' | 'none';

// Logo configuration
export interface LogoConfig {
  src: string;
  alt: string;
}

// Site metadata
export interface SiteMetadata {
  name: string;
  title: string;
  description: string;
  logo?: LogoConfig;
}

// Global default component variants
export interface DefaultComponents {
  navbar: NavbarVariant;
  sidebar: SidebarVariant;
  footer: FooterVariant;
  outline: OutlineVariant;
}

// Individual page configuration
export interface PageConfig {
  type: PageType;
  title: string;
  url: string;
  description?: string;

  // For doc/blog types - path to content folder
  data_location?: string;

  // Per-page component overrides (optional - uses defaults if not set)
  navbar?: NavbarVariant;
  sidebar?: SidebarVariant;
  outline?: OutlineVariant;
  footer?: FooterVariant;

  // Layout override for custom types
  layout?: string;
}

// Navbar group for dropdown menus
export interface NavbarGroup {
  group: string;
  pages: string[];
}

// Navbar item can be a page name string or a group
export type NavbarItem = string | NavbarGroup;

// Footer link
export interface FooterLink {
  href: string;
  label: string;
}

// Footer configuration
export interface FooterConfig {
  copyright?: string;
  links?: FooterLink[];
}

// Main site configuration
export interface SiteConfig {
  site: SiteMetadata;
  defaults: DefaultComponents;
  pages: Record<string, PageConfig>;
  navbar: NavbarItem[];
  footer: FooterConfig;
}

// NavItem format used by navbar components
export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  children?: NavItem[];
}
