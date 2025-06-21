// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {themes} = require('prism-react-renderer');
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
        docs: false,
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],
  
  // plugins: [
  //   './src/plugins/auto-numbering-plugin.js',
  // ],
  
  markdown: {
    mermaid: true,
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/neuralabs-social-card.jpg',
// Update the navbar section in docusaurus.config.js:

navbar: {
  title: 'NeuraLabs',
  logo: {
    alt: 'NeuraLabs Logo',
    src: 'img/logo-light.svg',
    srcDark: 'img/logo-dark.svg',
  },
  items: [
    // Main navbar items (hidden on mobile by default)
    // Documentation and Blog temporarily disabled
    
    // Add secondary navbar items with position 'left' and className 'navbar__item--mobile'
    // These will only show in mobile menu
    {
      label: 'Home',
      to: '/',
      position: 'left',
      className: 'navbar__item--mobile-only'
    },
    {
      label: 'Overview',
      to: '/overview',
      position: 'left',
      className: 'navbar__item--mobile-only'
    },
    {
      label: 'Platform Documentation',
      type: 'dropdown',
      position: 'left',
      className: 'navbar__item--mobile-only',
      items: [
        { label: 'Platform', to: '/docs/platform' },
        { label: 'NeuraLock', to: '/docs/neuralock' },
        { label: 'Neura Execution Engine', to: '/docs/execution-engine' },
        { label: 'Neura Synthesis', to: '/docs/synthesis' },
        { label: 'Neura Ledger', to: '/docs/ledger' },
        { label: 'L1 Blockchain Integration', to: '/docs/blockchain-integration' },
        { label: 'Neura Synapsis (Coming Soon)', to: '#' },
      ],
    },
    {
      label: 'Developers Guide',
      to: '/developers',
      position: 'left',
      className: 'navbar__item--mobile-only'
    },
    {
      label: 'Blogs',
      to: '/blog',
      position: 'left',
      className: 'navbar__item--mobile-only'
    },
    {
      label: 'Roadmap & Release Notes',
      to: '/roadmap',
      position: 'left',
      className: 'navbar__item--mobile-only'
    },
    {
      label: 'GitHub',
      href: 'https://github.com/neuralabs/neuralabs-sui',
      position: 'right',
    },
  ],
},
      footer: {
        style: 'dark',
        links: [
          // Docs section temporarily disabled
          // {
          //   title: 'Docs',
          //   items: [
          //     {
          //       label: 'Introduction',
          //       to: '/docs/intro',
          //     },
          //     {
          //       label: 'Getting Started',
          //       to: '/docs/theoretical/getting-started',
          //     },
          //     {
          //       label: 'API Reference',
          //       to: '/docs/api',
          //     },
          //   ],
          // },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.gg/neuralabs',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/neuralabs',
              },
              {
                label: 'Forum',
                href: 'https://forum.neuralabs.org',
              },
            ],
          },
          {
            title: 'More',
            items: [
              // {
              //   label: 'Blog',
              //   to: '/blog',
              // },
              {
                label: 'GitHub',
                href: 'https://github.com/neuralabs/neuralabs-sui',
              },
              {
                label: 'Website',
                href: 'https://neuralabs.org',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} NeuraLabs. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['rust', 'bash', 'yaml', 'toml'],
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
    }),
};

module.exports = config;