// Security Implementation for Neuralock
import crypto from 'crypto';
import { ethers } from 'ethers';

// Security Configuration
export interface SecurityConfig {
  encryption: {
    algorithm: 'aes-256-gcm';
    keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
    iterations: number;
    saltLength: number;
  };
  session: {
    duration: number;        // milliseconds
    renewThreshold: number;  // renew when this much time left
    maxConcurrent: number;   // max sessions per user
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  authentication: {
    challengeExpiry: number;  // milliseconds
    maxAttempts: number;
    lockoutDuration: number;  // milliseconds
  };
}

// Input Validation
export class InputValidator {
  // Ethereum address validation
  static isValidAddress(address: string): boolean {
    return ethers.utils.isAddress(address);
  }
  
  // Public key validation
  static isValidPublicKey(key: string, type: 'secp256k1' | 'x25519'): boolean {
    if (type === 'secp256k1') {
      // Compressed or uncompressed secp256k1 public key
      return /^0x04[0-9a-fA-F]{128}$/.test(key) || /^0x0[23][0-9a-fA-F]{64}$/.test(key);
    } else {
      // X25519 public key (32 bytes)
      return /^0x[0-9a-fA-F]{64}$/.test(key);
    }
  }
  
  // Domain validation
  static isValidDomain(domain: string): boolean {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    return domainRegex.test(domain) && domain.length <= 253;
  }
  
  // Sanitize user input
  static sanitize(input: string, type: 'text' | 'html' | 'sql'): string {
    switch (type) {
      case 'html':
        // Basic HTML entity encoding
        return input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      
      case 'sql':
        // Basic SQL escaping (use parameterized queries in production)
        return input.replace(/'/g, "''");
      
      case 'text':
      default:
        // Remove control characters
        return input.replace(/[\x00-\x1F\x7F]/g, '');
    }
  }
  
  // Validate request signature
  static async validateSignature(
    message: string,
    signature: string,
    expectedSigner: string
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
    } catch {
      return false;
    }
  }
}

// Secure Random Generation
export class SecureRandom {
  // Generate cryptographically secure random bytes
  static bytes(length: number): Buffer {
    return crypto.randomBytes(length);
  }
  
  // Generate random hex string
  static hex(length: number): string {
    return this.bytes(length).toString('hex');
  }
  
  // Generate random integer in range [min, max)
  static int(min: number, max: number): number {
    const range = max - min;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const randomBytes = this.bytes(bytesNeeded);
    const randomValue = randomBytes.readUIntBE(0, bytesNeeded);
    return min + (randomValue % range);
  }
  
  // Generate secure token
  static token(length = 32): string {
    return this.hex(length);
  }
  
  // Generate nonce
  static nonce(): string {
    return this.hex(16);
  }
}

// Encryption Utilities
export class Encryption {
  // Derive key from password
  static async deriveKey(
    password: string,
    salt: Buffer,
    iterations: number = 100000
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, 32, 'sha256', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
  }
  
  // Encrypt data with AES-256-GCM
  static encrypt(data: Buffer, key: Buffer): {
    encrypted: Buffer;
    iv: Buffer;
    authTag: Buffer;
  } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return { encrypted, iv, authTag };
  }
  
  // Decrypt data with AES-256-GCM
  static decrypt(
    encrypted: Buffer,
    key: Buffer,
    iv: Buffer,
    authTag: Buffer
  ): Buffer {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  }
  
  // Secure key erasure
  static eraseKey(key: Buffer): void {
    crypto.randomFillSync(key);
  }
}

// Session Management
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  
  constructor(private config: SecurityConfig['session']) {}
  
  // Create new session
  createSession(userId: string, metadata: any = {}): string {
    // Check concurrent session limit
    const userSessionIds = this.userSessions.get(userId) || new Set();
    if (userSessionIds.size >= this.config.maxConcurrent) {
      // Remove oldest session
      const oldestSession = Array.from(userSessionIds)
        .map(id => this.sessions.get(id)!)
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      
      this.revokeSession(oldestSession.id);
    }
    
    const session: Session = {
      id: SecureRandom.token(),
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.config.duration,
      lastActivity: Date.now(),
      metadata
    };
    
    this.sessions.set(session.id, session);
    
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(session.id);
    
    return session.id;
  }
  
  // Validate session
  validateSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) return null;
    
    if (Date.now() > session.expiresAt) {
      this.revokeSession(sessionId);
      return null;
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    
    // Check if needs renewal
    const timeLeft = session.expiresAt - Date.now();
    if (timeLeft < this.config.renewThreshold) {
      session.expiresAt = Date.now() + this.config.duration;
    }
    
    return session;
  }
  
  // Revoke session
  revokeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    this.sessions.delete(sessionId);
    
    const userSessions = this.userSessions.get(session.userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.userSessions.delete(session.userId);
      }
    }
  }
  
  // Revoke all user sessions
  revokeUserSessions(userId: string): void {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return;
    
    sessionIds.forEach(id => this.sessions.delete(id));
    this.userSessions.delete(userId);
  }
  
  // Cleanup expired sessions
  cleanup(): void {
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

// Rate Limiting
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private config: SecurityConfig['rateLimit']) {}
  
  // Check if request should be allowed
  checkLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests
    const timestamps = this.requests.get(identifier) || [];
    
    // Filter requests within window
    const recentRequests = timestamps.filter(ts => ts > windowStart);
    
    // Check limit
    const allowed = recentRequests.length < this.config.maxRequests;
    
    if (allowed) {
      recentRequests.push(now);
      this.requests.set(identifier, recentRequests);
    }
    
    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - recentRequests.length),
      resetAt: windowStart + this.config.windowMs
    };
  }
  
  // Reset limits for identifier
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
  
  // Cleanup old entries
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    this.requests.forEach((timestamps, identifier) => {
      const recent = timestamps.filter(ts => ts > windowStart);
      if (recent.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recent);
      }
    });
  }
}

// Authentication Challenge
export class AuthenticationChallenge {
  private challenges: Map<string, Challenge> = new Map();
  private attempts: Map<string, number> = new Map();
  
  constructor(private config: SecurityConfig['authentication']) {}
  
  // Create authentication challenge
  createChallenge(address: string): string {
    // Check lockout
    if (this.isLockedOut(address)) {
      throw new Error('Account temporarily locked due to failed attempts');
    }
    
    const challenge: Challenge = {
      id: SecureRandom.token(),
      address,
      nonce: SecureRandom.nonce(),
      message: this.generateChallengeMessage(address),
      createdAt: Date.now(),
      expiresAt: Date.now() + this.config.challengeExpiry
    };
    
    this.challenges.set(challenge.id, challenge);
    
    return JSON.stringify({
      challengeId: challenge.id,
      message: challenge.message,
      expiresAt: challenge.expiresAt
    });
  }
  
  // Verify challenge response
  async verifyChallenge(
    challengeId: string,
    signature: string
  ): Promise<{ valid: boolean; address?: string }> {
    const challenge = this.challenges.get(challengeId);
    
    if (!challenge) {
      return { valid: false };
    }
    
    // Check expiry
    if (Date.now() > challenge.expiresAt) {
      this.challenges.delete(challengeId);
      return { valid: false };
    }
    
    // Verify signature
    const valid = await InputValidator.validateSignature(
      challenge.message,
      signature,
      challenge.address
    );
    
    // Clean up used challenge
    this.challenges.delete(challengeId);
    
    // Track attempts
    if (!valid) {
      const attempts = (this.attempts.get(challenge.address) || 0) + 1;
      this.attempts.set(challenge.address, attempts);
    } else {
      this.attempts.delete(challenge.address);
    }
    
    return { valid, address: valid ? challenge.address : undefined };
  }
  
  // Check if address is locked out
  private isLockedOut(address: string): boolean {
    const attempts = this.attempts.get(address) || 0;
    return attempts >= this.config.maxAttempts;
  }
  
  // Generate challenge message
  private generateChallengeMessage(address: string): string {
    return `Sign this message to authenticate with Neuralock.

Address: ${address}
Nonce: ${SecureRandom.nonce()}
Timestamp: ${new Date().toISOString()}

This request will not trigger any blockchain transaction.`;
  }
  
  // Cleanup expired challenges
  cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];
    
    this.challenges.forEach((challenge, id) => {
      if (now > challenge.expiresAt) {
        expired.push(id);
      }
    });
    
    expired.forEach(id => this.challenges.delete(id));
  }
}

// Type definitions
interface Session {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  metadata: any;
}

interface Challenge {
  id: string;
  address: string;
  nonce: string;
  message: string;
  createdAt: number;
  expiresAt: number;
}

// Export security utilities
export const Security = {
  InputValidator,
  SecureRandom,
  Encryption,
  SessionManager,
  RateLimiter,
  AuthenticationChallenge
};