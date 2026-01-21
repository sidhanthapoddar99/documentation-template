// src/plugins/my-plugin.js
module.exports = function (context, options) {
  return {
    name: 'my-custom-plugin',
    
    // Add custom webpack config
    configureWebpack(config, isServer, utils) {
      return {
        module: {
          rules: [
            // Custom rules
          ],
        },
      };
    },
    
    // Modify the generated HTML
    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: 'script',
            attributes: {
              src: 'https://example.com/script.js',
              async: true,
            },
          },
        ],
      };
    },
    
    // Add custom routes
    async contentLoaded({content, actions}) {
      const {createData, addRoute} = actions;
      
      // Create data that can be imported
      const jsonPath = await createData(
        'my-data.json',
        JSON.stringify({foo: 'bar'})
      );
      
      // Add a route
      addRoute({
        path: '/my-page',
        component: '@site/src/components/MyPage',
        modules: {
          data: jsonPath,
        },
      });
    },
  };
};