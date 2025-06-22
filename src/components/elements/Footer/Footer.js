import React from 'react';
import Link from '@docusaurus/Link';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    community: [
      { label: 'Discord', href: 'https://discord.gg/neuralabs' },
      { label: 'Twitter', href: 'https://twitter.com/neuralabs' },
      { label: 'Forum', href: 'https://forum.neuralabs.org' },
    ],
    resources: [
      { label: 'GitHub', href: 'https://github.com/neuralabs/neuralabs-sui' },
      { label: 'Website', href: 'https://neuralabs.org' },
      { label: 'Documentation', to: '/overview' },
    ],
    legal: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  };

  return (
    <footer className="custom-footer">
      <div className="footer-content">
        <div className="footer-grid">
          {/* Logo and Description */}
          <div className="footer-section footer-brand">
            <div className="footer-logo">
              <img src="/img/logo-light.svg" alt="NeuraLabs" width="150" height="40" />
            </div>
            <p className="footer-description">
              Democratizing AI ownership through decentralized workflows on the SUI blockchain.
            </p>
          </div>

          {/* Community Links */}
          <div className="footer-section">
            <h3 className="footer-section-title">Community</h3>
            <ul className="footer-links">
              {footerLinks.community.map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="footer-section">
            <h3 className="footer-section-title">Resources</h3>
            <ul className="footer-links">
              {footerLinks.resources.map((link, idx) => (
                <li key={idx}>
                  {link.to ? (
                    <Link to={link.to}>{link.label}</Link>
                  ) : (
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="footer-section">
            <h3 className="footer-section-title">Legal</h3>
            <ul className="footer-links">
              {footerLinks.legal.map((link, idx) => (
                <li key={idx}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © {currentYear} NeuraLabs. All rights reserved.
            </p>
            <p className="footer-built-with">
              Built with <span className="footer-heart">❤️</span> using Docusaurus
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;