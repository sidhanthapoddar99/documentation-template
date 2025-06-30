import { NeuralockClient } from '@neuralock/client';

const client = new NeuralockClient({
  applicationContract: '0x1234...',
  signer: signer,
  servers: [
    { 
      nftId: 1, 
      importanceFactor: 1.0,  // Primary server
      required: true          // Must participate
    },
    { 
      nftId: 2, 
      importanceFactor: 0.8   // Secondary server
    },
    { 
      nftId: 3, 
      importanceFactor: 0.6   // Tertiary server
    },
    { 
      nftId: 4, 
      importanceFactor: 0.4   // Backup server
    }
  ],
  options: {
    // Session configuration
    ttl: 600,                 // 10 minute sessions
    autoRefresh: true,        // Auto-refresh before expiry
    
    // Threshold configuration
    threshold: {
      mode: 'flexible',
      minimum: 2,             // At least 2 servers
      tolerance: 0.2          // 20% tolerance
    },
    
    // Network configuration
    retryAttempts: 5,         // Retry failed requests
    timeout: 45000,           // 45 second timeout
    retryDelay: 1000,         // Initial retry delay
    
    // Performance options
    cacheEnabled: true,       // Cache decrypted data
    cacheStrategy: 'lru',     // Least Recently Used
    cacheSize: 50,            // Max cached items
    
    // Advanced crypto options
    useWebWorkers: true,      // Offload crypto operations
    workerPoolSize: 4,        // Worker thread pool
    
    // Connection pooling
    connectionPool: {
      maxConnections: 10,
      keepAlive: true,
      keepAliveTimeout: 60000
    },
    
    // Logging and debugging
    debug: process.env.NODE_ENV === 'development',
    logger: console           // Custom logger instance
  }
});