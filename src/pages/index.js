import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { Hero, HomeFeatures, Stats } from '@site/src/components/homepage';
import './index.css';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <Layout
      title={`${siteConfig.title} - Decentralized AI Workflow Platform`}
      description="Build, deploy, and monetize autonomous AI agents on the decentralized SUI blockchain"
      wrapperClassName="home-page">
      <div className="home-page-wrapper">
        <Hero />
        <main>
          <HomeFeatures />
          <Stats />
        </main>
      </div>
    </Layout>
  );
}