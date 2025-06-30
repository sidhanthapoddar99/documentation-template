// src/pages/showcase.js
import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Showcase() {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <Layout
      title="Showcase"
      description="Projects built with our framework">
      <main>
        <h1>Project Showcase</h1>
        {/* Your custom content */}
      </main>
    </Layout>
  );
}