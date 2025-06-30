import { EventEmitter } from 'events';
import { URL } from 'url';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import http from 'http';
import https from 'https';

interface PoolConfig {
  minConnections: number;
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  maxRetries: number;
  retryDelay: number;
  keepAlive: boolean;
  keepAliveTimeout: number;
  healthCheckInterval: number;
  warmupConnections: boolean;
}

interface ConnectionStats {
  created: number;
  active: number;
  idle: number;
  failed: number;
  totalRequests: number;
  avgResponseTime: number;
  lastHealthCheck: number;
  healthy: boolean;
}

export class ConnectionPool extends EventEmitter {
  private config: PoolConfig;
  private connections: Map<string, PooledConnection[]> = new Map();
  private stats: Map<string, ConnectionStats> = new Map();
  private healthCheckTimer: NodeJS.Timer | null = null;
  
  constructor(config: Partial<PoolConfig> = {}) {
    super();
    
    this.config = {
      minConnections: config.minConnections ?? 5,
      maxConnections: config.maxConnections ?? 50,
      connectionTimeout: config.connectionTimeout ?? 30000,
      idleTimeout: config.idleTimeout ?? 300000, // 5 minutes
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      keepAlive: config.keepAlive ?? true,
      keepAliveTimeout: config.keepAliveTimeout ?? 60000,
      healthCheckInterval: config.healthCheckInterval ?? 30000,
      warmupConnections: config.warmupConnections ?? true
    };
    
    this.startHealthChecks();
  }
  
  /**
   * Initialize pool for a specific host
   */
  async initialize(hosts: string[]): Promise<void> {
    const initPromises = hosts.map(host => this.initializeHost(host));
    await Promise.all(initPromises);
  }
  
  /**
   * Initialize connections for a specific host
   */
  private async initializeHost(host: string): Promise<void> {
    const url = new URL(host);
    const key = this.getPoolKey(url);
    
    // Initialize stats
    this.stats.set(key, {
      created: 0,
      active: 0,
      idle: 0,
      failed: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      lastHealthCheck: Date.now(),
      healthy: true
    });
    
    // Create minimum connections
    const connections: PooledConnection[] = [];
    const createPromises: Promise<void>[] = [];
    
    for (let i = 0; i < this.config.minConnections; i++) {
      createPromises.push(
        this.createConnection(url)
          .then(conn => {
            connections.push(conn);
          })
          .catch(error => {
            console.error(`Failed to create initial connection to ${host}:`, error);
          })
      );
    }
    
    await Promise.all(createPromises);
    this.connections.set(key, connections);
    
    // Warmup connections if enabled
    if (this.config.warmupConnections) {
      await this.warmupConnections(key, connections);
    }
    
    console.log(`Initialized pool for ${host} with ${connections.length} connections`);
  }
  
  /**
   * Get a connection from the pool
   */
  async getConnection(url: string): Promise<PooledConnection> {
    const urlObj = new URL(url);
    const key = this.getPoolKey(urlObj);
    
    // Get or create connection pool for this host
    let pool = this.connections.get(key);
    if (!pool) {
      await this.initializeHost(url);
      pool = this.connections.get(key)!;
    }
    
    // Find an idle connection
    let connection = this.findIdleConnection(pool);
    
    // If no idle connection, create new one if under limit
    if (!connection) {
      const stats = this.stats.get(key)!;
      if (pool.length < this.config.maxConnections) {
        try {
          connection = await this.createConnection(urlObj);
          pool.push(connection);
        } catch (error) {
          stats.failed++;
          throw error;
        }
      } else {
        // Wait for a connection to become available
        connection = await this.waitForConnection(pool);
      }
    }
    
    // Mark connection as active
    connection.markActive();
    this.updateStats(key, 'acquire');
    
    return connection;
  }
  
  /**
   * Return a connection to the pool
   */
  releaseConnection(connection: PooledConnection): void {
    connection.markIdle();
    this.updateStats(connection.poolKey, 'release');
    
    // Check if connection should be closed
    if (connection.shouldClose()) {
      this.removeConnection(connection);
    }
  }
  
  /**
   * Create a new connection
   */
  private async createConnection(url: URL): Promise<PooledConnection> {
    const agent = url.protocol === 'https:' 
      ? new https.Agent({
          keepAlive: this.config.keepAlive,
          keepAliveMsecs: this.config.keepAliveTimeout,
          timeout: this.config.connectionTimeout,
          maxSockets: 1
        })
      : new http.Agent({
          keepAlive: this.config.keepAlive,
          keepAliveMsecs: this.config.keepAliveTimeout,
          timeout: this.config.connectionTimeout,
          maxSockets: 1
        });
    
    const axios_instance = axios.create({
      baseURL: url.origin,
      timeout: this.config.connectionTimeout,
      httpAgent: url.protocol === 'http:' ? agent : undefined,
      httpsAgent: url.protocol === 'https:' ? agent : undefined,
      maxRedirects: 0,
      validateStatus: () => true, // Don't throw on any status
      // Connection pooling optimizations
      headers: {
        'Connection': 'keep-alive',
        'Keep-Alive': `timeout=${Math.floor(this.config.keepAliveTimeout / 1000)}`
      }
    });
    
    // Add request/response interceptors for metrics
    this.addInterceptors(axios_instance, this.getPoolKey(url));
    
    const connection = new PooledConnection(
      axios_instance,
      agent,
      this.getPoolKey(url),
      this.config
    );
    
    // Update stats
    const stats = this.stats.get(this.getPoolKey(url))!;
    stats.created++;
    stats.idle++;
    
    this.emit('connection_created', {
      host: url.hostname,
      total: stats.created
    });
    
    return connection;
  }
  
  /**
   * Find an idle connection
   */
  private findIdleConnection(pool: PooledConnection[]): PooledConnection | null {
    for (const conn of pool) {
      if (conn.isIdle() && !conn.shouldClose()) {
        return conn;
      }
    }
    return null;
  }
  
  /**
   * Wait for a connection to become available
   */
  private async waitForConnection(
    pool: PooledConnection[]
  ): Promise<PooledConnection> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const connection = this.findIdleConnection(pool);
        
        if (connection) {
          clearInterval(checkInterval);
          resolve(connection);
        } else if (Date.now() - startTime > this.config.connectionTimeout) {
          clearInterval(checkInterval);
          reject(new Error('Connection pool timeout'));
        }
      }, 100);
    });
  }
  
  /**
   * Warmup connections
   */
  private async warmupConnections(
    key: string,
    connections: PooledConnection[]
  ): Promise<void> {
    const warmupPromises = connections.map(async (conn) => {
      try {
        await conn.instance.head('/health', { 
          timeout: 5000,
          validateStatus: () => true 
        });
      } catch (error) {
        // Warmup failed, but don't fail initialization
        console.warn(`Connection warmup failed: ${error.message}`);
      }
    });
    
    await Promise.all(warmupPromises);
  }
  
  /**
   * Remove a connection from the pool
   */
  private removeConnection(connection: PooledConnection): void {
    const pool = this.connections.get(connection.poolKey);
    if (!pool) return;
    
    const index = pool.indexOf(connection);
    if (index !== -1) {
      pool.splice(index, 1);
      connection.close();
      
      const stats = this.stats.get(connection.poolKey)!;
      stats.created--;
      
      this.emit('connection_closed', {
        poolKey: connection.poolKey,
        remaining: pool.length
      });
    }
  }
  
  /**
   * Add axios interceptors for metrics
   */
  private addInterceptors(instance: AxiosInstance, poolKey: string): void {
    // Request interceptor
    instance.interceptors.request.use(
      (config) => {
        (config as any).metadata = { startTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    instance.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config as any).metadata.startTime;
        this.recordResponseTime(poolKey, duration);
        return response;
      },
      (error) => {
        if (error.config) {
          const duration = Date.now() - (error.config as any).metadata.startTime;
          this.recordResponseTime(poolKey, duration);
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Record response time for metrics
   */
  private recordResponseTime(poolKey: string, duration: number): void {
    const stats = this.stats.get(poolKey);
    if (!stats) return;
    
    stats.totalRequests++;
    stats.avgResponseTime = 
      (stats.avgResponseTime * (stats.totalRequests - 1) + duration) / 
      stats.totalRequests;
  }
  
  /**
   * Update pool statistics
   */
  private updateStats(poolKey: string, action: 'acquire' | 'release'): void {
    const stats = this.stats.get(poolKey);
    if (!stats) return;
    
    const pool = this.connections.get(poolKey) || [];
    stats.active = pool.filter(c => c.isActive()).length;
    stats.idle = pool.filter(c => c.isIdle()).length;
  }
  
  /**
   * Start health check timer
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }
  
  /**
   * Perform health checks on all pools
   */
  private async performHealthChecks(): Promise<void> {
    const checks: Promise<void>[] = [];
    
    this.connections.forEach((pool, key) => {
      checks.push(this.checkPoolHealth(key, pool));
    });
    
    await Promise.all(checks);
  }
  
  /**
   * Check health of a specific pool
   */
  private async checkPoolHealth(
    key: string,
    pool: PooledConnection[]
  ): Promise<void> {
    const stats = this.stats.get(key)!;
    stats.lastHealthCheck = Date.now();
    
    // Remove expired connections
    const toRemove: PooledConnection[] = [];
    pool.forEach(conn => {
      if (conn.shouldClose()) {
        toRemove.push(conn);
      }
    });
    
    toRemove.forEach(conn => this.removeConnection(conn));
    
    // Ensure minimum connections
    const currentSize = pool.length;
    if (currentSize < this.config.minConnections) {
      const urlMatch = key.match(/^(https?):\/\/(.+)$/);
      if (urlMatch) {
        const url = new URL(`${urlMatch[1]}://${urlMatch[2]}`);
        const createCount = this.config.minConnections - currentSize;
        
        for (let i = 0; i < createCount; i++) {
          try {
            const conn = await this.createConnection(url);
            pool.push(conn);
          } catch (error) {
            console.error(`Failed to maintain minimum connections: ${error.message}`);
          }
        }
      }
    }
    
    // Test a random connection
    if (pool.length > 0) {
      const testConn = pool[Math.floor(Math.random() * pool.length)];
      try {
        await testConn.instance.head('/health', { 
          timeout: 5000,
          validateStatus: () => true 
        });
        stats.healthy = true;
      } catch (error) {
        stats.healthy = false;
        stats.failed++;
      }
    }
  }
  
  /**
   * Get pool key from URL
   */
  private getPoolKey(url: URL): string {
    return `${url.protocol}//${url.host}`;
  }
  
  /**
   * Get pool statistics
   */
  getStats(): Map<string, ConnectionStats> {
    return new Map(this.stats);
  }
  
  /**
   * Close all connections
   */
  async close(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    this.connections.forEach((pool) => {
      pool.forEach(conn => conn.close());
    });
    
    this.connections.clear();
    this.stats.clear();
    
    this.emit('pool_closed');
  }
}

// Pooled connection wrapper
class PooledConnection {
  private state: 'idle' | 'active' = 'idle';
  private lastUsed: number = Date.now();
  private requestCount: number = 0;
  private created: number = Date.now();
  
  constructor(
    public instance: AxiosInstance,
    private agent: http.Agent | https.Agent,
    public poolKey: string,
    private config: PoolConfig
  ) {}
  
  isIdle(): boolean {
    return this.state === 'idle';
  }
  
  isActive(): boolean {
    return this.state === 'active';
  }
  
  markActive(): void {
    this.state = 'active';
    this.lastUsed = Date.now();
    this.requestCount++;
  }
  
  markIdle(): void {
    this.state = 'idle';
    this.lastUsed = Date.now();
  }
  
  shouldClose(): boolean {
    // Close if idle too long
    if (this.state === 'idle' && 
        Date.now() - this.lastUsed > this.config.idleTimeout) {
      return true;
    }
    
    // Close if too many requests (connection rotation)
    if (this.requestCount > 1000) {
      return true;
    }
    
    // Close if too old (prevent stale connections)
    if (Date.now() - this.created > 3600000) { // 1 hour
      return true;
    }
    
    return false;
  }
  
  close(): void {
    this.agent.destroy();
  }
}

// Connection pool manager for multiple endpoints
export class ConnectionPoolManager {
  private pools: Map<string, ConnectionPool> = new Map();
  private defaultConfig: Partial<PoolConfig>;
  
  constructor(defaultConfig: Partial<PoolConfig> = {}) {
    this.defaultConfig = defaultConfig;
  }
  
  /**
   * Get or create pool for service
   */
  async getPool(
    serviceName: string,
    hosts: string[],
    config?: Partial<PoolConfig>
  ): Promise<ConnectionPool> {
    let pool = this.pools.get(serviceName);
    
    if (!pool) {
      pool = new ConnectionPool({ ...this.defaultConfig, ...config });
      await pool.initialize(hosts);
      this.pools.set(serviceName, pool);
    }
    
    return pool;
  }
  
  /**
   * Execute request using connection pool
   */
  async request(
    serviceName: string,
    config: AxiosRequestConfig
  ): Promise<any> {
    const pool = this.pools.get(serviceName);
    if (!pool) {
      throw new Error(`No pool configured for service: ${serviceName}`);
    }
    
    const url = axios.getUri(config);
    const connection = await pool.getConnection(url);
    
    try {
      const response = await connection.instance.request(config);
      return response;
    } finally {
      pool.releaseConnection(connection);
    }
  }
  
  /**
   * Get all pool statistics
   */
  getAllStats(): Map<string, Map<string, ConnectionStats>> {
    const allStats = new Map<string, Map<string, ConnectionStats>>();
    
    this.pools.forEach((pool, serviceName) => {
      allStats.set(serviceName, pool.getStats());
    });
    
    return allStats;
  }
  
  /**
   * Close all pools
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.pools.values()).map(
      pool => pool.close()
    );
    
    await Promise.all(closePromises);
    this.pools.clear();
  }
}

// Usage example
export async function setupConnectionPooling(): Promise<ConnectionPoolManager> {
  const manager = new ConnectionPoolManager({
    minConnections: 5,
    maxConnections: 50,
    connectionTimeout: 30000,
    idleTimeout: 300000,
    keepAlive: true,
    keepAliveTimeout: 60000,
    warmupConnections: true
  });
  
  // Configure pools for different services
  await manager.getPool('neuralock-servers', [
    'https://server1.neuralock.io',
    'https://server2.neuralock.io',
    'https://server3.neuralock.io',
    'https://server4.neuralock.io',
    'https://server5.neuralock.io'
  ]);
  
  await manager.getPool('blockchain-rpc', [
    'https://eth-mainnet.g.alchemy.com',
    'https://mainnet.infura.io'
  ], {
    maxConnections: 20,
    connectionTimeout: 60000
  });
  
  return manager;
}