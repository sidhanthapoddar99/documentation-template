import React from 'react';
import './Stats.css';

const StatsList = [
  {
    icon: '/img/icons/ai-workflow.svg',
    title: 'High Performance',
    description: 'Optimized for speed'
  },
  {
    icon: '/img/icons/security.svg',
    title: 'Secure',
    description: 'Enterprise-grade security'
  },
  {
    icon: '/img/icons/network.svg',
    title: 'Scalable',
    description: 'Global infrastructure'
  },
  {
    icon: '/img/icons/terminal.svg',
    title: 'Developer Ready',
    description: 'Modern tooling'
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