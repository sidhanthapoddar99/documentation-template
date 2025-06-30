// Decrypt each share using session keys
const decryptedShares = await Promise.all(
  validShares.map(async (response) => {
    // Derive the same shared secret
    const sharedSecret = await deriveSharedSecret(
      ephemeralPrivateKey,
      getServerPublicKey(response.serverId)
    );
    
    // Derive session key
    const sessionKey = await hkdf(
      sharedSecret,
      sessionId,
      'neuralock-session-share'
    );
    
    // Decrypt the share
    const share = await crypto.subtle.decrypt(
      { 
        name: 'AES-GCM', 
        iv: base64Decode(response.iv) 
      },
      sessionKey,
      base64Decode(response.share)
    );
    
    return {
      index: response.serverIndex,
      share: new Uint8Array(share)
    };
  })
);