/**
 * Type definitions for YAML configuration files
 */

// ==================================
// Site Configuration Types
// ==================================

export interface LogoConfig {
  src: string;
  alt: string;
  href?: string;
}

export interface SiteConfig {
  name: string;
  title: string;
  description: string;
  logo?: LogoConfig;
  defaults: DefaultComponents;
  theme: string;
}

export interface DefaultComponents {
  navbar: NavbarVariant;
  sidebar: SidebarVariant;
  footer: FooterVariant;
  outline: OutlineVariant;
}

// Component variants
export type NavbarVariant = 'minimal' | 'style1' | 'style2' | 'style3';
export type SidebarVariant = 'default' | 'none';
export type FooterVariant = 'default' | 'none';
export type OutlineVariant = 'default' | 'none';

// ==================================
// Pages Configuration Types
// ==================================

export type PageType = 'home' | 'doc' | 'blog' | 'custom';

export interface PageConfig {
  type: PageType;
  title: string;
  url: string;
  description?: string;

  // For doc/blog types - path to content folder (relative to DATA_DIR)
  content_dir?: string;

  // For home/custom types - .astro component in DATA_DIR/pages/
  component?: string;

  // External link flag
  external?: boolean;

  // Per-page component overrides (optional - uses defaults if not set)
  navbar?: NavbarVariant;
  sidebar?: SidebarVariant;
  footer?: FooterVariant;
  outline?: OutlineVariant;
}

export interface PagesConfig {
  pages: Record<string, PageConfig>;
}

// ==================================
// Navbar Configuration Types
// ==================================

export interface NavbarItemBase {
  page?: string;
  label?: string;
  href?: string;
  external?: boolean;
  icon?: string;
}

export interface NavbarGroup {
  group: string;
  items: NavbarItem[];
}

export type NavbarItem = NavbarItemBase | NavbarGroup;

export interface NavbarConfig {
  items: NavbarItem[];
}

// Resolved navbar item for components
export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  icon?: string;
  children?: NavItem[];
}

// ==================================
// Footer Configuration Types
// ==================================

export interface FooterLink {
  label: string;
  page?: string;
  href?: string;
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
  style: FooterVariant;
  copyright: string;
  columns?: FooterColumn[];
  social?: SocialLink[];
}

// ==================================
// Theme Configuration Types
// ==================================

export interface ColorOverrides {
  brand?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  light?: {
    background?: Record<string, string>;
    text?: Record<string, string>;
    border?: Record<string, string>;
  };
  dark?: {
    background?: Record<string, string>;
    text?: Record<string, string>;
    border?: Record<string, string>;
  };
}

export interface ThemeConfig {
  preset: string;
  overrides?: ColorOverrides;
}

// ==================================
// Resolved Page Config (with defaults applied)
// ==================================

export interface ResolvedPageConfig extends PageConfig {
  resolvedNavbar: NavbarVariant;
  resolvedSidebar: SidebarVariant;
  resolvedFooter: FooterVariant;
  resolvedOutline: OutlineVariant;
}
