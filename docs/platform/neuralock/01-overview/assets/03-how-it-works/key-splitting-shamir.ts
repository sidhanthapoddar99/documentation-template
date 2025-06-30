// Export AES key as raw bytes
const keyBytes = await crypto.subtle.exportKey('raw', aesKey);

// Split into shares using Shamir's Secret Sharing
const shares = shamirSplit({
  secret: keyBytes,
  total: servers.length,
  threshold: threshold
});

// Example: 3-of-5 split
// shares = [share1, share2, share3, share4, share5]
// Any 3 shares can reconstruct the original key