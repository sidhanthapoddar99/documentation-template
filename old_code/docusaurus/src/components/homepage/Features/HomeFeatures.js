import React from 'react';
import { Features, Feature } from '@site/src/components/elements/Features';
import './HomeFeatures.css';

const FeatureList = [
  {
    icon: '/img/icons/ai-workflow.svg',
    title: 'Modern Architecture',
    description: 'Built with cutting-edge technologies and industry best practices. Create scalable applications with robust architecture patterns and clean code principles.'
  },
  {
    icon: '/img/icons/blockchain.svg',
    title: 'Cloud-Native Infrastructure',
    description: 'Deploy anywhere with containerized applications, microservices architecture, and cloud-native deployment strategies. Scale horizontally with confidence.'
  },
  {
    icon: '/img/icons/security.svg',
    title: 'Security First',
    description: 'Enterprise-grade security with advanced authentication, authorization, and data protection. Built-in security scanning and vulnerability management.'
  },
  {
    icon: '/img/icons/network.svg',
    title: 'Global Distribution',
    description: 'Deploy your applications globally with CDN integration, edge computing support, and automatic failover. Ensure low latency for users worldwide.'
  },
  {
    icon: '/img/icons/settings.svg',
    title: 'Easy Integration',
    description: 'Seamlessly integrate with existing systems through comprehensive APIs, webhooks, and SDK support. Connect with popular tools and services.'
  },
  {
    icon: '/img/icons/code.svg',
    title: 'Developer Experience',
    description: 'Comprehensive documentation, CLI tools, and development environments. From local development to production deployment - streamlined workflow.'
  }
];

export default function HomeFeatures() {
  return (
    <section className="home-features-section">
      <div className="container">
        <div className="home-features-header">
          <h2 className="home-features-title">Why Choose Our Platform?</h2>
          <p className="home-features-subtitle">
            A comprehensive solution designed for modern development teams
          </p>
        </div>
        <Features className="home-features-grid">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </Features>
      </div>
    </section>
  );
}