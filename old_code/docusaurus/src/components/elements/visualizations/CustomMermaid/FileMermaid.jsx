import React, { useState, useEffect } from 'react';
import CustomMermaid from './CustomMermaid';
import { Callout } from '@site/src/components/elements/Callout';

const FileMermaid = ({ filePath, title, description }) => {
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
        console.error('Error loading Mermaid file:', err);
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
        <p>Loading diagram...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Callout type="danger" title="Error Loading Diagram">
        <p>{error}</p>
        <p>File path: <code>{filePath}</code></p>
      </Callout>
    );
  }

  if (!content) {
    return (
      <Callout type="warning" title="Empty Diagram">
        <p>The diagram file is empty.</p>
      </Callout>
    );
  }

  return (
    <CustomMermaid 
      value={content} 
      title={title || `Diagram: ${filePath.split('/').pop()}`}
      description={description}
    />
  );
};

export default FileMermaid;