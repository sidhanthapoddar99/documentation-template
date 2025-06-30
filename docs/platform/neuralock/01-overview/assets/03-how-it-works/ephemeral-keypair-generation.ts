// Client generates a temporary keypair for this session
const ephemeralKeypair = await crypto.subtle.generateKey(
  {
    name: 'ECDSA',
    namedCurve: 'P-256'
  },
  true,
  ['sign', 'verify']
);

// Export public key for sharing with servers
const ephemeralPublicKey = await crypto.subtle.exportKey(
  'raw',
  ephemeralKeypair.publicKey
);