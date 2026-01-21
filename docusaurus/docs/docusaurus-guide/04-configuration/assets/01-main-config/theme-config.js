// Theme Configuration (navbar, footer, etc.)
themeConfig: {
  // Navbar
  navbar: {
    title: 'My Site',
    logo: {
      alt: 'My Site Logo',
      src: 'img/logo.svg',
      srcDark: 'img/logo-dark.svg',  // Dark mode logo
    },
    items: [
      // Doc link
      {
        type: 'doc',
        docId: 'intro',
        position: 'left',
        label: 'Documentation',
      },
      // Blog link
      {
        to: '/blog',
        label: 'Blog',
        position: 'left'
      },
      // External link
      {
        href: 'https://github.com/myorg/myproject',
        label: 'GitHub',
        position: 'right',
      },
      // Dropdown
      {
        type: 'dropdown',
        label: 'Community',
        position: 'left',
        items: [
          {
            label: 'Discord',
            href: 'https://discord.gg/...',
          },
          {
            label: 'Twitter',
            href: 'https://twitter.com/...',
          },
        ],
      },
    ],
  },
  
  // Footer
  footer: {
    style: 'dark',
    links: [
      {
        title: 'Docs',
        items: [
          {
            label: 'Tutorial',
            to: '/docs/intro',
          },
        ],
      },
      {
        title: 'Community',
        items: [
          {
            label: 'Stack Overflow',
            href: 'https://stackoverflow.com/questions/tagged/...',
          },
        ],
      },
    ],
    copyright: `Copyright © ${new Date().getFullYear()} My Project.`,
  },
  
  // Code syntax highlighting
  prism: {
    theme: lightCodeTheme,
    darkTheme: darkCodeTheme,
    additionalLanguages: ['rust', 'ruby', 'php'],
  },
  
  // Announcement bar
  announcementBar: {
    id: 'support_us',
    content: 'We are looking for contributors!',
    backgroundColor: '#fafbfc',
    textColor: '#091E42',
    isCloseable: false,
  },
  
  // Color mode
  colorMode: {
    defaultMode: 'light',
    disableSwitch: false,
    respectPrefersColorScheme: true,
  },
},