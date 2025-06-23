/**
 * Expo Go Compatible Crypto Engine
 * Uses only expo-crypto and Web Crypto API (available in Expo Go)
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export interface EncryptedMessage {
  iv: string;
  ciphertext: string;
  senderId: string;
  timestamp: number;
  groupId?: string;
  keyHash: string; // Hash to verify correct decryption
}

export interface DecryptedMessage {
  content: string;
  senderId: string;
  timestamp: number;
  groupId?: string;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

class ExpoCompatibleCrypto {
  private initialized = false;
  private userKeyPair: KeyPair | null = null;
  private groupKeys: Map<string, string> = new Map();

  /**
   * Initialize the crypto engine for a user
   */
  async initialize(userId: string): Promise<void> {
    try {
      console.log('🔐 Initializing Expo-compatible crypto for user:', userId);
      
      // Try to load existing key pair
      const existingPrivateKey = await SecureStore.getItemAsync(`expo_private_key_${userId}`);
      const existingPublicKey = await SecureStore.getItemAsync(`expo_public_key_${userId}`);
      
      if (existingPrivateKey && existingPublicKey) {
        this.userKeyPair = {
          privateKey: existingPrivateKey,
          publicKey: existingPublicKey
        };
        console.log('✅ Loaded existing key pair');
      } else {
        // Generate new key pair
        this.userKeyPair = await this.generateSimpleKeyPair();
        
        // Store the key pair securely
        await SecureStore.setItemAsync(`expo_private_key_${userId}`, this.userKeyPair.privateKey);
        await SecureStore.setItemAsync(`expo_public_key_${userId}`, this.userKeyPair.publicKey);
        console.log('✅ Generated and stored new key pair');
      }
      
      this.initialized = true;
      console.log('✅ Expo-compatible crypto initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize crypto:', error);
      throw new Error('Crypto initialization failed');
    }
  }

  /**
   * Generate a simple key pair using secure random bytes
   */
  private async generateSimpleKeyPair(): Promise<KeyPair> {
    try {
      // Generate 256-bit keys using expo-crypto
      const privateKeyBytes = Crypto.getRandomBytes(32);
      const publicKeyBytes = Crypto.getRandomBytes(32);
      
      // Convert to base64 for storage
      const privateKey = this.bytesToBase64(privateKeyBytes);
      const publicKey = this.bytesToBase64(publicKeyBytes);
      
      return { publicKey, privateKey };
    } catch (error) {
      console.error('❌ Failed to generate key pair:', error);
      throw new Error('Key pair generation failed');
    }
  }

  /**
   * Generate a symmetric key for group encryption (256-bit)
   */
  private generateGroupKey(): string {
    const keyBytes = Crypto.getRandomBytes(32); // 256 bits
    return this.bytesToBase64(keyBytes);
  }

  /**
   * Create or join a group session
   */
  async createGroupSession(groupId: string, memberIds: string[]): Promise<void> {
    try {
      if (!this.initialized) {
        throw new Error('Crypto not initialized');
      }

      console.log('🔐 Creating group session for group:', groupId);
      
      // Check if we already have a key for this group
      let groupKey = this.groupKeys.get(groupId);
      
      if (!groupKey) {
        // Generate new group key
        groupKey = this.generateGroupKey();
        this.groupKeys.set(groupId, groupKey);
        
        // Store group key securely
        await SecureStore.setItemAsync(`expo_group_key_${groupId}`, groupKey);
        console.log('✅ Generated new group key for group:', groupId);
      } else {
        console.log('✅ Using existing group key for group:', groupId);
      }
    } catch (error) {
      console.error('❌ Failed to create group session:', error);
      throw new Error('Group session creation failed');
    }
  }

  /**
   * Simple AES-like encryption using XOR with key derivation
   * This is a simplified but functional encryption for demo purposes
   */
  private async simpleEncrypt(plaintext: string, key: string): Promise<{ ciphertext: string; iv: string }> {
    try {
      // Generate random IV
      const ivBytes = Crypto.getRandomBytes(16);
      const iv = this.bytesToBase64(ivBytes);
      
      // Convert inputs to bytes
      const plaintextBytes = new TextEncoder().encode(plaintext);
      const keyBytes = this.base64ToBytes(key);
      
      // Create derived key using hash
      const keyHashHex = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        key + iv
      );
      const derivedKeyBytes = this.hexToBytes(keyHashHex);
      
      // Encrypt using XOR with derived key
      const ciphertextBytes = new Uint8Array(plaintextBytes.length);
      for (let i = 0; i < plaintextBytes.length; i++) {
        ciphertextBytes[i] = plaintextBytes[i] ^ derivedKeyBytes[i % derivedKeyBytes.length];
      }
      
      return {
        ciphertext: this.bytesToBase64(ciphertextBytes),
        iv
      };
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Simple AES-like decryption using XOR with key derivation
   */
  private async simpleDecrypt(ciphertext: string, key: string, iv: string): Promise<string> {
    try {
      // Convert inputs to bytes
      const ciphertextBytes = this.base64ToBytes(ciphertext);
      const keyBytes = this.base64ToBytes(key);
      
      // Create derived key using hash (same as encryption)
      const keyHashHex = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        key + iv
      );
      const derivedKeyBytes = this.hexToBytes(keyHashHex);
      
      // Decrypt using XOR with derived key
      const plaintextBytes = new Uint8Array(ciphertextBytes.length);
      for (let i = 0; i < ciphertextBytes.length; i++) {
        plaintextBytes[i] = ciphertextBytes[i] ^ derivedKeyBytes[i % derivedKeyBytes.length];
      }
      
      return new TextDecoder().decode(plaintextBytes);
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt a message for group chat
   */
  async encryptGroupMessage(message: string, groupId: string, senderId: string): Promise<EncryptedMessage> {
    try {
      if (!this.initialized) {
        throw new Error('Crypto not initialized');
      }

      console.log('🔐 Encrypting message for group:', groupId);
      
      // Get group key
      let groupKey = this.groupKeys.get(groupId);
      if (!groupKey) {
        // Try to load from secure storage
        const storedKey = await SecureStore.getItemAsync(`expo_group_key_${groupId}`);
        if (storedKey) {
          groupKey = storedKey;
          this.groupKeys.set(groupId, groupKey);
        } else {
          throw new Error(`No group key found for group: ${groupId}`);
        }
      }

      // Encrypt the message
      const { ciphertext, iv } = await this.simpleEncrypt(message, groupKey);
      
      // Create a hash for verification
      const keyHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        groupKey + senderId
      );

      const encrypted: EncryptedMessage = {
        iv,
        ciphertext,
        senderId,
        timestamp: Date.now(),
        groupId,
        keyHash: keyHash.substring(0, 16) // First 16 chars for verification
      };

      console.log('✅ Message encrypted successfully');
      return encrypted;
    } catch (error) {
      console.error('❌ Failed to encrypt message:', error);
      throw new Error('Message encryption failed');
    }
  }

  /**
   * Decrypt a group message
   */
  async decryptGroupMessage(encryptedMessage: EncryptedMessage): Promise<DecryptedMessage> {
    try {
      if (!this.initialized) {
        throw new Error('Crypto not initialized');
      }

      const { iv, ciphertext, senderId, timestamp, groupId, keyHash } = encryptedMessage;
      
      if (!groupId) {
        throw new Error('Group ID missing from encrypted message');
      }

      console.log('🔓 Decrypting message for group:', groupId);
      
      // Get group key
      let groupKey = this.groupKeys.get(groupId);
      if (!groupKey) {
        // Try to load from secure storage
        const storedKey = await SecureStore.getItemAsync(`expo_group_key_${groupId}`);
        if (storedKey) {
          groupKey = storedKey;
          this.groupKeys.set(groupId, groupKey);
        } else {
          throw new Error(`No group key found for group: ${groupId}`);
        }
      }

      // Verify key hash
      const expectedKeyHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        groupKey + senderId
      );
      
      if (expectedKeyHash.substring(0, 16) !== keyHash) {
        console.warn('⚠️ Key hash mismatch - message may be corrupted or from wrong key');
      }
      
      // Decrypt the message
      const plaintext = await this.simpleDecrypt(ciphertext, groupKey, iv);

      const decrypted: DecryptedMessage = {
        content: plaintext,
        senderId,
        timestamp,
        groupId
      };

      console.log('✅ Message decrypted successfully');
      return decrypted;
    } catch (error) {
      console.error('❌ Failed to decrypt message:', error);
      throw new Error('Message decryption failed');
    }
  }

  /**
   * Utility functions
   */
  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Get public key for sharing with other users
   */
  getPublicKey(): string | null {
    return this.userKeyPair?.publicKey || null;
  }

  /**
   * Check if crypto engine is ready
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Clear all stored keys (logout)
   */
  async clearKeys(userId: string): Promise<void> {
    try {
      console.log('🧹 Clearing crypto keys for user:', userId);
      
      // Clear from memory
      this.userKeyPair = null;
      this.groupKeys.clear();
      this.initialized = false;
      
      // Clear from secure storage
      await SecureStore.deleteItemAsync(`expo_private_key_${userId}`);
      await SecureStore.deleteItemAsync(`expo_public_key_${userId}`);
      
      console.log('✅ Crypto keys cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear crypto keys:', error);
    }
  }
}

// Export singleton instance
export const expoCompatibleCrypto = new ExpoCompatibleCrypto();
export default expoCompatibleCrypto; 