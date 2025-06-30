import { Server, ThresholdConfig, SelectionStrategy } from '@neuralock/types';

interface ServerScore {
  server: Server;
  score: number;
  metrics: {
    importance: number;
    latency: number;
    reliability: number;
    geographic: number;
  };
}

export class ServerSelectionAlgorithm {
  private readonly config: ThresholdConfig;
  private readonly metricsCache: Map<string, ServerMetrics>;
  
  constructor(config: ThresholdConfig) {
    this.config = config;
    this.metricsCache = new Map();
  }
  
  /**
   * Select optimal servers based on current conditions
   */
  async selectServers(
    availableServers: Server[],
    userLocation?: GeographicLocation,
    strategy: SelectionStrategy = 'balanced'
  ): Promise<Server[]> {
    // Filter healthy servers
    const healthyServers = await this.filterHealthyServers(availableServers);
    
    if (healthyServers.length < this.config.threshold.k) {
      throw new Error(
        `Insufficient healthy servers: ${healthyServers.length} < ${this.config.threshold.k}`
      );
    }
    
    // Score servers based on strategy
    const scoredServers = await this.scoreServers(
      healthyServers,
      userLocation,
      strategy
    );
    
    // Select top servers
    return this.selectTopServers(scoredServers);
  }
  
  /**
   * Filter servers based on health status
   */
  private async filterHealthyServers(servers: Server[]): Promise<Server[]> {
    const healthChecks = await Promise.all(
      servers.map(async (server) => ({
        server,
        healthy: await this.checkServerHealth(server)
      }))
    );
    
    return healthChecks
      .filter(({ healthy }) => healthy)
      .map(({ server }) => server);
  }
  
  /**
   * Check individual server health
   */
  private async checkServerHealth(server: Server): Promise<boolean> {
    try {
      const response = await fetch(`${server.url}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (!response.ok) return false;
      
      const health = await response.json();
      return health.status === 'healthy' && health.ready === true;
    } catch (error) {
      console.warn(`Health check failed for ${server.id}:`, error);
      return false;
    }
  }
  
  /**
   * Score servers based on multiple factors
   */
  private async scoreServers(
    servers: Server[],
    userLocation?: GeographicLocation,
    strategy: SelectionStrategy
  ): Promise<ServerScore[]> {
    const scores = await Promise.all(
      servers.map(async (server) => {
        const metrics = await this.getServerMetrics(server);
        const score = this.calculateScore(
          server,
          metrics,
          userLocation,
          strategy
        );
        
        return { server, score, metrics };
      })
    );
    
    // Sort by score (highest first)
    return scores.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Get or fetch server metrics
   */
  private async getServerMetrics(server: Server): Promise<ServerMetrics> {
    const cached = this.metricsCache.get(server.id);
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached;
    }
    
    const metrics = await this.fetchServerMetrics(server);
    this.metricsCache.set(server.id, {
      ...metrics,
      timestamp: Date.now()
    });
    
    return metrics;
  }
  
  /**
   * Fetch real-time server metrics
   */
  private async fetchServerMetrics(server: Server): Promise<ServerMetrics> {
    try {
      const response = await fetch(`${server.url}/metrics`, {
        method: 'GET',
        timeout: 3000
      });
      
      if (!response.ok) {
        return this.getDefaultMetrics();
      }
      
      return await response.json();
    } catch (error) {
      return this.getDefaultMetrics();
    }
  }
  
  /**
   * Calculate server score based on strategy
   */
  private calculateScore(
    server: Server,
    metrics: ServerMetrics,
    userLocation?: GeographicLocation,
    strategy: SelectionStrategy
  ): number {
    const weights = this.getStrategyWeights(strategy);
    
    // Base importance from configuration
    const importanceScore = server.importance || 1.0;
    
    // Latency score (lower is better, normalized to 0-1)
    const latencyScore = 1 - Math.min(metrics.avgLatency / 1000, 1);
    
    // Reliability score based on uptime
    const reliabilityScore = metrics.uptime / 100;
    
    // Geographic score (if user location provided)
    const geographicScore = userLocation
      ? this.calculateGeographicScore(server, userLocation)
      : 0.5;
    
    // Calculate weighted score
    const score = 
      weights.importance * importanceScore +
      weights.latency * latencyScore +
      weights.reliability * reliabilityScore +
      weights.geographic * geographicScore;
    
    return score;
  }
  
  /**
   * Get weight configuration for different strategies
   */
  private getStrategyWeights(strategy: SelectionStrategy): ScoreWeights {
    switch (strategy) {
      case 'performance':
        return {
          importance: 0.2,
          latency: 0.5,
          reliability: 0.2,
          geographic: 0.1
        };
        
      case 'reliability':
        return {
          importance: 0.3,
          latency: 0.1,
          reliability: 0.5,
          geographic: 0.1
        };
        
      case 'geographic':
        return {
          importance: 0.2,
          latency: 0.2,
          reliability: 0.2,
          geographic: 0.4
        };
        
      case 'balanced':
      default:
        return {
          importance: 0.25,
          latency: 0.25,
          reliability: 0.25,
          geographic: 0.25
        };
    }
  }
  
  /**
   * Calculate geographic proximity score
   */
  private calculateGeographicScore(
    server: Server,
    userLocation: GeographicLocation
  ): number {
    if (!server.location) return 0.5;
    
    // Simple distance calculation (could be improved with actual geo calculations)
    const distance = this.calculateDistance(server.location, userLocation);
    
    // Normalize to 0-1 (closer is better)
    // Assume max relevant distance is 10000km
    return 1 - Math.min(distance / 10000, 1);
  }
  
  /**
   * Calculate distance between two geographic points
   */
  private calculateDistance(
    loc1: GeographicLocation,
    loc2: GeographicLocation
  ): number {
    // Haversine formula for great-circle distance
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLon = this.toRad(loc2.lon - loc1.lon);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.lat)) * Math.cos(this.toRad(loc2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Select final set of servers
   */
  private selectTopServers(scoredServers: ServerScore[]): Server[] {
    const selected: Server[] = [];
    const k = this.config.threshold.k;
    const buffer = Math.min(2, this.config.threshold.n - k); // Extra servers
    
    // Always include minimum required servers
    for (let i = 0; i < Math.min(k + buffer, scoredServers.length); i++) {
      selected.push(scoredServers[i].server);
    }
    
    // Log selection for monitoring
    this.logSelection(scoredServers, selected);
    
    return selected;
  }
  
  /**
   * Log server selection for monitoring
   */
  private logSelection(
    scoredServers: ServerScore[],
    selected: Server[]
  ): void {
    console.log('Server selection complete:', {
      available: scoredServers.length,
      selected: selected.length,
      threshold: this.config.threshold,
      topScores: scoredServers.slice(0, 5).map(s => ({
        id: s.server.id,
        score: s.score.toFixed(3),
        metrics: s.metrics
      }))
    });
  }
  
  /**
   * Get default metrics when fetch fails
   */
  private getDefaultMetrics(): ServerMetrics {
    return {
      avgLatency: 100,
      uptime: 99,
      requestsPerSecond: 0,
      errorRate: 0,
      timestamp: Date.now()
    };
  }
}

// Type definitions
interface ServerMetrics {
  avgLatency: number;      // milliseconds
  uptime: number;          // percentage (0-100)
  requestsPerSecond: number;
  errorRate: number;       // percentage (0-100)
  timestamp: number;
}

interface GeographicLocation {
  lat: number;
  lon: number;
  region?: string;
}

interface ScoreWeights {
  importance: number;
  latency: number;
  reliability: number;
  geographic: number;
}

// Usage example
export async function selectOptimalServers(
  config: ThresholdConfig,
  availableServers: Server[],
  userLocation?: GeographicLocation
): Promise<Server[]> {
  const selector = new ServerSelectionAlgorithm(config);
  
  try {
    // Try performance strategy first
    return await selector.selectServers(
      availableServers,
      userLocation,
      'performance'
    );
  } catch (error) {
    console.warn('Performance selection failed, falling back to balanced:', error);
    
    // Fallback to balanced strategy
    return await selector.selectServers(
      availableServers,
      userLocation,
      'balanced'
    );
  }
}