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
          <h1 className="hero-title">Your Product Title</h1>
          <p className="hero-subtitle">
            A comprehensive platform for modern development. 
            Build, deploy, and scale your applications with confidence.
          </p>
          <div className="hero-buttons">
            <a
              className="button button--lg button--primary hero-btn-primary"
              href="https://github.com/yourorg/yourproject"
              target="_blank"
              rel="noopener noreferrer">
              View on GitHub
            </a>
            <a
              className="button button--lg  hero-btn-secondary"
              href="https://yourwebsite.com"
              target="_blank"
              rel="noopener noreferrer">
              Visit Website
            </a>
          </div>
          <div className="hero-stats">
            <p className="hero-stats-text">
              Modern Architecture • Scalable Infrastructure • Developer-Friendly
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Hero;