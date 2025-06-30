// Plugins (if not included in preset)
plugins: [
  '@docusaurus/plugin-ideal-image',
  [
    '@docusaurus/plugin-pwa',
    {
      debug: true,
      offlineModeActivationStrategies: [
        'appInstalled',
        'standalone',
        'queryString',
      ],
    },
  ],
],

// Custom fields (accessible in components)
customFields: {
  myCustomField: 'value',
},