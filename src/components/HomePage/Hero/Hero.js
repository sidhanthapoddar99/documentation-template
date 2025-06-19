import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import './Hero.css';

function Hero() {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <header className="hero-banner">
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">Democratizing AI Ownership</h1>
          <p className="hero-subtitle">
            Build, deploy, and monetize autonomous AI agents on the decentralized SUI blockchain. 
            Create workflows without centralized control.
          </p>
          <div className="hero-buttons">
            <Link
              className="button button--lg button--primary hero-btn-primary"
              to="/docs/intro">
              Documentation
            </Link>
            <Link
              className="button button--lg button--secondary hero-btn-secondary"
              to="/docs/theoretical/getting-started">
              Quick Start
            </Link>
          </div>
          <div className="hero-stats">
            <p className="hero-stats-text">
              Powered by SUI Blockchain • Zero-Knowledge Proofs • Decentralized Infrastructure
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Hero;