import React, { useState, useEffect } from 'react';
import CodeBlock from '@theme/CodeBlock';
import './CodeBlock.css';

// Language mapping based on file extensions
const extensionToLanguage = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  rs: 'rust',
  md: 'markdown',
  mdx: 'mdx',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  css: 'css',
  scss: 'scss',
  html: 'html',
  xml: 'xml',
  sh: 'bash',
  bash: 'bash',
  move: 'rust',
  sol: 'solidity',
  go: 'go',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  txt: 'text',
  // Add more as needed
};

function getLanguageFromPath(filePath) {
  const extension = filePath.split('.').pop().toLowerCase();
  return extensionToLanguage[extension] || 'text';
}

export function CollapsibleCodeBlock({ 
  title, 
  description, 
  language = 'bash', 
  children,
  filePath, // New prop for file path
  defaultCollapsed = true 
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (filePath && typeof window !== 'undefined' && window.fs) {
      setLoading(true);
      setError(null);
      
      window.fs.readFile(filePath, { encoding: 'utf8' })
        .then(content => {
          setFileContent(content);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error reading file:', err);
          setError(`Failed to load file: ${filePath}`);
          setLoading(false);
        });
    }
  }, [filePath]);

  // Determine the content to display
  const codeContent = filePath ? fileContent : children;
  // Auto-detect language from file path if not explicitly provided
  const displayLanguage = language || (filePath ? getLanguageFromPath(filePath) : 'bash');
  // Update title to include filename if using filePath
  const displayTitle = title || (filePath ? filePath.split('/').pop() : '');

  if (filePath && loading) {
    return (
      <div className="collapsible-code-block">
        <div className="code-block-header">
          <div className="code-block-info">
            <div className="code-block-meta">
              <img src="/img/icons/code.svg" width="16" height="16" className="code-block-icon" alt="Code" />
              <h4 className="code-block-title">{displayTitle}</h4>
              <span className="code-block-language">{displayLanguage}</span>
            </div>
            <p className="code-block-description">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (filePath && error) {
    return (
      <div className="collapsible-code-block">
        <div className="code-block-header">
          <div className="code-block-info">
            <div className="code-block-meta">
              <img src="/img/icons/code.svg" width="16" height="16" className="code-block-icon" alt="Code" />
              <h4 className="code-block-title">{displayTitle}</h4>
            </div>
            <p className="code-block-description" style={{ color: 'var(--color-status-danger)' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

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
            <h4 className="code-block-title">{displayTitle}</h4>
            <span className="code-block-language">{displayLanguage}</span>
          </div>
          {(description || filePath) && (
            <p className="code-block-description">
              {description || `Source: ${filePath}`}
            </p>
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
      
      {!isCollapsed && codeContent && (
        <div className="code-block-content">
          <CodeBlock language={displayLanguage} style={{ margin: 0, textAlign: 'left' }}>
            {codeContent}
          </CodeBlock>
        </div>
      )}
    </div>
  );
}

export function InlineCodeCard({ 
  title, 
  description, 
  language, 
  code,
  filePath, // New prop for file path
  defaultExpanded = false 
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (filePath && typeof window !== 'undefined' && window.fs) {
      setLoading(true);
      setError(null);
      
      window.fs.readFile(filePath, { encoding: 'utf8' })
        .then(content => {
          setFileContent(content);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error reading file:', err);
          setError(`Failed to load file: ${filePath}`);
          setLoading(false);
        });
    }
  }, [filePath]);

  // Determine the content to display
  const codeContent = filePath ? fileContent : code;
  // Auto-detect language from file path if not explicitly provided
  const displayLanguage = language || (filePath ? getLanguageFromPath(filePath) : 'text');
  // Update title to include filename if using filePath
  const displayTitle = title || (filePath ? filePath.split('/').pop() : '');

  if (filePath && loading) {
    return (
      <div className="collapsible-code-block">
        <div className="code-block-header">
          <div className="code-block-info">
            <div className="code-block-meta">
              <img src="/img/icons/code.svg" width="16" height="16" className="code-block-icon" alt="Code" />
              <h4 className="code-block-title">{displayTitle}</h4>
              <span className="code-block-language">{displayLanguage}</span>
            </div>
            <p className="code-block-description">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (filePath && error) {
    return (
      <div className="collapsible-code-block">
        <div className="code-block-header">
          <div className="code-block-info">
            <div className="code-block-meta">
              <img src="/img/icons/code.svg" width="16" height="16" className="code-block-icon" alt="Code" />
              <h4 className="code-block-title">{displayTitle}</h4>
            </div>
            <p className="code-block-description" style={{ color: 'var(--color-status-danger)' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

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
            <h4 className="code-block-title">{displayTitle}</h4>
            <span className="code-block-language">{displayLanguage}</span>
          </div>
          {(description || filePath) && (
            <p className="code-block-description">
              {description || `Source: ${filePath}`}
            </p>
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
      
      {isExpanded && codeContent && (
        <div className="code-block-content">
          <CodeBlock language={displayLanguage} style={{ margin: 0, textAlign: 'left' }}>
            {codeContent}
          </CodeBlock>
        </div>
      )}
    </div>
  );
}