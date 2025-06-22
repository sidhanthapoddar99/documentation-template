import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { Hero, HomeFeatures, Stats } from '@site/src/components/homepage';
import { Footer } from '@site/src/components/elements';
import './index.css';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <Layout
      title={`${siteConfig.title} - Decentralized AI Workflow Platform`}
      description="Build, deploy, and monetize autonomous AI agents on the decentralized SUI blockchain"
      wrapperClassName="home-page"
      noFooter={true}> {/* Disable default footer */}
      <div className="home-page-wrapper">
        <Hero />
        <main>
          <HomeFeatures />
          <Stats />
        </main>
        <Footer />
      </div>
    </Layout>
  );
}