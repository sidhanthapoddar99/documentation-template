import React from 'react';
import Layout from '@theme/Layout';
import './BaseLayout.css';

/**
 * BaseLayout - Wrapper around Docusaurus Layout with our customizations
 * All other layouts should extend this one
 */
export default function BaseLayout({ 
  children, 
  title, 
  description,
  keywords,
  image,
  noFooter = false,
  wrapperClassName = '',
  ...props 
}) {
  return (
    <Layout
      title={title}
      description={description}
      keywords={keywords}
      image={image}
      noFooter={noFooter}
      wrapperClassName={`base-layout ${wrapperClassName}`}
      {...props}
    >
      <div className="base-layout-content">
        {children}
      </div>
    </Layout>
  );
}