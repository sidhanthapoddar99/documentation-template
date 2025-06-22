// Plugin to handle code imports with @code tag
module.exports = function codeImportPlugin() {
  return {
    name: 'code-import-plugin',
    configureWebpack() {
      return {
        module: {
          rules: [
            {
              test: /\.(js|jsx|ts|tsx|py|rs|md|mdx|json|yaml|yml|css|scss|html|xml|sh|bash|move|sol|go|java|cpp|c|txt)$/,
              use: 'raw-loader',
              // Only apply to files imported with @code prefix
              resourceQuery: /code/,
            },
          ],
        },
      };
    },
  };
};