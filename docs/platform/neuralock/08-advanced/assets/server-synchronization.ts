import { EventEmitter } from 'events';
import PQueue from 'p-queue';
import { createHash } from 'crypto';

interface SyncMessage {
  type: 'share_update' | 'config_update' | 'health_status' | 'sync_request';
  serverId: string;
  timestamp: number;
  data: any;
  signature: string;
}

interface SyncState {
  serverId: string;
  lastSync: number;
  version: string;
  shareCount: number;
  configHash: string;
}

export class ServerSynchronization extends EventEmitter {
  private servers: Map<string, ServerConnection>;
  private syncQueue: PQueue;
  private syncState: Map<string, SyncState>;
  private localServerId: string;
  private syncInterval: NodeJS.Timer | null = null;
  
  constructor(localServerId: string, options?: SyncOptions) {
    super();
    this.localServerId = localServerId;
    this.servers = new Map();
    this.syncState = new Map();
    this.syncQueue = new PQueue({
      concurrency: options?.concurrency || 5,
      interval: 1000,
      intervalCap: options?.rateLimit || 10
    });
  }
  
  /**
   * Initialize synchronization with peer servers
   */
  async initialize(peerServers: ServerInfo[]): Promise<void> {
    console.log(`Initializing sync for ${this.localServerId} with ${peerServers.length} peers`);
    
    // Connect to each peer
    const connectionPromises = peerServers.map(async (server) => {
      if (server.id === this.localServerId) return;
      
      try {
        const connection = await this.connectToServer(server);
        this.servers.set(server.id, connection);
        
        // Initialize sync state
        this.syncState.set(server.id, {
          serverId: server.id,
          lastSync: 0,
          version: '0.0.0',
          shareCount: 0,
          configHash: ''
        });
        
        // Setup message handlers
        this.setupMessageHandlers(connection);
        
        console.log(`Connected to peer ${server.id}`);
      } catch (error) {
        console.error(`Failed to connect to ${server.id}:`, error);
        this.emit('peer_connection_failed', { serverId: server.id, error });
      }
    });
    
    await Promise.all(connectionPromises);
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Perform initial sync
    await this.performFullSync();
  }
  
  /**
   * Connect to a peer server
   */
  private async connectToServer(server: ServerInfo): Promise<ServerConnection> {
    const connection = new ServerConnection(server);
    
    await connection.connect();
    
    // Authenticate with peer
    await connection.authenticate({
      serverId: this.localServerId,
      timestamp: Date.now(),
      signature: this.signMessage({
        serverId: this.localServerId,
        timestamp: Date.now()
      })
    });
    
    return connection;
  }
  
  /**
   * Setup message handlers for a server connection
   */
  private setupMessageHandlers(connection: ServerConnection): void {
    connection.on('message', async (message: SyncMessage) => {
      try {
        // Verify message signature
        if (!this.verifyMessageSignature(message)) {
          console.error(`Invalid signature from ${message.serverId}`);
          return;
        }
        
        // Handle based on message type
        switch (message.type) {
          case 'share_update':
            await this.handleShareUpdate(message);
            break;
            
          case 'config_update':
            await this.handleConfigUpdate(message);
            break;
            
          case 'health_status':
            await this.handleHealthStatus(message);
            break;
            
          case 'sync_request':
            await this.handleSyncRequest(message);
            break;
            
          default:
            console.warn(`Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error(`Error handling message from ${message.serverId}:`, error);
      }
    });
    
    connection.on('disconnect', () => {
      console.warn(`Lost connection to ${connection.serverId}`);
      this.emit('peer_disconnected', { serverId: connection.serverId });
      
      // Attempt reconnection
      this.scheduleReconnection(connection.serverId);
    });
  }
  
  /**
   * Perform full synchronization with all peers
   */
  async performFullSync(): Promise<void> {
    console.log('Starting full synchronization...');
    
    const syncTasks = Array.from(this.servers.entries()).map(
      ([serverId, connection]) => 
        this.syncQueue.add(() => this.syncWithPeer(serverId, connection))
    );
    
    await Promise.all(syncTasks);
    
    console.log('Full synchronization complete');
    this.emit('sync_complete', {
      timestamp: Date.now(),
      peerssynced: this.servers.size
    });
  }
  
  /**
   * Sync with a specific peer
   */
  private async syncWithPeer(
    serverId: string,
    connection: ServerConnection
  ): Promise<void> {
    const state = this.syncState.get(serverId);
    if (!state) return;
    
    try {
      // Request sync status
      const peerStatus = await connection.request('sync_status', {
        since: state.lastSync
      });
      
      // Compare and sync differences
      if (peerStatus.configHash !== state.configHash) {
        await this.syncConfiguration(connection, peerStatus);
      }
      
      if (peerStatus.shareCount !== state.shareCount) {
        await this.syncShares(connection, state.lastSync);
      }
      
      // Update sync state
      this.syncState.set(serverId, {
        serverId,
        lastSync: Date.now(),
        version: peerStatus.version,
        shareCount: peerStatus.shareCount,
        configHash: peerStatus.configHash
      });
      
    } catch (error) {
      console.error(`Sync failed with ${serverId}:`, error);
      this.emit('sync_error', { serverId, error });
    }
  }
  
  /**
   * Sync configuration changes
   */
  private async syncConfiguration(
    connection: ServerConnection,
    peerStatus: any
  ): Promise<void> {
    const config = await connection.request('get_config', {});
    
    // Validate configuration
    if (this.validateConfiguration(config)) {
      // Apply configuration updates
      await this.applyConfigurationUpdate(config);
      
      this.emit('config_synced', {
        serverId: connection.serverId,
        configHash: peerStatus.configHash
      });
    }
  }
  
  /**
   * Sync share updates
   */
  private async syncShares(
    connection: ServerConnection,
    since: number
  ): Promise<void> {
    // Request share updates since last sync
    const updates = await connection.request('get_share_updates', { since });
    
    // Process each update
    for (const update of updates.shares) {
      await this.processShareUpdate(update);
    }
    
    this.emit('shares_synced', {
      serverId: connection.serverId,
      count: updates.shares.length
    });
  }
  
  /**
   * Handle incoming share update
   */
  private async handleShareUpdate(message: SyncMessage): Promise<void> {
    const { data } = message;
    
    // Validate share data
    if (!this.validateShareData(data)) {
      console.error('Invalid share data received');
      return;
    }
    
    // Check if we already have this update
    const existingShare = await this.getShare(data.objectId);
    if (existingShare && existingShare.version >= data.version) {
      return; // Already have this or newer version
    }
    
    // Apply the update
    await this.updateShare(data);
    
    // Propagate to other peers
    await this.propagateUpdate(message, message.serverId);
  }
  
  /**
   * Propagate updates to other peers
   */
  private async propagateUpdate(
    message: SyncMessage,
    excludeServerId: string
  ): Promise<void> {
    const propagationTasks = Array.from(this.servers.entries())
      .filter(([serverId]) => serverId !== excludeServerId)
      .map(([serverId, connection]) =>
        this.syncQueue.add(async () => {
          try {
            await connection.send(message);
          } catch (error) {
            console.error(`Failed to propagate to ${serverId}:`, error);
          }
        })
      );
    
    await Promise.all(propagationTasks);
  }
  
  /**
   * Start periodic synchronization
   */
  private startPeriodicSync(): void {
    const interval = 60000; // 1 minute
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.performIncrementalSync();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, interval);
  }
  
  /**
   * Perform incremental synchronization
   */
  private async performIncrementalSync(): Promise<void> {
    const syncPromises = Array.from(this.servers.entries()).map(
      ([serverId, connection]) =>
        this.syncQueue.add(async () => {
          const state = this.syncState.get(serverId);
          if (!state) return;
          
          // Only sync if connection is healthy
          if (connection.isHealthy()) {
            await this.syncWithPeer(serverId, connection);
          }
        })
    );
    
    await Promise.all(syncPromises);
  }
  
  /**
   * Handle sync request from peer
   */
  private async handleSyncRequest(message: SyncMessage): Promise<void> {
    const { data, serverId } = message;
    const connection = this.servers.get(serverId);
    
    if (!connection) {
      console.error(`No connection found for ${serverId}`);
      return;
    }
    
    // Prepare sync response
    const response = await this.prepareSyncResponse(data.since);
    
    // Send response
    await connection.respond(message.id, response);
  }
  
  /**
   * Prepare sync response with updates
   */
  private async prepareSyncResponse(since: number): Promise<SyncResponse> {
    const shares = await this.getShareUpdatesSince(since);
    const config = await this.getCurrentConfig();
    
    return {
      timestamp: Date.now(),
      serverId: this.localServerId,
      shares,
      config,
      configHash: this.hashConfig(config),
      shareCount: await this.getShareCount()
    };
  }
  
  /**
   * Validate share data
   */
  private validateShareData(data: any): boolean {
    // Check required fields
    if (!data.objectId || !data.shareData || !data.version) {
      return false;
    }
    
    // Verify share integrity
    const hash = createHash('sha256')
      .update(data.shareData)
      .digest('hex');
    
    return hash === data.shareHash;
  }
  
  /**
   * Sign a message
   */
  private signMessage(data: any): string {
    // Implementation would use server's signing key
    return 'signature';
  }
  
  /**
   * Verify message signature
   */
  private verifyMessageSignature(message: SyncMessage): boolean {
    // Implementation would verify using sender's public key
    return true;
  }
  
  /**
   * Schedule reconnection to a server
   */
  private scheduleReconnection(serverId: string): void {
    setTimeout(async () => {
      try {
        const serverInfo = await this.getServerInfo(serverId);
        const connection = await this.connectToServer(serverInfo);
        this.servers.set(serverId, connection);
        this.setupMessageHandlers(connection);
        
        console.log(`Reconnected to ${serverId}`);
        this.emit('peer_reconnected', { serverId });
        
        // Perform sync after reconnection
        await this.syncWithPeer(serverId, connection);
      } catch (error) {
        console.error(`Reconnection to ${serverId} failed:`, error);
        // Schedule another attempt
        this.scheduleReconnection(serverId);
      }
    }, 30000); // 30 seconds
  }
  
  /**
   * Get synchronization metrics
   */
  getMetrics(): SyncMetrics {
    const connectedPeers = Array.from(this.servers.values())
      .filter(conn => conn.isHealthy()).length;
    
    const syncStates = Array.from(this.syncState.values());
    const avgSyncLag = syncStates.reduce(
      (sum, state) => sum + (Date.now() - state.lastSync),
      0
    ) / syncStates.length;
    
    return {
      connectedPeers,
      totalPeers: this.servers.size,
      avgSyncLag,
      queueSize: this.syncQueue.size,
      pendingTasks: this.syncQueue.pending
    };
  }
  
  /**
   * Shutdown synchronization
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down synchronization...');
    
    // Stop periodic sync
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Clear queue
    this.syncQueue.clear();
    
    // Close all connections
    const closePromises = Array.from(this.servers.values()).map(
      conn => conn.close()
    );
    
    await Promise.all(closePromises);
    
    this.servers.clear();
    this.syncState.clear();
    
    console.log('Synchronization shutdown complete');
  }
}

// Supporting classes and interfaces
class ServerConnection extends EventEmitter {
  serverId: string;
  private ws: WebSocket | null = null;
  private healthy: boolean = false;
  
  constructor(private serverInfo: ServerInfo) {
    super();
    this.serverId = serverInfo.id;
  }
  
  async connect(): Promise<void> {
    // WebSocket connection implementation
    this.healthy = true;
  }
  
  async authenticate(credentials: any): Promise<void> {
    // Authentication implementation
  }
  
  async send(message: any): Promise<void> {
    // Send message implementation
  }
  
  async request(method: string, params: any): Promise<any> {
    // Request-response implementation
  }
  
  async respond(requestId: string, data: any): Promise<void> {
    // Response implementation
  }
  
  isHealthy(): boolean {
    return this.healthy;
  }
  
  async close(): Promise<void> {
    // Close connection
    this.healthy = false;
  }
}

interface ServerInfo {
  id: string;
  url: string;
  publicKey: string;
}

interface SyncOptions {
  concurrency?: number;
  rateLimit?: number;
}

interface SyncResponse {
  timestamp: number;
  serverId: string;
  shares: any[];
  config: any;
  configHash: string;
  shareCount: number;
}

interface SyncMetrics {
  connectedPeers: number;
  totalPeers: number;
  avgSyncLag: number;
  queueSize: number;
  pendingTasks: number;
}

// Usage example
export async function setupServerSync(
  serverId: string,
  peers: ServerInfo[]
): Promise<ServerSynchronization> {
  const sync = new ServerSynchronization(serverId, {
    concurrency: 5,
    rateLimit: 10
  });
  
  // Setup event handlers
  sync.on('sync_complete', (data) => {
    console.log('Synchronization complete:', data);
  });
  
  sync.on('sync_error', (data) => {
    console.error('Sync error:', data);
  });
  
  sync.on('peer_disconnected', (data) => {
    console.warn('Peer disconnected:', data);
  });
  
  // Initialize synchronization
  await sync.initialize(peers);
  
  return sync;
}