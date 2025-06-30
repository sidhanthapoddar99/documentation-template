// Shamir's Secret Sharing Implementation
import { randomBytes } from 'crypto';

// Finite field arithmetic for GF(2^8)
class GF256 {
  private static readonly FIELD_SIZE = 256;
  private static readonly GENERATOR = 0x11d; // x^8 + x^4 + x^3 + x^2 + 1
  
  // Precomputed logarithm and exponential tables for fast multiplication
  private static logTable: Uint8Array;
  private static expTable: Uint8Array;
  
  static {
    this.initializeTables();
  }
  
  private static initializeTables(): void {
    this.logTable = new Uint8Array(256);
    this.expTable = new Uint8Array(256);
    
    let value = 1;
    for (let i = 0; i < 255; i++) {
      this.expTable[i] = value;
      this.logTable[value] = i;
      
      // Multiply by generator (x) in GF(2^8)
      value = value << 1;
      if (value >= 256) {
        value ^= this.GENERATOR;
      }
    }
    this.expTable[255] = this.expTable[0];
  }
  
  // Addition in GF(2^8) is XOR
  static add(a: number, b: number): number {
    return a ^ b;
  }
  
  // Subtraction in GF(2^8) is same as addition (XOR)
  static subtract(a: number, b: number): number {
    return a ^ b;
  }
  
  // Multiplication using log/exp tables
  static multiply(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    
    const logSum = this.logTable[a] + this.logTable[b];
    return this.expTable[logSum % 255];
  }
  
  // Division using log/exp tables
  static divide(a: number, b: number): number {
    if (b === 0) throw new Error('Division by zero');
    if (a === 0) return 0;
    
    const logDiff = (this.logTable[a] - this.logTable[b] + 255) % 255;
    return this.expTable[logDiff];
  }
  
  // Compute a^exp in GF(2^8)
  static power(a: number, exp: number): number {
    if (a === 0) return 0;
    if (exp === 0) return 1;
    
    const logResult = (this.logTable[a] * exp) % 255;
    return this.expTable[logResult];
  }
}

// Polynomial operations in GF(2^8)
class Polynomial {
  constructor(public coefficients: Uint8Array) {}
  
  // Evaluate polynomial at x using Horner's method
  evaluate(x: number): number {
    let result = 0;
    for (let i = this.coefficients.length - 1; i >= 0; i--) {
      result = GF256.multiply(result, x);
      result = GF256.add(result, this.coefficients[i]);
    }
    return result;
  }
  
  // Generate random polynomial with given degree and constant term
  static random(degree: number, constant: number): Polynomial {
    const coefficients = new Uint8Array(degree + 1);
    coefficients[0] = constant;
    
    // Generate random coefficients for x^1 to x^degree
    const randomCoeffs = randomBytes(degree);
    for (let i = 1; i <= degree; i++) {
      coefficients[i] = randomCoeffs[i - 1];
    }
    
    return new Polynomial(coefficients);
  }
}

// Shamir's Secret Sharing
export class ShamirSecretSharing {
  // Split a secret into n shares with threshold k
  static split(
    secret: Buffer,
    k: number,
    n: number
  ): Share[] {
    if (k < 2) throw new Error('Threshold must be at least 2');
    if (k > n) throw new Error('Threshold cannot exceed total shares');
    if (n > 255) throw new Error('Maximum 255 shares supported');
    
    const shares: Share[] = [];
    
    // Process each byte of the secret
    for (let byteIndex = 0; byteIndex < secret.length; byteIndex++) {
      const secretByte = secret[byteIndex];
      
      // Generate random polynomial with degree k-1
      const polynomial = Polynomial.random(k - 1, secretByte);
      
      // Evaluate polynomial at x = 1, 2, ..., n
      for (let x = 1; x <= n; x++) {
        if (!shares[x - 1]) {
          shares[x - 1] = {
            x: x,
            y: Buffer.alloc(secret.length)
          };
        }
        shares[x - 1].y[byteIndex] = polynomial.evaluate(x);
      }
    }
    
    return shares;
  }
  
  // Combine k shares to reconstruct the secret
  static combine(shares: Share[]): Buffer {
    if (shares.length < 2) {
      throw new Error('At least 2 shares required');
    }
    
    // Validate all shares have same length
    const secretLength = shares[0].y.length;
    if (!shares.every(share => share.y.length === secretLength)) {
      throw new Error('All shares must have same length');
    }
    
    const secret = Buffer.alloc(secretLength);
    
    // Reconstruct each byte using Lagrange interpolation
    for (let byteIndex = 0; byteIndex < secretLength; byteIndex++) {
      let result = 0;
      
      for (let i = 0; i < shares.length; i++) {
        const xi = shares[i].x;
        const yi = shares[i].y[byteIndex];
        
        // Calculate Lagrange basis polynomial Li(0)
        let li = 1;
        for (let j = 0; j < shares.length; j++) {
          if (i === j) continue;
          
          const xj = shares[j].x;
          // Li(0) = ∏(0 - xj) / (xi - xj)
          const numerator = GF256.subtract(0, xj);
          const denominator = GF256.subtract(xi, xj);
          li = GF256.multiply(li, GF256.divide(numerator, denominator));
        }
        
        // Add yi * Li(0) to result
        result = GF256.add(result, GF256.multiply(yi, li));
      }
      
      secret[byteIndex] = result;
    }
    
    return secret;
  }
  
  // Verify share validity (optional - requires additional data)
  static verifyShare(share: Share, commitment?: Buffer): boolean {
    // In a production system, you might include Feldman's VSS
    // or Pedersen's VSS for verifiable secret sharing
    // This would involve commitments to polynomial coefficients
    
    // Basic validation
    if (!share.x || share.x < 1 || share.x > 255) return false;
    if (!share.y || share.y.length === 0) return false;
    
    // Advanced validation would check against commitments
    if (commitment) {
      // Verify share against commitment
      // Implementation depends on chosen VSS scheme
    }
    
    return true;
  }
  
  // Generate share metadata for verification
  static generateShareMetadata(share: Share): ShareMetadata {
    const hash = require('crypto').createHash('sha256');
    hash.update(Buffer.from([share.x]));
    hash.update(share.y);
    
    return {
      shareId: share.x,
      checksum: hash.digest('hex').slice(0, 8),
      length: share.y.length,
      version: 1
    };
  }
}

// Type definitions
export interface Share {
  x: number;    // Share index (1 to n)
  y: Buffer;    // Share value
}

export interface ShareMetadata {
  shareId: number;
  checksum: string;
  length: number;
  version: number;
}

// Example usage and test
export function demonstrateShamir() {
  // Example secret
  const secret = Buffer.from('This is a very secret encryption key!');
  console.log('Original secret:', secret.toString());
  console.log('Secret length:', secret.length, 'bytes');
  
  // Split into 5 shares with threshold 3
  const k = 3; // threshold
  const n = 5; // total shares
  
  console.log(`\nSplitting secret into ${n} shares with threshold ${k}`);
  const shares = ShamirSecretSharing.split(secret, k, n);
  
  // Display share metadata
  shares.forEach((share, i) => {
    const metadata = ShamirSecretSharing.generateShareMetadata(share);
    console.log(`Share ${i + 1}:`, {
      id: metadata.shareId,
      checksum: metadata.checksum,
      size: metadata.length
    });
  });
  
  // Test reconstruction with exactly k shares
  console.log('\nRecombining with exactly k shares (shares 1, 3, 5)...');
  const selectedShares = [shares[0], shares[2], shares[4]];
  const reconstructed1 = ShamirSecretSharing.combine(selectedShares);
  console.log('Reconstructed:', reconstructed1.toString());
  console.log('Success:', secret.equals(reconstructed1));
  
  // Test reconstruction with more than k shares
  console.log('\nRecombining with k+1 shares (shares 1, 2, 3, 4)...');
  const moreShares = shares.slice(0, 4);
  const reconstructed2 = ShamirSecretSharing.combine(moreShares);
  console.log('Reconstructed:', reconstructed2.toString());
  console.log('Success:', secret.equals(reconstructed2));
  
  // Test that k-1 shares cannot reconstruct
  console.log('\nAttempting with k-1 shares (should fail or give wrong result)...');
  try {
    const insufficientShares = shares.slice(0, k - 1);
    const failed = ShamirSecretSharing.combine(insufficientShares);
    console.log('Result with insufficient shares:', failed.toString());
    console.log('Matches original?:', secret.equals(failed));
  } catch (error) {
    console.log('Failed as expected:', error.message);
  }
}

// Advanced features for production use
export class SecureShamirSecretSharing extends ShamirSecretSharing {
  // Add authentication to shares
  static splitWithAuth(
    secret: Buffer,
    k: number,
    n: number,
    authKey: Buffer
  ): AuthenticatedShare[] {
    const shares = this.split(secret, k, n);
    const hmac = require('crypto').createHmac('sha256', authKey);
    
    return shares.map(share => {
      hmac.update(Buffer.from([share.x]));
      hmac.update(share.y);
      
      return {
        ...share,
        mac: hmac.digest()
      };
    });
  }
  
  // Verify and combine authenticated shares
  static combineWithAuth(
    shares: AuthenticatedShare[],
    authKey: Buffer
  ): Buffer {
    // Verify all MACs first
    const hmac = require('crypto').createHmac('sha256', authKey);
    
    for (const share of shares) {
      hmac.update(Buffer.from([share.x]));
      hmac.update(share.y);
      const expectedMac = hmac.digest();
      
      if (!share.mac.equals(expectedMac)) {
        throw new Error(`Share ${share.x} authentication failed`);
      }
    }
    
    // If all MACs valid, proceed with combination
    return this.combine(shares);
  }
}

export interface AuthenticatedShare extends Share {
  mac: Buffer;  // Message authentication code
}