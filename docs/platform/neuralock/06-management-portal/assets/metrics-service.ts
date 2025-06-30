// Metrics Service Implementation
import { EventEmitter } from 'events';

interface MetricPoint {
  timestamp: number;
  value: number;
  tags: Record<string, string>;
}

interface AggregatedMetric {
  metric: string;
  period: '1m' | '5m' | '1h' | '1d';
  timestamp: number;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

interface MetricQuery {
  metric: string;
  startTime: Date;
  endTime: Date;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupBy?: string[];
  filters?: Record<string, string>;
}

export class MetricsService extends EventEmitter {
  private buffer: Map<string, MetricPoint[]> = new Map();
  private aggregates: Map<string, AggregatedMetric[]> = new Map();
  private flushInterval: NodeJS.Timer;
  private storage: MetricStorage;
  
  constructor(storage: MetricStorage, flushIntervalMs = 10000) {
    super();
    this.storage = storage;
    
    // Start flush interval
    this.flushInterval = setInterval(() => {
      this.flush();
    }, flushIntervalMs);
  }
  
  // Record a metric
  record(metric: string, value: number, tags: Record<string, string> = {}): void {
    const point: MetricPoint = {
      timestamp: Date.now(),
      value,
      tags: {
        ...tags,
        hostname: process.env.HOSTNAME || 'unknown',
        region: process.env.REGION || 'unknown'
      }
    };
    
    if (!this.buffer.has(metric)) {
      this.buffer.set(metric, []);
    }
    
    this.buffer.get(metric)!.push(point);
    
    // Emit for real-time monitoring
    this.emit('metric', { metric, point });
  }
  
  // Record a timing metric
  timing(metric: string, duration: number, tags?: Record<string, string>): void {
    this.record(`${metric}.duration`, duration, tags);
  }
  
  // Increment a counter
  increment(metric: string, value = 1, tags?: Record<string, string>): void {
    this.record(`${metric}.count`, value, tags);
  }
  
  // Record a gauge (current value)
  gauge(metric: string, value: number, tags?: Record<string, string>): void {
    this.record(`${metric}.gauge`, value, tags);
  }
  
  // Start a timer
  startTimer(tags?: Record<string, string>): () => void {
    const start = Date.now();
    return (metric: string) => {
      this.timing(metric, Date.now() - start, tags);
    };
  }
  
  // Query metrics
  async query(query: MetricQuery): Promise<any[]> {
    const results = await this.storage.query(query);
    
    // Apply aggregation if requested
    if (query.aggregation) {
      return this.applyAggregation(results, query);
    }
    
    return results;
  }
  
  // Get real-time metrics
  getRealtimeMetrics(metric: string, duration = 60000): MetricPoint[] {
    const points = this.buffer.get(metric) || [];
    const cutoff = Date.now() - duration;
    
    return points.filter(p => p.timestamp >= cutoff);
  }
  
  // Calculate percentiles
  private calculatePercentiles(values: number[]): {
    p50: number;
    p95: number;
    p99: number;
  } {
    if (values.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }
    
    const sorted = values.sort((a, b) => a - b);
    const p50Index = Math.floor(sorted.length * 0.5);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    
    return {
      p50: sorted[p50Index] || 0,
      p95: sorted[p95Index] || sorted[sorted.length - 1],
      p99: sorted[p99Index] || sorted[sorted.length - 1]
    };
  }
  
  // Aggregate metrics
  private aggregate(metric: string, points: MetricPoint[], period: AggregatedMetric['period']): AggregatedMetric[] {
    const periodMs = {
      '1m': 60000,
      '5m': 300000,
      '1h': 3600000,
      '1d': 86400000
    }[period];
    
    // Group points by period
    const groups = new Map<number, MetricPoint[]>();
    
    points.forEach(point => {
      const periodStart = Math.floor(point.timestamp / periodMs) * periodMs;
      if (!groups.has(periodStart)) {
        groups.set(periodStart, []);
      }
      groups.get(periodStart)!.push(point);
    });
    
    // Calculate aggregates for each period
    const aggregates: AggregatedMetric[] = [];
    
    groups.forEach((groupPoints, timestamp) => {
      const values = groupPoints.map(p => p.value);
      const percentiles = this.calculatePercentiles(values);
      
      aggregates.push({
        metric,
        period,
        timestamp,
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        ...percentiles
      });
    });
    
    return aggregates;
  }
  
  // Flush metrics to storage
  private async flush(): Promise<void> {
    if (this.buffer.size === 0) return;
    
    const startTime = Date.now();
    const metrics = new Map(this.buffer);
    this.buffer.clear();
    
    try {
      // Store raw metrics
      for (const [metric, points] of metrics) {
        await this.storage.store(metric, points);
        
        // Calculate and store aggregates
        const aggregates1m = this.aggregate(metric, points, '1m');
        const aggregates5m = this.aggregate(metric, points, '5m');
        
        await this.storage.storeAggregates(metric, [...aggregates1m, ...aggregates5m]);
      }
      
      this.emit('flush', {
        metricsCount: metrics.size,
        pointsCount: Array.from(metrics.values()).reduce((sum, points) => sum + points.length, 0),
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      this.emit('flush-error', error);
      
      // Re-add metrics to buffer on error
      metrics.forEach((points, metric) => {
        const existing = this.buffer.get(metric) || [];
        this.buffer.set(metric, [...existing, ...points]);
      });
    }
  }
  
  // Apply aggregation to query results
  private applyAggregation(results: any[], query: MetricQuery): any[] {
    if (!query.groupBy || query.groupBy.length === 0) {
      // Simple aggregation
      const values = results.map(r => r.value);
      
      switch (query.aggregation) {
        case 'sum':
          return [{ value: values.reduce((a, b) => a + b, 0) }];
        case 'avg':
          return [{ value: values.reduce((a, b) => a + b, 0) / values.length }];
        case 'min':
          return [{ value: Math.min(...values) }];
        case 'max':
          return [{ value: Math.max(...values) }];
        case 'count':
          return [{ value: values.length }];
        default:
          return results;
      }
    }
    
    // Group by tags
    const groups = new Map<string, any[]>();
    
    results.forEach(result => {
      const key = query.groupBy!.map(tag => result.tags[tag] || 'unknown').join(':');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(result);
    });
    
    // Apply aggregation to each group
    const aggregated: any[] = [];
    
    groups.forEach((groupResults, key) => {
      const values = groupResults.map(r => r.value);
      const tags = {};
      
      query.groupBy!.forEach((tag, index) => {
        tags[tag] = key.split(':')[index];
      });
      
      let value: number;
      switch (query.aggregation) {
        case 'sum':
          value = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          value = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'min':
          value = Math.min(...values);
          break;
        case 'max':
          value = Math.max(...values);
          break;
        case 'count':
          value = values.length;
          break;
        default:
          value = 0;
      }
      
      aggregated.push({ value, tags });
    });
    
    return aggregated;
  }
  
  // Calculate derived metrics
  async calculateDerivedMetrics(): Promise<{
    totalOperations: number;
    successRate: number;
    avgLatency: number;
    errorRate: number;
    activeServers: number;
    throughput: number;
  }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    
    // Query various metrics
    const [
      operations,
      successes,
      failures,
      latencies,
      servers
    ] = await Promise.all([
      this.query({
        metric: 'neuralock.operation.count',
        startTime: oneHourAgo,
        endTime: now,
        aggregation: 'sum'
      }),
      this.query({
        metric: 'neuralock.operation.success.count',
        startTime: oneHourAgo,
        endTime: now,
        aggregation: 'sum'
      }),
      this.query({
        metric: 'neuralock.operation.failure.count',
        startTime: oneHourAgo,
        endTime: now,
        aggregation: 'sum'
      }),
      this.query({
        metric: 'neuralock.operation.duration',
        startTime: oneHourAgo,
        endTime: now,
        aggregation: 'avg'
      }),
      this.query({
        metric: 'neuralock.server.active.gauge',
        startTime: now,
        endTime: now,
        aggregation: 'max'
      })
    ]);
    
    const totalOps = operations[0]?.value || 0;
    const successCount = successes[0]?.value || 0;
    const failureCount = failures[0]?.value || 0;
    
    return {
      totalOperations: totalOps,
      successRate: totalOps > 0 ? (successCount / totalOps) * 100 : 100,
      avgLatency: latencies[0]?.value || 0,
      errorRate: totalOps > 0 ? (failureCount / totalOps) * 100 : 0,
      activeServers: servers[0]?.value || 0,
      throughput: totalOps / 3600 // Operations per second
    };
  }
  
  // Cleanup
  destroy(): void {
    clearInterval(this.flushInterval);
    this.flush(); // Final flush
  }
}

// Storage interface
interface MetricStorage {
  store(metric: string, points: MetricPoint[]): Promise<void>;
  storeAggregates(metric: string, aggregates: AggregatedMetric[]): Promise<void>;
  query(query: MetricQuery): Promise<any[]>;
}

// Example usage
export function initializeMetrics(storage: MetricStorage): MetricsService {
  const metrics = new MetricsService(storage);
  
  // Log flush events
  metrics.on('flush', ({ metricsCount, pointsCount, duration }) => {
    console.log(`Flushed ${pointsCount} points for ${metricsCount} metrics in ${duration}ms`);
  });
  
  // Handle errors
  metrics.on('flush-error', (error) => {
    console.error('Failed to flush metrics:', error);
  });
  
  return metrics;
}

// Metric recording helpers
export function recordApiRequest(metrics: MetricsService) {
  return (req: any, res: any, next: any) => {
    const timer = metrics.startTimer({
      method: req.method,
      path: req.route?.path || req.path,
      service: 'api'
    });
    
    res.on('finish', () => {
      // Record timing
      timer('api.request');
      
      // Record status
      metrics.increment('api.request', 1, {
        method: req.method,
        path: req.route?.path || req.path,
        status: res.statusCode.toString(),
        statusClass: `${Math.floor(res.statusCode / 100)}xx`
      });
      
      // Record errors
      if (res.statusCode >= 400) {
        metrics.increment('api.error', 1, {
          method: req.method,
          path: req.route?.path || req.path,
          status: res.statusCode.toString()
        });
      }
    });
    
    next();
  };
}