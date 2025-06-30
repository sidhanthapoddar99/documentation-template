// For each server and its share
const encryptedShares = await Promise.all(
  shares.map(async (share, index) => {
    const server = servers[index];
    
    // Derive shared secret using ECDH
    const sharedSecret = await deriveSharedSecret(
      ephemeralPrivateKey,
      server.encryptionPublicKey
    );
    
    // Derive encryption key from shared secret
    const shareKey = await hkdf(
      sharedSecret,
      salt,
      'neuralock-share-encryption'
    );
    
    // Encrypt the share
    const encryptedShare = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: generateIV() },
      shareKey,
      share
    );
    
    return {
      serverId: server.id,
      encryptedShare: base64(encryptedShare),
      iv: base64(iv)
    };
  })
);