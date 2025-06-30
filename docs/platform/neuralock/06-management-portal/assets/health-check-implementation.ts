// Health Check Implementation
import { EventEmitter } from 'events';

interface HealthCheckConfig {
  interval: number;              // Check interval in ms
  timeout: number;               // Request timeout in ms
  retries: number;               // Number of retries
  degradedThreshold: number;     // Response time for degraded status (ms)
  offlineThreshold: number;      // Consecutive failures for offline
}

interface ServerHealthCheck {
  serverId: number;
  endpoint: string;
  lastCheck?: Date;
  nextCheck?: Date;
  status: 'online' | 'degraded' | 'offline' | 'unknown';
  metrics: {
    responseTime: number;
    uptime: number;
    errorRate: number;
  };
}

export class HealthMonitor extends EventEmitter {
  private servers: Map<number, ServerHealthCheck> = new Map();
  private intervals: Map<number, NodeJS.Timer> = new Map();
  private config: HealthCheckConfig;
  
  constructor(config: HealthCheckConfig = {
    interval: 60000,           // 1 minute
    timeout: 5000,             // 5 seconds
    retries: 3,
    degradedThreshold: 2000,   // 2 seconds
    offlineThreshold: 3
  }) {
    super();
    this.config = config;
  }
  
  // Add server to monitoring
  addServer(serverId: number, endpoint: string): void {
    const healthCheck: ServerHealthCheck = {
      serverId,
      endpoint,
      status: 'unknown',
      metrics: {
        responseTime: 0,
        uptime: 100,
        errorRate: 0
      }
    };
    
    this.servers.set(serverId, healthCheck);
    this.startMonitoring(serverId);
    
    // Immediate first check
    this.checkHealth(serverId);
  }
  
  // Remove server from monitoring
  removeServer(serverId: number): void {
    const interval = this.intervals.get(serverId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(serverId);
    }
    this.servers.delete(serverId);
  }
  
  // Start monitoring for a server
  private startMonitoring(serverId: number): void {
    const interval = setInterval(() => {
      this.checkHealth(serverId);
    }, this.config.interval);
    
    this.intervals.set(serverId, interval);
  }
  
  // Perform health check
  private async checkHealth(serverId: number): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) return;
    
    server.lastCheck = new Date();
    server.nextCheck = new Date(Date.now() + this.config.interval);
    
    try {
      const result = await this.performHealthCheck(server.endpoint);
      
      // Update metrics
      server.metrics.responseTime = result.responseTime;
      
      // Determine status based on response time
      if (result.responseTime < this.config.degradedThreshold) {
        server.status = 'online';
      } else {
        server.status = 'degraded';
      }
      
      // Reset error tracking on success
      this.updateErrorTracking(serverId, false);
      
      // Emit status update
      this.emit('health-update', {
        serverId,
        status: server.status,
        metrics: server.metrics,
        timestamp: new Date()
      });
      
    } catch (error) {
      // Track consecutive failures
      const isOffline = this.updateErrorTracking(serverId, true);
      
      if (isOffline) {
        server.status = 'offline';
        
        this.emit('server-offline', {
          serverId,
          error: error.message,
          timestamp: new Date()
        });
      }
      
      this.emit('health-check-failed', {
        serverId,
        error: error.message,
        timestamp: new Date()
      });
    }
  }
  
  // Perform actual HTTP health check
  private async performHealthCheck(endpoint: string): Promise<{
    responseTime: number;
    data: any;
  }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Health-Check': 'true'
        },
        signal: controller.signal
      });
      
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate health check response
      if (!this.validateHealthResponse(data)) {
        throw new Error('Invalid health check response format');
      }
      
      return { responseTime, data };
      
    } finally {
      clearTimeout(timeout);
    }
  }
  
  // Validate health check response format
  private validateHealthResponse(data: any): boolean {
    return (
      data &&
      typeof data.status === 'string' &&
      typeof data.timestamp === 'number' &&
      data.services &&
      typeof data.services.api === 'boolean'
    );
  }
  
  // Track consecutive errors
  private errorTracking = new Map<number, number>();
  
  private updateErrorTracking(serverId: number, isError: boolean): boolean {
    if (isError) {
      const current = this.errorTracking.get(serverId) || 0;
      this.errorTracking.set(serverId, current + 1);
      return current + 1 >= this.config.offlineThreshold;
    } else {
      this.errorTracking.delete(serverId);
      return false;
    }
  }
  
  // Get current health status
  getServerHealth(serverId: number): ServerHealthCheck | undefined {
    return this.servers.get(serverId);
  }
  
  // Get all servers health
  getAllServersHealth(): ServerHealthCheck[] {
    return Array.from(this.servers.values());
  }
  
  // Calculate network health
  getNetworkHealth(): {
    totalServers: number;
    online: number;
    degraded: number;
    offline: number;
    unknown: number;
    overallHealth: 'healthy' | 'degraded' | 'critical';
    avgResponseTime: number;
  } {
    const servers = this.getAllServersHealth();
    const stats = {
      totalServers: servers.length,
      online: 0,
      degraded: 0,
      offline: 0,
      unknown: 0,
      avgResponseTime: 0
    };
    
    let totalResponseTime = 0;
    let responseCount = 0;
    
    servers.forEach(server => {
      stats[server.status]++;
      if (server.metrics.responseTime > 0) {
        totalResponseTime += server.metrics.responseTime;
        responseCount++;
      }
    });
    
    stats.avgResponseTime = responseCount > 0 
      ? Math.round(totalResponseTime / responseCount)
      : 0;
    
    // Determine overall health
    const onlinePercentage = (stats.online / stats.totalServers) * 100;
    const degradedPercentage = (stats.degraded / stats.totalServers) * 100;
    
    let overallHealth: 'healthy' | 'degraded' | 'critical';
    if (onlinePercentage >= 90) {
      overallHealth = 'healthy';
    } else if (onlinePercentage >= 70 || degradedPercentage >= 30) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'critical';
    }
    
    return { ...stats, overallHealth };
  }
  
  // Batch health check
  async checkAllServers(): Promise<void> {
    const promises = Array.from(this.servers.keys()).map(serverId => 
      this.checkHealth(serverId)
    );
    
    await Promise.allSettled(promises);
  }
  
  // Stop all monitoring
  stopAll(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.servers.clear();
    this.errorTracking.clear();
  }
}

// Usage example
export function initializeHealthMonitoring(servers: Array<{
  id: number;
  healthEndpoint: string;
}>) {
  const monitor = new HealthMonitor({
    interval: 30000,        // 30 seconds
    timeout: 5000,          // 5 seconds
    retries: 3,
    degradedThreshold: 1000, // 1 second
    offlineThreshold: 3
  });
  
  // Add event listeners
  monitor.on('health-update', (data) => {
    console.log(`Server ${data.serverId} health updated:`, data.status);
    // Update UI/database
  });
  
  monitor.on('server-offline', (data) => {
    console.error(`Server ${data.serverId} is offline:`, data.error);
    // Send alerts
  });
  
  // Add servers
  servers.forEach(server => {
    monitor.addServer(server.id, server.healthEndpoint);
  });
  
  return monitor;
}