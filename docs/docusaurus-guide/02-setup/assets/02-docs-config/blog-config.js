// Blog configuration in docusaurus.config.js
module.exports = {
  // ... other config
  plugins: [
    [
      '@docusaurus/plugin-content-blog',
      {
        showReadingTime: true,
        editUrl: 'https://github.com/neuralabs/neuralabs-documentation/tree/main/',
        blogSidebarTitle: 'All posts',
        blogSidebarCount: 'ALL',
        routeBasePath: 'blog', // Blog URL path
        path: './blog', // Blog content directory
        feedOptions: {
          type: 'all',
          title: 'My Blog',
          description: 'My blog description',
          copyright: `Copyright © ${new Date().getFullYear()} My Company.`,
        },
      },
    ],
  ],
};