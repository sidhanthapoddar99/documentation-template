// Create session request message
const message = {
  action: 'create_session',
  address: walletAddress,
  ephemeralPublicKey: base64(ephemeralPublicKey),
  timestamp: Date.now(),
  ttl: 3600 // 1 hour session
};

// Sign with wallet (e.g., MetaMask)
const signature = await signer.signMessage(
  JSON.stringify(message)
);