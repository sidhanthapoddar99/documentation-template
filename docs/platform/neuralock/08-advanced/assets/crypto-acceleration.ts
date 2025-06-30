import { Worker } from 'worker_threads';
import { cpus } from 'os';
import crypto from 'crypto';
import { promisify } from 'util';

// Check for hardware acceleration support
const isAESNISupported = (): boolean => {
  try {
    const cpuInfo = cpus()[0].model;
    return cpuInfo.includes('AES') || process.arch === 'x64';
  } catch {
    return false;
  }
};

interface CryptoAcceleratorConfig {
  enableGPU: boolean;
  enableAESNI: boolean;
  workerPoolSize: number;
  batchSize: number;
  queueSize: number;
}

export class CryptoAccelerator {
  private config: CryptoAcceleratorConfig;
  private workerPool: Worker[] = [];
  private gpuAccelerator?: GPUAccelerator;
  private jobQueue: CryptoJob[] = [];
  private metrics: AcceleratorMetrics;
  
  constructor(config: Partial<CryptoAcceleratorConfig> = {}) {
    this.config = {
      enableGPU: config.enableGPU ?? false,
      enableAESNI: config.enableAESNI ?? isAESNISupported(),
      workerPoolSize: config.workerPoolSize ?? cpus().length,
      batchSize: config.batchSize ?? 100,
      queueSize: config.queueSize ?? 10000
    };
    
    this.metrics = new AcceleratorMetrics();
    this.initialize();
  }
  
  /**
   * Initialize crypto acceleration resources
   */
  private async initialize(): Promise<void> {
    // Initialize worker pool for CPU-based operations
    for (let i = 0; i < this.config.workerPoolSize; i++) {
      const worker = new Worker('./crypto-worker.js', {
        workerData: {
          workerId: i,
          enableAESNI: this.config.enableAESNI
        }
      });
      
      worker.on('message', (result) => {
        this.handleWorkerResult(result);
      });
      
      worker.on('error', (error) => {
        console.error(`Worker ${i} error:`, error);
        this.metrics.recordError('worker', error);
      });
      
      this.workerPool.push(worker);
    }
    
    // Initialize GPU acceleration if enabled
    if (this.config.enableGPU) {
      try {
        this.gpuAccelerator = await GPUAccelerator.create();
        console.log('GPU acceleration initialized');
      } catch (error) {
        console.warn('GPU acceleration not available:', error);
        this.config.enableGPU = false;
      }
    }
    
    // Start batch processor
    this.startBatchProcessor();
  }
  
  /**
   * Encrypt data with hardware acceleration
   */
  async encrypt(
    data: Buffer,
    key: Buffer,
    options?: EncryptOptions
  ): Promise<EncryptedData> {
    const startTime = Date.now();
    
    try {
      // For small data, use direct CPU encryption
      if (data.length < 1024 || !this.shouldUseBatch(options)) {
        return await this.encryptDirect(data, key, options);
      }
      
      // For large data or batch operations, use accelerated path
      if (this.config.enableGPU && data.length > 1024 * 1024) {
        return await this.encryptGPU(data, key, options);
      }
      
      // Use worker pool for medium-sized data
      return await this.encryptWorker(data, key, options);
      
    } finally {
      this.metrics.recordOperation('encrypt', Date.now() - startTime, data.length);
    }
  }
  
  /**
   * Decrypt data with hardware acceleration
   */
  async decrypt(
    encryptedData: EncryptedData,
    key: Buffer,
    options?: DecryptOptions
  ): Promise<Buffer> {
    const startTime = Date.now();
    
    try {
      // For small data, use direct CPU decryption
      if (encryptedData.data.length < 1024 || !this.shouldUseBatch(options)) {
        return await this.decryptDirect(encryptedData, key, options);
      }
      
      // For large data, use accelerated path
      if (this.config.enableGPU && encryptedData.data.length > 1024 * 1024) {
        return await this.decryptGPU(encryptedData, key, options);
      }
      
      // Use worker pool for medium-sized data
      return await this.decryptWorker(encryptedData, key, options);
      
    } finally {
      this.metrics.recordOperation('decrypt', Date.now() - startTime, encryptedData.data.length);
    }
  }
  
  /**
   * Batch encrypt multiple items
   */
  async batchEncrypt(
    items: BatchEncryptItem[],
    options?: BatchOptions
  ): Promise<EncryptedData[]> {
    const startTime = Date.now();
    
    try {
      // Split into optimal batch sizes
      const batches = this.splitIntoBatches(items, this.config.batchSize);
      const results: EncryptedData[] = [];
      
      // Process batches in parallel
      const batchPromises = batches.map(batch => 
        this.processBatchEncrypt(batch, options)
      );
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(r => results.push(...r));
      
      return results;
      
    } finally {
      const totalSize = items.reduce((sum, item) => sum + item.data.length, 0);
      this.metrics.recordOperation('batch_encrypt', Date.now() - startTime, totalSize);
    }
  }
  
  /**
   * Direct CPU encryption (with AES-NI if available)
   */
  private async encryptDirect(
    data: Buffer,
    key: Buffer,
    options?: EncryptOptions
  ): Promise<EncryptedData> {
    const algorithm = options?.algorithm || 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);
    
    const tag = (cipher as any).getAuthTag();
    
    return {
      algorithm,
      data: encrypted,
      iv,
      tag
    };
  }
  
  /**
   * Direct CPU decryption
   */
  private async decryptDirect(
    encryptedData: EncryptedData,
    key: Buffer,
    options?: DecryptOptions
  ): Promise<Buffer> {
    const decipher = crypto.createDecipheriv(
      encryptedData.algorithm,
      key,
      encryptedData.iv
    );
    
    if (encryptedData.tag) {
      (decipher as any).setAuthTag(encryptedData.tag);
    }
    
    return Buffer.concat([
      decipher.update(encryptedData.data),
      decipher.final()
    ]);
  }
  
  /**
   * Worker-based encryption
   */
  private async encryptWorker(
    data: Buffer,
    key: Buffer,
    options?: EncryptOptions
  ): Promise<EncryptedData> {
    return new Promise((resolve, reject) => {
      const job: CryptoJob = {
        id: crypto.randomUUID(),
        type: 'encrypt',
        data,
        key,
        options,
        resolve,
        reject
      };
      
      this.enqueueJob(job);
    });
  }
  
  /**
   * Worker-based decryption
   */
  private async decryptWorker(
    encryptedData: EncryptedData,
    key: Buffer,
    options?: DecryptOptions
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const job: CryptoJob = {
        id: crypto.randomUUID(),
        type: 'decrypt',
        encryptedData,
        key,
        options,
        resolve,
        reject
      };
      
      this.enqueueJob(job);
    });
  }
  
  /**
   * GPU-accelerated encryption
   */
  private async encryptGPU(
    data: Buffer,
    key: Buffer,
    options?: EncryptOptions
  ): Promise<EncryptedData> {
    if (!this.gpuAccelerator) {
      return this.encryptWorker(data, key, options);
    }
    
    return await this.gpuAccelerator.encrypt(data, key, options);
  }
  
  /**
   * GPU-accelerated decryption
   */
  private async decryptGPU(
    encryptedData: EncryptedData,
    key: Buffer,
    options?: DecryptOptions
  ): Promise<Buffer> {
    if (!this.gpuAccelerator) {
      return this.decryptWorker(encryptedData, key, options);
    }
    
    return await this.gpuAccelerator.decrypt(encryptedData, key, options);
  }
  
  /**
   * Process batch encryption
   */
  private async processBatchEncrypt(
    batch: BatchEncryptItem[],
    options?: BatchOptions
  ): Promise<EncryptedData[]> {
    // Use GPU for large batches
    if (this.config.enableGPU && batch.length > 50) {
      return await this.gpuAccelerator!.batchEncrypt(batch, options);
    }
    
    // Otherwise use worker pool
    const promises = batch.map(item =>
      this.encryptWorker(item.data, item.key, options)
    );
    
    return await Promise.all(promises);
  }
  
  /**
   * Enqueue job for processing
   */
  private enqueueJob(job: CryptoJob): void {
    if (this.jobQueue.length >= this.config.queueSize) {
      job.reject(new Error('Crypto job queue full'));
      return;
    }
    
    this.jobQueue.push(job);
    this.processNextJob();
  }
  
  /**
   * Process next job in queue
   */
  private processNextJob(): void {
    if (this.jobQueue.length === 0) return;
    
    // Find available worker
    const availableWorker = this.findAvailableWorker();
    if (!availableWorker) return;
    
    const job = this.jobQueue.shift()!;
    availableWorker.postMessage(job);
  }
  
  /**
   * Find available worker
   */
  private findAvailableWorker(): Worker | null {
    // Simple round-robin for now
    // In production, track worker load
    return this.workerPool[0];
  }
  
  /**
   * Handle worker result
   */
  private handleWorkerResult(result: any): void {
    const { jobId, error, data } = result;
    
    // Find corresponding job
    const jobIndex = this.jobQueue.findIndex(j => j.id === jobId);
    if (jobIndex === -1) return;
    
    const job = this.jobQueue[jobIndex];
    this.jobQueue.splice(jobIndex, 1);
    
    if (error) {
      job.reject(new Error(error));
    } else {
      job.resolve(data);
    }
    
    // Process next job
    this.processNextJob();
  }
  
  /**
   * Start batch processor
   */
  private startBatchProcessor(): void {
    setInterval(() => {
      this.processBatchQueue();
    }, 10);
  }
  
  /**
   * Process batch queue
   */
  private processBatchQueue(): void {
    if (this.jobQueue.length < this.config.batchSize) return;
    
    const batch = this.jobQueue.splice(0, this.config.batchSize);
    // Process batch...
  }
  
  /**
   * Should use batch processing
   */
  private shouldUseBatch(options?: any): boolean {
    return options?.batch !== false;
  }
  
  /**
   * Split items into batches
   */
  private splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  
  /**
   * Get performance metrics
   */
  getMetrics(): AcceleratorMetricsData {
    return this.metrics.getSnapshot();
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Terminate workers
    await Promise.all(
      this.workerPool.map(w => w.terminate())
    );
    
    // Cleanup GPU resources
    if (this.gpuAccelerator) {
      await this.gpuAccelerator.cleanup();
    }
  }
}

// GPU Accelerator (simplified - would use WebGPU/CUDA in production)
class GPUAccelerator {
  static async create(): Promise<GPUAccelerator> {
    // Check for GPU availability
    // Initialize GPU context
    return new GPUAccelerator();
  }
  
  async encrypt(data: Buffer, key: Buffer, options?: EncryptOptions): Promise<EncryptedData> {
    // GPU-accelerated encryption implementation
    throw new Error('GPU encryption not implemented');
  }
  
  async decrypt(encryptedData: EncryptedData, key: Buffer, options?: DecryptOptions): Promise<Buffer> {
    // GPU-accelerated decryption implementation
    throw new Error('GPU decryption not implemented');
  }
  
  async batchEncrypt(items: BatchEncryptItem[], options?: BatchOptions): Promise<EncryptedData[]> {
    // GPU batch encryption
    throw new Error('GPU batch encryption not implemented');
  }
  
  async cleanup(): Promise<void> {
    // Cleanup GPU resources
  }
}

// Metrics collection
class AcceleratorMetrics {
  private operations: Map<string, OperationMetrics> = new Map();
  private errors: Map<string, number> = new Map();
  
  recordOperation(type: string, duration: number, size: number): void {
    const metrics = this.operations.get(type) || {
      count: 0,
      totalDuration: 0,
      totalSize: 0,
      durations: []
    };
    
    metrics.count++;
    metrics.totalDuration += duration;
    metrics.totalSize += size;
    metrics.durations.push(duration);
    
    // Keep only last 1000 durations for percentile calculation
    if (metrics.durations.length > 1000) {
      metrics.durations.shift();
    }
    
    this.operations.set(type, metrics);
  }
  
  recordError(type: string, error: any): void {
    this.errors.set(type, (this.errors.get(type) || 0) + 1);
  }
  
  getSnapshot(): AcceleratorMetricsData {
    const snapshot: AcceleratorMetricsData = {
      operations: {},
      errors: Object.fromEntries(this.errors),
      summary: {
        totalOperations: 0,
        avgThroughputMBps: 0
      }
    };
    
    let totalOps = 0;
    let totalMB = 0;
    let totalTime = 0;
    
    this.operations.forEach((metrics, type) => {
      const avgDuration = metrics.totalDuration / metrics.count;
      const throughputMBps = (metrics.totalSize / 1024 / 1024) / (metrics.totalDuration / 1000);
      
      snapshot.operations[type] = {
        count: metrics.count,
        avgDuration,
        throughputMBps,
        p95Duration: this.percentile(metrics.durations, 0.95),
        p99Duration: this.percentile(metrics.durations, 0.99)
      };
      
      totalOps += metrics.count;
      totalMB += metrics.totalSize / 1024 / 1024;
      totalTime += metrics.totalDuration / 1000;
    });
    
    snapshot.summary.totalOperations = totalOps;
    snapshot.summary.avgThroughputMBps = totalMB / totalTime;
    
    return snapshot;
  }
  
  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

// Type definitions
interface EncryptOptions {
  algorithm?: string;
  batch?: boolean;
}

interface DecryptOptions {
  batch?: boolean;
}

interface BatchOptions {
  parallel?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

interface EncryptedData {
  algorithm: string;
  data: Buffer;
  iv: Buffer;
  tag?: Buffer;
}

interface BatchEncryptItem {
  data: Buffer;
  key: Buffer;
}

interface CryptoJob {
  id: string;
  type: 'encrypt' | 'decrypt';
  data?: Buffer;
  encryptedData?: EncryptedData;
  key: Buffer;
  options?: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

interface OperationMetrics {
  count: number;
  totalDuration: number;
  totalSize: number;
  durations: number[];
}

interface AcceleratorMetricsData {
  operations: {
    [key: string]: {
      count: number;
      avgDuration: number;
      throughputMBps: number;
      p95Duration: number;
      p99Duration: number;
    };
  };
  errors: Record<string, number>;
  summary: {
    totalOperations: number;
    avgThroughputMBps: number;
  };
}

// Usage example
export async function setupCryptoAcceleration(): Promise<CryptoAccelerator> {
  const accelerator = new CryptoAccelerator({
    enableGPU: process.env.ENABLE_GPU === 'true',
    enableAESNI: true,
    workerPoolSize: cpus().length,
    batchSize: 100,
    queueSize: 10000
  });
  
  // Benchmark to verify acceleration
  const testData = crypto.randomBytes(1024 * 1024); // 1MB
  const testKey = crypto.randomBytes(32);
  
  console.log('Benchmarking crypto acceleration...');
  
  const startTime = Date.now();
  const encrypted = await accelerator.encrypt(testData, testKey);
  const decrypted = await accelerator.decrypt(encrypted, testKey);
  const duration = Date.now() - startTime;
  
  console.log(`Crypto round-trip (1MB): ${duration}ms`);
  console.log(`Throughput: ${(2 * 1024 * 1024) / duration} KB/s`);
  
  return accelerator;
}