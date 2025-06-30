import { Socket } from 'net';
import { TLSSocket } from 'tls';
import http2 from 'http2';
import { promisify } from 'util';
import { EventEmitter } from 'events';

interface NetworkOptimizationConfig {
  enableHTTP2: boolean;
  enableTCPNoDelay: boolean;
  enableKeepAlive: boolean;
  keepAliveInitialDelay: number;
  socketTimeout: number;
  maxSockets: number;
  maxFreeSockets: number;
  enableCompression: boolean;
  compressionThreshold: number;
}

export class NetworkOptimizer extends EventEmitter {
  private config: NetworkOptimizationConfig;
  private http2Sessions: Map<string, http2.ClientHttp2Session> = new Map();
  private metrics: NetworkMetrics;
  
  constructor(config: Partial<NetworkOptimizationConfig> = {}) {
    super();
    
    this.config = {
      enableHTTP2: config.enableHTTP2 ?? true,
      enableTCPNoDelay: config.enableTCPNoDelay ?? true,
      enableKeepAlive: config.enableKeepAlive ?? true,
      keepAliveInitialDelay: config.keepAliveInitialDelay ?? 60000,
      socketTimeout: config.socketTimeout ?? 120000,
      maxSockets: config.maxSockets ?? 256,
      maxFreeSockets: config.maxFreeSockets ?? 256,
      enableCompression: config.enableCompression ?? true,
      compressionThreshold: config.compressionThreshold ?? 1024
    };
    
    this.metrics = new NetworkMetrics();
    this.setupGlobalAgent();
  }
  
  /**
   * Setup optimized global HTTP agent
   */
  private setupGlobalAgent(): void {
    const http = require('http');
    const https = require('https');
    
    // Configure HTTP agent
    http.globalAgent.keepAlive = this.config.enableKeepAlive;
    http.globalAgent.keepAliveMsecs = this.config.keepAliveInitialDelay;
    http.globalAgent.maxSockets = this.config.maxSockets;
    http.globalAgent.maxFreeSockets = this.config.maxFreeSockets;
    
    // Configure HTTPS agent
    https.globalAgent.keepAlive = this.config.enableKeepAlive;
    https.globalAgent.keepAliveMsecs = this.config.keepAliveInitialDelay;
    https.globalAgent.maxSockets = this.config.maxSockets;
    https.globalAgent.maxFreeSockets = this.config.maxFreeSockets;
    
    // Apply socket optimizations
    this.applySocketOptimizations();
  }
  
  /**
   * Apply TCP socket optimizations
   */
  private applySocketOptimizations(): void {
    const net = require('net');
    const originalConnect = net.Socket.prototype.connect;
    
    // Override socket connect to apply optimizations
    net.Socket.prototype.connect = function(...args: any[]) {
      const socket = originalConnect.apply(this, args);
      
      // TCP_NODELAY - disable Nagle's algorithm
      if (this.setNoDelay) {
        this.setNoDelay(true);
      }
      
      // Keep-alive settings
      if (this.setKeepAlive) {
        this.setKeepAlive(true, 60000);
      }
      
      // Socket timeout
      if (this.setTimeout) {
        this.setTimeout(120000);
      }
      
      return socket;
    };
  }
  
  /**
   * Create optimized HTTP/2 connection
   */
  async createHTTP2Connection(
    url: string,
    options?: http2.ClientSessionOptions
  ): Promise<OptimizedHTTP2Client> {
    const startTime = Date.now();
    
    try {
      // Check for existing session
      const existingSession = this.http2Sessions.get(url);
      if (existingSession && !existingSession.closed) {
        this.metrics.recordConnectionReuse();
        return new OptimizedHTTP2Client(existingSession, this.config);
      }
      
      // Create new session with optimizations
      const session = http2.connect(url, {
        ...options,
        settings: {
          enablePush: false,
          initialWindowSize: 65535,
          maxFrameSize: 16384,
          maxConcurrentStreams: 100,
          maxHeaderListSize: 8192,
          ...options?.settings
        },
        createConnection: (authority, options) => {
          return this.createOptimizedSocket(authority, options as any);
        }
      });
      
      // Store session for reuse
      this.http2Sessions.set(url, session);
      
      // Setup session event handlers
      this.setupHTTP2SessionHandlers(session, url);
      
      // Wait for session to be ready
      await new Promise<void>((resolve, reject) => {
        session.once('connect', resolve);
        session.once('error', reject);
      });
      
      this.metrics.recordConnection('http2', Date.now() - startTime);
      
      return new OptimizedHTTP2Client(session, this.config);
      
    } catch (error) {
      this.metrics.recordError('http2_connection', error);
      throw error;
    }
  }
  
  /**
   * Create optimized socket
   */
  private createOptimizedSocket(
    authority: URL,
    options: any
  ): Socket | TLSSocket {
    const isSecure = authority.protocol === 'https:';
    const port = parseInt(authority.port || (isSecure ? '443' : '80'));
    
    let socket: Socket | TLSSocket;
    
    if (isSecure) {
      const tls = require('tls');
      socket = tls.connect({
        host: authority.hostname,
        port,
        servername: authority.hostname,
        ...options,
        // TLS optimizations
        secureOptions: require('constants').SSL_OP_NO_SSLv2 | 
                      require('constants').SSL_OP_NO_SSLv3,
        ciphers: 'ECDHE+AESGCM:ECDHE+AES256:!aNULL:!MD5:!DSS',
        honorCipherOrder: true,
        sessionIdContext: 'neuralock'
      });
    } else {
      socket = new Socket();
      socket.connect(port, authority.hostname);
    }
    
    // Apply socket optimizations
    this.optimizeSocket(socket);
    
    return socket;
  }
  
  /**
   * Optimize socket settings
   */
  private optimizeSocket(socket: Socket | TLSSocket): void {
    // TCP_NODELAY
    if (this.config.enableTCPNoDelay) {
      socket.setNoDelay(true);
    }
    
    // Keep-alive
    if (this.config.enableKeepAlive) {
      socket.setKeepAlive(true, this.config.keepAliveInitialDelay);
    }
    
    // Socket timeout
    socket.setTimeout(this.config.socketTimeout);
    
    // Buffer sizes (platform-specific)
    try {
      // Increase send/receive buffer sizes
      const SO_SNDBUF = 7;
      const SO_RCVBUF = 8;
      const bufferSize = 256 * 1024; // 256KB
      
      (socket as any).setsockopt(SO_SNDBUF, bufferSize);
      (socket as any).setsockopt(SO_RCVBUF, bufferSize);
    } catch (error) {
      // Not all platforms support setsockopt
    }
  }
  
  /**
   * Setup HTTP/2 session event handlers
   */
  private setupHTTP2SessionHandlers(
    session: http2.ClientHttp2Session,
    url: string
  ): void {
    session.on('error', (error) => {
      console.error(`HTTP/2 session error for ${url}:`, error);
      this.metrics.recordError('http2_session', error);
    });
    
    session.on('frameError', (type, code, id) => {
      console.error(`HTTP/2 frame error: type=${type}, code=${code}, id=${id}`);
      this.metrics.recordError('http2_frame', new Error(`Frame error: ${type}`));
    });
    
    session.on('close', () => {
      this.http2Sessions.delete(url);
    });
    
    // Ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (!session.closed) {
        session.ping((err, duration) => {
          if (err) {
            console.error('HTTP/2 ping failed:', err);
          } else {
            this.metrics.recordPing(duration);
          }
        });
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  }
  
  /**
   * Optimize request for performance
   */
  optimizeRequest(request: any): any {
    const optimized = { ...request };
    
    // Enable compression for responses
    if (this.config.enableCompression) {
      optimized.headers = {
        ...optimized.headers,
        'accept-encoding': 'gzip, deflate, br'
      };
    }
    
    // Connection headers for HTTP/1.1
    if (!this.config.enableHTTP2) {
      optimized.headers = {
        ...optimized.headers,
        'connection': 'keep-alive'
      };
    }
    
    return optimized;
  }
  
  /**
   * Create connection pool for parallel requests
   */
  createConnectionPool(
    urls: string[],
    options?: ConnectionPoolOptions
  ): ConnectionPool {
    return new ConnectionPool(urls, {
      ...options,
      optimizer: this
    });
  }
  
  /**
   * Preconnect to servers for reduced latency
   */
  async preconnect(urls: string[]): Promise<void> {
    const preconnectPromises = urls.map(async (url) => {
      try {
        if (this.config.enableHTTP2) {
          await this.createHTTP2Connection(url);
        } else {
          // For HTTP/1.1, create and cache socket
          await this.warmConnection(url);
        }
        
        console.log(`Preconnected to ${url}`);
      } catch (error) {
        console.error(`Preconnect failed for ${url}:`, error);
      }
    });
    
    await Promise.all(preconnectPromises);
  }
  
  /**
   * Warm connection for HTTP/1.1
   */
  private async warmConnection(url: string): Promise<void> {
    const { request } = require(url.startsWith('https') ? 'https' : 'http');
    const urlObj = new URL(url);
    
    return new Promise((resolve, reject) => {
      const req = request({
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: '/',
        method: 'HEAD',
        agent: new (require(url.startsWith('https') ? 'https' : 'http').Agent)({
          keepAlive: true,
          maxSockets: 1
        })
      }, (res) => {
        res.resume();
        res.on('end', resolve);
      });
      
      req.on('error', reject);
      req.end();
    });
  }
  
  /**
   * Get network metrics
   */
  getMetrics(): NetworkMetricsData {
    return this.metrics.getSnapshot();
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Close all HTTP/2 sessions
    const closePromises = Array.from(this.http2Sessions.values()).map(
      session => promisify(session.close.bind(session))()
    );
    
    await Promise.all(closePromises);
    this.http2Sessions.clear();
  }
}

// Optimized HTTP/2 client
class OptimizedHTTP2Client {
  constructor(
    private session: http2.ClientHttp2Session,
    private config: NetworkOptimizationConfig
  ) {}
  
  /**
   * Make optimized request
   */
  async request(
    path: string,
    options?: RequestOptions
  ): Promise<OptimizedResponse> {
    const startTime = Date.now();
    
    const headers = {
      ':path': path,
      ':method': options?.method || 'GET',
      ...options?.headers
    };
    
    // Apply compression
    if (this.config.enableCompression) {
      headers['accept-encoding'] = 'gzip, deflate, br';
    }
    
    const stream = this.session.request(headers);
    
    // Handle request body
    if (options?.body) {
      const body = this.prepareBody(options.body);
      stream.end(body);
    } else {
      stream.end();
    }
    
    // Collect response
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let responseHeaders: any = {};
      
      stream.on('response', (headers) => {
        responseHeaders = headers;
      });
      
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        const duration = Date.now() - startTime;
        const body = Buffer.concat(chunks);
        
        resolve({
          status: responseHeaders[':status'],
          headers: responseHeaders,
          body: this.decompressBody(body, responseHeaders),
          duration,
          protocol: 'h2'
        });
      });
      
      stream.on('error', reject);
    });
  }
  
  /**
   * Prepare request body
   */
  private prepareBody(body: any): Buffer {
    if (Buffer.isBuffer(body)) return body;
    if (typeof body === 'string') return Buffer.from(body);
    return Buffer.from(JSON.stringify(body));
  }
  
  /**
   * Decompress response body if needed
   */
  private decompressBody(body: Buffer, headers: any): Buffer {
    const encoding = headers['content-encoding'];
    
    if (!encoding) return body;
    
    const zlib = require('zlib');
    
    switch (encoding) {
      case 'gzip':
        return zlib.gunzipSync(body);
      case 'deflate':
        return zlib.inflateSync(body);
      case 'br':
        return zlib.brotliDecompressSync(body);
      default:
        return body;
    }
  }
}

// Connection pool for parallel requests
class ConnectionPool {
  private connections: Map<string, any> = new Map();
  private metrics: PoolMetrics;
  
  constructor(
    private urls: string[],
    private options: ConnectionPoolOptions & { optimizer: NetworkOptimizer }
  ) {
    this.metrics = new PoolMetrics();
  }
  
  /**
   * Execute parallel requests
   */
  async parallelRequests(
    requests: PoolRequest[]
  ): Promise<OptimizedResponse[]> {
    const startTime = Date.now();
    
    // Group requests by URL
    const grouped = this.groupRequestsByUrl(requests);
    
    // Execute in parallel
    const promises: Promise<OptimizedResponse>[] = [];
    
    for (const [url, urlRequests] of grouped) {
      const client = await this.getOrCreateClient(url);
      
      for (const request of urlRequests) {
        promises.push(
          client.request(request.path, request.options)
            .then(response => {
              this.metrics.recordRequest(url, response.duration);
              return response;
            })
            .catch(error => {
              this.metrics.recordError(url, error);
              throw error;
            })
        );
      }
    }
    
    const results = await Promise.all(promises);
    
    this.metrics.recordBatch(requests.length, Date.now() - startTime);
    
    return results;
  }
  
  /**
   * Group requests by URL
   */
  private groupRequestsByUrl(
    requests: PoolRequest[]
  ): Map<string, PoolRequest[]> {
    const grouped = new Map<string, PoolRequest[]>();
    
    for (const request of requests) {
      const url = request.url || this.urls[0];
      const existing = grouped.get(url) || [];
      existing.push(request);
      grouped.set(url, existing);
    }
    
    return grouped;
  }
  
  /**
   * Get or create client for URL
   */
  private async getOrCreateClient(url: string): Promise<OptimizedHTTP2Client> {
    const existing = this.connections.get(url);
    if (existing) return existing;
    
    const client = await this.options.optimizer.createHTTP2Connection(url);
    this.connections.set(url, client);
    
    return client;
  }
  
  /**
   * Get pool metrics
   */
  getMetrics(): PoolMetricsData {
    return this.metrics.getSnapshot();
  }
}

// Network metrics collection
class NetworkMetrics {
  private connections = { http1: 0, http2: 0 };
  private connectionTimes: number[] = [];
  private pingTimes: number[] = [];
  private errors = new Map<string, number>();
  private connectionReuses = 0;
  
  recordConnection(protocol: string, duration: number): void {
    this.connections[protocol as keyof typeof this.connections]++;
    this.connectionTimes.push(duration);
  }
  
  recordConnectionReuse(): void {
    this.connectionReuses++;
  }
  
  recordPing(duration: number): void {
    this.pingTimes.push(duration);
  }
  
  recordError(type: string, error: any): void {
    this.errors.set(type, (this.errors.get(type) || 0) + 1);
  }
  
  getSnapshot(): NetworkMetricsData {
    return {
      connections: { ...this.connections },
      connectionReuses: this.connectionReuses,
      avgConnectionTime: this.average(this.connectionTimes),
      avgPingTime: this.average(this.pingTimes),
      errors: Object.fromEntries(this.errors)
    };
  }
  
  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}

// Pool metrics
class PoolMetrics {
  private requests = new Map<string, { count: number; totalTime: number }>();
  private batches: { size: number; duration: number }[] = [];
  private errors = new Map<string, number>();
  
  recordRequest(url: string, duration: number): void {
    const existing = this.requests.get(url) || { count: 0, totalTime: 0 };
    existing.count++;
    existing.totalTime += duration;
    this.requests.set(url, existing);
  }
  
  recordBatch(size: number, duration: number): void {
    this.batches.push({ size, duration });
  }
  
  recordError(url: string, error: any): void {
    this.errors.set(url, (this.errors.get(url) || 0) + 1);
  }
  
  getSnapshot(): PoolMetricsData {
    const requestStats = Object.fromEntries(
      Array.from(this.requests.entries()).map(([url, stats]) => [
        url,
        {
          count: stats.count,
          avgDuration: stats.totalTime / stats.count
        }
      ])
    );
    
    const avgBatchSize = this.batches.reduce((sum, b) => sum + b.size, 0) / this.batches.length || 0;
    const avgBatchDuration = this.batches.reduce((sum, b) => sum + b.duration, 0) / this.batches.length || 0;
    
    return {
      requests: requestStats,
      batches: {
        count: this.batches.length,
        avgSize: avgBatchSize,
        avgDuration: avgBatchDuration
      },
      errors: Object.fromEntries(this.errors)
    };
  }
}

// Type definitions
interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

interface OptimizedResponse {
  status: number;
  headers: Record<string, any>;
  body: Buffer;
  duration: number;
  protocol: string;
}

interface ConnectionPoolOptions {
  maxConcurrent?: number;
  timeout?: number;
}

interface PoolRequest {
  url?: string;
  path: string;
  options?: RequestOptions;
}

interface NetworkMetricsData {
  connections: Record<string, number>;
  connectionReuses: number;
  avgConnectionTime: number;
  avgPingTime: number;
  errors: Record<string, number>;
}

interface PoolMetricsData {
  requests: Record<string, { count: number; avgDuration: number }>;
  batches: {
    count: number;
    avgSize: number;
    avgDuration: number;
  };
  errors: Record<string, number>;
}

// Usage example
export async function setupNetworkOptimization(): Promise<NetworkOptimizer> {
  const optimizer = new NetworkOptimizer({
    enableHTTP2: true,
    enableTCPNoDelay: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 60000,
    socketTimeout: 120000,
    maxSockets: 256,
    maxFreeSockets: 256,
    enableCompression: true,
    compressionThreshold: 1024
  });
  
  // Preconnect to frequently used servers
  await optimizer.preconnect([
    'https://server1.neuralock.io',
    'https://server2.neuralock.io',
    'https://server3.neuralock.io'
  ]);
  
  return optimizer;
}