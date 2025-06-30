import { EventEmitter } from 'events';
import { performance, PerformanceObserver } from 'perf_hooks';
import * as prom from 'prom-client';
import { StatsD } from 'node-statsd';

interface MonitoringConfig {
  enablePrometheus: boolean;
  enableStatsD: boolean;
  enableLogging: boolean;
  statsDHost?: string;
  statsDPort?: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  customMetrics?: CustomMetric[];
  alertThresholds?: AlertThreshold[];
}

interface CustomMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  labels?: string[];
  buckets?: number[]; // For histograms
  percentiles?: number[]; // For summaries
}

interface AlertThreshold {
  metric: string;
  condition: 'above' | 'below' | 'equals';
  value: number;
  duration: number; // seconds
  severity: 'info' | 'warning' | 'critical';
}

export class PerformanceMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private prometheus: typeof prom | null = null;
  private statsd: StatsD | null = null;
  private metrics: Map<string, any> = new Map();
  private performanceMarks: Map<string, number> = new Map();
  private alertState: Map<string, AlertState> = new Map();
  private observer: PerformanceObserver | null = null;
  
  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    
    this.config = {
      enablePrometheus: config.enablePrometheus ?? true,
      enableStatsD: config.enableStatsD ?? false,
      enableLogging: config.enableLogging ?? true,
      statsDHost: config.statsDHost ?? 'localhost',
      statsDPort: config.statsDPort ?? 8125,
      logLevel: config.logLevel ?? 'info',
      customMetrics: config.customMetrics ?? [],
      alertThresholds: config.alertThresholds ?? []
    };
    
    this.initialize();
  }
  
  /**
   * Initialize monitoring systems
   */
  private initialize(): void {
    // Initialize Prometheus
    if (this.config.enablePrometheus) {
      this.prometheus = prom;
      this.setupPrometheusMetrics();
      
      // Start collection default metrics
      this.prometheus.collectDefaultMetrics({ 
        prefix: 'neuralock_',
        gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
      });
    }
    
    // Initialize StatsD
    if (this.config.enableStatsD) {
      this.statsd = new StatsD({
        host: this.config.statsDHost,
        port: this.config.statsDPort,
        prefix: 'neuralock.',
        errorHandler: (error) => {
          console.error('StatsD error:', error);
        }
      });
    }
    
    // Setup performance observer
    this.setupPerformanceObserver();
    
    // Initialize alert checking
    this.startAlertChecking();
  }
  
  /**
   * Setup Prometheus metrics
   */
  private setupPrometheusMetrics(): void {
    if (!this.prometheus) return;
    
    // Request duration histogram
    this.metrics.set('request_duration', new this.prometheus.Histogram({
      name: 'neuralock_request_duration_seconds',
      help: 'Request duration in seconds',
      labelNames: ['method', 'endpoint', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
    }));
    
    // Active requests gauge
    this.metrics.set('active_requests', new this.prometheus.Gauge({
      name: 'neuralock_active_requests',
      help: 'Number of active requests',
      labelNames: ['endpoint']
    }));
    
    // Request rate counter
    this.metrics.set('request_total', new this.prometheus.Counter({
      name: 'neuralock_requests_total',
      help: 'Total number of requests',
      labelNames: ['method', 'endpoint', 'status']
    }));
    
    // Error rate counter
    this.metrics.set('errors_total', new this.prometheus.Counter({
      name: 'neuralock_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'endpoint']
    }));
    
    // Threshold operation metrics
    this.metrics.set('threshold_operations', new this.prometheus.Histogram({
      name: 'neuralock_threshold_operations_seconds',
      help: 'Threshold operation duration',
      labelNames: ['operation', 'threshold_k', 'threshold_n'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
    }));
    
    // Cache metrics
    this.metrics.set('cache_hits', new this.prometheus.Counter({
      name: 'neuralock_cache_hits_total',
      help: 'Cache hit count',
      labelNames: ['cache_level']
    }));
    
    this.metrics.set('cache_misses', new this.prometheus.Counter({
      name: 'neuralock_cache_misses_total',
      help: 'Cache miss count',
      labelNames: ['cache_level']
    }));
    
    // Custom metrics
    this.config.customMetrics?.forEach(metric => {
      this.createCustomMetric(metric);
    });
  }
  
  /**
   * Create custom metric
   */
  private createCustomMetric(config: CustomMetric): void {
    if (!this.prometheus) return;
    
    let metric: any;
    
    switch (config.type) {
      case 'counter':
        metric = new this.prometheus.Counter({
          name: `neuralock_${config.name}`,
          help: config.help,
          labelNames: config.labels || []
        });
        break;
        
      case 'gauge':
        metric = new this.prometheus.Gauge({
          name: `neuralock_${config.name}`,
          help: config.help,
          labelNames: config.labels || []
        });
        break;
        
      case 'histogram':
        metric = new this.prometheus.Histogram({
          name: `neuralock_${config.name}`,
          help: config.help,
          labelNames: config.labels || [],
          buckets: config.buckets || this.prometheus.exponentialBuckets(0.001, 2, 10)
        });
        break;
        
      case 'summary':
        metric = new this.prometheus.Summary({
          name: `neuralock_${config.name}`,
          help: config.help,
          labelNames: config.labels || [],
          percentiles: config.percentiles || [0.5, 0.9, 0.95, 0.99]
        });
        break;
    }
    
    this.metrics.set(config.name, metric);
  }
  
  /**
   * Setup performance observer
   */
  private setupPerformanceObserver(): void {
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.handlePerformanceEntry(entry);
      }
    });
    
    this.observer.observe({ 
      entryTypes: ['measure', 'function', 'http', 'dns'] 
    });
  }
  
  /**
   * Handle performance entry
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    if (this.config.enableLogging && this.shouldLog('debug')) {
      console.log(`Performance: ${entry.name} - ${entry.duration}ms`);
    }
    
    // Record to metrics
    if (this.prometheus) {
      const metric = this.metrics.get('request_duration');
      if (metric && entry.entryType === 'measure') {
        metric.observe(
          { method: 'unknown', endpoint: entry.name, status: 'success' },
          entry.duration / 1000
        );
      }
    }
    
    if (this.statsd) {
      this.statsd.timing(`performance.${entry.name}`, entry.duration);
    }
  }
  
  /**
   * Start timing an operation
   */
  startTimer(name: string): Timer {
    const startTime = performance.now();
    this.performanceMarks.set(name, startTime);
    
    if (this.prometheus) {
      const activeRequests = this.metrics.get('active_requests');
      if (activeRequests) {
        activeRequests.inc({ endpoint: name });
      }
    }
    
    return new Timer(name, this);
  }
  
  /**
   * End timing and record metrics
   */
  endTimer(timer: Timer, labels?: Record<string, string>): void {
    const duration = timer.end();
    
    // Prometheus metrics
    if (this.prometheus) {
      const requestDuration = this.metrics.get('request_duration');
      if (requestDuration) {
        requestDuration.observe(
          { 
            method: labels?.method || 'unknown',
            endpoint: timer.name,
            status: labels?.status || 'success'
          },
          duration / 1000
        );
      }
      
      const activeRequests = this.metrics.get('active_requests');
      if (activeRequests) {
        activeRequests.dec({ endpoint: timer.name });
      }
      
      const requestTotal = this.metrics.get('request_total');
      if (requestTotal) {
        requestTotal.inc({
          method: labels?.method || 'unknown',
          endpoint: timer.name,
          status: labels?.status || 'success'
        });
      }
    }
    
    // StatsD metrics
    if (this.statsd) {
      this.statsd.timing(`request.${timer.name}`, duration);
      this.statsd.increment(`request.${timer.name}.${labels?.status || 'success'}`);
    }
    
    // Performance mark
    performance.measure(timer.name, {
      start: this.performanceMarks.get(timer.name),
      end: performance.now()
    });
    
    this.performanceMarks.delete(timer.name);
  }
  
  /**
   * Record a counter metric
   */
  incrementCounter(
    name: string,
    labels?: Record<string, string>,
    value: number = 1
  ): void {
    if (this.prometheus) {
      const metric = this.metrics.get(name);
      if (metric && metric.inc) {
        metric.inc(labels || {}, value);
      }
    }
    
    if (this.statsd) {
      const labelStr = labels ? 
        Object.entries(labels).map(([k, v]) => `${k}:${v}`).join('.') : '';
      this.statsd.increment(`${name}${labelStr ? '.' + labelStr : ''}`, value);
    }
  }
  
  /**
   * Record a gauge metric
   */
  setGauge(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    if (this.prometheus) {
      const metric = this.metrics.get(name);
      if (metric && metric.set) {
        metric.set(labels || {}, value);
      }
    }
    
    if (this.statsd) {
      const labelStr = labels ? 
        Object.entries(labels).map(([k, v]) => `${k}:${v}`).join('.') : '';
      this.statsd.gauge(`${name}${labelStr ? '.' + labelStr : ''}`, value);
    }
  }
  
  /**
   * Record a histogram metric
   */
  recordHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    if (this.prometheus) {
      const metric = this.metrics.get(name);
      if (metric && metric.observe) {
        metric.observe(labels || {}, value);
      }
    }
    
    if (this.statsd) {
      const labelStr = labels ? 
        Object.entries(labels).map(([k, v]) => `${k}:${v}`).join('.') : '';
      this.statsd.histogram(`${name}${labelStr ? '.' + labelStr : ''}`, value);
    }
  }
  
  /**
   * Record an error
   */
  recordError(
    type: string,
    endpoint?: string,
    error?: any
  ): void {
    if (this.prometheus) {
      const metric = this.metrics.get('errors_total');
      if (metric) {
        metric.inc({ type, endpoint: endpoint || 'unknown' });
      }
    }
    
    if (this.statsd) {
      this.statsd.increment(`errors.${type}${endpoint ? '.' + endpoint : ''}`);
    }
    
    if (this.config.enableLogging && this.shouldLog('error')) {
      console.error(`Error [${type}]${endpoint ? ` at ${endpoint}` : ''}:`, error);
    }
    
    this.emit('error', { type, endpoint, error });
  }
  
  /**
   * Get metrics for Prometheus
   */
  async getMetrics(): Promise<string> {
    if (!this.prometheus) {
      return '';
    }
    
    return this.prometheus.register.metrics();
  }
  
  /**
   * Get metrics snapshot
   */
  getSnapshot(): MetricsSnapshot {
    const snapshot: MetricsSnapshot = {
      timestamp: Date.now(),
      metrics: {}
    };
    
    this.metrics.forEach((metric, name) => {
      if (metric.get) {
        const values = metric.get();
        snapshot.metrics[name] = values;
      }
    });
    
    return snapshot;
  }
  
  /**
   * Start alert checking
   */
  private startAlertChecking(): void {
    if (!this.config.alertThresholds || this.config.alertThresholds.length === 0) {
      return;
    }
    
    setInterval(() => {
      this.checkAlerts();
    }, 10000); // Check every 10 seconds
  }
  
  /**
   * Check alert thresholds
   */
  private checkAlerts(): void {
    this.config.alertThresholds?.forEach(threshold => {
      const metric = this.metrics.get(threshold.metric);
      if (!metric || !metric.get) return;
      
      const values = metric.get();
      const value = this.extractMetricValue(values);
      
      const triggered = this.checkThreshold(value, threshold);
      const alertKey = `${threshold.metric}-${threshold.condition}-${threshold.value}`;
      const currentState = this.alertState.get(alertKey);
      
      if (triggered) {
        if (!currentState || currentState.state === 'resolved') {
          // New alert
          this.alertState.set(alertKey, {
            state: 'triggered',
            startTime: Date.now(),
            lastValue: value
          });
          
          this.emit('alert', {
            metric: threshold.metric,
            condition: threshold.condition,
            threshold: threshold.value,
            currentValue: value,
            severity: threshold.severity
          });
        } else {
          // Update existing alert
          currentState.lastValue = value;
        }
      } else if (currentState && currentState.state === 'triggered') {
        // Alert resolved
        this.alertState.set(alertKey, {
          state: 'resolved',
          startTime: Date.now(),
          lastValue: value
        });
        
        this.emit('alert_resolved', {
          metric: threshold.metric,
          condition: threshold.condition,
          threshold: threshold.value,
          currentValue: value
        });
      }
    });
  }
  
  /**
   * Check if threshold is triggered
   */
  private checkThreshold(value: number, threshold: AlertThreshold): boolean {
    switch (threshold.condition) {
      case 'above':
        return value > threshold.value;
      case 'below':
        return value < threshold.value;
      case 'equals':
        return Math.abs(value - threshold.value) < 0.001;
      default:
        return false;
    }
  }
  
  /**
   * Extract numeric value from metric
   */
  private extractMetricValue(values: any): number {
    if (typeof values === 'number') return values;
    if (values.value !== undefined) return values.value;
    if (values.values && values.values.length > 0) {
      return values.values[0].value;
    }
    return 0;
  }
  
  /**
   * Should log based on level
   */
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= configLevel;
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (this.statsd) {
      this.statsd.close();
    }
    
    this.removeAllListeners();
  }
}

// Timer helper class
class Timer {
  private startTime: number;
  
  constructor(
    public name: string,
    private monitor: PerformanceMonitor
  ) {
    this.startTime = performance.now();
  }
  
  end(labels?: Record<string, string>): number {
    const duration = performance.now() - this.startTime;
    this.monitor.endTimer(this, labels);
    return duration;
  }
}

// Alert state tracking
interface AlertState {
  state: 'triggered' | 'resolved';
  startTime: number;
  lastValue: number;
}

// Metrics snapshot
interface MetricsSnapshot {
  timestamp: number;
  metrics: Record<string, any>;
}

// Express middleware
export function createExpressMiddleware(
  monitor: PerformanceMonitor
): (req: any, res: any, next: any) => void {
  return (req, res, next) => {
    const timer = monitor.startTimer(`http_request`);
    
    // Capture response status
    const originalSend = res.send;
    res.send = function(data: any) {
      timer.end({
        method: req.method,
        endpoint: req.route?.path || req.path,
        status: res.statusCode.toString()
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Usage example
export function setupPerformanceMonitoring(): PerformanceMonitor {
  const monitor = new PerformanceMonitor({
    enablePrometheus: true,
    enableStatsD: process.env.STATSD_HOST ? true : false,
    enableLogging: true,
    logLevel: 'info',
    statsDHost: process.env.STATSD_HOST,
    statsDPort: parseInt(process.env.STATSD_PORT || '8125'),
    customMetrics: [
      {
        name: 'share_operations',
        type: 'histogram',
        help: 'Share operation duration',
        labels: ['operation', 'result'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
      }
    ],
    alertThresholds: [
      {
        metric: 'request_duration',
        condition: 'above',
        value: 1, // 1 second
        duration: 60,
        severity: 'warning'
      },
      {
        metric: 'errors_total',
        condition: 'above',
        value: 100,
        duration: 300,
        severity: 'critical'
      }
    ]
  });
  
  // Listen for alerts
  monitor.on('alert', (alert) => {
    console.error('Performance alert:', alert);
    // Send to alerting system
  });
  
  return monitor;
}