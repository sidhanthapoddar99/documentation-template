// Server-side re-encryption
async function reencryptShare(share, sessionData) {
  // Derive shared secret with client's ephemeral key
  const sharedSecret = await deriveSharedSecret(
    serverEncryptionPrivateKey,
    sessionData.ephemeralPublicKey
  );
  
  // Derive session-specific key
  const sessionKey = await hkdf(
    sharedSecret,
    sessionData.sessionId,
    'neuralock-session-share'
  );
  
  // Encrypt share for this session
  const reencryptedShare = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: generateIV() },
    sessionKey,
    share
  );
  
  return {
    share: base64(reencryptedShare),
    iv: base64(iv),
    serverId: serverConfig.id
  };
}