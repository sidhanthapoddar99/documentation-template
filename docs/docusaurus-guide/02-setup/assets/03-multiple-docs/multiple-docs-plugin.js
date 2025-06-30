// docusaurus.config.js - Multiple docs configuration
module.exports = {
  // ... other config
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'api', // Unique ID for this docs section
        path: 'docs/api', // Folder containing docs
        routeBasePath: 'api', // URL path for this docs section
        sidebarPath: require.resolve('./sidebarsApi.js'), // Dedicated sidebar
        editUrl: 'https://github.com/myorg/myrepo/tree/main/',
        showLastUpdateTime: true,
        showLastUpdateAuthor: true,
        customProps: {
          // Custom properties accessible in components
          section: 'API Documentation',
        },
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'guides',
        path: 'docs/guides',
        routeBasePath: 'guides',
        sidebarPath: require.resolve('./sidebarsGuides.js'),
        editUrl: 'https://github.com/myorg/myrepo/tree/main/',
        showLastUpdateTime: true,
      },
    ],
  ],
};