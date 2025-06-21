import React from 'react';
import { Features, Feature } from '@site/src/components/elements/Features';
import './HomeFeatures.css';

const FeatureList = [
  {
    icon: '/img/icons/ai-workflow.svg',
    title: 'Autonomous AI Agents',
    description: 'Create AI agents that can discover capabilities, negotiate costs, and compose workflows autonomously. Build the future of self-organizing AI systems without centralized control.'
  },
  {
    icon: '/img/icons/blockchain.svg',
    title: 'Blockchain-Native Infrastructure',
    description: 'Built on SUI blockchain with NFT-based access control, zkLogin authentication, and Walrus decentralized storage. Your AI agents are truly owned by you, not controlled by corporations.'
  },
  {
    icon: '/img/icons/security.svg',
    title: 'Privacy-Preserving Cryptography',
    description: 'Advanced cryptographic primitives including SUI Seal for threshold encryption, zero-knowledge proofs for private computation, and VRF for verifiable randomness. Secure by design.'
  },
  {
    icon: '/img/icons/network.svg',
    title: 'Decentralized Execution Network',
    description: 'Distributed HPC execution nodes with support for multiple AI providers (Anthropic, DeepSeek, AWS Bedrock). Scale your workflows globally with automatic load balancing and cost optimization.'
  },
  {
    icon: '/img/icons/settings.svg',
    title: 'Creator Economy',
    description: 'Monetize your AI workflows and sub-agents through automatic micropayments. When other agents use your capabilities, you get paid instantly and fairly according to your pricing.'
  },
  {
    icon: '/img/icons/code.svg',
    title: 'Developer-First Platform',
    description: 'Comprehensive SDKs, APIs, and visual workflow builder. From drag-and-drop interfaces to custom code execution - build however you want with full blockchain integration.'
  }
];

export default function HomeFeatures() {
  return (
    <section className="home-features-section">
      <div className="container">
        <div className="home-features-header">
          <h2 className="home-features-title">Why Choose NeuraLabs?</h2>
          <p className="home-features-subtitle">
            The first truly decentralized platform for autonomous AI agents
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