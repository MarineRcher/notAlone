// Signal Protocol Cryptographic Utilities using Noble Crypto

import { x25519 } from '@noble/curves/ed25519';
import { ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import { hkdf } from '@noble/hashes/hkdf';
import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/hashes/utils';
import { CryptoConfig } from './types';

export const CRYPTO_CONFIG: CryptoConfig = {
  maxSkippedMessages: 1000,
  maxChainKeyHistory: 5,
  sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
  ratchetAdvanceThreshold: 100,
};

// Constants
const KEY_SIZE = 32; // 256 bits
const IV_SIZE = 12; // 96 bits for ChaCha20Poly1305

/**
 * Generate a new X25519 key pair for ECDH
 */
export function generateKeyPair(): {
  publicKey: ArrayBuffer;
  privateKey: ArrayBuffer;
} {
  const keyId = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log(`🔑 [X25519 KEYPAIR] Generating new X25519 key pair - KeyID: ${keyId}`);
  
  const privateKey = x25519.utils.randomPrivateKey();
  console.log(`🔑 [X25519 KEYPAIR] ✅ Generated private key (32 bytes) - KeyID: ${keyId}`);
  
  const publicKey = x25519.getPublicKey(privateKey);
  const publicKeyPreview = Array.from(publicKey.slice(0, 4))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('').toUpperCase();
  console.log(`🔑 [X25519 KEYPAIR] ✅ Generated public key (32 bytes) - KeyID: ${keyId}, Preview: ${publicKeyPreview}`);
  
  return {
    publicKey: new Uint8Array(publicKey).buffer.slice(0),
    privateKey: new Uint8Array(privateKey).buffer.slice(0),
  };
}

/**
 * Generate Ed25519 signing key pair
 */
export function generateSigningKeyPair(): {
  publicKey: ArrayBuffer;
  privateKey: ArrayBuffer;
} {
  const keyId = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log(`🔑 [ED25519 SIGNING] Generating new Ed25519 signing key pair - KeyID: ${keyId}`);
  
  const privateKey = ed25519.utils.randomPrivateKey();
  console.log(`🔑 [ED25519 SIGNING] ✅ Generated signing private key (32 bytes) - KeyID: ${keyId}`);
  
  const publicKey = ed25519.getPublicKey(privateKey);
  const publicKeyPreview = Array.from(publicKey.slice(0, 4))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('').toUpperCase();
  console.log(`🔑 [ED25519 SIGNING] ✅ Generated signing public key (32 bytes) - KeyID: ${keyId}, Preview: ${publicKeyPreview}`);
  
  return {
    publicKey: new Uint8Array(publicKey).buffer.slice(0),
    privateKey: new Uint8Array(privateKey).buffer.slice(0),
  };
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): ArrayBuffer {
  return new Uint8Array(randomBytes(length)).buffer.slice(0);
}

/**
 * HKDF Key Derivation Function using SHA-256
 */
export function hkdfExpand(
  inputKeyMaterial: ArrayBuffer,
  salt: ArrayBuffer,
  info: ArrayBuffer,
  outputLength: number
): ArrayBuffer {
  const ikm = new Uint8Array(inputKeyMaterial);
  const saltBytes = new Uint8Array(salt);
  const infoBytes = new Uint8Array(info);
  
  const result = hkdf(sha256, ikm, saltBytes, infoBytes, outputLength);
  return result.slice();
}

/**
 * HMAC-based Key Derivation Function for chain keys
 */
export function deriveKeys(chainKey: ArrayBuffer): {
  nextChainKey: ArrayBuffer;
  messageKey: ArrayBuffer;
} {
  const chainKeyBytes = new Uint8Array(chainKey);
  
  // Derive next chain key using HMAC
  const nextChainKey = hmac(sha256, chainKeyBytes, new TextEncoder().encode('chain'));
  
  // Derive message key using HMAC
  const messageKey = hmac(sha256, chainKeyBytes, new TextEncoder().encode('message'));

  return {
    nextChainKey: nextChainKey.slice(),
    messageKey: messageKey.slice(),
  };
}

/**
 * Derive message encryption keys from message key
 */
export function deriveMessageKeys(messageKey: ArrayBuffer): {
  cipherKey: ArrayBuffer;
  macKey: ArrayBuffer;
  iv: ArrayBuffer;
} {
  // Derive cipher key
  const cipherKey = hkdfExpand(
    messageKey,
    new ArrayBuffer(0),
    new TextEncoder().encode('cipher'),
    KEY_SIZE
  );
  
  // Derive MAC key
  const macKey = hkdfExpand(
    messageKey,
    new ArrayBuffer(0),
    new TextEncoder().encode('mac'),
    KEY_SIZE
  );
  
  // Generate random IV
  const iv = generateRandomBytes(IV_SIZE);

  return { cipherKey, macKey, iv };
}

/**
 * Perform X25519 Diffie-Hellman key exchange
 */
export function performDH(
  privateKey: ArrayBuffer,
  publicKey: ArrayBuffer
): ArrayBuffer {
  const privKey = new Uint8Array(privateKey);
  const pubKey = new Uint8Array(publicKey);
  
  const sharedSecret = x25519.getSharedSecret(privKey, pubKey);
  return sharedSecret.slice();
}

/**
 * Double Ratchet root key derivation using HKDF
 */
export function deriveRootKey(
  rootKey: ArrayBuffer,
  dhOutput: ArrayBuffer
): { newRootKey: ArrayBuffer; chainKey: ArrayBuffer } {
  const salt = new Uint8Array(rootKey);
  const ikm = new Uint8Array(dhOutput);
  const info = new TextEncoder().encode('root-key-derivation');
  
  // Derive 64 bytes: 32 for new root key, 32 for chain key
  const derived = hkdf(sha256, ikm, salt, info, 64);
  
  return {
    newRootKey: derived.slice(0, 32),
    chainKey: derived.slice(32, 64),
  };
}

/**
 * ChaCha20Poly1305 encryption
 */
export function encrypt(
  plaintext: ArrayBuffer,
  key: ArrayBuffer,
  iv: ArrayBuffer
): ArrayBuffer {
  const keyBytes = new Uint8Array(key);
  const ivBytes = new Uint8Array(iv);
  const plaintextBytes = new Uint8Array(plaintext);
  
  const cipher = chacha20poly1305(keyBytes, ivBytes);
  const ciphertext = cipher.encrypt(plaintextBytes);
  
  return ciphertext.slice();
}

/**
 * ChaCha20Poly1305 decryption
 */
export function decrypt(
  ciphertext: ArrayBuffer,
  key: ArrayBuffer,
  iv: ArrayBuffer
): ArrayBuffer {
  const keyBytes = new Uint8Array(key);
  const ivBytes = new Uint8Array(iv);
  const ciphertextBytes = new Uint8Array(ciphertext);
  
  const cipher = chacha20poly1305(keyBytes, ivBytes);
  const plaintext = cipher.decrypt(ciphertextBytes);
  
  return plaintext.slice();
}

/**
 * HMAC-SHA256 message authentication
 */
export function signMessage(
  message: ArrayBuffer,
  key: ArrayBuffer
): ArrayBuffer {
  const keyBytes = new Uint8Array(key);
  const messageBytes = new Uint8Array(message);
  
  const signature = hmac(sha256, keyBytes, messageBytes);
  return signature.slice();
}

/**
 * Verify HMAC-SHA256 signature
 */
export function verifySignature(
  signature: ArrayBuffer,
  message: ArrayBuffer,
  key: ArrayBuffer
): boolean {
  const expectedSignature = signMessage(message, key);
  return secureCompare(signature, expectedSignature);
}

/**
 * Ed25519 digital signature
 */
export function signWithEd25519(
  message: ArrayBuffer,
  privateKey: ArrayBuffer
): ArrayBuffer {
  const privKey = new Uint8Array(privateKey);
  const messageBytes = new Uint8Array(message);
  
  const signature = ed25519.sign(messageBytes, privKey);
  return signature.slice();
}

/**
 * Verify Ed25519 signature
 */
export function verifyEd25519Signature(
  signature: ArrayBuffer,
  message: ArrayBuffer,
  publicKey: ArrayBuffer
): boolean {
  const sigBytes = new Uint8Array(signature);
  const messageBytes = new Uint8Array(message);
  const pubKey = new Uint8Array(publicKey);
  
  return ed25519.verify(sigBytes, messageBytes, pubKey);
}

/**
 * Export key as ArrayBuffer (identity function for our implementation)
 */
export function exportKey(key: ArrayBuffer): ArrayBuffer {
  return key.slice(0);
}

/**
 * Import key from ArrayBuffer (identity function for our implementation)
 */
export function importKey(
  keyData: ArrayBuffer,
  algorithm: string,
  usages: string[]
): ArrayBuffer {
  return keyData.slice(0);
}

/**
 * Constant-time comparison to prevent timing attacks
 */
export function secureCompare(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  
  const aBytes = new Uint8Array(a);
  const bBytes = new Uint8Array(b);
  
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  
  return result === 0;
}

/**
 * Concatenate multiple ArrayBuffers
 */
export function concatArrayBuffers(...buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  
  return result.buffer;
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  const bytes = randomBytes(16);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA-256 hash function
 */
export function hash(data: ArrayBuffer): ArrayBuffer {
  const dataBytes = new Uint8Array(data);
  const hashBytes = sha256(dataBytes);
  return hashBytes.slice();
}

/**
 * Securely wipe an ArrayBuffer (best effort)
 */
export function secureWipe(buffer: ArrayBuffer): void {
  if (buffer.byteLength > 0) {
    const view = new Uint8Array(buffer);
    view.fill(0);
  }
} 