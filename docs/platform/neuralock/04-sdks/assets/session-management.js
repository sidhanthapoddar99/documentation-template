import { NeuralockClient } from '@neuralock/client';

const client = new NeuralockClient(config);

// Initialize with session monitoring
await client.initialize();

// Get current session information
const session = client.getSession();
console.log('Session info:', {
  createdAt: new Date(session.createdAt),
  expiresAt: new Date(session.expiresAt),
  timeRemaining: session.timeRemaining,
  servers: session.servers.length
});

// Monitor session expiry
client.on('sessionExpiring', async (timeRemaining) => {
  console.log(`Session expiring in ${timeRemaining}ms`);
  
  // Auto-refresh is enabled by default
  // But you can manually refresh if needed
  if (timeRemaining < 60000) { // Less than 1 minute
    await client.refreshSession();
  }
});

// Handle session events
client.on('sessionRefreshed', () => {
  console.log('Session successfully refreshed');
});

client.on('sessionExpired', () => {
  console.log('Session expired - operations will fail until reinitialized');
});

// Manual session refresh
async function refreshIfNeeded() {
  const session = client.getSession();
  
  if (session.timeRemaining < 300000) { // Less than 5 minutes
    try {
      await client.refreshSession();
      console.log('Session refreshed proactively');
    } catch (error) {
      console.error('Failed to refresh session:', error);
      // Reinitialize if refresh fails
      await client.initialize();
    }
  }
}

// Check session validity before operations
async function secureOperation() {
  if (!client.isSessionValid()) {
    await client.initialize();
  }
  
  // Proceed with encryption/decryption
  return await client.encrypt(data, objectId);
}