import React from 'react';
import './Stats.css';

const StatsList = [
  {
    icon: '/img/icons/ai-workflow.svg',
    title: 'Autonomous Agents',
    description: 'Self-organizing AI network'
  },
  {
    icon: '/img/icons/security.svg',
    title: 'Zero-Knowledge',
    description: 'Privacy-preserving by design'
  },
  {
    icon: '/img/icons/network.svg',
    title: 'Global Network',
    description: 'Decentralized execution'
  },
  {
    icon: '/img/icons/terminal.svg',
    title: 'Real-time',
    description: 'Streaming AI responses'
  }
];

function Stat({ icon, title, description }) {
  return (
    <div className="stat-item">
      <div className="stat-icon">
        <img src={icon} alt={title} />
      </div>
      <h4 className="stat-title">{title}</h4>
      <p className="stat-description">{description}</p>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {StatsList.map((props, idx) => (
            <Stat key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}