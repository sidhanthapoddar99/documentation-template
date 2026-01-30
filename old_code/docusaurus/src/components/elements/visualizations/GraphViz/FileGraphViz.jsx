import React, { useState, useEffect } from 'react';
import GraphViz from './GraphViz';
import { Callout } from '@site/src/components/elements/Callout';

const FileGraphViz = ({ filePath, title, description, engine }) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFile = async () => {
      try {
        setLoading(true);
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        setContent(text);
        setError(null);
      } catch (err) {
        console.error('Error loading GraphViz file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load file');
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [filePath]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading graph...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Callout type="danger" title="Error Loading Graph">
        <p>{error}</p>
        <p>File path: <code>{filePath}</code></p>
      </Callout>
    );
  }

  if (!content) {
    return (
      <Callout type="warning" title="Empty Graph">
        <p>The graph file is empty.</p>
      </Callout>
    );
  }

  return (
    <GraphViz 
      value={content} 
      title={title || `Graph: ${filePath.split('/').pop()}`}
      description={description}
      engine={engine}
    />
  );
};

export default FileGraphViz;