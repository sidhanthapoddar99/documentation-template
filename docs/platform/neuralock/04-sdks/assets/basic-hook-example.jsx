import React, { useState, useEffect } from 'react';
import { useNeuralock } from '@neuralock/react';

function SecureDocument() {
  const { encrypt, decrypt, isInitialized, isLoading, error } = useNeuralock();
  const [content, setContent] = useState('');
  const [encrypted, setEncrypted] = useState(null);
  const [decrypted, setDecrypted] = useState('');

  // Handle encryption
  const handleEncrypt = async () => {
    try {
      const result = await encrypt(content, 'doc-123');
      setEncrypted(result);
      setContent(''); // Clear input after encryption
    } catch (err) {
      console.error('Encryption failed:', err);
    }
  };

  // Handle decryption
  const handleDecrypt = async () => {
    if (!encrypted) return;
    
    try {
      const result = await decrypt(encrypted, 'doc-123');
      setDecrypted(result);
    } catch (err) {
      console.error('Decryption failed:', err);
    }
  };

  if (!isInitialized) {
    return <div>Initializing Neuralock...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="secure-document">
      <h2>Secure Document Storage</h2>
      
      {/* Encryption Section */}
      <div className="encrypt-section">
        <h3>Encrypt Data</h3>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter sensitive data..."
          rows={4}
          cols={50}
        />
        <button 
          onClick={handleEncrypt} 
          disabled={!content || isLoading}
        >
          {isLoading ? 'Encrypting...' : 'Encrypt'}
        </button>
      </div>

      {/* Encrypted Result */}
      {encrypted && (
        <div className="encrypted-result">
          <h3>Encrypted Data</h3>
          <code>{encrypted.ciphertext.substring(0, 50)}...</code>
          <p>Stored on {encrypted.metadata.servers.length} servers</p>
        </div>
      )}

      {/* Decryption Section */}
      {encrypted && (
        <div className="decrypt-section">
          <h3>Decrypt Data</h3>
          <button 
            onClick={handleDecrypt}
            disabled={isLoading}
          >
            {isLoading ? 'Decrypting...' : 'Decrypt'}
          </button>
          
          {decrypted && (
            <div className="decrypted-result">
              <h4>Decrypted Content:</h4>
              <p>{decrypted}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}