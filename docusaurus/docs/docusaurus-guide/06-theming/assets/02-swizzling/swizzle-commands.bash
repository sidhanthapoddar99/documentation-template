# List all components available for swizzling
npm run swizzle @docusaurus/theme-classic -- --list

# Swizzle a component (eject = full control)
npm run swizzle @docusaurus/theme-classic Navbar -- --eject

# Swizzle a component (wrap = extend functionality)
npm run swizzle @docusaurus/theme-classic Footer -- --wrap