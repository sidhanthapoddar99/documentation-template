import { EventEmitter } from 'events';
import axios from 'axios';
import PQueue from 'p-queue';

interface ServerHealth {
  serverId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: number;
  metrics: HealthMetrics;
  checks: HealthCheckResult[];
}

interface HealthMetrics {
  uptime: number;
  cpu: number;
  memory: number;
  disk: number;
  requestRate: number;
  errorRate: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
}

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration: number;
  timestamp: number;
}

export class MultiServerHealthMonitor extends EventEmitter {
  private servers: Map<string, ServerConfig>;
  private healthStatus: Map<string, ServerHealth>;
  private checkQueue: PQueue;
  private monitoringInterval: NodeJS.Timer | null = null;
  private aggregateMetrics: AggregateMetrics;
  
  constructor(private config: MonitoringConfig) {
    super();
    this.servers = new Map();
    this.healthStatus = new Map();
    this.checkQueue = new PQueue({
      concurrency: config.concurrency || 10,
      interval: 1000,
      intervalCap: config.rateLimit || 20
    });
    this.aggregateMetrics = this.initializeAggregateMetrics();
  }
  
  /**
   * Register servers for monitoring
   */
  registerServers(servers: ServerConfig[]): void {
    servers.forEach(server => {
      this.servers.set(server.id, server);
      this.healthStatus.set(server.id, {
        serverId: server.id,
        status: 'unknown',
        lastCheck: 0,
        metrics: this.getDefaultMetrics(),
        checks: []
      });
    });
    
    console.log(`Registered ${servers.length} servers for monitoring`);
  }
  
  /**
   * Start health monitoring
   */
  start(): void {
    console.log('Starting multi-server health monitoring...');
    
    // Perform initial health check
    this.performHealthChecks();
    
    // Start periodic monitoring
    this.monitoringInterval = setInterval(
      () => this.performHealthChecks(),
      this.config.checkInterval || 30000
    );
    
    // Start aggregate metrics calculation
    setInterval(
      () => this.calculateAggregateMetrics(),
      10000
    );
  }
  
  /**
   * Perform health checks on all servers
   */
  private async performHealthChecks(): Promise<void> {
    const checkPromises = Array.from(this.servers.values()).map(server =>
      this.checkQueue.add(() => this.checkServerHealth(server))
    );
    
    await Promise.all(checkPromises);
    
    // Evaluate overall system health
    this.evaluateSystemHealth();
  }
  
  /**
   * Check individual server health
   */
  private async checkServerHealth(server: ServerConfig): Promise<void> {
    const startTime = Date.now();
    const checks: HealthCheckResult[] = [];
    
    try {
      // Basic health endpoint check
      const healthCheck = await this.performHealthEndpointCheck(server);
      checks.push(healthCheck);
      
      // Metrics endpoint check
      const metricsCheck = await this.performMetricsCheck(server);
      checks.push(metricsCheck);
      
      // Custom health checks
      for (const check of this.config.customChecks || []) {
        const result = await this.performCustomCheck(server, check);
        checks.push(result);
      }
      
      // Threshold verification
      const thresholdCheck = await this.performThresholdCheck(server);
      checks.push(thresholdCheck);
      
      // Certificate check
      if (server.tlsEnabled) {
        const certCheck = await this.performCertificateCheck(server);
        checks.push(certCheck);
      }
      
      // Update health status
      const status = this.determineServerStatus(checks);
      const metrics = await this.fetchServerMetrics(server);
      
      this.healthStatus.set(server.id, {
        serverId: server.id,
        status,
        lastCheck: Date.now(),
        metrics,
        checks
      });
      
      // Emit events based on status changes
      this.handleStatusChange(server.id, status);
      
    } catch (error) {
      console.error(`Health check failed for ${server.id}:`, error);
      
      this.healthStatus.set(server.id, {
        serverId: server.id,
        status: 'unhealthy',
        lastCheck: Date.now(),
        metrics: this.getDefaultMetrics(),
        checks: [{
          name: 'connectivity',
          status: 'fail',
          message: `Connection failed: ${error.message}`,
          duration: Date.now() - startTime,
          timestamp: Date.now()
        }]
      });
      
      this.emit('server_unhealthy', {
        serverId: server.id,
        error: error.message
      });
    }
  }
  
  /**
   * Perform health endpoint check
   */
  private async performHealthEndpointCheck(
    server: ServerConfig
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${server.url}/health`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      const duration = Date.now() - startTime;
      
      if (response.status === 200 && response.data.status === 'healthy') {
        return {
          name: 'health_endpoint',
          status: 'pass',
          message: 'Health endpoint responding',
          duration,
          timestamp: Date.now()
        };
      } else {
        return {
          name: 'health_endpoint',
          status: 'fail',
          message: `Unhealthy response: ${response.status}`,
          duration,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      return {
        name: 'health_endpoint',
        status: 'fail',
        message: `Health check failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Perform metrics check
   */
  private async performMetricsCheck(
    server: ServerConfig
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${server.url}/metrics`, {
        timeout: 5000
      });
      
      const duration = Date.now() - startTime;
      
      // Parse and validate metrics
      const metrics = this.parsePrometheusMetrics(response.data);
      
      // Check for concerning metrics
      const warnings = [];
      if (metrics.cpu > 80) warnings.push('High CPU usage');
      if (metrics.memory > 85) warnings.push('High memory usage');
      if (metrics.errorRate > 5) warnings.push('High error rate');
      
      if (warnings.length > 0) {
        return {
          name: 'metrics',
          status: 'warn',
          message: warnings.join(', '),
          duration,
          timestamp: Date.now()
        };
      }
      
      return {
        name: 'metrics',
        status: 'pass',
        message: 'Metrics within normal range',
        duration,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        name: 'metrics',
        status: 'fail',
        message: `Metrics check failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Perform threshold verification check
   */
  private async performThresholdCheck(
    server: ServerConfig
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${server.url}/threshold/status`, {
        timeout: 5000
      });
      
      const duration = Date.now() - startTime;
      const { activeServers, requiredThreshold, configuredThreshold } = response.data;
      
      if (activeServers < requiredThreshold) {
        return {
          name: 'threshold',
          status: 'fail',
          message: `Insufficient servers: ${activeServers}/${requiredThreshold}`,
          duration,
          timestamp: Date.now()
        };
      }
      
      if (activeServers < configuredThreshold) {
        return {
          name: 'threshold',
          status: 'warn',
          message: `Below optimal threshold: ${activeServers}/${configuredThreshold}`,
          duration,
          timestamp: Date.now()
        };
      }
      
      return {
        name: 'threshold',
        status: 'pass',
        message: `Threshold satisfied: ${activeServers}/${configuredThreshold}`,
        duration,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        name: 'threshold',
        status: 'fail',
        message: `Threshold check failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Perform certificate check
   */
  private async performCertificateCheck(
    server: ServerConfig
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const certInfo = await this.getCertificateInfo(server.url);
      const daysUntilExpiry = Math.floor(
        (certInfo.validTo - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilExpiry < 7) {
        return {
          name: 'certificate',
          status: 'fail',
          message: `Certificate expires in ${daysUntilExpiry} days`,
          duration: Date.now() - startTime,
          timestamp: Date.now()
        };
      }
      
      if (daysUntilExpiry < 30) {
        return {
          name: 'certificate',
          status: 'warn',
          message: `Certificate expires in ${daysUntilExpiry} days`,
          duration: Date.now() - startTime,
          timestamp: Date.now()
        };
      }
      
      return {
        name: 'certificate',
        status: 'pass',
        message: `Certificate valid for ${daysUntilExpiry} days`,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        name: 'certificate',
        status: 'fail',
        message: `Certificate check failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Perform custom health check
   */
  private async performCustomCheck(
    server: ServerConfig,
    check: CustomHealthCheck
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const result = await check.execute(server);
      
      return {
        name: check.name,
        status: result.success ? 'pass' : 'fail',
        message: result.message,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        name: check.name,
        status: 'fail',
        message: `Check failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Determine server status based on check results
   */
  private determineServerStatus(
    checks: HealthCheckResult[]
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const failedChecks = checks.filter(c => c.status === 'fail').length;
    const warnChecks = checks.filter(c => c.status === 'warn').length;
    
    if (failedChecks > 0) {
      return 'unhealthy';
    }
    
    if (warnChecks > 0) {
      return 'degraded';
    }
    
    return 'healthy';
  }
  
  /**
   * Fetch server metrics
   */
  private async fetchServerMetrics(server: ServerConfig): Promise<HealthMetrics> {
    try {
      const response = await axios.get(`${server.url}/metrics`, {
        timeout: 5000
      });
      
      return this.parsePrometheusMetrics(response.data);
    } catch (error) {
      return this.getDefaultMetrics();
    }
  }
  
  /**
   * Parse Prometheus metrics format
   */
  private parsePrometheusMetrics(data: string): HealthMetrics {
    // Simple parser for key metrics
    const getMetric = (name: string): number => {
      const match = data.match(new RegExp(`${name}\\s+(\\d+\\.?\\d*)`));
      return match ? parseFloat(match[1]) : 0;
    };
    
    return {
      uptime: getMetric('process_uptime_seconds'),
      cpu: getMetric('process_cpu_percent'),
      memory: getMetric('process_memory_percent'),
      disk: getMetric('disk_usage_percent'),
      requestRate: getMetric('http_requests_per_second'),
      errorRate: getMetric('http_errors_per_second'),
      latency: {
        p50: getMetric('http_request_duration_seconds{quantile="0.5"}') * 1000,
        p95: getMetric('http_request_duration_seconds{quantile="0.95"}') * 1000,
        p99: getMetric('http_request_duration_seconds{quantile="0.99"}') * 1000
      }
    };
  }
  
  /**
   * Calculate aggregate metrics across all servers
   */
  private calculateAggregateMetrics(): void {
    const healthyServers = Array.from(this.healthStatus.values())
      .filter(h => h.status === 'healthy' || h.status === 'degraded');
    
    if (healthyServers.length === 0) {
      return;
    }
    
    // Calculate averages
    const totalMetrics = healthyServers.reduce((acc, server) => ({
      cpu: acc.cpu + server.metrics.cpu,
      memory: acc.memory + server.metrics.memory,
      disk: acc.disk + server.metrics.disk,
      requestRate: acc.requestRate + server.metrics.requestRate,
      errorRate: acc.errorRate + server.metrics.errorRate,
      latency: {
        p50: acc.latency.p50 + server.metrics.latency.p50,
        p95: acc.latency.p95 + server.metrics.latency.p95,
        p99: acc.latency.p99 + server.metrics.latency.p99
      }
    }), this.getDefaultMetrics());
    
    const count = healthyServers.length;
    
    this.aggregateMetrics = {
      timestamp: Date.now(),
      serverCount: {
        total: this.servers.size,
        healthy: healthyServers.filter(h => h.status === 'healthy').length,
        degraded: healthyServers.filter(h => h.status === 'degraded').length,
        unhealthy: this.servers.size - healthyServers.length
      },
      averages: {
        cpu: totalMetrics.cpu / count,
        memory: totalMetrics.memory / count,
        disk: totalMetrics.disk / count,
        requestRate: totalMetrics.requestRate,
        errorRate: totalMetrics.errorRate,
        latency: {
          p50: totalMetrics.latency.p50 / count,
          p95: totalMetrics.latency.p95 / count,
          p99: totalMetrics.latency.p99 / count
        }
      },
      alerts: this.generateAlerts()
    };
    
    this.emit('metrics_updated', this.aggregateMetrics);
  }
  
  /**
   * Generate alerts based on current status
   */
  private generateAlerts(): Alert[] {
    const alerts: Alert[] = [];
    
    // Check server availability
    const unhealthyCount = Array.from(this.healthStatus.values())
      .filter(h => h.status === 'unhealthy').length;
    
    if (unhealthyCount > 0) {
      alerts.push({
        level: unhealthyCount >= this.config.criticalThreshold ? 'critical' : 'warning',
        type: 'server_availability',
        message: `${unhealthyCount} servers are unhealthy`,
        timestamp: Date.now()
      });
    }
    
    // Check threshold compliance
    const healthyCount = this.servers.size - unhealthyCount;
    if (healthyCount < this.config.minimumHealthyServers) {
      alerts.push({
        level: 'critical',
        type: 'threshold_violation',
        message: `Only ${healthyCount} healthy servers, minimum ${this.config.minimumHealthyServers} required`,
        timestamp: Date.now()
      });
    }
    
    // Check aggregate metrics
    if (this.aggregateMetrics.averages.cpu > 80) {
      alerts.push({
        level: 'warning',
        type: 'high_cpu',
        message: `Average CPU usage is ${this.aggregateMetrics.averages.cpu.toFixed(1)}%`,
        timestamp: Date.now()
      });
    }
    
    if (this.aggregateMetrics.averages.errorRate > 5) {
      alerts.push({
        level: 'warning',
        type: 'high_error_rate',
        message: `Error rate is ${this.aggregateMetrics.averages.errorRate.toFixed(1)} per second`,
        timestamp: Date.now()
      });
    }
    
    return alerts;
  }
  
  /**
   * Evaluate overall system health
   */
  private evaluateSystemHealth(): void {
    const statuses = Array.from(this.healthStatus.values());
    const healthyCount = statuses.filter(s => s.status === 'healthy').length;
    const degradedCount = statuses.filter(s => s.status === 'degraded').length;
    const unhealthyCount = statuses.filter(s => s.status === 'unhealthy').length;
    
    let systemStatus: 'healthy' | 'degraded' | 'critical';
    
    if (unhealthyCount >= this.config.criticalThreshold) {
      systemStatus = 'critical';
    } else if (unhealthyCount > 0 || degradedCount > 0) {
      systemStatus = 'degraded';
    } else {
      systemStatus = 'healthy';
    }
    
    this.emit('system_health_updated', {
      status: systemStatus,
      healthy: healthyCount,
      degraded: degradedCount,
      unhealthy: unhealthyCount,
      total: this.servers.size,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle server status changes
   */
  private handleStatusChange(serverId: string, newStatus: string): void {
    const previousHealth = this.healthStatus.get(serverId);
    
    if (previousHealth && previousHealth.status !== newStatus) {
      this.emit('server_status_changed', {
        serverId,
        previousStatus: previousHealth.status,
        newStatus,
        timestamp: Date.now()
      });
      
      // Send alerts for critical changes
      if (newStatus === 'unhealthy') {
        this.emit('alert', {
          level: 'critical',
          type: 'server_down',
          serverId,
          message: `Server ${serverId} is now unhealthy`,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * Get current health status
   */
  getHealthStatus(): Map<string, ServerHealth> {
    return new Map(this.healthStatus);
  }
  
  /**
   * Get aggregate metrics
   */
  getAggregateMetrics(): AggregateMetrics {
    return { ...this.aggregateMetrics };
  }
  
  /**
   * Get health report
   */
  generateHealthReport(): HealthReport {
    const statuses = Array.from(this.healthStatus.values());
    
    return {
      timestamp: Date.now(),
      summary: {
        totalServers: this.servers.size,
        healthy: statuses.filter(s => s.status === 'healthy').length,
        degraded: statuses.filter(s => s.status === 'degraded').length,
        unhealthy: statuses.filter(s => s.status === 'unhealthy').length
      },
      servers: statuses.map(s => ({
        id: s.serverId,
        status: s.status,
        lastCheck: s.lastCheck,
        uptime: s.metrics.uptime,
        issues: s.checks.filter(c => c.status !== 'pass')
      })),
      metrics: this.aggregateMetrics,
      alerts: this.aggregateMetrics.alerts
    };
  }
  
  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.checkQueue.clear();
    console.log('Health monitoring stopped');
  }
  
  /**
   * Get default metrics
   */
  private getDefaultMetrics(): HealthMetrics {
    return {
      uptime: 0,
      cpu: 0,
      memory: 0,
      disk: 0,
      requestRate: 0,
      errorRate: 0,
      latency: {
        p50: 0,
        p95: 0,
        p99: 0
      }
    };
  }
  
  /**
   * Initialize aggregate metrics
   */
  private initializeAggregateMetrics(): AggregateMetrics {
    return {
      timestamp: Date.now(),
      serverCount: {
        total: 0,
        healthy: 0,
        degraded: 0,
        unhealthy: 0
      },
      averages: this.getDefaultMetrics(),
      alerts: []
    };
  }
  
  /**
   * Get certificate info (mock implementation)
   */
  private async getCertificateInfo(url: string): Promise<any> {
    // In real implementation, would check TLS certificate
    return {
      validTo: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 days
    };
  }
}

// Type definitions
interface ServerConfig {
  id: string;
  url: string;
  region: string;
  tlsEnabled: boolean;
}

interface MonitoringConfig {
  checkInterval: number;
  concurrency: number;
  rateLimit: number;
  minimumHealthyServers: number;
  criticalThreshold: number;
  customChecks?: CustomHealthCheck[];
}

interface CustomHealthCheck {
  name: string;
  execute: (server: ServerConfig) => Promise<{ success: boolean; message: string }>;
}

interface AggregateMetrics {
  timestamp: number;
  serverCount: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  averages: HealthMetrics;
  alerts: Alert[];
}

interface Alert {
  level: 'info' | 'warning' | 'critical';
  type: string;
  message: string;
  timestamp: number;
  serverId?: string;
}

interface HealthReport {
  timestamp: number;
  summary: {
    totalServers: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  servers: Array<{
    id: string;
    status: string;
    lastCheck: number;
    uptime: number;
    issues: HealthCheckResult[];
  }>;
  metrics: AggregateMetrics;
  alerts: Alert[];
}

// Usage example
export async function setupHealthMonitoring(
  servers: ServerConfig[],
  config: Partial<MonitoringConfig> = {}
): Promise<MultiServerHealthMonitor> {
  const monitor = new MultiServerHealthMonitor({
    checkInterval: 30000,
    concurrency: 10,
    rateLimit: 20,
    minimumHealthyServers: 5,
    criticalThreshold: 3,
    ...config
  });
  
  // Register servers
  monitor.registerServers(servers);
  
  // Setup event handlers
  monitor.on('server_unhealthy', (data) => {
    console.error(`Server ${data.serverId} is unhealthy:`, data.error);
  });
  
  monitor.on('alert', (alert) => {
    console.warn(`[${alert.level.toUpperCase()}] ${alert.type}: ${alert.message}`);
  });
  
  monitor.on('system_health_updated', (health) => {
    console.log('System health:', health);
  });
  
  // Start monitoring
  monitor.start();
  
  return monitor;
}