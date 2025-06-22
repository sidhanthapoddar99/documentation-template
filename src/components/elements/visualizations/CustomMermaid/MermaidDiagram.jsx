import React from 'react';
import CustomMermaid from './CustomMermaid';

// Helper component to make file-based diagrams easier to use
// This component expects the diagram content to be passed as a prop
// The actual file importing should be done in the MDX file using raw-loader

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