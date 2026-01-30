// @ts-check
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Load and parse a YAML file
 * @param {string} filename - The YAML file to load
 * @returns {any} Parsed YAML content
 */
function loadYaml(filename) {
  const filePath = path.join(__dirname, filename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return yaml.load(fileContents);
}

/**
 * Load app information configuration
 * @returns {import('@docusaurus/types').Config} App info config
 */
function loadAppInfo() {
  return loadYaml('app-info.yaml');
}

/**
 * Load and process plugins configuration
 * @returns {Array} Processed plugins array
 */
function loadPlugins() {
  const pluginsConfig = loadYaml('plugins.yaml');
  
  // Transform plugins into the format expected by Docusaurus
  const processedPlugins = pluginsConfig.plugins.map(plugin => [
    '@docusaurus/plugin-content-docs',
    {
      id: plugin.id,
      path: plugin.path,
      routeBasePath: plugin.routeBasePath,
      sidebarPath: require.resolve(path.join(__dirname, '..', plugin.sidebarPath)),
    },
  ]);

  return processedPlugins;
}

/**
 * Load navbar configuration
 * @returns {any} Navbar config
 */
function loadNavbar() {
  const navbarConfig = loadYaml('navbar.yaml');
  return navbarConfig.navbar;
}

module.exports = {
  loadAppInfo,
  loadPlugins,
  loadNavbar,
};