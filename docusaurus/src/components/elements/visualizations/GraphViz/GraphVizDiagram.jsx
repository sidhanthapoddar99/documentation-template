import React from 'react';
import GraphViz from './GraphViz';

// Helper component to make file-based diagrams easier to use
// This component expects the diagram content to be passed as a prop
// The actual file importing should be done in the MDX file using raw-loader

export function GraphVizDiagram({ 
  content,
  filename,
  title,
  description,
  engine = 'dot'
}) {
  // Extract filename without path if present
  const baseFilename = filename ? filename.split('/').pop() : null;
  const displayTitle = title || (baseFilename ? `Graph: ${baseFilename}` : 'GraphViz Diagram');
  const displayDescription = description || (baseFilename ? `Source: ${baseFilename}` : null);

  return (
    <GraphViz
      value={content}
      title={displayTitle}
      description={displayDescription}
      engine={engine}
    />
  );
}