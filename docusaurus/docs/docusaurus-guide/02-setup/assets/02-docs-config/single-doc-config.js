// docusaurus.config.js
module.exports = {
  // ... other config
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: 'docs',
          editUrl: 'https://github.com/neuralabs/neuralabs-documentation/tree/main/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/neuralabs/neuralabs-documentation/tree/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
};