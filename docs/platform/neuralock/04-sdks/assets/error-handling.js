import { 
  NeuralockClient,
  NeuralockError,
  SessionExpiredError,
  ThresholdNotMetError,
  PermissionDeniedError,
  ServerCommunicationError
} from '@neuralock/client';

const client = new NeuralockClient(config);

try {
  await client.initialize();
  
  const encrypted = await client.encrypt(data, objectId);
  const decrypted = await client.decrypt(encrypted, objectId);
  
} catch (error) {
  if (error instanceof SessionExpiredError) {
    // Session has expired, need to reinitialize
    console.log('Session expired, refreshing...');
    await client.initialize();
    // Retry operation
    
  } else if (error instanceof ThresholdNotMetError) {
    // Not enough servers responded
    console.error('Insufficient servers available:', error.details);
    // Could retry with reduced threshold or notify user
    
  } else if (error instanceof PermissionDeniedError) {
    // User doesn't have access to this object
    console.error('Access denied:', error.message);
    // Request permission or show access denied UI
    
  } else if (error instanceof ServerCommunicationError) {
    // Network or server issue
    console.error('Server communication failed:', error.details);
    // Could implement retry logic or fallback
    
  } else if (error instanceof NeuralockError) {
    // Generic Neuralock error
    console.error('Neuralock error:', error.code, error.message);
    
  } else {
    // Unexpected error
    console.error('Unexpected error:', error);
  }
}

// Using error details for debugging
client.on('error', (error) => {
  console.log('Error details:', {
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: new Date().toISOString()
  });
});