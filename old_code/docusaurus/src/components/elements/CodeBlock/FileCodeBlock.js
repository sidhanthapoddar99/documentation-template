import React from 'react';
import { CollapsibleCodeBlock, InlineCodeCard } from './CodeBlock';

// Helper component to make file-based code blocks easier to use
// This component expects the file content to be passed as a prop
// The actual file importing should be done in the MDX file using raw-loader

export function FileCollapsibleCodeBlock({ 
  content,
  filename,
  title,
  description,
  language,
  defaultCollapsed = true 
}) {
  // Extract extension from filename if provided
  const getLanguageFromFilename = (fname) => {
    if (!fname) return 'text';
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
    };
    const extension = fname.split('.').pop().toLowerCase();
    return extensionToLanguage[extension] || 'text';
  };

  // Determine language: manual override > filename detection > default
  const displayLanguage = language || (filename ? getLanguageFromFilename(filename) : 'text');
  const displayTitle = title || filename || 'Code';
  const displayDescription = description || (filename ? `Source: ${filename}` : null);

  return (
    <CollapsibleCodeBlock
      title={displayTitle}
      description={displayDescription}
      language={displayLanguage}
      defaultCollapsed={defaultCollapsed}
    >
      {content}
    </CollapsibleCodeBlock>
  );
}

export function FileInlineCodeCard({ 
  content,
  filename,
  title,
  description,
  language,
  defaultExpanded = false 
}) {
  // Extract extension from filename if provided
  const getLanguageFromFilename = (fname) => {
    if (!fname) return 'text';
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
    };
    const extension = fname.split('.').pop().toLowerCase();
    return extensionToLanguage[extension] || 'text';
  };

  // Determine language: manual override > filename detection > default
  const displayLanguage = language || (filename ? getLanguageFromFilename(filename) : 'text');
  const displayTitle = title || filename || 'Code';
  const displayDescription = description || (filename ? `Source: ${filename}` : null);

  return (
    <InlineCodeCard
      title={displayTitle}
      description={displayDescription}
      language={displayLanguage}
      code={content}
      defaultExpanded={defaultExpanded}
    />
  );
}