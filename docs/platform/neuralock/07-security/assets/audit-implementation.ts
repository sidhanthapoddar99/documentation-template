// Comprehensive Audit Implementation for Neuralock
import { createHash, randomBytes } from 'crypto';
import { EventEmitter } from 'events';

// Audit event structure
export interface AuditEvent {
  id: string;
  timestamp: Date;
  category: AuditCategory;
  event: string;
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  actor: AuditActor;
  target?: AuditTarget;
  details: Record<string, any>;
  result: AuditResult;
  metadata: AuditMetadata;
  hash?: string;
  previousHash?: string;
}

export interface AuditActor {
  address: string;
  role?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  origin?: string;
}

export interface AuditTarget {
  type: 'user' | 'server' | 'object' | 'system';
  id: string;
  contract?: string;
  previousState?: any;
  newState?: any;
}

export interface AuditResult {
  success: boolean;
  duration?: number;
  error?: string;
  errorCode?: string;
}

export interface AuditMetadata {
  requestId: string;
  traceId: string;
  version: string;
  environment: string;
  serverNode?: string;
  additionalInfo?: Record<string, any>;
}

export type AuditCategory = 
  | 'authentication'
  | 'authorization'
  | 'data_operation'
  | 'system_event'
  | 'security_event'
  | 'configuration'
  | 'compliance';

// Main audit service
export class AuditService extends EventEmitter {
  private buffer: AuditEvent[] = [];
  private previousHash: string = '0x0';
  private flushInterval: NodeJS.Timer;
  private storage: AuditStorage;
  private blockchain: BlockchainAnchor;
  
  constructor(
    storage: AuditStorage,
    blockchain: BlockchainAnchor,
    flushIntervalMs: number = 10000
  ) {
    super();
    this.storage = storage;
    this.blockchain = blockchain;
    
    // Start periodic flush
    this.flushInterval = setInterval(() => {
      this.flush();
    }, flushIntervalMs);
  }
  
  // Log an audit event
  async log(params: {
    category: AuditCategory;
    event: string;
    severity?: AuditEvent['severity'];
    actor: AuditActor;
    target?: AuditTarget;
    details?: Record<string, any>;
    result: AuditResult;
    metadata?: Partial<AuditMetadata>;
  }): Promise<void> {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      category: params.category,
      event: params.event,
      severity: params.severity || 'info',
      actor: this.sanitizeActor(params.actor),
      target: params.target,
      details: params.details || {},
      result: params.result,
      metadata: {
        requestId: params.metadata?.requestId || this.generateRequestId(),
        traceId: params.metadata?.traceId || this.generateTraceId(),
        version: params.metadata?.version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        serverNode: process.env.SERVER_NODE || 'unknown',
        ...params.metadata
      }
    };
    
    // Calculate event hash
    auditEvent.previousHash = this.previousHash;
    auditEvent.hash = this.calculateEventHash(auditEvent);
    this.previousHash = auditEvent.hash;
    
    // Add to buffer
    this.buffer.push(auditEvent);
    
    // Emit for real-time monitoring
    this.emit('audit_event', auditEvent);
    
    // Check if immediate flush needed
    if (auditEvent.severity === 'critical' || this.buffer.length >= 100) {
      await this.flush();
    }
  }
  
  // Flush buffered events to storage
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const events = [...this.buffer];
    this.buffer = [];
    
    try {
      // Store events
      await this.storage.batchStore(events);
      
      // Calculate merkle root for blockchain anchoring
      const merkleRoot = this.calculateMerkleRoot(events);
      
      // Anchor to blockchain periodically
      if (events.length >= 50 || events.some(e => e.severity === 'critical')) {
        await this.blockchain.anchor(merkleRoot, events.length);
      }
      
      this.emit('flush_complete', {
        eventCount: events.length,
        merkleRoot
      });
      
    } catch (error) {
      // Re-add events to buffer on failure
      this.buffer = [...events, ...this.buffer];
      this.emit('flush_error', error);
    }
  }
  
  // Query audit logs
  async query(params: AuditQuery): Promise<AuditEvent[]> {
    return this.storage.query(params);
  }
  
  // Verify audit trail integrity
  async verifyIntegrity(
    startTime: Date,
    endTime: Date
  ): Promise<IntegrityCheckResult> {
    const events = await this.query({ startTime, endTime });
    
    if (events.length === 0) {
      return { valid: true, errors: [] };
    }
    
    const errors: string[] = [];
    let previousHash = events[0].previousHash || '0x0';
    
    for (const event of events) {
      // Verify hash chain
      if (event.previousHash !== previousHash) {
        errors.push(`Chain broken at event ${event.id}`);
      }
      
      // Verify event hash
      const calculatedHash = this.calculateEventHash(event);
      if (event.hash !== calculatedHash) {
        errors.push(`Invalid hash for event ${event.id}`);
      }
      
      previousHash = event.hash!;
    }
    
    // Verify blockchain anchors
    const anchors = await this.blockchain.getAnchors(startTime, endTime);
    for (const anchor of anchors) {
      const anchorEvents = events.filter(e => 
        e.timestamp >= anchor.startTime && 
        e.timestamp <= anchor.endTime
      );
      
      const calculatedRoot = this.calculateMerkleRoot(anchorEvents);
      if (calculatedRoot !== anchor.merkleRoot) {
        errors.push(`Merkle root mismatch for anchor ${anchor.id}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      eventsChecked: events.length,
      anchorsVerified: anchors.length
    };
  }
  
  // Generate compliance report
  async generateComplianceReport(
    regulation: string,
    startTime: Date,
    endTime: Date
  ): Promise<ComplianceReport> {
    const events = await this.query({
      startTime,
      endTime,
      categories: this.getRegulationCategories(regulation)
    });
    
    const report: ComplianceReport = {
      regulation,
      period: { start: startTime, end: endTime },
      summary: this.summarizeEvents(events),
      compliance: await this.checkCompliance(regulation, events),
      violations: this.findViolations(regulation, events),
      recommendations: this.generateRecommendations(regulation, events)
    };
    
    // Store report for audit trail
    await this.log({
      category: 'compliance',
      event: 'report_generated',
      actor: { address: 'system', role: 'compliance_monitor' },
      details: { regulation, period: report.period },
      result: { success: true }
    });
    
    return report;
  }
  
  // Private helper methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }
  
  private generateRequestId(): string {
    return `req_${randomBytes(16).toString('hex')}`;
  }
  
  private generateTraceId(): string {
    return `trc_${randomBytes(16).toString('hex')}`;
  }
  
  private sanitizeActor(actor: AuditActor): AuditActor {
    return {
      address: actor.address.toLowerCase(),
      role: actor.role,
      sessionId: actor.sessionId,
      ip: this.anonymizeIP(actor.ip),
      userAgent: actor.userAgent,
      origin: actor.origin
    };
  }
  
  private anonymizeIP(ip?: string): string | undefined {
    if (!ip) return undefined;
    
    // For GDPR compliance, anonymize last octet
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
    
    return ip;
  }
  
  private calculateEventHash(event: AuditEvent): string {
    const data = {
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      category: event.category,
      event: event.event,
      severity: event.severity,
      actor: event.actor,
      target: event.target,
      details: event.details,
      result: event.result,
      metadata: event.metadata,
      previousHash: event.previousHash
    };
    
    return createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
  
  private calculateMerkleRoot(events: AuditEvent[]): string {
    if (events.length === 0) return '0x0';
    
    let hashes = events.map(e => e.hash!);
    
    while (hashes.length > 1) {
      const newHashes: string[] = [];
      
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left;
        
        const combined = createHash('sha256')
          .update(left + right)
          .digest('hex');
        
        newHashes.push(combined);
      }
      
      hashes = newHashes;
    }
    
    return hashes[0];
  }
  
  private getRegulationCategories(regulation: string): AuditCategory[] {
    const categoryMap: Record<string, AuditCategory[]> = {
      'GDPR': ['authentication', 'authorization', 'data_operation'],
      'CCPA': ['data_operation', 'authorization'],
      'HIPAA': ['authentication', 'authorization', 'data_operation', 'security_event'],
      'SOC2': ['security_event', 'system_event', 'configuration']
    };
    
    return categoryMap[regulation] || [];
  }
  
  private summarizeEvents(events: AuditEvent[]): EventSummary {
    return {
      total: events.length,
      byCategory: this.groupByCategory(events),
      bySeverity: this.groupBySeverity(events),
      byResult: this.groupByResult(events),
      uniqueActors: this.countUniqueActors(events),
      timeRange: this.getTimeRange(events)
    };
  }
  
  private async checkCompliance(
    regulation: string,
    events: AuditEvent[]
  ): Promise<ComplianceStatus> {
    // Implement regulation-specific compliance checks
    const checks = this.getComplianceChecks(regulation);
    const results = await Promise.all(
      checks.map(check => check(events))
    );
    
    return {
      compliant: results.every(r => r.passed),
      score: (results.filter(r => r.passed).length / results.length) * 100,
      details: results
    };
  }
  
  // Cleanup
  destroy(): void {
    clearInterval(this.flushInterval);
    this.flush(); // Final flush
  }
}

// Type definitions
export interface AuditQuery {
  startTime?: Date;
  endTime?: Date;
  categories?: AuditCategory[];
  events?: string[];
  actors?: string[];
  severity?: AuditEvent['severity'][];
  limit?: number;
  offset?: number;
}

export interface IntegrityCheckResult {
  valid: boolean;
  errors: string[];
  eventsChecked?: number;
  anchorsVerified?: number;
}

export interface ComplianceReport {
  regulation: string;
  period: { start: Date; end: Date };
  summary: EventSummary;
  compliance: ComplianceStatus;
  violations: Violation[];
  recommendations: string[];
}

export interface EventSummary {
  total: number;
  byCategory: Record<AuditCategory, number>;
  bySeverity: Record<string, number>;
  byResult: { success: number; failure: number };
  uniqueActors: number;
  timeRange: { start: Date; end: Date };
}

export interface ComplianceStatus {
  compliant: boolean;
  score: number;
  details: ComplianceCheckResult[];
}

export interface ComplianceCheckResult {
  check: string;
  passed: boolean;
  details?: string;
}

export interface Violation {
  event: AuditEvent;
  rule: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// Storage interface
export interface AuditStorage {
  store(event: AuditEvent): Promise<void>;
  batchStore(events: AuditEvent[]): Promise<void>;
  query(params: AuditQuery): Promise<AuditEvent[]>;
}

// Blockchain anchor interface
export interface BlockchainAnchor {
  anchor(merkleRoot: string, eventCount: number): Promise<void>;
  getAnchors(startTime: Date, endTime: Date): Promise<Anchor[]>;
}

export interface Anchor {
  id: string;
  merkleRoot: string;
  eventCount: number;
  startTime: Date;
  endTime: Date;
  transactionHash: string;
  blockNumber: number;
}

// Audit middleware for Express
export function auditMiddleware(auditService: AuditService) {
  return async (req: any, res: any, next: any) => {
    const start = Date.now();
    const requestId = auditService['generateRequestId']();
    
    // Add request ID to headers
    req.auditRequestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    // Capture original methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Override response methods
    const captureResponse = async (body: any) => {
      const duration = Date.now() - start;
      
      await auditService.log({
        category: 'data_operation',
        event: `${req.method} ${req.path}`,
        actor: {
          address: req.user?.address || 'anonymous',
          role: req.user?.role,
          sessionId: req.session?.id,
          ip: req.ip,
          userAgent: req.get('user-agent')
        },
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          statusCode: res.statusCode
        },
        result: {
          success: res.statusCode < 400,
          duration,
          error: res.statusCode >= 400 ? body?.error : undefined
        },
        metadata: { requestId }
      });
    };
    
    res.send = function(body: any) {
      captureResponse(body);
      return originalSend.call(this, body);
    };
    
    res.json = function(body: any) {
      captureResponse(body);
      return originalJson.call(this, body);
    };
    
    next();
  };
}