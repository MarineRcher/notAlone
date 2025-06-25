// Cryptographic Key Exchange Algorithms
// Implementation of various key exchange protocols for secure communication

import { x25519 } from '@noble/curves/ed25519';
import { randomBytes } from '@noble/hashes/utils';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';

/**
 * Diffie-Hellman Key Exchange using Curve25519
 * Provides forward secrecy and secure key agreement
 */
export class DiffieHellmanKeyExchange {
  private privateKey: Uint8Array;
  public readonly publicKey: Uint8Array;

  constructor(privateKey?: Uint8Array) {
    const keySource = privateKey ? 'provided' : 'generated';
    const keyId = this.generateKeyId();
    
    if (privateKey) {
      console.log(`🔑 [DH KEY] Using provided private key - KeyID: ${keyId}`);
      this.privateKey = privateKey;
    } else {
      console.log(`🔑 [DH KEY] Generating new DH private key - KeyID: ${keyId}`);
      // Generate random 32-byte private key
      this.privateKey = randomBytes(32);
      console.log(`🔑 [DH KEY] ✅ Generated private key (32 bytes) - KeyID: ${keyId}`);
    }
    
    // Generate corresponding public key using X25519
    console.log(`🔑 [DH KEY] Computing public key from private key - KeyID: ${keyId}`);
    this.publicKey = x25519.getPublicKey(this.privateKey);
    console.log(`🔑 [DH KEY] ✅ Generated public key (32 bytes) - KeyID: ${keyId}, Source: ${keySource}`);
    console.log(`🔑 [DH KEY] Public key preview: ${this.getPublicKeyPreview()}`);
  }

  /**
   * Perform Diffie-Hellman key exchange
   * @param remotePublicKey The other party's public key
   * @returns Shared secret (32 bytes)
   */
  computeSharedSecret(remotePublicKey: Uint8Array): Uint8Array {
    if (remotePublicKey.length !== 32) {
      throw new Error('Invalid public key length. Expected 32 bytes.');
    }

    const remoteKeyPreview = Array.from(remotePublicKey.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
    
    console.log(`🔑 [DH EXCHANGE] Computing shared secret...`);
    console.log(`🔑 [DH EXCHANGE] Our public key preview: ${this.getPublicKeyPreview()}`);
    console.log(`🔑 [DH EXCHANGE] Remote public key preview: ${remoteKeyPreview}`);
    
    const sharedSecret = x25519.getSharedSecret(this.privateKey, remotePublicKey);
    
    const secretPreview = Array.from(sharedSecret.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
    
    console.log(`🔑 [DH EXCHANGE] ✅ Shared secret computed (32 bytes) - Preview: ${secretPreview}`);
    
    return sharedSecret;
  }

  /**
   * Derive encryption keys from shared secret using HKDF
   * @param sharedSecret The computed shared secret
   * @param salt Optional salt for key derivation
   * @param info Optional context information
   * @param keyLength Length of derived key in bytes (default: 32)
   * @returns Derived key material
   */
  deriveKeys(
    sharedSecret: Uint8Array,
    salt?: Uint8Array,
    info?: Uint8Array,
    keyLength: number = 32
  ): Uint8Array {
    const defaultSalt = new Uint8Array(32); // All zeros if no salt provided
    const defaultInfo = new TextEncoder().encode('Signal Protocol Key Derivation');
    
    return hkdf(
      sha256,
      sharedSecret,
      salt || defaultSalt,
      info || defaultInfo,
      keyLength
    );
  }

  /**
   * Generate a new key pair for ratcheting (forward secrecy)
   * @returns New DiffieHellmanKeyExchange instance
   */
  static generateKeyPair(): DiffieHellmanKeyExchange {
    return new DiffieHellmanKeyExchange();
  }

  /**
   * Export private key (use with caution!)
   * @returns Private key bytes
   */
  exportPrivateKey(): Uint8Array {
    return new Uint8Array(this.privateKey);
  }

  /**
   * Create instance from existing private key
   * @param privateKey 32-byte private key
   * @returns DiffieHellmanKeyExchange instance
   */
  static fromPrivateKey(privateKey: Uint8Array): DiffieHellmanKeyExchange {
    if (privateKey.length !== 32) {
      throw new Error('Invalid private key length. Expected 32 bytes.');
    }
    return new DiffieHellmanKeyExchange(privateKey);
  }

  /**
   * Validate a public key
   * @param publicKey Public key to validate
   * @returns True if valid, false otherwise
   */
  static isValidPublicKey(publicKey: Uint8Array): boolean {
    return publicKey.length === 32;
  }

  /**
   * Generate a unique identifier for this key pair
   * @returns Short key identifier for logging
   */
  private generateKeyId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Get a preview of the public key for logging (first 8 chars as hex)
   * @returns Hex preview string
   */
  private getPublicKeyPreview(): string {
    const bytes = new Uint8Array(this.publicKey);
    return Array.from(bytes.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
  }
}

/**
 * Triple Diffie-Hellman (3DH) Key Exchange
 * Used in Signal Protocol for enhanced security
 */
export class TripleDiffieHellman {
  /**
   * Perform 3DH key agreement as initiator
   * @param identityKeyPair Our long-term identity key pair
   * @param ephemeralKeyPair Our ephemeral key pair
   * @param remoteIdentityKey Remote party's identity public key
   * @param remoteEphemeralKey Remote party's ephemeral public key
   * @returns Master secret (32 bytes)
   */
  static performAsInitiator(
    identityKeyPair: DiffieHellmanKeyExchange,
    ephemeralKeyPair: DiffieHellmanKeyExchange,
    remoteIdentityKey: Uint8Array,
    remoteEphemeralKey: Uint8Array
  ): Uint8Array {
    console.log(`🔑 [3DH INITIATOR] Starting Triple Diffie-Hellman as initiator...`);
    
    // DH1: Our identity key with their ephemeral key
    console.log(`🔑 [3DH INITIATOR] DH1: Our identity key ↔ Their ephemeral key`);
    const dh1 = identityKeyPair.computeSharedSecret(remoteEphemeralKey);
    
    // DH2: Our ephemeral key with their identity key
    console.log(`🔑 [3DH INITIATOR] DH2: Our ephemeral key ↔ Their identity key`);
    const dh2 = ephemeralKeyPair.computeSharedSecret(remoteIdentityKey);
    
    // DH3: Our ephemeral key with their ephemeral key
    console.log(`🔑 [3DH INITIATOR] DH3: Our ephemeral key ↔ Their ephemeral key`);
    const dh3 = ephemeralKeyPair.computeSharedSecret(remoteEphemeralKey);

    // Concatenate all shared secrets
    console.log(`🔑 [3DH INITIATOR] Concatenating 3 shared secrets (96 bytes total)`);
    const masterSecret = new Uint8Array(96); // 3 * 32 bytes
    masterSecret.set(dh1, 0);
    masterSecret.set(dh2, 32);
    masterSecret.set(dh3, 64);

    // Derive final shared secret using HKDF
    console.log(`🔑 [3DH INITIATOR] Deriving final master secret using HKDF...`);
    const finalSecret = hkdf(
      sha256,
      masterSecret,
      new Uint8Array(32), // Salt
      new TextEncoder().encode('Signal 3DH'),
      32
    );
    
    const secretPreview = Array.from(finalSecret.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
    
    console.log(`🔑 [3DH INITIATOR] ✅ Triple DH complete - Master secret preview: ${secretPreview}`);
    
    return finalSecret;
  }

  /**
   * Perform 3DH key agreement as responder
   * @param identityKeyPair Our long-term identity key pair
   * @param ephemeralKeyPair Our ephemeral key pair
   * @param remoteIdentityKey Remote party's identity public key
   * @param remoteEphemeralKey Remote party's ephemeral public key
   * @returns Master secret (32 bytes)
   */
  static performAsResponder(
    identityKeyPair: DiffieHellmanKeyExchange,
    ephemeralKeyPair: DiffieHellmanKeyExchange,
    remoteIdentityKey: Uint8Array,
    remoteEphemeralKey: Uint8Array
  ): Uint8Array {
    // DH1: Our ephemeral key with their identity key
    const dh1 = ephemeralKeyPair.computeSharedSecret(remoteIdentityKey);
    
    // DH2: Our identity key with their ephemeral key
    const dh2 = identityKeyPair.computeSharedSecret(remoteEphemeralKey);
    
    // DH3: Our ephemeral key with their ephemeral key
    const dh3 = ephemeralKeyPair.computeSharedSecret(remoteEphemeralKey);

    // Concatenate all shared secrets
    const masterSecret = new Uint8Array(96); // 3 * 32 bytes
    masterSecret.set(dh1, 0);
    masterSecret.set(dh2, 32);
    masterSecret.set(dh3, 64);

    // Derive final shared secret using HKDF
    return hkdf(
      sha256,
      masterSecret,
      new Uint8Array(32), // Salt
      new TextEncoder().encode('Signal 3DH'),
      32
    );
  }
}

/**
 * Key Derivation Functions
 */
export class KeyDerivation {
  /**
   * HKDF key derivation with multiple outputs
   * @param inputKeyMaterial Input key material
   * @param salt Salt value
   * @param info Context information
   * @param outputKeys Number of output keys to derive
   * @param keyLength Length of each output key
   * @returns Array of derived keys
   */
  static deriveMultipleKeys(
    inputKeyMaterial: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    outputKeys: number,
    keyLength: number = 32
  ): Uint8Array[] {
    const keys: Uint8Array[] = [];
    
    for (let i = 0; i < outputKeys; i++) {
      const keyInfo = new Uint8Array(info.length + 1);
      keyInfo.set(info);
      keyInfo[info.length] = i + 1; // Add counter
      
      const key = hkdf(sha256, inputKeyMaterial, salt, keyInfo, keyLength);
      keys.push(key);
    }
    
    return keys;
  }

  /**
   * Derive root key and chain key for Double Ratchet
   * @param rootKey Current root key
   * @param dhOutput Diffie-Hellman output
   * @returns New root key and chain key
   */
  static deriveRootAndChainKey(
    rootKey: Uint8Array,
    dhOutput: Uint8Array
  ): { rootKey: Uint8Array; chainKey: Uint8Array } {
    const keys = this.deriveMultipleKeys(
      dhOutput,
      rootKey,
      new TextEncoder().encode('Signal Root Chain'),
      2,
      32
    );
    
    return {
      rootKey: keys[0],
      chainKey: keys[1]
    };
  }

  /**
   * Derive message key from chain key
   * @param chainKey Current chain key
   * @returns Message key and next chain key
   */
  static deriveMessageKey(chainKey: Uint8Array): {
    messageKey: Uint8Array;
    nextChainKey: Uint8Array;
  } {
    // Message key = HMAC-SHA256(chainKey, 0x01)
    const messageKey = hkdf(
      sha256,
      chainKey,
      new Uint8Array(32),
      new Uint8Array([0x01]),
      32
    );
    
    // Next chain key = HMAC-SHA256(chainKey, 0x02)
    const nextChainKey = hkdf(
      sha256,
      chainKey,
      new Uint8Array(32),
      new Uint8Array([0x02]),
      32
    );
    
    return { messageKey, nextChainKey };
  }
}

// Export all classes
export {
  DiffieHellmanKeyExchange as DH,
  TripleDiffieHellman as TripleDH,
  KeyDerivation as KDF
};
