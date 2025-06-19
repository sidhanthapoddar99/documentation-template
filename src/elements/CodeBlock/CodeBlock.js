import React, { useState } from 'react';
import CodeBlock from '@theme/CodeBlock';
import './CodeBlock.css';

export function CollapsibleCodeBlock({ 
  title, 
  description, 
  language = 'bash', 
  children,
  defaultCollapsed = true 
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className="collapsible-code-block">
      <div 
        className="code-block-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="code-block-info">
          <div className="code-block-meta">
            <img 
              src="/img/icons/code.svg" 
              width="16" 
              height="16" 
              className="code-block-icon"
              alt="Code"
            />
            <h4 className="code-block-title">{title}</h4>
            <span className="code-block-language">{language}</span>
          </div>
          {description && (
            <p className="code-block-description">{description}</p>
          )}
        </div>
        
        <div className={`code-block-toggle ${isCollapsed ? '' : 'expanded'}`}>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="code-block-content">
          <CodeBlock language={language} style={{ margin: 0, textAlign: 'left' }}>
            {children}
          </CodeBlock>
        </div>
      )}
    </div>
  );
}

export function InlineCodeCard({ title, description, language, code, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="collapsible-code-block">
      <div 
        className="code-block-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="code-block-info">
          <div className="code-block-meta">
            <img 
              src="/img/icons/code.svg" 
              width="16" 
              height="16" 
              className="code-block-icon"
              alt="Code"
            />
            <h4 className="code-block-title">{title}</h4>
            <span className="code-block-language">{language}</span>
          </div>
          {description && (
            <p className="code-block-description">{description}</p>
          )}
        </div>
        
        <div className={`code-block-toggle ${isExpanded ? 'expanded' : ''}`}>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </div>
      </div>
      
      {isExpanded && (
        <div className="code-block-content">
          <CodeBlock language={language} style={{ margin: 0, textAlign: 'left' }}>
            {code}
          </CodeBlock>
        </div>
      )}
    </div>
  );
}