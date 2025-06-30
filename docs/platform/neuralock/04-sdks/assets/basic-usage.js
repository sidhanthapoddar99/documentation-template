import { NeuralockClient } from '@neuralock/client';
import { ethers } from 'ethers';

// Initialize with MetaMask or any Web3 provider
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Configure the client
const client = new NeuralockClient({
  applicationContract: '0x1234...', // Your app's contract address
  signer: signer,
  servers: [
    { nftId: 1 },
    { nftId: 2 },
    { nftId: 3 }
  ]
});

// Initialize session
await client.initialize();

// Encrypt sensitive data
const encryptedData = await client.encrypt(
  'This is my secret data',
  'document-123'
);

console.log('Encrypted:', encryptedData);

// Later, decrypt the data
const decrypted = await client.decrypt(
  encryptedData,
  'document-123'
);

console.log('Decrypted:', decrypted);