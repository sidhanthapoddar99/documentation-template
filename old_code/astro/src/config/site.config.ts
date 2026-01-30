/**
 * Site Configuration
 *
 * This file controls all site structure, navigation, and component selection.
 * Edit this file to customize your documentation site without changing code.
 */

import type { SiteConfig } from './types';

export const siteConfig: SiteConfig = {
  // Site metadata
  site: {
    name: 'Docs',
    title: 'Documentation',
    description: 'Modern documentation framework built with Astro',
    logo: {
      src: '/logo.svg',
      alt: 'Documentation',
    },
  },

  // Global defaults - used when page doesn't specify
  defaults: {
    navbar: 'minimal',
    sidebar: 'default',
    footer: 'default',
    outline: 'default',
  },

  // Page definitions
  pages: {
    home: {
      type: 'home',
      title: 'Home',
      url: '/',
      description: 'Welcome to the documentation',
      sidebar: 'none',
      outline: 'none',
    },
    getting_started: {
      type: 'doc',
      title: 'Getting Started',
      url: '/docs/getting-started',
      data_location: '../docs/getting-started',
    },
    configuration: {
      type: 'doc',
      title: 'Configuration',
      url: '/docs/configuration',
      data_location: '../docs/configuration',
    },
    components: {
      type: 'doc',
      title: 'Components',
      url: '/docs/components',
      data_location: '../docs/components',
    },
    guides: {
      type: 'doc',
      title: 'Guides',
      url: '/docs/guides/installation',
      data_location: '../docs/guides',
    },
    authoring: {
      type: 'doc',
      title: 'Writing Docs',
      url: '/docs/authoring',
      data_location: '../docs/authoring',
    },
    github: {
      type: 'custom',
      title: 'GitHub',
      url: 'https://github.com',
      sidebar: 'none',
      outline: 'none',
    },
  },

  // Navbar structure - references page names from above
  // Supports direct links (string) and dropdown groups (object with group & pages)
  navbar: [
    'home',
    'getting_started',
    {
      group: 'Learn',
      pages: ['authoring', 'configuration', 'guides'],
    },
    'components',
    'github',
  ],

  // Footer configuration
  footer: {
    copyright: '2024 Documentation. All rights reserved.',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
};
