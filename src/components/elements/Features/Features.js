import React from 'react';
import clsx from 'clsx';
import './Features.css';

export function Features({ children, className }) {
  return (
    <div className={clsx('features', className)}>
      {children}
    </div>
  );
}

export function Feature({ icon, title, description }) {
  // Support both emoji strings and image paths
  const isImagePath = typeof icon === 'string' && icon.startsWith('/');
  
  return (
    <div className="feature-card">
      <div className="feature-header">
        <div className="feature-icon">
          {isImagePath ? (
            <img src={icon} alt="" width="32" height="32" />
          ) : (
            <span className="feature-icon-emoji">{icon}</span>
          )}
        </div>
        <h3 className="feature-title">{title}</h3>
      </div>
      <p className="feature-description">{description}</p>
    </div>
  );
}