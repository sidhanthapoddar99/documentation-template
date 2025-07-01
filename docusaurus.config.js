// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.vsLight;
const darkCodeTheme = themes.vsDark;

// Load configuration from YAML files
const { loadAppInfo, loadPlugins, loadNavbar } = require('./config/process-config');
const appInfo = loadAppInfo();
const plugins = loadPlugins();
const navbar = loadNavbar();

/** @type {import('@docusaurus/types').Config} */
const config = {
  ...appInfo,

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
    // Documentation plugins loaded from YAML configuration
    ...plugins,
    // Webpack configuration for WASM
    function (context, options) {
      return {
        name: 'webpack-config-plugin',
        configureWebpack(config, isServer, utils) {
          return {
            module: {
              rules: [
                {
                  test: /\.wasm$/,
                  type: 'webassembly/async',
                },
              ],
            },
            experiments: {
              asyncWebAssembly: true,
            },
            resolve: {
              fallback: {
                fs: false,
                path: false,
              },
            },
          };
        },
      };
    },
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

      // Navbar loaded from YAML configuration
      navbar,


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

      mermaid: {
        theme: {light: 'neutral', dark: 'neutral'},
        options: {
          maxTextSize: 100000,
          maxEdges: 1000,
          htmlLabels: true,
          curve: 'basis',
          securityLevel: 'loose',
          startOnLoad: true,
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            rankSpacing: 80,
            nodeSpacing: 40,
            padding: 15,
            curve: 'basis',
          },
        },
      },
    }),
};

module.exports = config;