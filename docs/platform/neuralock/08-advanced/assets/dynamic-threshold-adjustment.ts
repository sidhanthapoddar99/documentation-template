import { EventEmitter } from 'events';
import { 
  ThresholdConfig, 
  ThreatLevel, 
  SystemMetrics,
  AdjustmentPolicy 
} from '@neuralock/types';

export class DynamicThresholdAdjuster extends EventEmitter {
  private currentConfig: ThresholdConfig;
  private readonly baseConfig: ThresholdConfig;
  private readonly policies: Map<string, AdjustmentPolicy>;
  private threatLevel: ThreatLevel = 'normal';
  private metricsHistory: SystemMetrics[] = [];
  
  constructor(baseConfig: ThresholdConfig) {
    super();
    this.baseConfig = baseConfig;
    this.currentConfig = { ...baseConfig };
    this.policies = this.initializePolicies();
  }
  
  /**
   * Initialize adjustment policies
   */
  private initializePolicies(): Map<string, AdjustmentPolicy> {
    const policies = new Map<string, AdjustmentPolicy>();
    
    // Threat-based policies
    policies.set('threat_elevated', {
      id: 'threat_elevated',
      name: 'Elevated Threat Response',
      trigger: {
        type: 'threat_level',
        condition: (metrics) => this.threatLevel === 'elevated'
      },
      adjustment: {
        k_modifier: 1,  // Increase k by 1
        n_modifier: 0,  // Keep n same
        mode: 'strict'  // Switch to strict mode
      },
      priority: 10
    });
    
    policies.set('threat_critical', {
      id: 'threat_critical',
      name: 'Critical Threat Response',
      trigger: {
        type: 'threat_level',
        condition: (metrics) => this.threatLevel === 'critical'
      },
      adjustment: {
        k_modifier: 2,     // Increase k by 2
        n_modifier: 0,     // Keep n same
        mode: 'strict',    // Strict mode
        require_mfa: true  // Additional authentication
      },
      priority: 20
    });
    
    // Performance-based policies
    policies.set('high_latency', {
      id: 'high_latency',
      name: 'High Latency Mitigation',
      trigger: {
        type: 'performance',
        condition: (metrics) => metrics.avgLatency > 500
      },
      adjustment: {
        k_modifier: -1,     // Reduce k if possible
        n_modifier: 0,
        mode: 'flexible',   // Use flexible mode
        min_k: 2           // Never go below k=2
      },
      priority: 5
    });
    
    // Availability-based policies
    policies.set('server_degradation', {
      id: 'server_degradation',
      name: 'Server Degradation Response',
      trigger: {
        type: 'availability',
        condition: (metrics) => {
          const availableServers = metrics.servers.filter(s => s.healthy).length;
          return availableServers < this.baseConfig.threshold.n - 1;
        }
      },
      adjustment: {
        k_modifier: 0,
        n_modifier: -1,    // Reduce n to match available
        mode: 'flexible'
      },
      priority: 15
    });
    
    // Time-based policies
    policies.set('business_hours', {
      id: 'business_hours',
      name: 'Business Hours Optimization',
      trigger: {
        type: 'schedule',
        condition: (metrics) => {
          const hour = new Date().getHours();
          return hour >= 9 && hour <= 17; // 9 AM - 5 PM
        }
      },
      adjustment: {
        k_modifier: 0,
        n_modifier: 0,
        mode: 'flexible',
        selection_strategy: 'performance' // Optimize for speed
      },
      priority: 3
    });
    
    // Compliance-based policies
    policies.set('compliance_audit', {
      id: 'compliance_audit',
      name: 'Compliance Audit Mode',
      trigger: {
        type: 'manual',
        condition: (metrics) => metrics.auditMode === true
      },
      adjustment: {
        k_modifier: 1,
        n_modifier: 0,
        mode: 'strict',
        enable_logging: 'verbose',
        require_attestation: true
      },
      priority: 25
    });
    
    return policies;
  }
  
  /**
   * Evaluate current conditions and adjust threshold
   */
  async evaluateAndAdjust(metrics: SystemMetrics): Promise<ThresholdConfig> {
    // Store metrics history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }
    
    // Find applicable policies
    const applicablePolicies = this.findApplicablePolicies(metrics);
    
    if (applicablePolicies.length === 0) {
      // No adjustment needed
      return this.currentConfig;
    }
    
    // Apply highest priority policy
    const policy = applicablePolicies[0];
    const newConfig = this.applyPolicy(policy, metrics);
    
    // Validate new configuration
    if (this.validateAdjustment(newConfig)) {
      this.currentConfig = newConfig;
      this.emit('threshold_adjusted', {
        previous: this.baseConfig,
        current: newConfig,
        policy: policy.id,
        reason: policy.name,
        timestamp: new Date()
      });
    }
    
    return this.currentConfig;
  }
  
  /**
   * Find all applicable policies based on current metrics
   */
  private findApplicablePolicies(metrics: SystemMetrics): AdjustmentPolicy[] {
    const applicable: AdjustmentPolicy[] = [];
    
    this.policies.forEach(policy => {
      if (policy.trigger.condition(metrics)) {
        applicable.push(policy);
      }
    });
    
    // Sort by priority (highest first)
    return applicable.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Apply policy adjustments to create new configuration
   */
  private applyPolicy(
    policy: AdjustmentPolicy,
    metrics: SystemMetrics
  ): ThresholdConfig {
    const newConfig = { ...this.currentConfig };
    const adjustment = policy.adjustment;
    
    // Apply threshold modifications
    newConfig.threshold.k = Math.max(
      adjustment.min_k || 1,
      this.baseConfig.threshold.k + adjustment.k_modifier
    );
    
    newConfig.threshold.n = Math.max(
      newConfig.threshold.k,
      this.baseConfig.threshold.n + adjustment.n_modifier
    );
    
    // Apply mode change
    if (adjustment.mode) {
      newConfig.mode = adjustment.mode;
    }
    
    // Apply selection strategy
    if (adjustment.selection_strategy) {
      newConfig.selectionStrategy = adjustment.selection_strategy;
    }
    
    // Apply additional settings
    if (adjustment.require_mfa) {
      newConfig.security = {
        ...newConfig.security,
        requireMFA: true
      };
    }
    
    if (adjustment.enable_logging) {
      newConfig.logging = {
        level: adjustment.enable_logging,
        auditTrail: true
      };
    }
    
    return newConfig;
  }
  
  /**
   * Validate proposed threshold adjustment
   */
  private validateAdjustment(newConfig: ThresholdConfig): boolean {
    // Basic validation
    if (newConfig.threshold.k < 1) return false;
    if (newConfig.threshold.k > newConfig.threshold.n) return false;
    
    // Check against system constraints
    const availableServers = this.getAvailableServerCount();
    if (newConfig.threshold.k > availableServers) return false;
    
    // Ensure minimum security
    if (newConfig.threshold.k < this.getMinimumSecureThreshold()) return false;
    
    return true;
  }
  
  /**
   * Set threat level manually
   */
  setThreatLevel(level: ThreatLevel): void {
    if (this.threatLevel !== level) {
      this.threatLevel = level;
      this.emit('threat_level_changed', {
        previous: this.threatLevel,
        current: level,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Get current effective configuration
   */
  getCurrentConfig(): ThresholdConfig {
    return { ...this.currentConfig };
  }
  
  /**
   * Get adjustment history
   */
  getAdjustmentHistory(): AdjustmentEvent[] {
    return this.listeners('threshold_adjusted')
      .map(listener => listener as unknown as AdjustmentEvent);
  }
  
  /**
   * Reset to base configuration
   */
  reset(): void {
    this.currentConfig = { ...this.baseConfig };
    this.threatLevel = 'normal';
    this.emit('threshold_reset', {
      config: this.currentConfig,
      timestamp: new Date()
    });
  }
  
  /**
   * Get available server count from metrics
   */
  private getAvailableServerCount(): number {
    if (this.metricsHistory.length === 0) {
      return this.baseConfig.threshold.n;
    }
    
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    return latestMetrics.servers.filter(s => s.healthy).length;
  }
  
  /**
   * Calculate minimum secure threshold based on threat level
   */
  private getMinimumSecureThreshold(): number {
    switch (this.threatLevel) {
      case 'critical':
        return Math.max(3, Math.ceil(this.baseConfig.threshold.n * 0.6));
      case 'elevated':
        return Math.max(2, Math.ceil(this.baseConfig.threshold.n * 0.5));
      case 'normal':
      default:
        return 2; // Never go below 2 for security
    }
  }
  
  /**
   * Predict optimal threshold based on historical data
   */
  async predictOptimalThreshold(): Promise<ThresholdPrediction> {
    if (this.metricsHistory.length < 10) {
      return {
        recommended: this.currentConfig,
        confidence: 0.5,
        reasoning: 'Insufficient historical data'
      };
    }
    
    // Analyze historical patterns
    const analysis = this.analyzeHistoricalMetrics();
    
    // Calculate optimal threshold
    const optimalK = this.calculateOptimalK(analysis);
    const optimalN = this.calculateOptimalN(analysis);
    
    return {
      recommended: {
        ...this.currentConfig,
        threshold: { k: optimalK, n: optimalN }
      },
      confidence: analysis.confidence,
      reasoning: analysis.reasoning
    };
  }
  
  /**
   * Analyze historical metrics for patterns
   */
  private analyzeHistoricalMetrics(): MetricsAnalysis {
    const recentMetrics = this.metricsHistory.slice(-20);
    
    const avgLatency = recentMetrics.reduce(
      (sum, m) => sum + m.avgLatency, 0
    ) / recentMetrics.length;
    
    const avgAvailability = recentMetrics.reduce(
      (sum, m) => sum + m.servers.filter(s => s.healthy).length, 0
    ) / recentMetrics.length;
    
    const failureRate = recentMetrics.reduce(
      (sum, m) => sum + m.failureRate, 0
    ) / recentMetrics.length;
    
    return {
      avgLatency,
      avgAvailability,
      failureRate,
      confidence: Math.min(recentMetrics.length / 20, 1),
      reasoning: this.generateAnalysisReasoning(
        avgLatency,
        avgAvailability,
        failureRate
      )
    };
  }
  
  private calculateOptimalK(analysis: MetricsAnalysis): number {
    // Balance between security and performance
    const securityFactor = 1 - analysis.failureRate;
    const performanceFactor = analysis.avgLatency < 200 ? 0.8 : 0.6;
    
    const baseK = this.baseConfig.threshold.k;
    const optimalK = Math.round(baseK * securityFactor * performanceFactor);
    
    return Math.max(2, Math.min(optimalK, this.baseConfig.threshold.n - 1));
  }
  
  private calculateOptimalN(analysis: MetricsAnalysis): number {
    // Ensure sufficient redundancy
    const avgAvailable = Math.floor(analysis.avgAvailability);
    return Math.min(avgAvailable, this.baseConfig.threshold.n);
  }
  
  private generateAnalysisReasoning(
    avgLatency: number,
    avgAvailability: number,
    failureRate: number
  ): string {
    const reasons = [];
    
    if (avgLatency > 300) {
      reasons.push('High latency detected');
    }
    if (avgAvailability < this.baseConfig.threshold.n * 0.9) {
      reasons.push('Reduced server availability');
    }
    if (failureRate > 0.05) {
      reasons.push('Elevated failure rate');
    }
    
    return reasons.length > 0 
      ? reasons.join(', ') 
      : 'System operating normally';
  }
}

// Type definitions
interface AdjustmentEvent {
  previous: ThresholdConfig;
  current: ThresholdConfig;
  policy: string;
  reason: string;
  timestamp: Date;
}

interface ThresholdPrediction {
  recommended: ThresholdConfig;
  confidence: number;
  reasoning: string;
}

interface MetricsAnalysis {
  avgLatency: number;
  avgAvailability: number;
  failureRate: number;
  confidence: number;
  reasoning: string;
}

// Usage example
export async function setupDynamicThreshold(
  baseConfig: ThresholdConfig
): Promise<DynamicThresholdAdjuster> {
  const adjuster = new DynamicThresholdAdjuster(baseConfig);
  
  // Set up monitoring
  adjuster.on('threshold_adjusted', (event) => {
    console.log('Threshold adjusted:', event);
  });
  
  adjuster.on('threat_level_changed', (event) => {
    console.log('Threat level changed:', event);
  });
  
  // Start periodic evaluation
  setInterval(async () => {
    const metrics = await collectSystemMetrics();
    await adjuster.evaluateAndAdjust(metrics);
  }, 60000); // Every minute
  
  return adjuster;
}

async function collectSystemMetrics(): Promise<SystemMetrics> {
  // Implementation would collect real metrics
  return {
    timestamp: Date.now(),
    avgLatency: 150,
    servers: [],
    failureRate: 0.01,
    auditMode: false
  };
}