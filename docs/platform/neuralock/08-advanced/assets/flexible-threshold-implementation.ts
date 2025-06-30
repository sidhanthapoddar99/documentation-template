import { 
  ThresholdConfig, 
  Server, 
  ShareDistribution,
  ImportanceFactor 
} from '@neuralock/types';
import { ShamirSecretSharing } from '@neuralock/crypto';

export class FlexibleThresholdManager {
  private readonly config: ThresholdConfig;
  private readonly shamir: ShamirSecretSharing;
  private serverWeights: Map<string, number>;
  
  constructor(config: ThresholdConfig) {
    this.config = config;
    this.shamir = new ShamirSecretSharing();
    this.serverWeights = this.calculateServerWeights();
  }
  
  /**
   * Distribute shares with flexible threshold support
   */
  async distributeShares(
    secret: Uint8Array,
    servers: Server[]
  ): Promise<ShareDistribution> {
    if (this.config.mode === 'strict') {
      return this.strictDistribution(secret, servers);
    }
    
    return this.flexibleDistribution(secret, servers);
  }
  
  /**
   * Strict threshold distribution (equal shares)
   */
  private async strictDistribution(
    secret: Uint8Array,
    servers: Server[]
  ): Promise<ShareDistribution> {
    // Generate standard Shamir shares
    const shares = await this.shamir.split(
      secret,
      this.config.threshold.k,
      this.config.threshold.n
    );
    
    // Distribute one share per server
    const distribution: ShareDistribution = {
      mode: 'strict',
      threshold: this.config.threshold,
      shares: new Map()
    };
    
    servers.forEach((server, index) => {
      distribution.shares.set(server.id, {
        shareIndex: index + 1,
        shareData: shares[index],
        weight: 1.0
      });
    });
    
    return distribution;
  }
  
  /**
   * Flexible threshold distribution with importance factors
   */
  private async flexibleDistribution(
    secret: Uint8Array,
    servers: Server[]
  ): Promise<ShareDistribution> {
    // Sort servers by importance
    const sortedServers = this.sortServersByImportance(servers);
    
    // Calculate share allocation based on importance
    const allocation = this.calculateShareAllocation(sortedServers);
    
    // Generate weighted shares
    const totalShares = allocation.reduce((sum, a) => sum + a.shares, 0);
    const shares = await this.shamir.split(
      secret,
      this.config.threshold.k,
      totalShares
    );
    
    // Distribute shares according to allocation
    const distribution: ShareDistribution = {
      mode: 'flexible',
      threshold: this.config.threshold,
      shares: new Map(),
      allocation
    };
    
    let shareIndex = 0;
    allocation.forEach((alloc) => {
      const serverShares = [];
      for (let i = 0; i < alloc.shares; i++) {
        serverShares.push(shares[shareIndex++]);
      }
      
      distribution.shares.set(alloc.serverId, {
        shareIndex: alloc.serverIndex,
        shareData: serverShares,
        weight: alloc.importance,
        shareCount: alloc.shares
      });
    });
    
    return distribution;
  }
  
  /**
   * Calculate server weights based on importance factors
   */
  private calculateServerWeights(): Map<string, number> {
    const weights = new Map<string, number>();
    
    this.config.servers.forEach((server) => {
      const importance = server.importance || 1.0;
      const reliability = server.metrics?.reliability || 1.0;
      const performance = server.metrics?.performance || 1.0;
      
      // Combined weight calculation
      const weight = importance * 0.5 + reliability * 0.3 + performance * 0.2;
      weights.set(server.id, weight);
    });
    
    return weights;
  }
  
  /**
   * Sort servers by importance for flexible distribution
   */
  private sortServersByImportance(servers: Server[]): Server[] {
    return [...servers].sort((a, b) => {
      const weightA = this.serverWeights.get(a.id) || 1.0;
      const weightB = this.serverWeights.get(b.id) || 1.0;
      return weightB - weightA;
    });
  }
  
  /**
   * Calculate share allocation based on server importance
   */
  private calculateShareAllocation(
    servers: Server[]
  ): ShareAllocation[] {
    const allocation: ShareAllocation[] = [];
    const k = this.config.threshold.k;
    const n = servers.length;
    
    // Base shares per server
    const baseShares = Math.floor(k / n);
    let remainingShares = k - (baseShares * n);
    
    servers.forEach((server, index) => {
      const weight = this.serverWeights.get(server.id) || 1.0;
      let shares = baseShares;
      
      // Allocate extra shares to higher importance servers
      if (remainingShares > 0 && weight > 0.8) {
        shares++;
        remainingShares--;
      }
      
      allocation.push({
        serverId: server.id,
        serverIndex: index + 1,
        shares,
        importance: weight,
        required: shares >= Math.ceil(k / n)
      });
    });
    
    // Ensure we've allocated all shares
    if (remainingShares > 0) {
      // Give remaining shares to most important servers
      allocation.sort((a, b) => b.importance - a.importance);
      for (let i = 0; i < remainingShares; i++) {
        allocation[i].shares++;
      }
    }
    
    return allocation;
  }
  
  /**
   * Reconstruct secret with flexible threshold
   */
  async reconstructSecret(
    collectedShares: CollectedShare[]
  ): Promise<Uint8Array> {
    if (this.config.mode === 'strict') {
      return this.strictReconstruction(collectedShares);
    }
    
    return this.flexibleReconstruction(collectedShares);
  }
  
  /**
   * Strict reconstruction (standard Shamir)
   */
  private async strictReconstruction(
    collectedShares: CollectedShare[]
  ): Promise<Uint8Array> {
    if (collectedShares.length < this.config.threshold.k) {
      throw new Error(
        `Insufficient shares: ${collectedShares.length} < ${this.config.threshold.k}`
      );
    }
    
    const shares = collectedShares
      .slice(0, this.config.threshold.k)
      .map(cs => cs.shareData);
    
    return this.shamir.combine(shares);
  }
  
  /**
   * Flexible reconstruction with weighted shares
   */
  private async flexibleReconstruction(
    collectedShares: CollectedShare[]
  ): Promise<Uint8Array> {
    // Calculate total weight of collected shares
    const totalWeight = collectedShares.reduce(
      (sum, share) => sum + (share.weight || 1.0),
      0
    );
    
    // Check if we have sufficient weight
    const requiredWeight = this.calculateRequiredWeight();
    if (totalWeight < requiredWeight) {
      throw new Error(
        `Insufficient share weight: ${totalWeight} < ${requiredWeight}`
      );
    }
    
    // Select shares for reconstruction
    const selectedShares = this.selectSharesForReconstruction(
      collectedShares,
      requiredWeight
    );
    
    // Flatten multi-shares from high-importance servers
    const flatShares = [];
    selectedShares.forEach(share => {
      if (Array.isArray(share.shareData)) {
        flatShares.push(...share.shareData);
      } else {
        flatShares.push(share.shareData);
      }
    });
    
    return this.shamir.combine(flatShares.slice(0, this.config.threshold.k));
  }
  
  /**
   * Calculate required weight for reconstruction
   */
  private calculateRequiredWeight(): number {
    // In flexible mode, we need equivalent weight to k shares
    // High importance servers contribute more weight
    return this.config.threshold.k * 0.8; // 80% of k as base requirement
  }
  
  /**
   * Select optimal shares for reconstruction
   */
  private selectSharesForReconstruction(
    collectedShares: CollectedShare[],
    requiredWeight: number
  ): CollectedShare[] {
    // Sort by weight (highest first)
    const sorted = [...collectedShares].sort(
      (a, b) => (b.weight || 1) - (a.weight || 1)
    );
    
    const selected: CollectedShare[] = [];
    let currentWeight = 0;
    
    for (const share of sorted) {
      selected.push(share);
      currentWeight += share.weight || 1;
      
      if (currentWeight >= requiredWeight) {
        break;
      }
    }
    
    return selected;
  }
  
  /**
   * Validate threshold configuration
   */
  validateConfiguration(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic validation
    if (this.config.threshold.k < 1) {
      errors.push('Threshold k must be at least 1');
    }
    
    if (this.config.threshold.k > this.config.threshold.n) {
      errors.push('Threshold k cannot exceed n');
    }
    
    // Security warnings
    if (this.config.threshold.k === 1) {
      warnings.push('k=1 provides no security against server compromise');
    }
    
    if (this.config.threshold.k < Math.ceil((this.config.threshold.n + 1) / 2)) {
      warnings.push('Consider k >= (n+1)/2 for Byzantine fault tolerance');
    }
    
    // Flexible mode validation
    if (this.config.mode === 'flexible') {
      const totalWeight = Array.from(this.serverWeights.values())
        .reduce((sum, w) => sum + w, 0);
      
      if (totalWeight < this.config.threshold.k) {
        errors.push('Total server weight insufficient for threshold');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Type definitions
interface ShareAllocation {
  serverId: string;
  serverIndex: number;
  shares: number;
  importance: number;
  required: boolean;
}

interface CollectedShare {
  serverId: string;
  shareData: Uint8Array | Uint8Array[];
  weight?: number;
  shareCount?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Usage example
export async function setupFlexibleThreshold(
  servers: Server[],
  k: number,
  n: number
): Promise<FlexibleThresholdManager> {
  const config: ThresholdConfig = {
    threshold: { k, n },
    mode: 'flexible',
    servers,
    selectionStrategy: 'importance_weighted'
  };
  
  const manager = new FlexibleThresholdManager(config);
  
  // Validate configuration
  const validation = manager.validateConfiguration();
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Configuration warnings:', validation.warnings);
  }
  
  return manager;
}