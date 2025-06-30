import React, { useState, useCallback } from 'react';
import { 
  useNeuralock, 
  useNeuralockSession,
  NeuralockProvider,
  NeuralockConfig,
  EncryptedData,
  NeuralockError,
  SessionData
} from '@neuralock/react';

// Type definitions for your application
interface SecureDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface SecureDocumentStore {
  objectId: string;
  encrypted: EncryptedData;
  metadata: {
    title: string;
    tags: string[];
    owner: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Custom hook with full TypeScript support
function useSecureDocument(objectId: string) {
  const { encrypt, decrypt, isLoading } = useNeuralock();
  const [document, setDocument] = useState<SecureDocument | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadDocument = useCallback(async () => {
    try {
      // Fetch from your API
      const response = await fetch(`/api/documents/${objectId}`);
      const data: SecureDocumentStore = await response.json();
      
      // Decrypt the content
      const decrypted = await decrypt(data.encrypted, objectId);
      const parsedDoc = JSON.parse(decrypted) as SecureDocument;
      
      setDocument({
        ...parsedDoc,
        createdAt: new Date(data.metadata.createdAt),
        updatedAt: new Date(data.metadata.updatedAt)
      });
    } catch (err) {
      setError(err as Error);
    }
  }, [objectId, decrypt]);

  const saveDocument = useCallback(async (doc: SecureDocument) => {
    try {
      // Encrypt the document
      const encrypted = await encrypt(JSON.stringify(doc), objectId);
      
      // Save to your API
      const response = await fetch(`/api/documents/${objectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectId,
          encrypted,
          metadata: {
            title: doc.title,
            tags: doc.tags,
            updatedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      setDocument(doc);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [objectId, encrypt]);

  return {
    document,
    loadDocument,
    saveDocument,
    isLoading,
    error
  };
}

// Strongly typed component
interface SecureEditorProps {
  documentId: string;
  onSave?: (doc: SecureDocument) => void;
}

export function SecureEditor({ documentId, onSave }: SecureEditorProps) {
  const { document, loadDocument, saveDocument, isLoading, error } = useSecureDocument(documentId);
  const { session, timeRemaining } = useNeuralockSession();
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<SecureDocument>>({});

  React.useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  React.useEffect(() => {
    if (document) {
      setFormData(document);
    }
  }, [document]);

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      alert('Title and content are required');
      return;
    }

    try {
      const updatedDoc: SecureDocument = {
        id: documentId,
        title: formData.title,
        content: formData.content,
        tags: formData.tags || [],
        createdAt: document?.createdAt || new Date(),
        updatedAt: new Date()
      };

      await saveDocument(updatedDoc);
      setEditMode(false);
      onSave?.(updatedDoc);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleChange = <K extends keyof SecureDocument>(
    key: K,
    value: SecureDocument[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Session warning
  const showSessionWarning = timeRemaining < 300000; // 5 minutes

  if (isLoading) {
    return <div className="loading">Loading secure document...</div>;
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  return (
    <div className="secure-editor">
      {showSessionWarning && (
        <div className="session-warning">
          Session expiring in {Math.floor(timeRemaining / 60000)} minutes
        </div>
      )}

      {editMode ? (
        <div className="edit-mode">
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Document title"
            className="title-input"
          />
          
          <textarea
            value={formData.content || ''}
            onChange={(e) => handleChange('content', e.target.value)}
            placeholder="Document content"
            className="content-textarea"
            rows={10}
          />
          
          <div className="tags-input">
            <input
              type="text"
              value={(formData.tags || []).join(', ')}
              onChange={(e) => handleChange(
                'tags', 
                e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              )}
              placeholder="Tags (comma separated)"
            />
          </div>
          
          <div className="actions">
            <button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setEditMode(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="view-mode">
          <h2>{document?.title}</h2>
          <div className="content">{document?.content}</div>
          <div className="tags">
            {document?.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
          <div className="metadata">
            <span>Created: {document?.createdAt.toLocaleDateString()}</span>
            <span>Updated: {document?.updatedAt.toLocaleDateString()}</span>
          </div>
          <button onClick={() => setEditMode(true)}>
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

// Type-safe provider configuration
export function App() {
  const config: NeuralockConfig = {
    applicationContract: process.env.REACT_APP_CONTRACT!,
    servers: [
      { nftId: 1, importanceFactor: 1.0 },
      { nftId: 2, importanceFactor: 0.8 },
      { nftId: 3, importanceFactor: 0.6 }
    ],
    options: {
      ttl: 600,
      threshold: {
        mode: 'flexible',
        minimum: 2,
        tolerance: 0.2
      }
    }
  };

  return (
    <NeuralockProvider config={config}>
      <div className="app">
        <h1>Secure Document Manager</h1>
        <SecureEditor 
          documentId="doc-123" 
          onSave={(doc) => console.log('Saved:', doc)}
        />
      </div>
    </NeuralockProvider>
  );
}

// Advanced TypeScript patterns
interface UseEncryptedStateOptions<T> {
  objectId: string;
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

export function useEncryptedState<T>({
  objectId,
  defaultValue,
  serialize = JSON.stringify,
  deserialize = JSON.parse
}: UseEncryptedStateOptions<T>) {
  const { encrypt, decrypt, isInitialized } = useNeuralock();
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load initial value
  React.useEffect(() => {
    if (!isInitialized) return;

    const loadValue = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/storage/${objectId}`);
        if (response.ok) {
          const { encrypted } = await response.json();
          const decrypted = await decrypt(encrypted, objectId);
          setValue(deserialize(decrypted));
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [isInitialized, objectId, decrypt, deserialize]);

  // Update value with encryption
  const updateValue = useCallback(async (newValue: T) => {
    setValue(newValue);
    setIsLoading(true);
    setError(null);

    try {
      const serialized = serialize(newValue);
      const encrypted = await encrypt(serialized, objectId);
      
      const response = await fetch(`/api/storage/${objectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encrypted })
      });

      if (!response.ok) {
        throw new Error('Failed to save encrypted value');
      }
    } catch (err) {
      setError(err as Error);
      setValue(value); // Rollback on error
    } finally {
      setIsLoading(false);
    }
  }, [value, objectId, encrypt, serialize]);

  return {
    value,
    updateValue,
    isLoading,
    error
  } as const;
}