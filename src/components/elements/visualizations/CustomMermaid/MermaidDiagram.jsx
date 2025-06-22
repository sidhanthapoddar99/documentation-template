import React from 'react';
import CustomMermaid from './CustomMermaid';

export function MermaidDiagram({ 
  content,
  filename,
  title,
  description
}) {
  const displayTitle = title || (filename ? `Diagram: ${filename}` : 'Mermaid Diagram');
  const displayDescription = description || (filename ? `Source: ${filename}` : null);

  return (
    <CustomMermaid
      value={content}
      title={displayTitle}
      description={displayDescription}
    />
  );
}