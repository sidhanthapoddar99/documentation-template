// Decrypt the ciphertext
const plaintext = await crypto.subtle.decrypt(
  {
    name: 'AES-GCM',
    iv: base64Decode(encryptedData.iv)
  },
  aesKey,
  base64Decode(encryptedData.ciphertext)
);

// Convert back to string
const decoder = new TextDecoder();
const decryptedData = decoder.decode(plaintext);