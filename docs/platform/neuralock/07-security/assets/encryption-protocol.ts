// Complete Encryption Protocol Implementation for Neuralock
import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';
import { ShamirSecretSharing } from './shamir-implementation';
import { X25519ECDH } from './ecdh-protocol';

// Encryption configuration
export interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  ivLength: 12;        // 96 bits for GCM
  tagLength: 16;       // 128 bits
  saltLength: 32;      // 256 bits
  keyLength: 32;       // 256 bits
}

// Complete encryption result
export interface EncryptionResult {
  encryptedData: Buffer;
  encryptedShares: EncryptedShare[];
  metadata: EncryptionMetadata;
}

// Encrypted share structure
export interface EncryptedShare {
  serverId: number;
  encryptedShare: Buffer;
  ephemeralPublicKey: Buffer;
  nonce: Buffer;
  authTag: Buffer;
}

// Encryption metadata
export interface EncryptionMetadata {
  algorithm: string;
  keyId: string;
  threshold: number;
  totalShares: number;
  timestamp: number;
  version: number;
}

// Main encryption protocol implementation
export class NeuralockEncryption {
  private static readonly config: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    ivLength: 12,
    tagLength: 16,
    saltLength: 32,
    keyLength: 32
  };
  
  // Complete encryption flow
  static async encrypt(
    data: Buffer,
    servers: ServerInfo[],
    threshold: number,
    contractAddress: string,
    objectId: string
  ): Promise<EncryptionResult> {
    // Step 1: Generate data encryption key
    const dataKey = randomBytes(this.config.keyLength);
    
    // Step 2: Encrypt data with AES-256-GCM
    const encryptedData = this.encryptData(data, dataKey, contractAddress, objectId);
    
    // Step 3: Split key using Shamir's Secret Sharing
    const shares = ShamirSecretSharing.split(dataKey, threshold, servers.length);
    
    // Step 4: Encrypt each share for its designated server
    const encryptedShares = await Promise.all(
      shares.map((share, index) => 
        this.encryptShareForServer(share, servers[index], contractAddress, objectId)
      )
    );
    
    // Step 5: Create metadata
    const metadata: EncryptionMetadata = {
      algorithm: this.config.algorithm,
      keyId: this.generateKeyId(dataKey),
      threshold,
      totalShares: servers.length,
      timestamp: Date.now(),
      version: 1
    };
    
    // Clear sensitive data
    dataKey.fill(0);
    
    return {
      encryptedData: encryptedData.encrypted,
      encryptedShares,
      metadata
    };
  }
  
  // Encrypt data with AES-256-GCM
  private static encryptData(
    data: Buffer,
    key: Buffer,
    contractAddress: string,
    objectId: string
  ): {
    encrypted: Buffer;
    iv: Buffer;
    authTag: Buffer;
  } {
    // Generate IV
    const iv = randomBytes(this.config.ivLength);
    
    // Create cipher
    const cipher = createCipheriv(this.config.algorithm, key, iv);
    
    // Add associated authenticated data (AAD)
    const aad = Buffer.concat([
      Buffer.from(contractAddress),
      Buffer.from(objectId)
    ]);
    cipher.setAAD(aad);
    
    // Encrypt data
    const encrypted = Buffer.concat([
      iv,
      cipher.update(data),
      cipher.final(),
      cipher.getAuthTag()
    ]);
    
    return {
      encrypted,
      iv,
      authTag: cipher.getAuthTag()
    };
  }
  
  // Encrypt share for specific server
  private static async encryptShareForServer(
    share: { x: number; y: Buffer },
    server: ServerInfo,
    contractAddress: string,
    objectId: string
  ): Promise<EncryptedShare> {
    // Generate ephemeral key pair
    const ephemeral = X25519ECDH.generateKeyPair();
    
    // Perform ECDH with server's public key
    const sharedSecret = X25519ECDH.computeSharedSecret(
      ephemeral.privateKey,
      server.encryptionPublicKey
    );
    
    // Derive encryption key
    const salt = Buffer.concat([
      Buffer.from(contractAddress),
      Buffer.from(objectId),
      Buffer.from([share.x])
    ]);
    const encryptionKey = X25519ECDH.deriveKey(sharedSecret, salt);
    
    // Prepare share data
    const shareData = Buffer.concat([
      Buffer.from([share.x]),
      share.y
    ]);
    
    // Encrypt share
    const nonce = randomBytes(this.config.ivLength);
    const cipher = createCipheriv(this.config.algorithm, encryptionKey, nonce);
    
    // Add AAD
    const aad = Buffer.concat([
      ephemeral.publicKey,
      Buffer.from(contractAddress),
      Buffer.from(objectId)
    ]);
    cipher.setAAD(aad);
    
    const encryptedShare = Buffer.concat([
      cipher.update(shareData),
      cipher.final()
    ]);
    const authTag = cipher.getAuthTag();
    
    // Clear sensitive data
    ephemeral.privateKey.fill(0);
    sharedSecret.fill(0);
    encryptionKey.fill(0);
    
    return {
      serverId: server.id,
      encryptedShare,
      ephemeralPublicKey: ephemeral.publicKey,
      nonce,
      authTag
    };
  }
  
  // Complete decryption flow
  static async decrypt(
    encryptedData: Buffer,
    encryptedShares: EncryptedShare[],
    servers: ServerInfo[],
    threshold: number,
    contractAddress: string,
    objectId: string,
    sessionPrivateKey: Buffer
  ): Promise<Buffer> {
    // Step 1: Decrypt shares from servers
    const decryptedShares = await Promise.all(
      encryptedShares.map(async (encShare) => {
        const server = servers.find(s => s.id === encShare.serverId);
        if (!server) throw new Error(`Server ${encShare.serverId} not found`);
        
        return this.decryptShareFromServer(
          encShare,
          server,
          contractAddress,
          objectId,
          sessionPrivateKey
        );
      })
    );
    
    // Step 2: Reconstruct encryption key using Shamir
    const dataKey = ShamirSecretSharing.combine(decryptedShares);
    
    // Step 3: Decrypt data
    const decryptedData = this.decryptData(
      encryptedData,
      dataKey,
      contractAddress,
      objectId
    );
    
    // Clear sensitive data
    dataKey.fill(0);
    
    return decryptedData;
  }
  
  // Decrypt share from server
  private static decryptShareFromServer(
    encryptedShare: EncryptedShare,
    server: ServerInfo,
    contractAddress: string,
    objectId: string,
    sessionPrivateKey: Buffer
  ): { x: number; y: Buffer } {
    // Perform ECDH with ephemeral public key
    const sharedSecret = X25519ECDH.computeSharedSecret(
      sessionPrivateKey,
      encryptedShare.ephemeralPublicKey
    );
    
    // Derive decryption key (same as encryption)
    const salt = Buffer.concat([
      Buffer.from(contractAddress),
      Buffer.from(objectId),
      Buffer.from([0]) // We'll extract x from decrypted data
    ]);
    const decryptionKey = X25519ECDH.deriveKey(sharedSecret, salt);
    
    // Decrypt share
    const decipher = createDecipheriv(
      this.config.algorithm,
      decryptionKey,
      encryptedShare.nonce
    );
    
    // Set AAD
    const aad = Buffer.concat([
      encryptedShare.ephemeralPublicKey,
      Buffer.from(contractAddress),
      Buffer.from(objectId)
    ]);
    decipher.setAAD(aad);
    decipher.setAuthTag(encryptedShare.authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedShare.encryptedShare),
      decipher.final()
    ]);
    
    // Extract x and y
    const x = decrypted[0];
    const y = decrypted.slice(1);
    
    // Clear sensitive data
    sharedSecret.fill(0);
    decryptionKey.fill(0);
    
    return { x, y };
  }
  
  // Decrypt data
  private static decryptData(
    encryptedData: Buffer,
    key: Buffer,
    contractAddress: string,
    objectId: string
  ): Buffer {
    // Extract components
    const iv = encryptedData.slice(0, this.config.ivLength);
    const authTag = encryptedData.slice(-this.config.tagLength);
    const ciphertext = encryptedData.slice(
      this.config.ivLength,
      -this.config.tagLength
    );
    
    // Create decipher
    const decipher = createDecipheriv(this.config.algorithm, key, iv);
    
    // Set AAD
    const aad = Buffer.concat([
      Buffer.from(contractAddress),
      Buffer.from(objectId)
    ]);
    decipher.setAAD(aad);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);
  }
  
  // Generate key ID for tracking
  private static generateKeyId(key: Buffer): string {
    return createHash('sha256')
      .update(key)
      .digest('hex')
      .slice(0, 16);
  }
  
  // Secure key derivation with context
  static deriveContextualKey(
    masterKey: Buffer,
    context: string,
    length: number = 32
  ): Buffer {
    const salt = createHash('sha256')
      .update(context)
      .digest();
    
    return X25519ECDH.deriveKey(masterKey, salt, Buffer.from(context), length);
  }
  
  // Generate deterministic IV (for specific use cases)
  static generateDeterministicIV(
    key: Buffer,
    contractAddress: string,
    objectId: string,
    counter: number
  ): Buffer {
    const input = Buffer.concat([
      key,
      Buffer.from(contractAddress),
      Buffer.from(objectId),
      Buffer.from(counter.toString())
    ]);
    
    return createHash('sha256')
      .update(input)
      .digest()
      .slice(0, this.config.ivLength);
  }
}

// Server information structure
export interface ServerInfo {
  id: number;
  encryptionPublicKey: Buffer;
  endpoint: string;
}

// Advanced encryption features
export class AdvancedEncryption extends NeuralockEncryption {
  // Encrypt with additional metadata
  static async encryptWithMetadata(
    data: Buffer,
    metadata: Record<string, any>,
    servers: ServerInfo[],
    threshold: number,
    contractAddress: string,
    objectId: string
  ): Promise<EncryptionResult> {
    // Serialize metadata
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    
    // Combine data and metadata
    const combined = Buffer.concat([
      Buffer.from([0x01]), // Version byte
      Buffer.allocUnsafe(4).fill(data.length), // Data length
      data,
      metadataBuffer
    ]);
    
    // Encrypt combined data
    return this.encrypt(combined, servers, threshold, contractAddress, objectId);
  }
  
  // Streaming encryption for large files
  static createEncryptionStream(
    servers: ServerInfo[],
    threshold: number,
    contractAddress: string,
    objectId: string
  ) {
    const { Transform } = require('stream');
    const dataKey = randomBytes(this.config.keyLength);
    const iv = randomBytes(this.config.ivLength);
    
    let cipher: any;
    let isFirst = true;
    
    const encryptStream = new Transform({
      transform(chunk: Buffer, encoding: string, callback: Function) {
        if (isFirst) {
          // Initialize cipher on first chunk
          cipher = createCipheriv('aes-256-gcm', dataKey, iv);
          const aad = Buffer.concat([
            Buffer.from(contractAddress),
            Buffer.from(objectId)
          ]);
          cipher.setAAD(aad);
          isFirst = false;
          
          // Emit IV as first output
          this.push(iv);
        }
        
        // Encrypt chunk
        const encrypted = cipher.update(chunk);
        callback(null, encrypted);
      },
      
      flush(callback: Function) {
        if (cipher) {
          // Finalize and emit auth tag
          const final = cipher.final();
          const authTag = cipher.getAuthTag();
          
          this.push(final);
          this.push(authTag);
          
          // Now handle key sharing
          // This would need to be done after stream completes
          // Store dataKey shares as metadata
        }
        callback();
      }
    });
    
    return {
      stream: encryptStream,
      dataKey,
      iv
    };
  }
}

// Example: Complete encryption/decryption cycle
export async function demonstrateEncryptionProtocol() {
  console.log('=== Neuralock Encryption Protocol Demo ===\n');
  
  // Setup
  const servers: ServerInfo[] = [
    {
      id: 1,
      encryptionPublicKey: randomBytes(32),
      endpoint: 'https://server1.neuralock.com'
    },
    {
      id: 2,
      encryptionPublicKey: randomBytes(32),
      endpoint: 'https://server2.neuralock.com'
    },
    {
      id: 3,
      encryptionPublicKey: randomBytes(32),
      endpoint: 'https://server3.neuralock.com'
    },
    {
      id: 4,
      encryptionPublicKey: randomBytes(32),
      endpoint: 'https://server4.neuralock.com'
    },
    {
      id: 5,
      encryptionPublicKey: randomBytes(32),
      endpoint: 'https://server5.neuralock.com'
    }
  ];
  
  const threshold = 3;
  const contractAddress = '0x1234567890123456789012345678901234567890';
  const objectId = 'document-123';
  
  // Data to encrypt
  const sensitiveData = Buffer.from('This is highly sensitive information that must be protected!');
  console.log('Original data:', sensitiveData.toString());
  console.log('Data size:', sensitiveData.length, 'bytes\n');
  
  // Encrypt
  console.log('Encrypting with threshold', threshold, 'of', servers.length, 'servers...');
  const encrypted = await NeuralockEncryption.encrypt(
    sensitiveData,
    servers,
    threshold,
    contractAddress,
    objectId
  );
  
  console.log('Encrypted data size:', encrypted.encryptedData.length, 'bytes');
  console.log('Number of shares:', encrypted.encryptedShares.length);
  console.log('Metadata:', encrypted.metadata);
  
  // Simulate decryption with minimum shares
  console.log('\nDecrypting with exactly', threshold, 'shares...');
  const sessionKeyPair = X25519ECDH.generateKeyPair();
  const selectedShares = encrypted.encryptedShares.slice(0, threshold);
  
  const decrypted = await NeuralockEncryption.decrypt(
    encrypted.encryptedData,
    selectedShares,
    servers,
    threshold,
    contractAddress,
    objectId,
    sessionKeyPair.privateKey
  );
  
  console.log('Decrypted data:', decrypted.toString());
  console.log('Success:', sensitiveData.equals(decrypted));
}