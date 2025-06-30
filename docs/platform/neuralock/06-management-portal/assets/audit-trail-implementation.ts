// Audit Trail Implementation
import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface AuditEntry {
  id: string;
  timestamp: number;
  category: 'role' | 'server' | 'verification' | 'config' | 'emergency';
  action: string;
  actor: {
    address: string;
    role: string;
    ip?: string;
    userAgent?: string;
    sessionId?: string;
  };
  target?: {
    type: 'user' | 'server' | 'config';
    id: string;
    previousState?: any;
    newState?: any;
  };
  result: 'success' | 'failure' | 'partial';
  metadata: {
    transactionHash?: string;
    blockNumber?: number;
    gasUsed?: string;
    error?: string;
    reason?: string;
  };
  hash: string;  // SHA256 hash of entry
  previousHash: string;  // Chain entries together
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  category?: AuditEntry['category'];
  actor?: string;
  target?: string;
  action?: string;
  result?: AuditEntry['result'];
}

export class AuditTrail extends EventEmitter {
  private entries: Map<string, AuditEntry> = new Map();
  private latestHash: string = '0x0';
  private merkleTree: MerkleTree;
  private storage: AuditStorage;
  
  constructor(storage: AuditStorage) {
    super();
    this.storage = storage;
    this.merkleTree = new MerkleTree();
  }
  
  // Create new audit entry
  async log(params: {
    category: AuditEntry['category'];
    action: string;
    actor: AuditEntry['actor'];
    target?: AuditEntry['target'];
    result: AuditEntry['result'];
    metadata?: Partial<AuditEntry['metadata']>;
  }): Promise<AuditEntry> {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      category: params.category,
      action: params.action,
      actor: params.actor,
      target: params.target,
      result: params.result,
      metadata: params.metadata || {},
      hash: '',
      previousHash: this.latestHash
    };
    
    // Calculate entry hash
    entry.hash = this.calculateHash(entry);
    
    // Store entry
    await this.storage.store(entry);
    this.entries.set(entry.id, entry);
    
    // Update merkle tree
    this.merkleTree.addLeaf(entry.hash);
    
    // Update latest hash
    this.latestHash = entry.hash;
    
    // Emit event
    this.emit('audit-logged', entry);
    
    // Periodic blockchain anchoring
    if (this.entries.size % 100 === 0) {
      await this.anchorToBlockchain();
    }
    
    return entry;
  }
  
  // Query audit entries
  async query(filter: AuditFilter): Promise<AuditEntry[]> {
    let entries = Array.from(this.entries.values());
    
    // Apply filters
    if (filter.startDate) {
      entries = entries.filter(e => e.timestamp >= filter.startDate!.getTime());
    }
    
    if (filter.endDate) {
      entries = entries.filter(e => e.timestamp <= filter.endDate!.getTime());
    }
    
    if (filter.category) {
      entries = entries.filter(e => e.category === filter.category);
    }
    
    if (filter.actor) {
      entries = entries.filter(e => 
        e.actor.address.toLowerCase() === filter.actor!.toLowerCase()
      );
    }
    
    if (filter.target) {
      entries = entries.filter(e => 
        e.target?.id.toLowerCase() === filter.target!.toLowerCase()
      );
    }
    
    if (filter.action) {
      entries = entries.filter(e => e.action === filter.action);
    }
    
    if (filter.result) {
      entries = entries.filter(e => e.result === filter.result);
    }
    
    // Sort by timestamp descending
    entries.sort((a, b) => b.timestamp - a.timestamp);
    
    return entries;
  }
  
  // Verify audit trail integrity
  async verifyIntegrity(startId?: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    const entries = Array.from(this.entries.values())
      .sort((a, b) => a.timestamp - b.timestamp);
    
    let previousHash = '0x0';
    let startChecking = !startId;
    
    for (const entry of entries) {
      if (!startChecking && entry.id === startId) {
        startChecking = true;
      }
      
      if (!startChecking) continue;
      
      // Verify hash chain
      if (entry.previousHash !== previousHash) {
        errors.push(`Chain broken at entry ${entry.id}: expected previous hash ${previousHash}, got ${entry.previousHash}`);
      }
      
      // Verify entry hash
      const calculatedHash = this.calculateHash(entry);
      if (entry.hash !== calculatedHash) {
        errors.push(`Invalid hash for entry ${entry.id}: expected ${calculatedHash}, got ${entry.hash}`);
      }
      
      previousHash = entry.hash;
    }
    
    // Verify merkle root
    const merkleRoot = this.merkleTree.getRoot();
    const blockchainRoot = await this.storage.getLatestMerkleRoot();
    
    if (merkleRoot !== blockchainRoot) {
      errors.push(`Merkle root mismatch: local ${merkleRoot}, blockchain ${blockchainRoot}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Export audit trail
  async export(filter: AuditFilter, format: 'json' | 'csv' = 'json'): Promise<string> {
    const entries = await this.query(filter);
    
    if (format === 'json') {
      return JSON.stringify(entries, null, 2);
    } else {
      // CSV export
      const headers = [
        'ID',
        'Timestamp',
        'Category',
        'Action',
        'Actor',
        'Actor Role',
        'Target Type',
        'Target ID',
        'Result',
        'Transaction Hash',
        'Reason'
      ];
      
      const rows = entries.map(entry => [
        entry.id,
        new Date(entry.timestamp).toISOString(),
        entry.category,
        entry.action,
        entry.actor.address,
        entry.actor.role,
        entry.target?.type || '',
        entry.target?.id || '',
        entry.result,
        entry.metadata.transactionHash || '',
        entry.metadata.reason || ''
      ]);
      
      return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
    }
  }
  
  // Generate statistics
  async getStatistics(filter: AuditFilter): Promise<{
    totalEntries: number;
    byCategory: Record<string, number>;
    byAction: Record<string, number>;
    byActor: Record<string, number>;
    byResult: Record<string, number>;
    timeline: Array<{ date: string; count: number }>;
  }> {
    const entries = await this.query(filter);
    
    const stats = {
      totalEntries: entries.length,
      byCategory: {} as Record<string, number>,
      byAction: {} as Record<string, number>,
      byActor: {} as Record<string, number>,
      byResult: {} as Record<string, number>,
      timeline: [] as Array<{ date: string; count: number }>
    };
    
    // Count by category
    entries.forEach(entry => {
      stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
      stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;
      stats.byActor[entry.actor.address] = (stats.byActor[entry.actor.address] || 0) + 1;
      stats.byResult[entry.result] = (stats.byResult[entry.result] || 0) + 1;
    });
    
    // Generate timeline
    const timelineMap = new Map<string, number>();
    entries.forEach(entry => {
      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
    });
    
    stats.timeline = Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return stats;
  }
  
  // Private methods
  private generateId(): string {
    return `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  private calculateHash(entry: AuditEntry): string {
    const data = {
      id: entry.id,
      timestamp: entry.timestamp,
      category: entry.category,
      action: entry.action,
      actor: entry.actor,
      target: entry.target,
      result: entry.result,
      metadata: entry.metadata,
      previousHash: entry.previousHash
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
  
  private async anchorToBlockchain(): Promise<void> {
    const merkleRoot = this.merkleTree.getRoot();
    const entryCount = this.entries.size;
    
    try {
      await this.storage.anchorMerkleRoot(merkleRoot, entryCount);
      this.emit('anchored', { merkleRoot, entryCount });
    } catch (error) {
      this.emit('anchor-failed', error);
    }
  }
}

// Merkle Tree implementation for audit entries
class MerkleTree {
  private leaves: string[] = [];
  
  addLeaf(hash: string): void {
    this.leaves.push(hash);
  }
  
  getRoot(): string {
    if (this.leaves.length === 0) return '0x0';
    if (this.leaves.length === 1) return this.leaves[0];
    
    let level = [...this.leaves];
    
    while (level.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || left; // Duplicate last if odd number
        
        const combined = crypto
          .createHash('sha256')
          .update(left + right)
          .digest('hex');
        
        nextLevel.push(combined);
      }
      
      level = nextLevel;
    }
    
    return level[0];
  }
  
  getProof(leafIndex: number): string[] {
    if (leafIndex >= this.leaves.length) {
      throw new Error('Leaf index out of bounds');
    }
    
    const proof: string[] = [];
    let level = [...this.leaves];
    let index = leafIndex;
    
    while (level.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || left;
        
        if (i === index || i + 1 === index) {
          proof.push(i === index ? right : left);
          index = Math.floor(index / 2);
        }
        
        const combined = crypto
          .createHash('sha256')
          .update(left + right)
          .digest('hex');
        
        nextLevel.push(combined);
      }
      
      level = nextLevel;
    }
    
    return proof;
  }
}

// Storage interface for audit entries
interface AuditStorage {
  store(entry: AuditEntry): Promise<void>;
  retrieve(id: string): Promise<AuditEntry | null>;
  anchorMerkleRoot(root: string, count: number): Promise<void>;
  getLatestMerkleRoot(): Promise<string>;
}

// Example usage
export function createAuditTrail(storage: AuditStorage): AuditTrail {
  const audit = new AuditTrail(storage);
  
  // Log all portal actions
  audit.on('audit-logged', (entry) => {
    console.log('Audit entry created:', entry.id);
  });
  
  // Handle blockchain anchoring
  audit.on('anchored', ({ merkleRoot, entryCount }) => {
    console.log(`Anchored ${entryCount} entries with root ${merkleRoot}`);
  });
  
  return audit;
}

// Audit middleware for Express
export function auditMiddleware(audit: AuditTrail) {
  return async (req: any, res: any, next: any) => {
    const start = Date.now();
    
    // Capture original end function
    const originalEnd = res.end;
    
    res.end = async function(...args: any[]) {
      // Call original end
      originalEnd.apply(res, args);
      
      // Log audit entry
      await audit.log({
        category: 'server',
        action: `${req.method} ${req.path}`,
        actor: {
          address: req.user?.address || 'anonymous',
          role: req.user?.role || 'none',
          ip: req.ip,
          userAgent: req.get('user-agent'),
          sessionId: req.session?.id
        },
        result: res.statusCode < 400 ? 'success' : 'failure',
        metadata: {
          responseTime: Date.now() - start,
          statusCode: res.statusCode
        }
      });
    };
    
    next();
  };
}