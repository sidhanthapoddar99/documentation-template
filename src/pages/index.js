import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { Hero, HomeFeatures, Stats } from '@site/src/components/HomePage';
import './index.css';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <Layout
      title={`${siteConfig.title} - Decentralized AI Workflow Platform`}
      description="Build, deploy, and monetize autonomous AI agents on the decentralized SUI blockchain">
      <Hero />
      <main>
        <HomeFeatures />
        <Stats />
      </main>
    </Layout>
  );
}