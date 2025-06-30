import { EventEmitter } from 'events';
import PQueue from 'p-queue';
import { createHash } from 'crypto';

interface BatchConfig {
  maxBatchSize: number;
  maxBatchWait: number;
  maxConcurrent: number;
  retryAttempts: number;
  retryDelay: number;
  deduplicate: boolean;
  priorityLevels: number;
}

interface BatchItem<T, R> {
  id: string;
  data: T;
  priority: number;
  timestamp: number;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
  retries: number;
}

export class BatchProcessor<T, R> extends EventEmitter {
  private config: BatchConfig;
  private queue: Map<number, BatchItem<T, R>[]> = new Map();
  private processing: boolean = false;
  private processTimer: NodeJS.Timer | null = null;
  private metrics: BatchMetrics;
  private dedupeCache: Map<string, Promise<R>> = new Map();
  
  constructor(
    private processBatch: (items: T[]) => Promise<R[]>,
    config: Partial<BatchConfig> = {}
  ) {
    super();
    
    this.config = {
      maxBatchSize: config.maxBatchSize ?? 100,
      maxBatchWait: config.maxBatchWait ?? 50,
      maxConcurrent: config.maxConcurrent ?? 5,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      deduplicate: config.deduplicate ?? true,
      priorityLevels: config.priorityLevels ?? 3
    };
    
    this.metrics = new BatchMetrics();
    
    // Initialize priority queues
    for (let i = 0; i < this.config.priorityLevels; i++) {
      this.queue.set(i, []);
    }
  }
  
  /**
   * Add item to batch queue
   */
  async add(data: T, options?: AddOptions): Promise<R> {
    const startTime = Date.now();
    
    // Check for deduplication
    if (this.config.deduplicate) {
      const hash = this.hashItem(data);
      const existing = this.dedupeCache.get(hash);
      
      if (existing) {
        this.metrics.recordDedupe();
        return existing;
      }
    }
    
    return new Promise<R>((resolve, reject) => {
      const item: BatchItem<T, R> = {
        id: this.generateId(),
        data,
        priority: options?.priority ?? 1,
        timestamp: Date.now(),
        resolve,
        reject,
        retries: 0
      };
      
      // Add to appropriate priority queue
      const priorityQueue = this.queue.get(item.priority) || [];
      priorityQueue.push(item);
      this.queue.set(item.priority, priorityQueue);
      
      this.metrics.recordEnqueue(Date.now() - startTime);
      
      // Trigger processing
      this.scheduleProcessing();
      
      // Store promise for deduplication
      if (this.config.deduplicate) {
        const hash = this.hashItem(data);
        const promise = new Promise<R>((res, rej) => {
          item.resolve = (result) => {
            res(result);
            resolve(result);
            // Clean up dedupe cache after completion
            setTimeout(() => this.dedupeCache.delete(hash), 60000);
          };
          item.reject = (error) => {
            rej(error);
            reject(error);
            this.dedupeCache.delete(hash);
          };
        });
        this.dedupeCache.set(hash, promise);
      }
    });
  }
  
  /**
   * Add multiple items
   */
  async addBatch(
    items: T[],
    options?: AddOptions
  ): Promise<R[]> {
    const promises = items.map(item => this.add(item, options));
    return Promise.all(promises);
  }
  
  /**
   * Schedule batch processing
   */
  private scheduleProcessing(): void {
    if (this.processing) return;
    
    // Check if we should process immediately
    const totalItems = this.getTotalQueueSize();
    if (totalItems >= this.config.maxBatchSize) {
      this.processBatches();
      return;
    }
    
    // Schedule processing after wait time
    if (!this.processTimer) {
      this.processTimer = setTimeout(() => {
        this.processBatches();
      }, this.config.maxBatchWait);
    }
  }
  
  /**
   * Process all pending batches
   */
  private async processBatches(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    this.processTimer = null;
    
    try {
      while (this.getTotalQueueSize() > 0) {
        await this.processNextBatch();
      }
    } finally {
      this.processing = false;
    }
  }
  
  /**
   * Process next batch
   */
  private async processNextBatch(): Promise<void> {
    const batch = this.collectBatch();
    if (batch.length === 0) return;
    
    const startTime = Date.now();
    
    try {
      // Extract data from batch items
      const batchData = batch.map(item => item.data);
      
      // Process batch
      const results = await this.processBatch(batchData);
      
      // Validate results
      if (results.length !== batch.length) {
        throw new Error(
          `Batch processor returned ${results.length} results for ${batch.length} items`
        );
      }
      
      // Resolve promises
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
      
      this.metrics.recordBatch(
        batch.length,
        Date.now() - startTime,
        'success'
      );
      
      this.emit('batch_processed', {
        size: batch.length,
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      this.handleBatchError(batch, error);
      
      this.metrics.recordBatch(
        batch.length,
        Date.now() - startTime,
        'error'
      );
      
      this.emit('batch_error', {
        size: batch.length,
        error
      });
    }
  }
  
  /**
   * Collect items for next batch
   */
  private collectBatch(): BatchItem<T, R>[] {
    const batch: BatchItem<T, R>[] = [];
    
    // Collect items by priority
    for (let priority = 0; priority < this.config.priorityLevels; priority++) {
      const queue = this.queue.get(priority) || [];
      
      while (queue.length > 0 && batch.length < this.config.maxBatchSize) {
        const item = queue.shift()!;
        batch.push(item);
      }
      
      if (batch.length >= this.config.maxBatchSize) break;
    }
    
    return batch;
  }
  
  /**
   * Handle batch processing error
   */
  private handleBatchError(
    batch: BatchItem<T, R>[],
    error: any
  ): void {
    batch.forEach(item => {
      item.retries++;
      
      if (item.retries < this.config.retryAttempts) {
        // Re-queue for retry
        setTimeout(() => {
          const queue = this.queue.get(item.priority) || [];
          queue.push(item);
          this.queue.set(item.priority, queue);
          this.scheduleProcessing();
        }, this.config.retryDelay * item.retries);
        
        this.metrics.recordRetry();
      } else {
        // Max retries exceeded
        item.reject(new Error(`Batch processing failed: ${error.message}`));
        this.metrics.recordFailure();
      }
    });
  }
  
  /**
   * Get total queue size
   */
  private getTotalQueueSize(): number {
    let total = 0;
    this.queue.forEach(queue => {
      total += queue.length;
    });
    return total;
  }
  
  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Hash item for deduplication
   */
  private hashItem(data: T): string {
    const str = JSON.stringify(data);
    return createHash('sha256').update(str).digest('hex');
  }
  
  /**
   * Get current queue status
   */
  getQueueStatus(): QueueStatus {
    const status: QueueStatus = {
      total: 0,
      byPriority: {},
      processing: this.processing
    };
    
    this.queue.forEach((queue, priority) => {
      status.byPriority[priority] = queue.length;
      status.total += queue.length;
    });
    
    return status;
  }
  
  /**
   * Get metrics
   */
  getMetrics(): BatchMetricsData {
    return this.metrics.getSnapshot();
  }
  
  /**
   * Flush all pending items
   */
  async flush(): Promise<void> {
    if (this.processTimer) {
      clearTimeout(this.processTimer);
      this.processTimer = null;
    }
    
    await this.processBatches();
  }
  
  /**
   * Clear queue
   */
  clear(): void {
    this.queue.forEach((queue, priority) => {
      queue.forEach(item => {
        item.reject(new Error('Queue cleared'));
      });
      this.queue.set(priority, []);
    });
    
    this.dedupeCache.clear();
  }
}

// Specialized batch processors
export class EncryptionBatchProcessor extends BatchProcessor<EncryptRequest, EncryptResponse> {
  constructor(private neuralockClient: any) {
    super(
      async (items) => {
        // Group by contract for optimal processing
        const grouped = this.groupByContract(items);
        const results: EncryptResponse[] = [];
        
        for (const [contract, contractItems] of grouped) {
          const contractResults = await this.neuralockClient.batchEncrypt({
            contract,
            items: contractItems.map(item => ({
              objectId: item.objectId,
              data: item.data
            }))
          });
          
          results.push(...contractResults);
        }
        
        // Reorder to match input order
        return this.reorderResults(items, results);
      },
      {
        maxBatchSize: 50,
        maxBatchWait: 100,
        deduplicate: true
      }
    );
  }
  
  private groupByContract(
    items: EncryptRequest[]
  ): Map<string, EncryptRequest[]> {
    const grouped = new Map<string, EncryptRequest[]>();
    
    items.forEach(item => {
      const existing = grouped.get(item.contract) || [];
      existing.push(item);
      grouped.set(item.contract, existing);
    });
    
    return grouped;
  }
  
  private reorderResults(
    items: EncryptRequest[],
    results: EncryptResponse[]
  ): EncryptResponse[] {
    const resultMap = new Map<string, EncryptResponse>();
    
    results.forEach(result => {
      const key = `${result.contract}-${result.objectId}`;
      resultMap.set(key, result);
    });
    
    return items.map(item => {
      const key = `${item.contract}-${item.objectId}`;
      const result = resultMap.get(key);
      if (!result) {
        throw new Error(`Missing result for ${key}`);
      }
      return result;
    });
  }
}

// Batch metrics
class BatchMetrics {
  private enqueues = 0;
  private dedupes = 0;
  private batches: { size: number; duration: number; status: string }[] = [];
  private retries = 0;
  private failures = 0;
  private queueTimes: number[] = [];
  
  recordEnqueue(queueTime: number): void {
    this.enqueues++;
    this.queueTimes.push(queueTime);
  }
  
  recordDedupe(): void {
    this.dedupes++;
  }
  
  recordBatch(size: number, duration: number, status: string): void {
    this.batches.push({ size, duration, status });
  }
  
  recordRetry(): void {
    this.retries++;
  }
  
  recordFailure(): void {
    this.failures++;
  }
  
  getSnapshot(): BatchMetricsData {
    const successBatches = this.batches.filter(b => b.status === 'success');
    const avgBatchSize = successBatches.reduce((sum, b) => sum + b.size, 0) / successBatches.length || 0;
    const avgBatchDuration = successBatches.reduce((sum, b) => sum + b.duration, 0) / successBatches.length || 0;
    const avgQueueTime = this.queueTimes.reduce((sum, t) => sum + t, 0) / this.queueTimes.length || 0;
    
    return {
      enqueues: this.enqueues,
      dedupes: this.dedupes,
      batches: this.batches.length,
      avgBatchSize,
      avgBatchDuration,
      avgQueueTime,
      retries: this.retries,
      failures: this.failures,
      dedupeRate: this.dedupes / (this.enqueues + this.dedupes) || 0,
      successRate: successBatches.length / this.batches.length || 0
    };
  }
}

// Type definitions
interface AddOptions {
  priority?: number;
}

interface QueueStatus {
  total: number;
  byPriority: Record<number, number>;
  processing: boolean;
}

interface BatchMetricsData {
  enqueues: number;
  dedupes: number;
  batches: number;
  avgBatchSize: number;
  avgBatchDuration: number;
  avgQueueTime: number;
  retries: number;
  failures: number;
  dedupeRate: number;
  successRate: number;
}

interface EncryptRequest {
  contract: string;
  objectId: string;
  data: Buffer;
}

interface EncryptResponse {
  contract: string;
  objectId: string;
  encryptedData: Buffer;
  shareIds: string[];
}

// Advanced batch coordination
export class BatchCoordinator {
  private processors: Map<string, BatchProcessor<any, any>> = new Map();
  private globalQueue: PQueue;
  
  constructor(private config: BatchCoordinatorConfig) {
    this.globalQueue = new PQueue({
      concurrency: config.globalConcurrency || 10,
      interval: 1000,
      intervalCap: config.globalRateLimit || 100
    });
  }
  
  /**
   * Register a batch processor
   */
  registerProcessor(
    name: string,
    processor: BatchProcessor<any, any>
  ): void {
    this.processors.set(name, processor);
    
    // Forward events
    processor.on('batch_processed', (data) => {
      this.emit('processor_batch', { processor: name, ...data });
    });
    
    processor.on('batch_error', (data) => {
      this.emit('processor_error', { processor: name, ...data });
    });
  }
  
  /**
   * Submit work to appropriate processor
   */
  async submit<T, R>(
    processorName: string,
    data: T,
    options?: AddOptions
  ): Promise<R> {
    const processor = this.processors.get(processorName);
    if (!processor) {
      throw new Error(`Unknown processor: ${processorName}`);
    }
    
    return this.globalQueue.add(
      () => processor.add(data, options),
      { priority: options?.priority }
    );
  }
  
  /**
   * Get global status
   */
  getStatus(): GlobalBatchStatus {
    const processorStatus: Record<string, QueueStatus> = {};
    
    this.processors.forEach((processor, name) => {
      processorStatus[name] = processor.getQueueStatus();
    });
    
    return {
      processors: processorStatus,
      globalQueue: {
        size: this.globalQueue.size,
        pending: this.globalQueue.pending
      }
    };
  }
  
  private emit(event: string, data: any): void {
    // Event emission implementation
  }
}

interface BatchCoordinatorConfig {
  globalConcurrency?: number;
  globalRateLimit?: number;
}

interface GlobalBatchStatus {
  processors: Record<string, QueueStatus>;
  globalQueue: {
    size: number;
    pending: number;
  };
}

// Usage example
export async function setupBatchProcessing(
  neuralockClient: any
): Promise<BatchCoordinator> {
  const coordinator = new BatchCoordinator({
    globalConcurrency: 10,
    globalRateLimit: 100
  });
  
  // Register encryption batch processor
  const encryptProcessor = new EncryptionBatchProcessor(neuralockClient);
  coordinator.registerProcessor('encrypt', encryptProcessor);
  
  // Register other processors...
  
  return coordinator;
}