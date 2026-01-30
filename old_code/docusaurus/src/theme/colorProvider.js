const { colors } = require('./colors');

/**
 * Converts the nested color object into CSS variables
 * @param {Object} colorObj - The color object to convert
 * @param {string} prefix - The prefix for CSS variable names
 * @returns {string} CSS variables as a string
 */
function generateCSSVariables(colorObj, prefix = 'color') {
  let cssVars = '';
  
  function processColors(obj, currentPrefix) {
    Object.entries(obj).forEach(([key, value]) => {
      const varName = `--${currentPrefix}-${key}`;
      
      if (typeof value === 'string') {
        cssVars += `  ${varName}: ${value};\n`;
      } else if (typeof value === 'object' && value !== null) {
        processColors(value, `${currentPrefix}-${key}`);
      }
    });
  }
  
  processColors(colorObj, prefix);
  return cssVars;
}

/**
 * Generates theme-specific CSS variables for light and dark modes
 * @returns {string} Complete CSS with theme variables
 */
function generateThemeCSS() {
  const lightThemeVars = generateCSSVariables(colors, 'color');
  
  // Generate semantic theme variables for light mode
  const lightSemanticVars = `
  /* Semantic theme variables - Light Mode */
  --theme-bg-primary: var(--color-background-primary-light);
  --theme-bg-secondary: var(--color-background-secondary-light);
  --theme-bg-surface: var(--color-background-surface-light);
  --theme-bg-elevated: var(--color-background-elevated-light);
  
  --theme-text-primary: var(--color-text-primary-light);
  --theme-text-secondary: var(--color-text-secondary-light);
  --theme-text-muted: var(--color-text-muted-light);
  --theme-text-heading: var(--color-text-heading-light);
  
  --theme-border-default: var(--color-border-default-light);
  --theme-border-subtle: var(--color-border-subtle-light);
  --theme-border-strong: var(--color-border-strong-light);
  
  --theme-card-bg: var(--color-components-card-background-light);
  --theme-card-border: var(--color-components-card-border-light);
  --theme-card-hover: var(--color-components-card-hover-light);
  
  --theme-button-secondary-bg: var(--color-components-button-secondary-background-light);
  --theme-button-secondary-text: var(--color-components-button-secondary-text-light);
  --theme-button-secondary-hover: var(--color-components-button-secondary-hover-light);
  
  --theme-code-bg: var(--color-components-code-background-light);
  --theme-code-text: var(--color-components-code-text-light);
  --theme-code-border: var(--color-components-code-border-light);
  
  --theme-callout-info-bg: var(--color-components-callout-info-background-light);
  --theme-callout-info-border: var(--color-components-callout-info-border-light);
  --theme-callout-info-text: var(--color-components-callout-info-text-light);
  
  --theme-callout-warning-bg: var(--color-components-callout-warning-background-light);
  --theme-callout-warning-border: var(--color-components-callout-warning-border-light);
  --theme-callout-warning-text: var(--color-components-callout-warning-text-light);
  
  --theme-callout-success-bg: var(--color-components-callout-success-background-light);
  --theme-callout-success-border: var(--color-components-callout-success-border-light);
  --theme-callout-success-text: var(--color-components-callout-success-text-light);
  
  --theme-callout-danger-bg: var(--color-components-callout-danger-background-light);
  --theme-callout-danger-border: var(--color-components-callout-danger-border-light);
  --theme-callout-danger-text: var(--color-components-callout-danger-text-light);
  
  --theme-icon-filter: var(--color-iconFilter-light);
  
  /* Prose/content typography theme variables */
  --theme-prose-body: var(--color-prose-body-light);
  --theme-prose-headings: var(--color-prose-headings-light);
  --theme-prose-lead: var(--color-prose-lead-light);
  --theme-prose-links: var(--color-prose-links-light);
  --theme-prose-bold: var(--color-prose-bold-light);
  --theme-prose-counters: var(--color-prose-counters-light);
  --theme-prose-bullets: var(--color-prose-bullets-light);
  --theme-prose-hr: var(--color-prose-hr-light);
  --theme-prose-quotes: var(--color-prose-quotes-light);
  --theme-prose-quoteBorders: var(--color-prose-quoteBorders-light);
  --theme-prose-captions: var(--color-prose-captions-light);
  --theme-prose-kbd: var(--color-prose-kbd-light);
  --theme-prose-kbdShadows: var(--color-prose-kbdShadows-light);
  --theme-prose-code: var(--color-prose-code-light);
  --theme-prose-preCode: var(--color-prose-preCode-light);
  --theme-prose-preBg: var(--color-prose-preBg-light);
  --theme-prose-thBorders: var(--color-prose-thBorders-light);
  --theme-prose-tdBorders: var(--color-prose-tdBorders-light);
`;

  const darkSemanticVars = `
  /* Semantic theme variables - Dark Mode */
  --theme-bg-primary: var(--color-background-primary-dark);
  --theme-bg-secondary: var(--color-background-secondary-dark);
  --theme-bg-surface: var(--color-background-surface-dark);
  --theme-bg-elevated: var(--color-background-elevated-dark);
  
  --theme-text-primary: var(--color-text-primary-dark);
  --theme-text-secondary: var(--color-text-secondary-dark);
  --theme-text-muted: var(--color-text-muted-dark);
  --theme-text-heading: var(--color-text-heading-dark);
  
  --theme-border-default: var(--color-border-default-dark);
  --theme-border-subtle: var(--color-border-subtle-dark);
  --theme-border-strong: var(--color-border-strong-dark);
  
  --theme-card-bg: var(--color-components-card-background-dark);
  --theme-card-border: var(--color-components-card-border-dark);
  --theme-card-hover: var(--color-components-card-hover-dark);
  
  --theme-button-secondary-bg: var(--color-components-button-secondary-background-dark);
  --theme-button-secondary-text: var(--color-components-button-secondary-text-dark);
  --theme-button-secondary-hover: var(--color-components-button-secondary-hover-dark);
  
  --theme-code-bg: var(--color-components-code-background-dark);
  --theme-code-text: var(--color-components-code-text-dark);
  --theme-code-border: var(--color-components-code-border-dark);
  
  --theme-callout-info-bg: var(--color-components-callout-info-background-dark);
  --theme-callout-info-border: var(--color-components-callout-info-border-dark);
  --theme-callout-info-text: var(--color-components-callout-info-text-dark);
  
  --theme-callout-warning-bg: var(--color-components-callout-warning-background-dark);
  --theme-callout-warning-border: var(--color-components-callout-warning-border-dark);
  --theme-callout-warning-text: var(--color-components-callout-warning-text-dark);
  
  --theme-callout-success-bg: var(--color-components-callout-success-background-dark);
  --theme-callout-success-border: var(--color-components-callout-success-border-dark);
  --theme-callout-success-text: var(--color-components-callout-success-text-dark);
  
  --theme-callout-danger-bg: var(--color-components-callout-danger-background-dark);
  --theme-callout-danger-border: var(--color-components-callout-danger-border-dark);
  --theme-callout-danger-text: var(--color-components-callout-danger-text-dark);
  
  --theme-icon-filter: var(--color-iconFilter-dark);
  
  /* Prose/content typography theme variables */
  --theme-prose-body: var(--color-prose-body-dark);
  --theme-prose-headings: var(--color-prose-headings-dark);
  --theme-prose-lead: var(--color-prose-lead-dark);
  --theme-prose-links: var(--color-prose-links-dark);
  --theme-prose-bold: var(--color-prose-bold-dark);
  --theme-prose-counters: var(--color-prose-counters-dark);
  --theme-prose-bullets: var(--color-prose-bullets-dark);
  --theme-prose-hr: var(--color-prose-hr-dark);
  --theme-prose-quotes: var(--color-prose-quotes-dark);
  --theme-prose-quoteBorders: var(--color-prose-quoteBorders-dark);
  --theme-prose-captions: var(--color-prose-captions-dark);
  --theme-prose-kbd: var(--color-prose-kbd-dark);
  --theme-prose-kbdShadows: var(--color-prose-kbdShadows-dark);
  --theme-prose-code: var(--color-prose-code-dark);
  --theme-prose-preCode: var(--color-prose-preCode-dark);
  --theme-prose-preBg: var(--color-prose-preBg-dark);
  --theme-prose-thBorders: var(--color-prose-thBorders-dark);
  --theme-prose-tdBorders: var(--color-prose-tdBorders-dark);
`;

  return `
/* Auto-generated color variables from colors.js */
:root {
${lightThemeVars}
${lightSemanticVars}
}

[data-theme='dark'] {
${darkSemanticVars}
}
`;
}

/**
 * Gets a color value from the nested color object using dot notation
 * @param {string} path - The path to the color value (e.g., 'background.primary.light')
 * @returns {string} The color value
 */
function getColor(path) {
  const keys = path.split('.');
  let current = colors;
  
  for (const key of keys) {
    if (current[key] === undefined) {
      console.warn(`Color path "${path}" not found`);
      return '#000000';
    }
    current = current[key];
  }
  
  return current;
}

/**
 * Gets a CSS variable name for a color path
 * @param {string} path - The path to the color value (e.g., 'background.primary.light')
 * @returns {string} The CSS variable name (e.g., 'var(--color-background-primary-light)')
 */
function getColorVar(path) {
  const varName = path.replace(/\./g, '-');
  return `var(--color-${varName})`;
}

module.exports = {
  generateCSSVariables,
  generateThemeCSS,
  getColor,
  getColorVar
};