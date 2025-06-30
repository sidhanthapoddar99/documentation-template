// Generate AES-256 key for data encryption
const aesKey = await crypto.subtle.generateKey(
  {
    name: 'AES-GCM',
    length: 256
  },
  true, // extractable for splitting
  ['encrypt', 'decrypt']
);

// Generate initialization vector
const iv = crypto.getRandomValues(new Uint8Array(12));