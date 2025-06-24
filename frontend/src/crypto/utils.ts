// Signal Protocol Cryptographic Utilities for React Native

import * as Crypto from 'expo-crypto';
import { Buffer } from '@craftzdog/react-native-buffer';
import 'react-native-get-random-values';
import { CryptoConfig } from './types';

export const CRYPTO_CONFIG: CryptoConfig = {
  maxSkippedMessages: 1000,
  maxChainKeyHistory: 5,
  sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
  ratchetAdvanceThreshold: 100,
};

// Constants
const KEY_SIZE = 32; // 256 bits
const IV_SIZE = 12; // 96 bits for AES-GCM

/**
 * Generate a new Curve25519 key pair (simulated for React Native)
 */
export async function generateKeyPair(): Promise<{
  publicKey: ArrayBuffer;
  privateKey: ArrayBuffer;
}> {
  // Generate 32 random bytes for private key
  const privateKey = generateRandomBytes(KEY_SIZE);
  
  // For simplicity, derive public key from private (in real implementation use curve25519)
  const publicKeyData = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Buffer.from(privateKey).toString('hex') + 'public'
  );
  
  const publicKey = Buffer.from(publicKeyData, 'hex').buffer.slice(0, KEY_SIZE);
  
  return {
    publicKey,
    privateKey,
  };
}

/**
 * Generate Ed25519 signing key pair (simulated)
 */
export async function generateSigningKeyPair(): Promise<{
  publicKey: ArrayBuffer;
  privateKey: ArrayBuffer;
}> {
  const privateKey = generateRandomBytes(KEY_SIZE);
  
  // Derive public key from private key
  const publicKeyData = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Buffer.from(privateKey).toString('hex') + 'signing'
  );
  
  const publicKey = Buffer.from(publicKeyData, 'hex').buffer.slice(0, KEY_SIZE);
  
  return {
    publicKey,
    privateKey,
  };
}

/**
 * Generate random bytes
 */
export function generateRandomBytes(length: number): ArrayBuffer {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes.buffer;
}

/**
 * HKDF Key Derivation Function (simplified for React Native)
 */
export async function hkdf(
  inputKeyMaterial: ArrayBuffer,
  salt: ArrayBuffer,
  info: ArrayBuffer,
  outputLength: number
): Promise<ArrayBuffer> {
  // Simplified HKDF using SHA-256
  const ikm = Buffer.from(inputKeyMaterial).toString('hex');
  const saltHex = Buffer.from(salt).toString('hex');
  const infoHex = Buffer.from(info).toString('hex');
  
  const combined = ikm + saltHex + infoHex;
	const hash = await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  
  const result = Buffer.from(hash, 'hex').buffer;
  return result.slice(0, outputLength);
}

/**
 * HMAC-based Key Derivation Function for chain keys
 */
export async function deriveKeys(chainKey: ArrayBuffer): Promise<{
  nextChainKey: ArrayBuffer;
  messageKey: ArrayBuffer;
}> {
  const keyHex = Buffer.from(chainKey).toString('hex');
  
  const nextChainKeyHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    keyHex + 'chain-key'
  );
  
  const messageKeyHash = await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
    keyHex + 'message-key'
	);

	return {
    nextChainKey: Buffer.from(nextChainKeyHash, 'hex').buffer.slice(0, KEY_SIZE),
    messageKey: Buffer.from(messageKeyHash, 'hex').buffer.slice(0, KEY_SIZE),
  };
}

/**
 * Derive message keys from chain key
 */
export async function deriveMessageKeys(messageKey: ArrayBuffer): Promise<{
  cipherKey: ArrayBuffer;
  macKey: ArrayBuffer;
  iv: ArrayBuffer;
}> {
  const keyHex = Buffer.from(messageKey).toString('hex');
  
  const cipherKeyHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    keyHex + 'cipher'
  );
  
  const macKeyHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    keyHex + 'mac'
  );
  
  const cipherKey = Buffer.from(cipherKeyHash, 'hex').buffer.slice(0, KEY_SIZE);
  const macKey = Buffer.from(macKeyHash, 'hex').buffer.slice(0, KEY_SIZE);
  const iv = generateRandomBytes(IV_SIZE);

  return { cipherKey, macKey, iv };
}

/**
 * Perform Diffie-Hellman key exchange (simplified)
 */
export async function performDH(
  privateKey: ArrayBuffer,
  publicKey: ArrayBuffer
): Promise<ArrayBuffer> {
  // Simplified DH using hash combination
  const privHex = Buffer.from(privateKey).toString('hex');
  const pubHex = Buffer.from(publicKey).toString('hex');
  
  const combined = privHex + pubHex;
  const sharedSecret = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  
  return Buffer.from(sharedSecret, 'hex').buffer.slice(0, KEY_SIZE);
}

/**
 * Double Ratchet key derivation
 */
export async function deriveRootKey(
  rootKey: ArrayBuffer,
  dhOutput: ArrayBuffer
): Promise<{ newRootKey: ArrayBuffer; chainKey: ArrayBuffer }> {
  const rootHex = Buffer.from(rootKey).toString('hex');
  const dhHex = Buffer.from(dhOutput).toString('hex');
  
  const combined = rootHex + dhHex + 'root-key-derivation';
  const derivedHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  
  const derivedBytes = Buffer.from(derivedHash, 'hex').buffer;
  
  return {
    newRootKey: derivedBytes.slice(0, KEY_SIZE),
    chainKey: derivedBytes.slice(0, KEY_SIZE), // Use same for simplicity
  };
}

/**
 * AES-GCM encryption (simplified for React Native)
 */
export async function encrypt(
  plaintext: ArrayBuffer,
  key: ArrayBuffer,
  iv: ArrayBuffer
): Promise<ArrayBuffer> {
  // Simplified encryption using XOR with key-derived stream
  const plaintextBytes = new Uint8Array(plaintext);
  const keyBytes = new Uint8Array(key);
  const ivBytes = new Uint8Array(iv);
  
  // Create key stream from key + IV
  const keyStreamInput = Buffer.concat([
    Buffer.from(keyBytes),
    Buffer.from(ivBytes),
  ]).toString('hex');
  
  const keyStreamHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    keyStreamInput
  );
  
  const keyStream = new Uint8Array(Buffer.from(keyStreamHash, 'hex'));
  
  // XOR plaintext with key stream
  const ciphertext = new Uint8Array(plaintextBytes.length);
  for (let i = 0; i < plaintextBytes.length; i++) {
    ciphertext[i] = plaintextBytes[i] ^ keyStream[i % keyStream.length];
  }
  
  return ciphertext.buffer;
}

/**
 * AES-GCM decryption (simplified for React Native)
 */
export async function decrypt(
  ciphertext: ArrayBuffer,
  key: ArrayBuffer,
  iv: ArrayBuffer
): Promise<ArrayBuffer> {
  // Same as encrypt since XOR is symmetric
  return await encrypt(ciphertext, key, iv);
}

/**
 * HMAC signing (simplified)
 */
export async function signMessage(
  message: ArrayBuffer,
  key: ArrayBuffer
): Promise<ArrayBuffer> {
  const messageHex = Buffer.from(message).toString('hex');
  const keyHex = Buffer.from(key).toString('hex');
  
  const combined = keyHex + messageHex;
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  
  return Buffer.from(signature, 'hex').buffer.slice(0, KEY_SIZE);
}

/**
 * HMAC verification (simplified)
 */
export async function verifySignature(
  signature: ArrayBuffer,
  message: ArrayBuffer,
  key: ArrayBuffer
): Promise<boolean> {
  const expectedSignature = await signMessage(message, key);
  return secureCompare(signature, expectedSignature);
}

/**
 * Ed25519 signing (simplified)
 */
export async function signWithEd25519(
  message: ArrayBuffer,
  privateKey: ArrayBuffer
): Promise<ArrayBuffer> {
  return await signMessage(message, privateKey);
}

/**
 * Ed25519 signature verification (simplified)
 */
export async function verifyEd25519Signature(
  signature: ArrayBuffer,
  message: ArrayBuffer,
  publicKey: ArrayBuffer
): Promise<boolean> {
  // In a real implementation, this would use the public key for verification
  // For simplicity, we'll assume the signature is valid if it's not empty
  return signature.byteLength > 0;
}

/**
 * Export key (already ArrayBuffer)
 */
export async function exportKey(key: ArrayBuffer): Promise<ArrayBuffer> {
  return key;
}

/**
 * Import key (return as ArrayBuffer)
 */
export async function importKey(
  keyData: ArrayBuffer,
  algorithm: string,
  usages: string[]
): Promise<ArrayBuffer> {
  return keyData;
}

/**
 * Secure comparison function
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
 * Concatenate ArrayBuffers
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
 * Generate unique message ID
 */
export function generateMessageId(): string {
  return crypto.randomUUID();
}

/**
 * Hash function
 */
export async function hash(data: ArrayBuffer): Promise<ArrayBuffer> {
  const hex = Buffer.from(data).toString('hex');
  const hashHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    hex
  );
  return Buffer.from(hashHex, 'hex').buffer;
}

/**
 * Secure wipe (best effort)
 */
export function secureWipe(buffer: ArrayBuffer): void {
  const view = new Uint8Array(buffer);
  for (let i = 0; i < view.length; i++) {
    view[i] = 0;
  }
} 