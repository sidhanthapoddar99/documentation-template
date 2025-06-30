// ECDH (Elliptic Curve Diffie-Hellman) Protocol Implementation
import { randomBytes, createHash } from 'crypto';
import * as nacl from 'tweetnacl';

// X25519 ECDH Implementation
export class X25519ECDH {
  // Generate a new X25519 key pair
  static generateKeyPair(): {
    privateKey: Buffer;
    publicKey: Buffer;
  } {
    // Generate 32 random bytes for private key
    const privateKey = randomBytes(32);
    
    // Derive public key using X25519
    const publicKey = Buffer.from(
      nacl.scalarMult.base(new Uint8Array(privateKey))
    );
    
    return { privateKey, publicKey };
  }
  
  // Perform ECDH key agreement
  static computeSharedSecret(
    privateKey: Buffer,
    peerPublicKey: Buffer
  ): Buffer {
    // Validate inputs
    if (privateKey.length !== 32) {
      throw new Error('Private key must be 32 bytes');
    }
    if (peerPublicKey.length !== 32) {
      throw new Error('Public key must be 32 bytes');
    }
    
    // Compute shared secret
    const sharedSecret = nacl.scalarMult(
      new Uint8Array(privateKey),
      new Uint8Array(peerPublicKey)
    );
    
    // Check for low-order points (security)
    if (this.isLowOrderPoint(sharedSecret)) {
      throw new Error('Low-order point detected');
    }
    
    return Buffer.from(sharedSecret);
  }
  
  // Check for low-order points
  private static isLowOrderPoint(point: Uint8Array): boolean {
    // Check if all bytes are zero (point at infinity)
    return point.every(byte => byte === 0);
  }
  
  // Key derivation function (HKDF)
  static deriveKey(
    sharedSecret: Buffer,
    salt: Buffer = Buffer.alloc(0),
    info: Buffer = Buffer.alloc(0),
    length: number = 32
  ): Buffer {
    // HKDF-Extract
    const prk = this.hkdfExtract(salt, sharedSecret);
    
    // HKDF-Expand
    return this.hkdfExpand(prk, info, length);
  }
  
  // HKDF-Extract
  private static hkdfExtract(salt: Buffer, ikm: Buffer): Buffer {
    const hmac = createHash('sha256');
    
    // If salt is empty, use hash-length zeros
    const actualSalt = salt.length === 0 ? Buffer.alloc(32, 0) : salt;
    
    // PRK = HMAC-Hash(salt, IKM)
    return this.hmac(actualSalt, ikm);
  }
  
  // HKDF-Expand
  private static hkdfExpand(prk: Buffer, info: Buffer, length: number): Buffer {
    const hashLen = 32; // SHA-256 output length
    const n = Math.ceil(length / hashLen);
    
    if (n > 255) {
      throw new Error('Output length too large');
    }
    
    let t = Buffer.alloc(0);
    let okm = Buffer.alloc(0);
    
    for (let i = 1; i <= n; i++) {
      const input = Buffer.concat([
        t,
        info,
        Buffer.from([i])
      ]);
      
      t = this.hmac(prk, input);
      okm = Buffer.concat([okm, t]);
    }
    
    return okm.slice(0, length);
  }
  
  // HMAC implementation
  private static hmac(key: Buffer, data: Buffer): Buffer {
    const hmac = require('crypto').createHmac('sha256', key);
    hmac.update(data);
    return hmac.digest();
  }
}

// Complete ECDH Protocol Flow
export class ECDHProtocol {
  private privateKey: Buffer;
  private publicKey: Buffer;
  private sessions: Map<string, SessionKeys> = new Map();
  
  constructor() {
    const keyPair = X25519ECDH.generateKeyPair();
    this.privateKey = keyPair.privateKey;
    this.publicKey = keyPair.publicKey;
  }
  
  // Get public key for sharing
  getPublicKey(): Buffer {
    return this.publicKey;
  }
  
  // Establish session with peer
  establishSession(
    sessionId: string,
    peerPublicKey: Buffer,
    isInitiator: boolean = true
  ): SessionKeys {
    // Compute shared secret
    const sharedSecret = X25519ECDH.computeSharedSecret(
      this.privateKey,
      peerPublicKey
    );
    
    // Generate salt from session ID
    const salt = createHash('sha256')
      .update(sessionId)
      .digest();
    
    // Derive separate keys for each direction
    const keys = this.deriveSessionKeys(
      sharedSecret,
      salt,
      isInitiator
    );
    
    // Store session
    this.sessions.set(sessionId, keys);
    
    // Clear shared secret from memory
    sharedSecret.fill(0);
    
    return keys;
  }
  
  // Derive session keys
  private deriveSessionKeys(
    sharedSecret: Buffer,
    salt: Buffer,
    isInitiator: boolean
  ): SessionKeys {
    // Create different info for each direction
    const clientInfo = Buffer.from('client_to_server');
    const serverInfo = Buffer.from('server_to_client');
    
    // Derive keys based on role
    const sendInfo = isInitiator ? clientInfo : serverInfo;
    const receiveInfo = isInitiator ? serverInfo : clientInfo;
    
    return {
      sendKey: X25519ECDH.deriveKey(sharedSecret, salt, sendInfo, 32),
      receiveKey: X25519ECDH.deriveKey(sharedSecret, salt, receiveInfo, 32),
      sendMacKey: X25519ECDH.deriveKey(
        sharedSecret, 
        salt, 
        Buffer.concat([sendInfo, Buffer.from('_mac')]), 
        32
      ),
      receiveMacKey: X25519ECDH.deriveKey(
        sharedSecret, 
        salt, 
        Buffer.concat([receiveInfo, Buffer.from('_mac')]), 
        32
      )
    };
  }
  
  // Get session keys
  getSessionKeys(sessionId: string): SessionKeys | undefined {
    return this.sessions.get(sessionId);
  }
  
  // Clean up session
  closeSession(sessionId: string): void {
    const keys = this.sessions.get(sessionId);
    if (keys) {
      // Securely erase keys
      keys.sendKey.fill(0);
      keys.receiveKey.fill(0);
      keys.sendMacKey.fill(0);
      keys.receiveMacKey.fill(0);
      
      this.sessions.delete(sessionId);
    }
  }
  
  // Rotate keys
  rotateKeys(): {
    privateKey: Buffer;
    publicKey: Buffer;
  } {
    // Generate new key pair
    const newKeyPair = X25519ECDH.generateKeyPair();
    
    // Securely erase old private key
    this.privateKey.fill(0);
    
    // Update keys
    this.privateKey = newKeyPair.privateKey;
    this.publicKey = newKeyPair.publicKey;
    
    return newKeyPair;
  }
}

// Session key structure
export interface SessionKeys {
  sendKey: Buffer;      // For encrypting outgoing messages
  receiveKey: Buffer;   // For decrypting incoming messages
  sendMacKey: Buffer;   // For authenticating outgoing messages
  receiveMacKey: Buffer; // For verifying incoming messages
}

// Example: Complete handshake between client and server
export function demonstrateECDHHandshake() {
  console.log('=== ECDH Key Exchange Demo ===\n');
  
  // Initialize client and server
  const client = new ECDHProtocol();
  const server = new ECDHProtocol();
  
  console.log('Client public key:', client.getPublicKey().toString('hex'));
  console.log('Server public key:', server.getPublicKey().toString('hex'));
  
  // Session ID (could be random or negotiated)
  const sessionId = randomBytes(16).toString('hex');
  console.log('\nSession ID:', sessionId);
  
  // Client establishes session with server
  const clientKeys = client.establishSession(
    sessionId,
    server.getPublicKey(),
    true // client is initiator
  );
  
  // Server establishes session with client
  const serverKeys = server.establishSession(
    sessionId,
    client.getPublicKey(),
    false // server is not initiator
  );
  
  // Verify keys match (client send = server receive, etc.)
  console.log('\nKey agreement successful:');
  console.log('Client->Server key match:', 
    clientKeys.sendKey.equals(serverKeys.receiveKey));
  console.log('Server->Client key match:', 
    serverKeys.sendKey.equals(clientKeys.receiveKey));
  
  // Demonstrate secure communication
  const message = Buffer.from('Hello, secure world!');
  console.log('\nOriginal message:', message.toString());
  
  // Client encrypts message for server
  const encrypted = encryptWithKey(message, clientKeys.sendKey);
  console.log('Encrypted:', encrypted.toString('hex'));
  
  // Server decrypts message
  const decrypted = decryptWithKey(encrypted, serverKeys.receiveKey);
  console.log('Decrypted:', decrypted.toString());
  
  // Clean up
  client.closeSession(sessionId);
  server.closeSession(sessionId);
}

// Helper functions for encryption/decryption
function encryptWithKey(data: Buffer, key: Buffer): Buffer {
  // This is a simplified example - use proper AEAD in production
  const cipher = require('crypto').createCipheriv(
    'aes-256-gcm',
    key,
    randomBytes(12)
  );
  return Buffer.concat([cipher.update(data), cipher.final()]);
}

function decryptWithKey(data: Buffer, key: Buffer): Buffer {
  // This is a simplified example - use proper AEAD in production
  const decipher = require('crypto').createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.alloc(12) // Would need to transmit IV in real implementation
  );
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

// Advanced: ECDH with ephemeral keys for forward secrecy
export class EphemeralECDH extends ECDHProtocol {
  // Generate ephemeral key for each session
  establishEphemeralSession(
    sessionId: string,
    peerPublicKey: Buffer,
    staticPrivateKey?: Buffer
  ): {
    ephemeralPublicKey: Buffer;
    sessionKeys: SessionKeys;
  } {
    // Generate ephemeral key pair
    const ephemeral = X25519ECDH.generateKeyPair();
    
    // Compute shared secret with ephemeral key
    const sharedSecret = X25519ECDH.computeSharedSecret(
      ephemeral.privateKey,
      peerPublicKey
    );
    
    // Optional: Mix in static key for authentication
    let finalSecret = sharedSecret;
    if (staticPrivateKey) {
      const staticSecret = X25519ECDH.computeSharedSecret(
        staticPrivateKey,
        peerPublicKey
      );
      
      // Combine secrets
      finalSecret = createHash('sha256')
        .update(sharedSecret)
        .update(staticSecret)
        .digest();
      
      // Clear static secret
      staticSecret.fill(0);
    }
    
    // Derive session keys
    const salt = createHash('sha256').update(sessionId).digest();
    const keys = this.deriveSessionKeys(finalSecret, salt, true);
    
    // Clear secrets
    ephemeral.privateKey.fill(0);
    sharedSecret.fill(0);
    if (finalSecret !== sharedSecret) {
      finalSecret.fill(0);
    }
    
    return {
      ephemeralPublicKey: ephemeral.publicKey,
      sessionKeys: keys
    };
  }
}