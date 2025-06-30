import React, { useState } from 'react';
import { useNeuralock, useNeuralockCache } from '@neuralock/react';

function EncryptionForm() {
  const { encrypt, decrypt, isLoading, error } = useNeuralock();
  const { setCached, getCached } = useNeuralockCache();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    isPublic: false
  });
  
  const [encryptedId, setEncryptedId] = useState(null);
  const [showDecrypted, setShowDecrypted] = useState(false);
  const [decryptedData, setDecryptedData] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Generate unique ID
      const objectId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Encrypt the entire form data
      const dataToEncrypt = JSON.stringify(formData);
      const encrypted = await encrypt(dataToEncrypt, objectId);
      
      // Save to your backend
      await saveToBackend({
        id: objectId,
        encrypted: encrypted,
        metadata: {
          title: formData.title,
          category: formData.category,
          isPublic: formData.isPublic,
          createdAt: new Date().toISOString()
        }
      });
      
      // Cache the decrypted data for quick access
      setCached(objectId, formData);
      
      setEncryptedId(objectId);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        category: 'general',
        isPublic: false
      });
      
      alert('Document encrypted and saved successfully!');
    } catch (err) {
      console.error('Encryption failed:', err);
      alert('Failed to encrypt document');
    }
  };

  // Handle decryption
  const handleDecrypt = async () => {
    if (!encryptedId) return;
    
    // Check cache first
    const cached = getCached(encryptedId);
    if (cached) {
      setDecryptedData(cached);
      setShowDecrypted(true);
      return;
    }
    
    try {
      // Fetch encrypted data from backend
      const { encrypted } = await fetchFromBackend(encryptedId);
      
      // Decrypt
      const decrypted = await decrypt(encrypted, encryptedId);
      const parsedData = JSON.parse(decrypted);
      
      // Cache for future use
      setCached(encryptedId, parsedData);
      
      setDecryptedData(parsedData);
      setShowDecrypted(true);
    } catch (err) {
      console.error('Decryption failed:', err);
      alert('Failed to decrypt document');
    }
  };

  return (
    <div className="encryption-form-container">
      <h2>Secure Document Form</h2>
      
      <form onSubmit={handleSubmit} className="encryption-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter document title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows={6}
            placeholder="Enter your sensitive content here..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="general">General</option>
            <option value="financial">Financial</option>
            <option value="medical">Medical</option>
            <option value="legal">Legal</option>
            <option value="personal">Personal</option>
          </select>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
            />
            Make this document publicly accessible
          </label>
        </div>

        {error && (
          <div className="error-message">
            Error: {error.message}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading || !formData.title || !formData.content}
          className="submit-button"
        >
          {isLoading ? 'Encrypting...' : 'Encrypt & Save'}
        </button>
      </form>

      {encryptedId && (
        <div className="success-message">
          <h3>Document Encrypted Successfully!</h3>
          <p>Document ID: <code>{encryptedId}</code></p>
          <button 
            onClick={handleDecrypt}
            disabled={isLoading}
            className="decrypt-button"
          >
            {isLoading ? 'Decrypting...' : 'Decrypt Document'}
          </button>
        </div>
      )}

      {showDecrypted && decryptedData && (
        <div className="decrypted-content">
          <h3>Decrypted Document</h3>
          <div className="decrypted-field">
            <strong>Title:</strong> {decryptedData.title}
          </div>
          <div className="decrypted-field">
            <strong>Content:</strong>
            <p>{decryptedData.content}</p>
          </div>
          <div className="decrypted-field">
            <strong>Category:</strong> {decryptedData.category}
          </div>
          <div className="decrypted-field">
            <strong>Public:</strong> {decryptedData.isPublic ? 'Yes' : 'No'}
          </div>
        </div>
      )}

      <style jsx>{`
        .encryption-form-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .encryption-form {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: bold;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }

        .form-group.checkbox label {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .form-group.checkbox input {
          width: auto;
          margin-right: 8px;
        }

        .submit-button,
        .decrypt-button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
        }

        .submit-button:disabled,
        .decrypt-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          color: #d32f2f;
          margin: 16px 0;
          padding: 12px;
          background: #ffebee;
          border-radius: 4px;
        }

        .success-message {
          background: #e8f5e9;
          padding: 16px;
          border-radius: 8px;
          margin: 16px 0;
        }

        .success-message code {
          background: #c8e6c9;
          padding: 2px 4px;
          border-radius: 2px;
        }

        .decrypted-content {
          background: #e3f2fd;
          padding: 16px;
          border-radius: 8px;
          margin: 16px 0;
        }

        .decrypted-field {
          margin: 8px 0;
        }

        .decrypted-field strong {
          color: #1976d2;
        }
      `}</style>
    </div>
  );
}

// Mock backend functions
async function saveToBackend(data) {
  // Simulate API call
  return new Promise(resolve => setTimeout(resolve, 1000));
}

async function fetchFromBackend(id) {
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        id,
        encrypted: { /* encrypted data */ }
      });
    }, 1000);
  });
}

export default EncryptionForm;