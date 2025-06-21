import React from 'react';
import clsx from 'clsx';
import './Callout.css';

export function Callout({ children, type = 'info', title, className }) {
  return (
    <div className={clsx('callout', `callout-${type}`, className)}>
      {title && <div className="callout-title">{title}</div>}
      <div className="callout-content">
        {children}
      </div>
    </div>
  );
}