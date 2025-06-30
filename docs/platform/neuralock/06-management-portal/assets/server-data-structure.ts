// Server NFT Data Structure
interface ServerInfo {
  // NFT Token Information
  nftId: number;                    // Unique token ID
  tokenOwner: string;               // Current NFT owner address
  tokenURI: string;                 // Metadata URI (if using external storage)
  
  // Server Metadata (stored on-chain)
  metadata: {
    serverPublicKey: string;        // secp256k1 public key for identity
    encryptionPublicKey: string;    // X25519 public key for ECDH
    domain: string;                 // Server domain (e.g., "server1.example.com")
    verified: boolean;              // Verification status
    registeredAt: number;           // Registration timestamp
    lastUpdated: number;            // Last metadata update
    version: string;                // API version supported
  };
  
  // Health Information (off-chain, updated regularly)
  health: {
    status: 'online' | 'offline' | 'degraded' | 'maintenance' | 'unknown';
    lastPing: number;               // Last successful health check
    responseTime: number;           // Average response time (ms)
    uptime: number;                 // Uptime percentage (0-100)
    errorRate: number;              // Error rate percentage
    consecutiveFailures: number;    // Failed health checks in a row
  };
  
  // Performance Metrics (off-chain)
  metrics: {
    totalRequests: number;          // Total requests handled
    successRate: number;            // Success rate percentage
    activeSessions: number;         // Current active sessions
    storageUsed: number;            // Storage in bytes
    bandwidth: {
      inbound: number;              // Bytes received
      outbound: number;             // Bytes sent
    };
    latency: {
      p50: number;                  // 50th percentile (ms)
      p95: number;                  // 95th percentile (ms)
      p99: number;                  // 99th percentile (ms)
    };
  };
  
  // Configuration (partially on-chain)
  config: {
    healthCheckEndpoint: string;    // URL for health checks
    apiEndpoint: string;            // Main API endpoint
    supportedOperations: string[];  // Supported operations
    maxSessions: number;            // Maximum concurrent sessions
    rateLimit: {
      requestsPerMinute: number;
      burstSize: number;
    };
  };
  
  // Verification Information
  verification: {
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    requestId?: number;             // Current verification request
    verifiedBy?: string[];          // Addresses that approved
    verifiedAt?: number;            // Verification timestamp
    rejectionReason?: string;       // If rejected
  };
  
  // Access Control
  permissions: {
    managers: string[];             // Addresses with management rights
    blocked: string[];              // Blocked addresses
    whitelist?: string[];           // If using whitelist mode
  };
}

// Server Registration Input
interface ServerRegistrationInput {
  recipient: string;                // Address to receive NFT
  serverName: string;               // Human-readable name
  description?: string;             // Optional description
  serverPublicKey: string;          // Server's public key
  encryptionPublicKey: string;      // Encryption public key
  domain: string;                   // Server domain
  healthCheckEndpoint: string;      // Health check URL
  proofOfOwnership: {
    message: string;                // Message that was signed
    signature: string;              // Signature proving key ownership
  };
}

// Health Check Response
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  version: string;
  uptime: number;                   // Server uptime in seconds
  metrics: {
    cpu: number;                    // CPU usage percentage
    memory: number;                 // Memory usage percentage
    disk: number;                   // Disk usage percentage
    connections: number;            // Active connections
  };
  services: {
    api: boolean;                   // API service status
    database: boolean;              // Database connection
    blockchain: boolean;            // Blockchain connectivity
  };
}

// Server Update Request
interface ServerUpdateRequest {
  tokenId: number;
  updates: {
    domain?: string;
    healthCheckEndpoint?: string;
    apiEndpoint?: string;
    supportedOperations?: string[];
  };
  signature: string;                // Owner's signature
}

export type {
  ServerInfo,
  ServerRegistrationInput,
  HealthCheckResponse,
  ServerUpdateRequest
};