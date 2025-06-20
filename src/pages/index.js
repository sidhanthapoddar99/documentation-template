import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { Hero, HomeFeatures, Stats } from '@site/src/components/homepage';
import { HomeLayout } from '@site/src/layouts';
import './index.css';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <HomeLayout
      title={`${siteConfig.title} - Decentralized AI Workflow Platform`}
      description="Build, deploy, and monetize autonomous AI agents on the decentralized SUI blockchain">
      <Hero />
      <main>
        <HomeFeatures />
        <Stats />
      </main>
    </HomeLayout>
  );
}