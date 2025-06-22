// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.vsLight;
const darkCodeTheme = themes.vsDark;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'NeuraLabs Documentation',
  tagline: 'Decentralized AI Workflow Platform on SUI',
  favicon: 'img/logo-light.svg',

  // Set the production url of your site here
  url: 'https://docs.neuralabs.org',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'neuralabs',
  projectName: 'neuralabs-sui',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: false, // Disable default docs plugin as we're using custom instances
        // blog: {
        //   showReadingTime: true,
        //   editUrl: 'https://github.com/neuralabs/neuralabs-documentation/tree/main/',
        // },
        blog: false, // Disable blog for now
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],

  plugins: [
    // Overview docs
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'overview',
        path: 'docs/overview',
        routeBasePath: 'overview',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    // Platform Overview
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'platform-overview',
        path: 'docs/platform/platform-overview',
        routeBasePath: 'platform-overview',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    // NeuraLock
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'neuralock',
        path: 'docs/platform/neuralock',
        routeBasePath: 'neuralock',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    // Execution Engine
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'execution-engine',
        path: 'docs/platform/execution-engine',
        routeBasePath: 'execution-engine',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    // Synthesis
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'synthesis',
        path: 'docs/platform/synthesis',
        routeBasePath: 'synthesis',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    // Ledger
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'ledger',
        path: 'docs/platform/ledger',
        routeBasePath: 'ledger',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    // Blockchain Integration
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'blockchain-integration',
        path: 'docs/platform/blockchain-integration',
        routeBasePath: 'blockchain-integration',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    // Synapsis
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'synapsis',
        path: 'docs/platform/synapsis',
        routeBasePath: 'synapsis',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    // Component Usage docs
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'component-usage',
        path: 'docs/component-usage',
        routeBasePath: 'component-usage',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    // Developers docs
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'developers',
        path: 'docs/developers',
        routeBasePath: 'developers',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
    // Roadmap docs
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'roadmap',
        path: 'docs/roadmap',
        routeBasePath: 'roadmap',
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],
  ],

  markdown: {
    mermaid: true,
    mdx1Compat: {
      comments: true,
      admonitions: true,
      headingIds: true,
    },
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/neuralabs-social-card.jpg',

      // Update the navbar section in docusaurus.config.js:
      navbar:
      {
        title: 'NeuraLabs',
        logo: {
          alt: 'NeuraLabs Logo',
          src: 'img/logo-light.svg',
          srcDark: 'img/logo-dark.svg',
        },
        items: [
          // Navigation items - these will be in the second row on desktop
          {
            label: 'Welcome',
            to: '/',
            position: 'left',
            className: 'navbar__item--nav',
            activeBaseRegex: '^/$'
          },
          {
            label: 'Component Usage',
            to: '/component-usage',
            position: 'left',
            className: 'navbar__item--nav'
          },
          {
            label: 'Overview',
            to: '/overview',
            position: 'left',
            className: 'navbar__item--nav'
          },
          {
            label: 'Platform Documentation',
            type: 'dropdown',
            position: 'left',
            className: 'navbar__item--nav',
            items: [
              { label: 'Platform', to: '/platform-overview' },
              { label: 'NeuraLock', to: '/neuralock' },
              { label: 'Neura Execution Engine', to: '/execution-engine' },
              { label: 'Neura Synthesis', to: '/synthesis' },
              { label: 'Neura Ledger', to: '/ledger' },
              { label: 'L1 Blockchain Integration', to: '/blockchain-integration' },
              { label: 'Neura Synapsis (Coming Soon)', to: '/synapsis' },
            ],
          },
          {
            label: 'Developers Guide',
            to: '/developers',
            position: 'left',
            className: 'navbar__item--nav'
          },
          {
            label: 'Blogs',
            to: '/blog',
            position: 'left',
            className: 'navbar__item--nav'
          },
          {
            label: 'Roadmap & Release Notes',
            to: '/roadmap',
            position: 'left',
            className: 'navbar__item--nav'
          },
          {
            label: 'GitHub',
            href: 'https://github.com/neuralabs/neuralabs-sui',
            position: 'right',
            className: 'navbar__item--nav'
          },
        ],
      },


      // footer: false, // Disable default footer - we're using a custom one

      prism: 
      {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['rust', 'bash', 'yaml', 'toml'],
      },


      colorMode: 
      {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
    }),
};

module.exports = config;