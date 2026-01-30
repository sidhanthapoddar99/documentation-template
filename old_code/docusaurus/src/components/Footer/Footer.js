import React from 'react';
import Link from '@docusaurus/Link';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    community: [
      { label: 'Discord', href: 'https://discord.gg/yourserver' },
      { label: 'Twitter', href: 'https://twitter.com/yourhandle' },
      { label: 'Forum', href: 'https://forum.yoursite.com' },
    ],
    resources: [
      { label: 'GitHub', href: 'https://github.com/yourorg/yourproject' },
      { label: 'Website', href: 'https://yourwebsite.com' },
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
              <img src="/img/logo-light.svg" alt="Your Company" width="150" height="40" />
            </div>
            <p className="footer-description">
              Building modern solutions for today's development challenges with cutting-edge technology.
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
              © {currentYear} Your Company. All rights reserved.
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