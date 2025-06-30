// src/theme/MDXComponents/index.js
import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import Feature from '@site/src/components/Feature';
import CodeBlock from '@site/src/components/CodeBlock';

export default {
  ...MDXComponents,
  // Map components for use in MDX
  Feature,
  CodeBlock,
  // Override default elements
  h2: (props) => <h2 style={{color: 'red'}} {...props} />,
};