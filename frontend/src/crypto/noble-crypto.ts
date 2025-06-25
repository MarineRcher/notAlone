// Noble Cryptography Utilities for Signal Protocol
// Pure TypeScript implementation using Noble libraries

import { x25519 } from '@noble/curves/ed25519';
import { ed25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';
import { hmac } from '@noble/hashes/hmac';
import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/hashes/utils';
import type { KeyPair, MessageKeys } from './types';

export class NobleSignalCrypto {
  // Generate X25519 key pair for ECDH
  static generateKeyPair(): KeyPair {
    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);
    return { privateKey, publicKey };
  }

  // Generate Ed25519 signing key pair
  static generateSigningKeyPair(): KeyPair {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    return { privateKey, publicKey };
  }

  // X25519 Diffie-Hellman key exchange
  static dh(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
    return x25519.getSharedSecret(privateKey, publicKey);
  }

  // Ed25519 digital signature
  static sign(privateKey: Uint8Array, message: Uint8Array): Uint8Array {
    return ed25519.sign(message, privateKey);
  }

  // Ed25519 signature verification
  static verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
    return ed25519.verify(signature, message, publicKey);
  }

  // HKDF key derivation function
  static deriveKeys(inputKey: Uint8Array, salt: Uint8Array, info: string, length: number = 32): Uint8Array {
    return hkdf(sha256, inputKey, salt, new TextEncoder().encode(info), length);
  }

  // Signal's Double Ratchet key derivation
  static kdfRootKey(rootKey: Uint8Array, dhOutput: Uint8Array): { rootKey: Uint8Array; chainKey: Uint8Array } {
    const output = this.deriveKeys(dhOutput, rootKey, 'Signal_Root_Key_Derivation', 64);
    return {
      rootKey: output.slice(0, 32),
      chainKey: output.slice(32, 64)
    };
  }

  // Chain key advancement for message keys
  static kdfChainKey(chainKey: Uint8Array): { chainKey: Uint8Array; messageKey: Uint8Array } {
    const nextChainKey = hmac(sha256, chainKey, new Uint8Array([0x02]));
    const messageKey = hmac(sha256, chainKey, new Uint8Array([0x01]));
    return { chainKey: nextChainKey, messageKey };
  }

  // Derive encryption keys from message key
  static deriveMessageKeys(messageKey: Uint8Array): MessageKeys {
    const cipherKey = this.deriveKeys(messageKey, new Uint8Array(32), 'Signal_Message_Cipher_Key');
    const macKey = this.deriveKeys(messageKey, new Uint8Array(32), 'Signal_Message_MAC_Key');
    const iv = randomBytes(16);
    return { cipherKey, macKey, iv };
  }

  // ChaCha20Poly1305 authenticated encryption
  static encrypt(key: Uint8Array, plaintext: Uint8Array, aad?: Uint8Array): { ciphertext: Uint8Array; nonce: Uint8Array } {
    const nonce = randomBytes(12);
    const cipher = chacha20poly1305(key, nonce, aad);
    const ciphertext = cipher.encrypt(plaintext);
    return { ciphertext, nonce };
  }

  // ChaCha20Poly1305 authenticated decryption
  static decrypt(key: Uint8Array, ciphertext: Uint8Array, nonce: Uint8Array, aad?: Uint8Array): Uint8Array {
    const cipher = chacha20poly1305(key, nonce, aad);
    return cipher.decrypt(ciphertext);
  }

  // Secure random bytes generation
  static randomBytes(length: number): Uint8Array {
    return randomBytes(length);
  }

  // Utility: Convert Uint8Array to hex string
  static toHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Utility: Convert hex string to Uint8Array
  static fromHex(hex: string): Uint8Array {
    const matches = hex.match(/.{1,2}/g);
    if (!matches) throw new Error('Invalid hex string');
    return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
  }

  // Utility: Compare two Uint8Arrays in constant time
  static constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }
} 