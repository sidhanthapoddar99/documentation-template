// Compliance Checks Implementation for Neuralock
import { AuditEvent } from './audit-implementation';

// Compliance check function type
export type ComplianceCheck = (events: AuditEvent[]) => ComplianceCheckResult;

export interface ComplianceCheckResult {
  check: string;
  passed: boolean;
  details?: string;
  violations?: Violation[];
}

export interface Violation {
  eventId: string;
  timestamp: Date;
  description: string;
  severity: 'low' | 'medium' | 'high';
  remediation?: string;
}

// GDPR Compliance Checks
export class GDPRComplianceChecks {
  // Check data minimization principle
  static checkDataMinimization(events: AuditEvent[]): ComplianceCheckResult {
    const dataOperations = events.filter(e => e.category === 'data_operation');
    const violations: Violation[] = [];
    
    dataOperations.forEach(event => {
      if (event.details.dataSize && event.details.dataSize > 1048576) { // 1MB
        violations.push({
          eventId: event.id,
          timestamp: event.timestamp,
          description: 'Large data collection detected',
          severity: 'medium',
          remediation: 'Review if all collected data is necessary'
        });
      }
    });
    
    return {
      check: 'GDPR Data Minimization',
      passed: violations.length === 0,
      details: `Checked ${dataOperations.length} data operations`,
      violations
    };
  }
  
  // Check user consent tracking
  static checkUserConsent(events: AuditEvent[]): ComplianceCheckResult {
    const userOperations = events.filter(e => 
      e.category === 'data_operation' && 
      e.target?.type === 'user'
    );
    
    const violations: Violation[] = [];
    
    userOperations.forEach(event => {
      if (!event.details.consentId && !event.details.legalBasis) {
        violations.push({
          eventId: event.id,
          timestamp: event.timestamp,
          description: 'Data operation without documented consent',
          severity: 'high',
          remediation: 'Ensure user consent is obtained and tracked'
        });
      }
    });
    
    return {
      check: 'GDPR User Consent',
      passed: violations.length === 0,
      details: `Found ${violations.length} operations without consent`,
      violations
    };
  }
  
  // Check data access logging
  static checkAccessLogging(events: AuditEvent[]): ComplianceCheckResult {
    const accessEvents = events.filter(e => 
      e.event.includes('access') || e.event.includes('read')
    );
    
    const missingDetails = accessEvents.filter(e => 
      !e.actor.address || !e.target || !e.details.purpose
    );
    
    return {
      check: 'GDPR Access Logging',
      passed: missingDetails.length === 0,
      details: `${missingDetails.length} access events missing required details`,
      violations: missingDetails.map(e => ({
        eventId: e.id,
        timestamp: e.timestamp,
        description: 'Access event missing actor, target, or purpose',
        severity: 'medium',
        remediation: 'Ensure all access events include complete information'
      }))
    };
  }
  
  // Check data retention compliance
  static checkDataRetention(events: AuditEvent[]): ComplianceCheckResult {
    const retentionViolations: Violation[] = [];
    const deletionEvents = events.filter(e => e.event.includes('delete'));
    
    // Check if data is being deleted according to retention policy
    const dataCreationEvents = events.filter(e => 
      e.event.includes('create') && e.target?.type === 'object'
    );
    
    dataCreationEvents.forEach(creation => {
      const deletionEvent = deletionEvents.find(d => 
        d.target?.id === creation.target?.id
      );
      
      if (!deletionEvent) {
        const age = Date.now() - creation.timestamp.getTime();
        const maxRetention = 365 * 24 * 60 * 60 * 1000; // 1 year
        
        if (age > maxRetention) {
          retentionViolations.push({
            eventId: creation.id,
            timestamp: creation.timestamp,
            description: 'Data exceeds retention period',
            severity: 'high',
            remediation: 'Delete data according to retention policy'
          });
        }
      }
    });
    
    return {
      check: 'GDPR Data Retention',
      passed: retentionViolations.length === 0,
      details: `Found ${retentionViolations.length} retention violations`,
      violations: retentionViolations
    };
  }
  
  // Get all GDPR checks
  static getAllChecks(): ComplianceCheck[] {
    return [
      this.checkDataMinimization,
      this.checkUserConsent,
      this.checkAccessLogging,
      this.checkDataRetention
    ];
  }
}

// CCPA Compliance Checks
export class CCPAComplianceChecks {
  // Check opt-out compliance
  static checkOptOut(events: AuditEvent[]): ComplianceCheckResult {
    const optOutRequests = events.filter(e => 
      e.event === 'user_opt_out_request'
    );
    
    const violations: Violation[] = [];
    
    optOutRequests.forEach(request => {
      // Check if opt-out was honored
      const subsequentDataUse = events.find(e => 
        e.timestamp > request.timestamp &&
        e.target?.id === request.actor.address &&
        e.category === 'data_operation' &&
        !e.details.optOutHonored
      );
      
      if (subsequentDataUse) {
        violations.push({
          eventId: subsequentDataUse.id,
          timestamp: subsequentDataUse.timestamp,
          description: 'Data used after opt-out request',
          severity: 'high',
          remediation: 'Honor opt-out requests immediately'
        });
      }
    });
    
    return {
      check: 'CCPA Opt-Out Compliance',
      passed: violations.length === 0,
      details: `Processed ${optOutRequests.length} opt-out requests`,
      violations
    };
  }
  
  // Check data access requests
  static checkAccessRequests(events: AuditEvent[]): ComplianceCheckResult {
    const accessRequests = events.filter(e => 
      e.event === 'user_data_access_request'
    );
    
    const violations: Violation[] = [];
    
    accessRequests.forEach(request => {
      // Check response time (CCPA requires 45 days)
      const response = events.find(e => 
        e.event === 'user_data_access_response' &&
        e.details.requestId === request.id
      );
      
      if (!response) {
        const age = Date.now() - request.timestamp.getTime();
        if (age > 45 * 24 * 60 * 60 * 1000) {
          violations.push({
            eventId: request.id,
            timestamp: request.timestamp,
            description: 'Access request not fulfilled within 45 days',
            severity: 'high',
            remediation: 'Respond to access requests within required timeframe'
          });
        }
      }
    });
    
    return {
      check: 'CCPA Access Request Compliance',
      passed: violations.length === 0,
      details: `${violations.length} overdue access requests`,
      violations
    };
  }
  
  // Get all CCPA checks
  static getAllChecks(): ComplianceCheck[] {
    return [
      this.checkOptOut,
      this.checkAccessRequests
    ];
  }
}

// HIPAA Compliance Checks
export class HIPAAComplianceChecks {
  // Check access controls for PHI
  static checkPHIAccessControls(events: AuditEvent[]): ComplianceCheckResult {
    const phiAccess = events.filter(e => 
      e.details.dataType === 'PHI' || e.details.isHealthData
    );
    
    const violations: Violation[] = [];
    
    phiAccess.forEach(event => {
      // Check if access was authorized
      if (!event.details.authorization || !event.actor.role) {
        violations.push({
          eventId: event.id,
          timestamp: event.timestamp,
          description: 'PHI accessed without proper authorization',
          severity: 'high',
          remediation: 'Implement strict access controls for PHI'
        });
      }
      
      // Check minimum necessary standard
      if (event.details.dataScope === 'full' && !event.details.justification) {
        violations.push({
          eventId: event.id,
          timestamp: event.timestamp,
          description: 'Full PHI access without justification',
          severity: 'medium',
          remediation: 'Apply minimum necessary standard'
        });
      }
    });
    
    return {
      check: 'HIPAA Access Controls',
      passed: violations.length === 0,
      details: `Checked ${phiAccess.length} PHI access events`,
      violations
    };
  }
  
  // Check audit logging for PHI
  static checkPHIAuditLogging(events: AuditEvent[]): ComplianceCheckResult {
    const phiEvents = events.filter(e => 
      e.details.dataType === 'PHI' || e.details.isHealthData
    );
    
    const incomplete = phiEvents.filter(e => 
      !e.actor.address ||
      !e.actor.role ||
      !e.target ||
      !e.details.purpose ||
      !e.result
    );
    
    return {
      check: 'HIPAA Audit Logging',
      passed: incomplete.length === 0,
      details: `${incomplete.length} PHI events with incomplete logging`,
      violations: incomplete.map(e => ({
        eventId: e.id,
        timestamp: e.timestamp,
        description: 'PHI event missing required audit information',
        severity: 'high',
        remediation: 'Ensure complete audit trail for all PHI access'
      }))
    };
  }
  
  // Check encryption compliance
  static checkEncryption(events: AuditEvent[]): ComplianceCheckResult {
    const transmissions = events.filter(e => 
      e.event.includes('transmit') || e.event.includes('send')
    );
    
    const unencrypted = transmissions.filter(e => 
      !e.details.encrypted || e.details.encryptionMethod === 'none'
    );
    
    return {
      check: 'HIPAA Encryption',
      passed: unencrypted.length === 0,
      details: `Found ${unencrypted.length} unencrypted transmissions`,
      violations: unencrypted.map(e => ({
        eventId: e.id,
        timestamp: e.timestamp,
        description: 'Data transmitted without encryption',
        severity: 'high',
        remediation: 'Encrypt all data in transit and at rest'
      }))
    };
  }
  
  // Get all HIPAA checks
  static getAllChecks(): ComplianceCheck[] {
    return [
      this.checkPHIAccessControls,
      this.checkPHIAuditLogging,
      this.checkEncryption
    ];
  }
}

// SOC 2 Compliance Checks
export class SOC2ComplianceChecks {
  // Check availability monitoring
  static checkAvailability(events: AuditEvent[]): ComplianceCheckResult {
    const systemEvents = events.filter(e => e.category === 'system_event');
    const downtime = systemEvents.filter(e => 
      e.event === 'system_down' || e.severity === 'critical'
    );
    
    const totalTime = events.length > 0 
      ? events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime()
      : 0;
    
    const downtimeMs = downtime.reduce((total, event) => {
      const duration = event.details.duration || 0;
      return total + duration;
    }, 0);
    
    const availability = totalTime > 0 
      ? ((totalTime - downtimeMs) / totalTime) * 100 
      : 100;
    
    return {
      check: 'SOC 2 Availability',
      passed: availability >= 99.9,
      details: `System availability: ${availability.toFixed(2)}%`,
      violations: availability < 99.9 ? [{
        eventId: 'system',
        timestamp: new Date(),
        description: 'Availability below 99.9% SLA',
        severity: 'high',
        remediation: 'Improve system reliability and redundancy'
      }] : []
    };
  }
  
  // Check change management
  static checkChangeManagement(events: AuditEvent[]): ComplianceCheckResult {
    const configChanges = events.filter(e => 
      e.category === 'configuration' || e.event.includes('update')
    );
    
    const unauthorizedChanges = configChanges.filter(e => 
      !e.details.approvalId || !e.details.changeTicket
    );
    
    return {
      check: 'SOC 2 Change Management',
      passed: unauthorizedChanges.length === 0,
      details: `${unauthorizedChanges.length} changes without approval`,
      violations: unauthorizedChanges.map(e => ({
        eventId: e.id,
        timestamp: e.timestamp,
        description: 'Configuration change without approval',
        severity: 'medium',
        remediation: 'Implement change approval process'
      }))
    };
  }
  
  // Check security monitoring
  static checkSecurityMonitoring(events: AuditEvent[]): ComplianceCheckResult {
    const securityEvents = events.filter(e => e.category === 'security_event');
    const unaddressed = securityEvents.filter(e => 
      e.severity === 'high' && !e.details.addressed
    );
    
    return {
      check: 'SOC 2 Security Monitoring',
      passed: unaddressed.length === 0,
      details: `${unaddressed.length} high severity events unaddressed`,
      violations: unaddressed.map(e => ({
        eventId: e.id,
        timestamp: e.timestamp,
        description: 'High severity security event not addressed',
        severity: 'high',
        remediation: 'Implement incident response procedures'
      }))
    };
  }
  
  // Get all SOC 2 checks
  static getAllChecks(): ComplianceCheck[] {
    return [
      this.checkAvailability,
      this.checkChangeManagement,
      this.checkSecurityMonitoring
    ];
  }
}

// Master compliance checker
export class ComplianceChecker {
  private static checkMap: Record<string, ComplianceCheck[]> = {
    'GDPR': GDPRComplianceChecks.getAllChecks(),
    'CCPA': CCPAComplianceChecks.getAllChecks(),
    'HIPAA': HIPAAComplianceChecks.getAllChecks(),
    'SOC2': SOC2ComplianceChecks.getAllChecks()
  };
  
  // Run all checks for a regulation
  static async runChecks(
    regulation: string,
    events: AuditEvent[]
  ): Promise<ComplianceCheckResult[]> {
    const checks = this.checkMap[regulation] || [];
    return checks.map(check => check(events));
  }
  
  // Run all compliance checks
  static async runAllChecks(
    events: AuditEvent[]
  ): Promise<Record<string, ComplianceCheckResult[]>> {
    const results: Record<string, ComplianceCheckResult[]> = {};
    
    for (const [regulation, checks] of Object.entries(this.checkMap)) {
      results[regulation] = checks.map(check => check(events));
    }
    
    return results;
  }
  
  // Generate compliance summary
  static generateSummary(
    results: Record<string, ComplianceCheckResult[]>
  ): ComplianceSummary {
    const summary: ComplianceSummary = {
      overallCompliant: true,
      regulations: {},
      criticalViolations: [],
      recommendations: []
    };
    
    for (const [regulation, checks] of Object.entries(results)) {
      const passed = checks.filter(c => c.passed).length;
      const total = checks.length;
      const compliant = passed === total;
      
      summary.regulations[regulation] = {
        compliant,
        score: (passed / total) * 100,
        passed,
        total
      };
      
      if (!compliant) {
        summary.overallCompliant = false;
      }
      
      // Collect violations
      checks.forEach(check => {
        if (check.violations) {
          check.violations.forEach(v => {
            if (v.severity === 'high') {
              summary.criticalViolations.push({
                regulation,
                check: check.check,
                violation: v
              });
            }
          });
        }
      });
    }
    
    // Generate recommendations
    if (summary.criticalViolations.length > 0) {
      summary.recommendations.push(
        'Address critical violations immediately to ensure compliance'
      );
    }
    
    return summary;
  }
}

// Type definitions
export interface ComplianceSummary {
  overallCompliant: boolean;
  regulations: Record<string, {
    compliant: boolean;
    score: number;
    passed: number;
    total: number;
  }>;
  criticalViolations: {
    regulation: string;
    check: string;
    violation: Violation;
  }[];
  recommendations: string[];
}