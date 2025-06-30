// Encrypt the actual data
const encoder = new TextEncoder();
const plaintext = encoder.encode(data);

const ciphertext = await crypto.subtle.encrypt(
  {
    name: 'AES-GCM',
    iv: iv
  },
  aesKey,
  plaintext
);

// Package encrypted data
const encryptedData = {
  ciphertext: base64(ciphertext),
  iv: base64(iv),
  algorithm: 'AES-256-GCM'
};