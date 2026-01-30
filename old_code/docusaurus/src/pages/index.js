import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import { Hero, HomeFeatures, Stats } from '@site/src/components/homepage';
import { Footer } from '@site/src/components/Footer';
import './index.css';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <Layout
      title={`${siteConfig.title} - Modern Development Platform`}
      description="A comprehensive platform for modern development teams - build, deploy, and scale your applications with confidence"
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