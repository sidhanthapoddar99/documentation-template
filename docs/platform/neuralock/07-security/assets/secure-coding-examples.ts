// Secure Coding Examples for Neuralock Implementation

import { ethers } from 'ethers';
import crypto from 'crypto';

// ============================================
// 1. INPUT VALIDATION AND SANITIZATION
// ============================================

export class SecureInputHandler {
  // Validate Ethereum address with checksum
  static validateAddress(address: string): string {
    try {
      // This will throw if invalid
      const checksumAddress = ethers.utils.getAddress(address);
      return checksumAddress;
    } catch (error) {
      throw new Error('Invalid Ethereum address format');
    }
  }
  
  // Validate and sanitize object ID
  static validateObjectId(objectId: string): string {
    // Only allow alphanumeric, dash, and underscore
    const sanitized = objectId.replace(/[^a-zA-Z0-9\-_]/g, '');
    
    if (sanitized !== objectId) {
      throw new Error('Object ID contains invalid characters');
    }
    
    if (sanitized.length < 1 || sanitized.length > 64) {
      throw new Error('Object ID must be between 1 and 64 characters');
    }
    
    return sanitized;
  }
  
  // Validate numeric input with bounds checking
  static validateThreshold(value: any, totalShares: number): number {
    const threshold = parseInt(value, 10);
    
    if (isNaN(threshold)) {
      throw new Error('Threshold must be a number');
    }
    
    if (threshold < 1) {
      throw new Error('Threshold must be at least 1');
    }
    
    if (threshold > totalShares) {
      throw new Error('Threshold cannot exceed total shares');
    }
    
    return threshold;
  }
  
  // Prevent SQL injection in queries
  static buildSecureQuery(tableName: string, conditions: Record<string, any>) {
    // Whitelist table names
    const allowedTables = ['servers', 'sessions', 'shares'];
    if (!allowedTables.includes(tableName)) {
      throw new Error('Invalid table name');
    }
    
    // Use parameterized queries
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    const whereClause = keys.map((key, i) => `${key} = ${placeholders[i]}`).join(' AND ');
    
    return {
      query: `SELECT * FROM ${tableName} WHERE ${whereClause}`,
      values
    };
  }
  
  // XSS prevention for output
  static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\//g, '&#x2F;');
  }
}

// ============================================
// 2. SECURE RANDOM NUMBER GENERATION
// ============================================

export class SecureRandom {
  // Generate cryptographically secure random bytes
  static generateBytes(length: number): Buffer {
    if (length < 1 || length > 1024) {
      throw new Error('Invalid length for random bytes');
    }
    return crypto.randomBytes(length);
  }
  
  // Generate secure session ID
  static generateSessionId(): string {
    return this.generateBytes(32).toString('hex');
  }
  
  // Generate secure nonce
  static generateNonce(): string {
    // 128-bit nonce
    return this.generateBytes(16).toString('hex');
  }
  
  // Generate secure token with expiration
  static generateToken(): { token: string; expires: number } {
    const token = this.generateBytes(32).toString('base64url');
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    return { token, expires };
  }
  
  // Secure random integer in range
  static randomInt(min: number, max: number): number {
    if (min >= max) {
      throw new Error('Min must be less than max');
    }
    
    const range = max - min;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValue = Math.pow(256, bytesNeeded);
    const threshold = maxValue - (maxValue % range);
    
    let randomValue;
    do {
      randomValue = this.generateBytes(bytesNeeded).readUIntBE(0, bytesNeeded);
    } while (randomValue >= threshold);
    
    return min + (randomValue % range);
  }
}

// ============================================
// 3. SECURE SESSION MANAGEMENT
// ============================================

export class SecureSessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_SESSIONS_PER_USER = 5;
  
  // Create secure session
  createSession(userId: string, metadata: any = {}): string {
    // Clean up expired sessions first
    this.cleanupExpiredSessions();
    
    // Check session limit per user
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId);
    
    if (userSessions.length >= this.MAX_SESSIONS_PER_USER) {
      // Remove oldest session
      const oldest = userSessions.sort((a, b) => a.createdAt - b.createdAt)[0];
      this.revokeSession(oldest.id);
    }
    
    const sessionId = SecureRandom.generateSessionId();
    const session: SessionData = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + this.SESSION_TIMEOUT,
      metadata: {
        ...metadata,
        userAgent: metadata.userAgent || 'unknown',
        ipAddress: metadata.ipAddress || 'unknown'
      }
    };
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }
  
  // Validate session with activity update
  validateSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Check expiration
    if (Date.now() > session.expiresAt) {
      this.revokeSession(sessionId);
      return null;
    }
    
    // Update activity
    session.lastActivity = Date.now();
    session.expiresAt = Date.now() + this.SESSION_TIMEOUT;
    
    return session;
  }
  
  // Securely revoke session
  revokeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Clear sensitive data
      session.metadata = {};
      this.sessions.delete(sessionId);
    }
  }
  
  // Clean up expired sessions
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expired: string[] = [];
    
    this.sessions.forEach((session, id) => {
      if (now > session.expiresAt) {
        expired.push(id);
      }
    });
    
    expired.forEach(id => this.revokeSession(id));
  }
}

// ============================================
// 4. SECURE CRYPTOGRAPHIC OPERATIONS
// ============================================

export class SecureCrypto {
  // Constant-time comparison to prevent timing attacks
  static constantTimeCompare(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    
    return result === 0;
  }
  
  // Secure password hashing with salt
  static async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    const salt = crypto.randomBytes(32);
    
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve({
          hash: derivedKey.toString('hex'),
          salt: salt.toString('hex')
        });
      });
    });
  }
  
  // Verify password against hash
  static async verifyPassword(
    password: string,
    hash: string,
    salt: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const saltBuffer = Buffer.from(salt, 'hex');
      const hashBuffer = Buffer.from(hash, 'hex');
      
      crypto.pbkdf2(password, saltBuffer, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(this.constantTimeCompare(derivedKey, hashBuffer));
      });
    });
  }
  
  // Secure key derivation
  static deriveKey(
    masterKey: Buffer,
    context: string,
    length: number = 32
  ): Buffer {
    const salt = crypto.createHash('sha256')
      .update(context)
      .digest();
    
    return crypto.pbkdf2Sync(masterKey, salt, 10000, length, 'sha256');
  }
  
  // Secure memory cleanup
  static secureErase(buffer: Buffer): void {
    // Overwrite with random data
    crypto.randomFillSync(buffer);
    // Then zero out
    buffer.fill(0);
  }
}

// ============================================
// 5. SECURE API ENDPOINTS
// ============================================

export class SecureAPI {
  // Rate limiting implementation
  private rateLimits: Map<string, RateLimitData> = new Map();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_REQUESTS = 100;
  
  // Check rate limit
  checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(identifier);
    
    if (!limit || now - limit.windowStart > this.RATE_LIMIT_WINDOW) {
      // New window
      this.rateLimits.set(identifier, {
        windowStart: now,
        requests: 1
      });
      return true;
    }
    
    if (limit.requests >= this.MAX_REQUESTS) {
      return false;
    }
    
    limit.requests++;
    return true;
  }
  
  // CORS configuration
  static getCorsOptions(): any {
    return {
      origin: (origin: string, callback: Function) => {
        const allowedOrigins = [
          'https://app.neuralock.com',
          'https://portal.neuralock.com'
        ];
        
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400 // 24 hours
    };
  }
  
  // Security headers
  static setSecurityHeaders(res: any): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }
}

// ============================================
// 6. SECURE ERROR HANDLING
// ============================================

export class SecureErrorHandler {
  // Log error securely without exposing sensitive info
  static logError(error: Error, context: any = {}): void {
    const sanitizedError = {
      message: error.message,
      type: error.name,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context)
    };
    
    // Log to secure logging service
    console.error('Security Error:', JSON.stringify(sanitizedError));
    
    // Don't log stack trace in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack:', error.stack);
    }
  }
  
  // Sanitize context to remove sensitive data
  private static sanitizeContext(context: any): any {
    const sensitive = ['password', 'privateKey', 'secret', 'token'];
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(context)) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  // Create user-safe error response
  static createSafeError(error: Error): { error: string; code: string } {
    // Map internal errors to safe external messages
    const errorMap: Record<string, { message: string; code: string }> = {
      'Invalid signature': { message: 'Authentication failed', code: 'AUTH_FAILED' },
      'Insufficient permissions': { message: 'Access denied', code: 'ACCESS_DENIED' },
      'Invalid input': { message: 'Invalid request data', code: 'INVALID_INPUT' },
      'Rate limit exceeded': { message: 'Too many requests', code: 'RATE_LIMITED' }
    };
    
    const mapped = errorMap[error.message] || {
      message: 'An error occurred',
      code: 'INTERNAL_ERROR'
    };
    
    return {
      error: mapped.message,
      code: mapped.code
    };
  }
}

// Type definitions
interface SessionData {
  id: string;
  userId: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  metadata: any;
}

interface RateLimitData {
  windowStart: number;
  requests: number;
}