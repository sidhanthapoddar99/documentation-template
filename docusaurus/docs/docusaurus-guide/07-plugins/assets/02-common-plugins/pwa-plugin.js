plugins: [
  // Progressive Web App
  [
    '@docusaurus/plugin-pwa',
    {
      debug: true,
      offlineModeActivationStrategies: ['appInstalled', 'queryString'],
      pwaHead: [
        {
          tagName: 'link',
          rel: 'manifest',
          href: '/manifest.json',
        },
      ],
    },
  ],
]