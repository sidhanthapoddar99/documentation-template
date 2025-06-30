module.exports = {
  // Site Metadata
  title: 'My Documentation',
  tagline: 'Documentation made easy',
  url: 'https://mysite.com',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  
  // Deployment
  organizationName: 'myorg',      // GitHub org/user name
  projectName: 'myproject',       // GitHub repo name
  deploymentBranch: 'gh-pages',   // Branch for GitHub Pages
  
  // Behavior
  onBrokenLinks: 'throw',         // What to do with broken links
  onBrokenMarkdownLinks: 'warn',  // What to do with broken MD links
  
  // Internationalization
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'es'],
  },
  
  // Presets (bundles of plugins/themes)
  presets: [
    [
      'classic',                  // Most common preset
      {
        // Docs plugin configuration
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/myorg/myproject/edit/main/',
          routeBasePath: 'docs',  // URL path for docs
          remarkPlugins: [],      // Markdown plugins
          rehypePlugins: [],      // HTML plugins
        },
        
        // Blog plugin configuration
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/myorg/myproject/edit/main/',
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
        },
        
        // Theme configuration
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};