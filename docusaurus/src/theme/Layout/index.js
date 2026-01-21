import React from 'react';
import OriginalLayout from '@theme-original/Layout';

export default function Layout(props) {
  // Check if we're on a doc page by looking for the docs-no-footer class
  const isDocPage = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('docs-no-footer');
  
  // If it's a doc page or noFooter is explicitly set, disable the footer
  const noFooter = props.noFooter || isDocPage;
  
  return <OriginalLayout {...props} noFooter={noFooter} />;
}