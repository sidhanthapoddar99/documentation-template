import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { promisify } from 'util';

interface CacheConfig {
  memory: {
    maxSize: number;
    ttl: number;
  };
  redis: {
    nodes: string[];
    ttl: number;
  };
  features: {
    compression: boolean;
    encryption: boolean;
    stampedePrevention: boolean;
  };
}

export class MultiLayerCache {
  private l1Cache: LRUCache<string, any>;
  private l2Cache: Redis.Cluster;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  
  constructor(config: CacheConfig) {
    this.config = config;
    this.metrics = new CacheMetrics();
    
    // Initialize L1 Memory Cache
    this.l1Cache = new LRUCache({
      max: config.memory.maxSize,
      ttl: config.memory.ttl * 1000,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
      
      // Size calculation for memory management
      sizeCalculation: (value) => {
        if (Buffer.isBuffer(value)) return value.length;
        if (typeof value === 'string') return value.length * 2;
        return JSON.stringify(value).length * 2;
      },
      
      // Disposal function for cleanup
      dispose: (value, key) => {
        this.metrics.recordEviction('l1', key);
      }
    });
    
    // Initialize L2 Redis Cache
    this.l2Cache = new Redis.Cluster(
      config.redis.nodes.map(node => {
        const [host, port] = node.split(':');
        return { host, port: parseInt(port) };
      }),
      {
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        retryDelayOnClusterDown: 300,
        slotsRefreshTimeout: 2000,
        clusterRetryStrategy: (times) => {
          return Math.min(100 * Math.pow(2, times), 3000);
        }
      }
    );
    
    this.setupEventHandlers();
  }
  
  /**
   * Get value from cache with multi-layer fallback
   */
  async get<T>(key: string, options?: GetOptions): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Check L1 cache
      const l1Value = this.l1Cache.get(key);
      if (l1Value !== undefined) {
        this.metrics.recordHit('l1', Date.now() - startTime);
        return this.deserializeValue<T>(l1Value);
      }
      
      // Check L2 cache
      const l2Value = await this.l2Cache.get(this.getRedisKey(key));
      if (l2Value) {
        this.metrics.recordHit('l2', Date.now() - startTime);
        
        // Backfill L1 cache
        const deserialized = this.deserializeValue<T>(l2Value);
        this.l1Cache.set(key, deserialized);
        
        return deserialized;
      }
      
      // Cache miss
      this.metrics.recordMiss(Date.now() - startTime);
      
      // If loader function provided, fetch and cache
      if (options?.loader) {
        return await this.loadAndCache(key, options.loader, options);
      }
      
      return null;
    } catch (error) {
      this.metrics.recordError('get', error);
      
      // Fallback to loader if available
      if (options?.loader) {
        return await options.loader();
      }
      
      throw error;
    }
  }
  
  /**
   * Set value in cache layers
   */
  async set<T>(
    key: string, 
    value: T, 
    options?: SetOptions
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const serialized = this.serializeValue(value);
      const ttl = options?.ttl || this.config.memory.ttl;
      
      // Set in L1 cache
      this.l1Cache.set(key, value, { ttl: ttl * 1000 });
      
      // Set in L2 cache
      const redisKey = this.getRedisKey(key);
      const redisTTL = options?.ttl || this.config.redis.ttl;
      
      if (this.config.features.compression && serialized.length > 1024) {
        const compressed = await this.compress(serialized);
        await this.l2Cache.setex(
          redisKey,
          redisTTL,
          compressed
        );
      } else {
        await this.l2Cache.setex(
          redisKey,
          redisTTL,
          serialized
        );
      }
      
      this.metrics.recordSet(Date.now() - startTime);
      
      // Handle cache tags for invalidation
      if (options?.tags) {
        await this.tagCache(key, options.tags);
      }
    } catch (error) {
      this.metrics.recordError('set', error);
      throw error;
    }
  }
  
  /**
   * Delete value from all cache layers
   */
  async delete(key: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Delete from L1
      this.l1Cache.delete(key);
      
      // Delete from L2
      await this.l2Cache.del(this.getRedisKey(key));
      
      this.metrics.recordDelete(Date.now() - startTime);
    } catch (error) {
      this.metrics.recordError('delete', error);
      throw error;
    }
  }
  
  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      const keysToInvalidate = new Set<string>();
      
      // Get all keys associated with tags
      for (const tag of tags) {
        const keys = await this.l2Cache.smembers(`tag:${tag}`);
        keys.forEach(key => keysToInvalidate.add(key));
      }
      
      // Invalidate all keys
      const invalidationPromises = Array.from(keysToInvalidate).map(
        key => this.delete(key)
      );
      
      await Promise.all(invalidationPromises);
      
      // Clean up tag sets
      const tagCleanupPromises = tags.map(
        tag => this.l2Cache.del(`tag:${tag}`)
      );
      
      await Promise.all(tagCleanupPromises);
      
      this.metrics.recordInvalidation(
        keysToInvalidate.size,
        Date.now() - startTime
      );
    } catch (error) {
      this.metrics.recordError('invalidate', error);
      throw error;
    }
  }
  
  /**
   * Load value and cache with stampede prevention
   */
  private async loadAndCache<T>(
    key: string,
    loader: () => Promise<T>,
    options?: GetOptions
  ): Promise<T> {
    if (this.config.features.stampedePrevention) {
      return await this.loadWithStampedePrevention(key, loader, options);
    }
    
    // Simple load and cache
    const value = await loader();
    await this.set(key, value, options);
    return value;
  }
  
  /**
   * Prevent cache stampede using probabilistic early expiration
   */
  private async loadWithStampedePrevention<T>(
    key: string,
    loader: () => Promise<T>,
    options?: GetOptions
  ): Promise<T> {
    const lockKey = `lock:${key}`;
    const lockTTL = 30; // 30 seconds
    
    // Try to acquire lock
    const acquired = await this.l2Cache.set(
      lockKey,
      '1',
      'NX',
      'EX',
      lockTTL
    );
    
    if (acquired) {
      try {
        // We have the lock, load the value
        const value = await loader();
        await this.set(key, value, options);
        return value;
      } finally {
        // Release lock
        await this.l2Cache.del(lockKey);
      }
    } else {
      // Another process is loading, wait and retry
      await this.sleep(100);
      
      // Check if value is now in cache
      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        return cachedValue;
      }
      
      // Retry with exponential backoff
      return await this.loadWithStampedePrevention(key, loader, options);
    }
  }
  
  /**
   * Tag cache entries for bulk invalidation
   */
  private async tagCache(key: string, tags: string[]): Promise<void> {
    const pipeline = this.l2Cache.pipeline();
    
    for (const tag of tags) {
      pipeline.sadd(`tag:${tag}`, key);
      pipeline.expire(`tag:${tag}`, 86400); // 24 hours
    }
    
    await pipeline.exec();
  }
  
  /**
   * Serialize value for storage
   */
  private serializeValue(value: any): string {
    if (this.config.features.encryption) {
      const json = JSON.stringify(value);
      return this.encrypt(json);
    }
    return JSON.stringify(value);
  }
  
  /**
   * Deserialize value from storage
   */
  private deserializeValue<T>(value: any): T {
    if (typeof value === 'string') {
      if (this.config.features.encryption) {
        const decrypted = this.decrypt(value);
        return JSON.parse(decrypted);
      }
      return JSON.parse(value);
    }
    return value;
  }
  
  /**
   * Compress data using zlib
   */
  private async compress(data: string): Promise<string> {
    const { gzip } = await import('zlib');
    const gzipAsync = promisify(gzip);
    const compressed = await gzipAsync(Buffer.from(data));
    return compressed.toString('base64');
  }
  
  /**
   * Decompress data
   */
  private async decompress(data: string): Promise<string> {
    const { gunzip } = await import('zlib');
    const gunzipAsync = promisify(gunzip);
    const decompressed = await gunzipAsync(Buffer.from(data, 'base64'));
    return decompressed.toString();
  }
  
  /**
   * Simple encryption (implement with proper crypto in production)
   */
  private encrypt(data: string): string {
    // Simplified - use proper encryption in production
    return Buffer.from(data).toString('base64');
  }
  
  /**
   * Simple decryption
   */
  private decrypt(data: string): string {
    // Simplified - use proper decryption in production
    return Buffer.from(data, 'base64').toString();
  }
  
  /**
   * Get Redis key with namespace
   */
  private getRedisKey(key: string): string {
    return `neuralock:cache:${key}`;
  }
  
  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    this.l2Cache.on('error', (error) => {
      console.error('Redis cache error:', error);
      this.metrics.recordError('redis', error);
    });
    
    this.l2Cache.on('node error', (error, node) => {
      console.error(`Redis node error (${node}):`, error);
      this.metrics.recordError('redis_node', error);
    });
  }
  
  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetricsData {
    return this.metrics.getSnapshot();
  }
  
  /**
   * Clear all cache layers
   */
  async clear(): Promise<void> {
    this.l1Cache.clear();
    
    // Clear L2 cache (be careful in production!)
    const keys = await this.l2Cache.keys('neuralock:cache:*');
    if (keys.length > 0) {
      await this.l2Cache.del(...keys);
    }
    
    this.metrics.reset();
  }
  
  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(keys: WarmUpConfig[]): Promise<void> {
    const warmUpPromises = keys.map(async (config) => {
      const value = await config.loader();
      await this.set(config.key, value, { 
        ttl: config.ttl,
        tags: config.tags 
      });
    });
    
    await Promise.all(warmUpPromises);
  }
}

// Cache metrics collection
class CacheMetrics {
  private hits: Map<string, number> = new Map();
  private misses: number = 0;
  private errors: Map<string, number> = new Map();
  private latencies: number[] = [];
  
  recordHit(layer: string, latency: number): void {
    this.hits.set(layer, (this.hits.get(layer) || 0) + 1);
    this.latencies.push(latency);
  }
  
  recordMiss(latency: number): void {
    this.misses++;
    this.latencies.push(latency);
  }
  
  recordSet(latency: number): void {
    this.latencies.push(latency);
  }
  
  recordDelete(latency: number): void {
    this.latencies.push(latency);
  }
  
  recordEviction(layer: string, key: string): void {
    // Track evictions
  }
  
  recordInvalidation(count: number, latency: number): void {
    this.latencies.push(latency);
  }
  
  recordError(operation: string, error: any): void {
    this.errors.set(operation, (this.errors.get(operation) || 0) + 1);
  }
  
  getSnapshot(): CacheMetricsData {
    const totalHits = Array.from(this.hits.values()).reduce((a, b) => a + b, 0);
    const hitRate = totalHits / (totalHits + this.misses) || 0;
    
    return {
      hitRate,
      hits: Object.fromEntries(this.hits),
      misses: this.misses,
      errors: Object.fromEntries(this.errors),
      avgLatency: this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length || 0,
      p95Latency: this.percentile(this.latencies, 0.95),
      p99Latency: this.percentile(this.latencies, 0.99)
    };
  }
  
  reset(): void {
    this.hits.clear();
    this.misses = 0;
    this.errors.clear();
    this.latencies = [];
  }
  
  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

// Type definitions
interface GetOptions {
  loader?: () => Promise<any>;
  ttl?: number;
}

interface SetOptions {
  ttl?: number;
  tags?: string[];
}

interface WarmUpConfig {
  key: string;
  loader: () => Promise<any>;
  ttl?: number;
  tags?: string[];
}

interface CacheMetricsData {
  hitRate: number;
  hits: Record<string, number>;
  misses: number;
  errors: Record<string, number>;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
}

// Usage example
export async function setupCache(): Promise<MultiLayerCache> {
  const cache = new MultiLayerCache({
    memory: {
      maxSize: 1024 * 1024 * 1024, // 1GB
      ttl: 300 // 5 minutes
    },
    redis: {
      nodes: [
        'redis-1:6379',
        'redis-2:6379',
        'redis-3:6379'
      ],
      ttl: 3600 // 1 hour
    },
    features: {
      compression: true,
      encryption: false,
      stampedePrevention: true
    }
  });
  
  // Warm up cache with critical data
  await cache.warmUp([
    {
      key: 'server-config',
      loader: async () => await fetchServerConfig(),
      ttl: 3600
    },
    {
      key: 'threshold-status',
      loader: async () => await getThresholdStatus(),
      ttl: 60
    }
  ]);
  
  return cache;
}