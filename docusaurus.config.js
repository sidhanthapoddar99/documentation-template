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
      navbar: {
        title: 'NeuraLabs',
        logo: {
          alt: 'NeuraLabs Logo',
          src: 'img/logo-light.svg',
          srcDark: 'img/logo-dark.svg',
        },
        items: [
          // Documentation and Blog temporarily disabled
          // {
          //   type: 'docSidebar',
          //   sidebarId: 'docsSidebar',
          //   position: 'left',
          //   label: 'Documentation',
          // },
          // {
          //   to: '/blog', 
          //   label: 'Blog', 
          //   position: 'left'
          // },
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