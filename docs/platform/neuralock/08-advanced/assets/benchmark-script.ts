import { performance } from 'perf_hooks';
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import * as fs from 'fs/promises';
import { createObjectCsvWriter } from 'csv-writer';
import { NeuralockClient } from '@neuralock/sdk';
import axios from 'axios';

interface BenchmarkConfig {
  servers: string[];
  threshold: { k: number; n: number };
  duration: number; // seconds
  concurrent: number;
  dataSize: number; // bytes
  operations: ('encrypt' | 'decrypt' | 'session')[];
  warmupDuration: number;
  outputFormat: 'json' | 'csv' | 'console';
  outputFile?: string;
}

interface BenchmarkResult {
  operation: string;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number; // ops/sec
  errorRate: number;
  timestamp: number;
}

export class NeuralockBenchmark {
  private config: BenchmarkConfig;
  private client: NeuralockClient;
  private results: Map<string, OperationMetrics> = new Map();
  private running: boolean = false;
  private workers: Worker[] = [];
  
  constructor(config: BenchmarkConfig) {
    this.config = config;
    this.client = new NeuralockClient({
      servers: config.servers,
      threshold: config.threshold
    });
  }
  
  /**
   * Run complete benchmark suite
   */
  async run(): Promise<BenchmarkResult[]> {
    console.log('Starting Neuralock benchmark...');
    console.log(`Configuration:`, this.config);
    
    // Initialize metrics
    this.config.operations.forEach(op => {
      this.results.set(op, new OperationMetrics(op));
    });
    
    // Warmup phase
    if (this.config.warmupDuration > 0) {
      console.log(`\nWarming up for ${this.config.warmupDuration}s...`);
      await this.warmup();
    }
    
    // Main benchmark
    console.log(`\nRunning benchmark for ${this.config.duration}s...`);
    this.running = true;
    
    const startTime = Date.now();
    const endTime = startTime + (this.config.duration * 1000);
    
    // Start worker threads
    await this.startWorkers();
    
    // Progress reporting
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = (elapsed / this.config.duration) * 100;
      process.stdout.write(`\rProgress: ${progress.toFixed(1)}%`);
    }, 1000);
    
    // Wait for benchmark to complete
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (Date.now() >= endTime) {
          this.running = false;
          clearInterval(checkInterval);
          clearInterval(progressInterval);
          resolve(undefined);
        }
      }, 100);
    });
    
    // Stop workers
    await this.stopWorkers();
    
    // Calculate results
    const results = this.calculateResults();
    
    // Output results
    await this.outputResults(results);
    
    return results;
  }
  
  /**
   * Warmup phase
   */
  private async warmup(): Promise<void> {
    const warmupEndTime = Date.now() + (this.config.warmupDuration * 1000);
    
    // Create test data
    const testData = Buffer.alloc(this.config.dataSize, 'test');
    
    while (Date.now() < warmupEndTime) {
      try {
        // Session creation
        if (this.config.operations.includes('session')) {
          await this.client.createSession();
        }
        
        // Encryption
        if (this.config.operations.includes('encrypt')) {
          await this.client.encrypt(testData, 'warmup-object');
        }
        
        // Small delay to avoid overwhelming
        await this.sleep(10);
      } catch (error) {
        // Ignore warmup errors
      }
    }
  }
  
  /**
   * Start worker threads
   */
  private async startWorkers(): Promise<void> {
    const workerCount = Math.min(this.config.concurrent, cpus().length);
    
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(__filename, {
        workerData: {
          workerId: i,
          config: this.config,
          isWorker: true
        }
      });
      
      worker.on('message', (message) => {
        if (message.type === 'result') {
          this.recordResult(message.operation, message.latency, message.success);
        }
      });
      
      worker.on('error', (error) => {
        console.error(`Worker ${i} error:`, error);
      });
      
      this.workers.push(worker);
    }
    
    // Start workers
    this.workers.forEach(worker => {
      worker.postMessage({ command: 'start' });
    });
  }
  
  /**
   * Stop worker threads
   */
  private async stopWorkers(): Promise<void> {
    // Signal workers to stop
    this.workers.forEach(worker => {
      worker.postMessage({ command: 'stop' });
    });
    
    // Wait for workers to finish
    await Promise.all(
      this.workers.map(worker => 
        new Promise(resolve => {
          worker.once('exit', resolve);
          worker.terminate();
        })
      )
    );
    
    this.workers = [];
  }
  
  /**
   * Record operation result
   */
  private recordResult(
    operation: string,
    latency: number,
    success: boolean
  ): void {
    const metrics = this.results.get(operation);
    if (metrics) {
      metrics.record(latency, success);
    }
  }
  
  /**
   * Calculate final results
   */
  private calculateResults(): BenchmarkResult[] {
    const results: BenchmarkResult[] = [];
    
    this.results.forEach((metrics, operation) => {
      const stats = metrics.getStats();
      results.push({
        operation,
        totalOperations: stats.total,
        successfulOperations: stats.successful,
        failedOperations: stats.failed,
        avgLatency: stats.avgLatency,
        minLatency: stats.minLatency,
        maxLatency: stats.maxLatency,
        p50Latency: stats.p50Latency,
        p95Latency: stats.p95Latency,
        p99Latency: stats.p99Latency,
        throughput: stats.throughput,
        errorRate: stats.errorRate,
        timestamp: Date.now()
      });
    });
    
    return results;
  }
  
  /**
   * Output benchmark results
   */
  private async outputResults(results: BenchmarkResult[]): Promise<void> {
    switch (this.config.outputFormat) {
      case 'console':
        this.outputConsole(results);
        break;
        
      case 'json':
        await this.outputJSON(results);
        break;
        
      case 'csv':
        await this.outputCSV(results);
        break;
    }
  }
  
  /**
   * Output to console
   */
  private outputConsole(results: BenchmarkResult[]): void {
    console.log('\n\n=== Benchmark Results ===\n');
    
    results.forEach(result => {
      console.log(`Operation: ${result.operation}`);
      console.log(`  Total Operations: ${result.totalOperations}`);
      console.log(`  Successful: ${result.successfulOperations}`);
      console.log(`  Failed: ${result.failedOperations}`);
      console.log(`  Error Rate: ${(result.errorRate * 100).toFixed(2)}%`);
      console.log(`  Throughput: ${result.throughput.toFixed(2)} ops/sec`);
      console.log(`  Latency:`);
      console.log(`    Average: ${result.avgLatency.toFixed(2)}ms`);
      console.log(`    Min: ${result.minLatency.toFixed(2)}ms`);
      console.log(`    Max: ${result.maxLatency.toFixed(2)}ms`);
      console.log(`    P50: ${result.p50Latency.toFixed(2)}ms`);
      console.log(`    P95: ${result.p95Latency.toFixed(2)}ms`);
      console.log(`    P99: ${result.p99Latency.toFixed(2)}ms`);
      console.log('');
    });
    
    // Summary
    const totalOps = results.reduce((sum, r) => sum + r.totalOperations, 0);
    const totalThroughput = results.reduce((sum, r) => sum + r.throughput, 0);
    
    console.log('=== Summary ===');
    console.log(`Total Operations: ${totalOps}`);
    console.log(`Combined Throughput: ${totalThroughput.toFixed(2)} ops/sec`);
    console.log(`Duration: ${this.config.duration}s`);
    console.log(`Concurrency: ${this.config.concurrent}`);
    console.log(`Data Size: ${this.config.dataSize} bytes`);
  }
  
  /**
   * Output to JSON file
   */
  private async outputJSON(results: BenchmarkResult[]): Promise<void> {
    const output = {
      config: this.config,
      results,
      summary: {
        totalOperations: results.reduce((sum, r) => sum + r.totalOperations, 0),
        combinedThroughput: results.reduce((sum, r) => sum + r.throughput, 0),
        timestamp: Date.now()
      }
    };
    
    const filename = this.config.outputFile || `benchmark-${Date.now()}.json`;
    await fs.writeFile(filename, JSON.stringify(output, null, 2));
    console.log(`\nResults written to ${filename}`);
  }
  
  /**
   * Output to CSV file
   */
  private async outputCSV(results: BenchmarkResult[]): Promise<void> {
    const filename = this.config.outputFile || `benchmark-${Date.now()}.csv`;
    
    const csvWriter = createObjectCsvWriter({
      path: filename,
      header: [
        { id: 'operation', title: 'Operation' },
        { id: 'totalOperations', title: 'Total Operations' },
        { id: 'successfulOperations', title: 'Successful' },
        { id: 'failedOperations', title: 'Failed' },
        { id: 'errorRate', title: 'Error Rate' },
        { id: 'throughput', title: 'Throughput (ops/sec)' },
        { id: 'avgLatency', title: 'Avg Latency (ms)' },
        { id: 'minLatency', title: 'Min Latency (ms)' },
        { id: 'maxLatency', title: 'Max Latency (ms)' },
        { id: 'p50Latency', title: 'P50 Latency (ms)' },
        { id: 'p95Latency', title: 'P95 Latency (ms)' },
        { id: 'p99Latency', title: 'P99 Latency (ms)' }
      ]
    });
    
    await csvWriter.writeRecords(results);
    console.log(`\nResults written to ${filename}`);
  }
  
  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Operation metrics collector
class OperationMetrics {
  private latencies: number[] = [];
  private successful: number = 0;
  private failed: number = 0;
  private startTime: number = Date.now();
  
  constructor(private operation: string) {}
  
  record(latency: number, success: boolean): void {
    this.latencies.push(latency);
    if (success) {
      this.successful++;
    } else {
      this.failed++;
    }
  }
  
  getStats(): any {
    const total = this.latencies.length;
    const duration = (Date.now() - this.startTime) / 1000;
    
    if (total === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        throughput: 0,
        errorRate: 0
      };
    }
    
    const sorted = [...this.latencies].sort((a, b) => a - b);
    
    return {
      total,
      successful: this.successful,
      failed: this.failed,
      avgLatency: this.latencies.reduce((a, b) => a + b, 0) / total,
      minLatency: sorted[0],
      maxLatency: sorted[sorted.length - 1],
      p50Latency: this.percentile(sorted, 0.5),
      p95Latency: this.percentile(sorted, 0.95),
      p99Latency: this.percentile(sorted, 0.99),
      throughput: total / duration,
      errorRate: this.failed / total
    };
  }
  
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Worker thread code
if (require('worker_threads').workerData?.isWorker) {
  const { parentPort, workerData } = require('worker_threads');
  const config = workerData.config;
  let running = false;
  
  // Initialize client
  const client = new NeuralockClient({
    servers: config.servers,
    threshold: config.threshold
  });
  
  // Test data
  const testData = Buffer.alloc(config.dataSize, 'benchmark');
  const objectIds = Array.from({ length: 100 }, (_, i) => `object-${i}`);
  
  // Worker operations
  async function runOperations() {
    while (running) {
      for (const operation of config.operations) {
        if (!running) break;
        
        const startTime = performance.now();
        let success = true;
        
        try {
          switch (operation) {
            case 'session':
              await client.createSession();
              break;
              
            case 'encrypt':
              const objectId = objectIds[Math.floor(Math.random() * objectIds.length)];
              await client.encrypt(testData, objectId);
              break;
              
            case 'decrypt':
              // Assume some objects are already encrypted
              const decryptId = objectIds[Math.floor(Math.random() * objectIds.length)];
              await client.decrypt(decryptId);
              break;
          }
        } catch (error) {
          success = false;
        }
        
        const latency = performance.now() - startTime;
        
        parentPort?.postMessage({
          type: 'result',
          operation,
          latency,
          success
        });
      }
      
      // Small delay to prevent tight loop
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  
  // Handle messages from main thread
  parentPort?.on('message', (message) => {
    if (message.command === 'start') {
      running = true;
      runOperations();
    } else if (message.command === 'stop') {
      running = false;
    }
  });
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const config: BenchmarkConfig = {
    servers: process.env.NEURALOCK_SERVERS?.split(',') || [
      'http://localhost:8001',
      'http://localhost:8002',
      'http://localhost:8003',
      'http://localhost:8004',
      'http://localhost:8005'
    ],
    threshold: {
      k: parseInt(args.find(a => a.startsWith('--k='))?.split('=')[1] || '3'),
      n: parseInt(args.find(a => a.startsWith('--n='))?.split('=')[1] || '5')
    },
    duration: parseInt(args.find(a => a.startsWith('--duration='))?.split('=')[1] || '60'),
    concurrent: parseInt(args.find(a => a.startsWith('--concurrent='))?.split('=')[1] || '10'),
    dataSize: parseInt(args.find(a => a.startsWith('--size='))?.split('=')[1] || '1024'),
    operations: (args.find(a => a.startsWith('--ops='))?.split('=')[1] || 'encrypt,decrypt,session').split(',') as any,
    warmupDuration: parseInt(args.find(a => a.startsWith('--warmup='))?.split('=')[1] || '10'),
    outputFormat: (args.find(a => a.startsWith('--format='))?.split('=')[1] || 'console') as any,
    outputFile: args.find(a => a.startsWith('--output='))?.split('=')[1]
  };
  
  const benchmark = new NeuralockBenchmark(config);
  benchmark.run()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Benchmark failed:', error);
      process.exit(1);
    });
}