// docusaurus.config.js - Navbar for multiple docs
module.exports = {
  // ... other config
  themeConfig: {
    navbar: {
      title: 'My Project',
      items: [
        // Main documentation
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Docs',
        },
        // API documentation
        {
          type: 'doc',
          docId: 'api/introduction',
          docsPluginId: 'api', // References the plugin ID
          position: 'left',
          label: 'API',
        },
        // Guides documentation
        {
          type: 'doc',
          docId: 'guides/getting-started',
          docsPluginId: 'guides',
          position: 'left',
          label: 'Guides',
        },
        // Dropdown for organized access
        {
          type: 'dropdown',
          label: 'Documentation',
          position: 'left',
          items: [
            {
              type: 'doc',
              docId: 'intro',
              label: 'Main Docs',
            },
            {
              type: 'doc',
              docId: 'api/introduction',
              docsPluginId: 'api',
              label: 'API Reference',
            },
            {
              type: 'doc',
              docId: 'guides/getting-started',
              docsPluginId: 'guides',
              label: 'User Guides',
            },
          ],
        },
      ],
    },
  },
};