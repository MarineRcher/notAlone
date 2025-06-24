// Signal Protocol Secure Storage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoredSession, StoredGroupSession, IdentityKeyPair, PreKeyBundle } from './types';
import { encrypt, decrypt, generateRandomBytes, hash } from './utils';

const STORAGE_KEYS = {
  IDENTITY_KEY: 'signal_identity_key',
  SESSIONS: 'signal_sessions',
  GROUP_SESSIONS: 'signal_group_sessions',
  PRE_KEYS: 'signal_pre_keys',
  SIGNED_PRE_KEY: 'signal_signed_pre_key',
  REGISTRATION_ID: 'signal_registration_id',
  STORAGE_KEY: 'signal_storage_key',
};

class SignalStorage {
  private storageKey: ArrayBuffer | null = null;
  private isInitialized = false;

  /**
   * Initialize storage with encryption key
   */
  async initialize(password?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Try to load existing storage key
      const existingKey = await AsyncStorage.getItem(STORAGE_KEYS.STORAGE_KEY);
      
      if (existingKey) {
        if (password) {
          // Derive key from password for existing storage
          this.storageKey = await this.deriveKeyFromPassword(password);
        } else {
          throw new Error('Password required for existing storage');
        }
      } else {
        // Generate new storage key
        this.storageKey = generateRandomBytes(32);
        
        if (password) {
          // Encrypt and store the storage key
          const derivedKey = await this.deriveKeyFromPassword(password);
          const encryptedStorageKey = await this.encryptData(this.storageKey, derivedKey);
          await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_KEY, this.arrayBufferToBase64(encryptedStorageKey));
        } else {
          // Store unencrypted (less secure but works without password)
          await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_KEY, this.arrayBufferToBase64(this.storageKey));
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw new Error('Storage initialization failed');
    }
  }

  /**
   * Derive encryption key from password
   */
  private async deriveKeyFromPassword(password: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Simple key derivation - in production, use PBKDF2 or Argon2
    return await hash(passwordBuffer);
  }

  /**
   * Encrypt data for storage
   */
  private async encryptData(data: ArrayBuffer, key?: ArrayBuffer): Promise<ArrayBuffer> {
    const encryptionKey = key || this.storageKey;
    if (!encryptionKey) throw new Error('No encryption key available');

    const iv = generateRandomBytes(12);
    const encrypted = await encrypt(data, encryptionKey, iv);
    
    // Prepend IV to encrypted data
    const result = new Uint8Array(iv.byteLength + encrypted.byteLength);
    result.set(new Uint8Array(iv), 0);
    result.set(new Uint8Array(encrypted), iv.byteLength);
    
    return result.buffer;
  }

  /**
   * Decrypt data from storage
   */
  private async decryptData(encryptedData: ArrayBuffer, key?: ArrayBuffer): Promise<ArrayBuffer> {
    const decryptionKey = key || this.storageKey;
    if (!decryptionKey) throw new Error('No decryption key available');

    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);
    
    return await decrypt(ciphertext, decryptionKey, iv);
  }

  /**
   * Store identity key pair
   */
  async storeIdentityKeyPair(identityKey: IdentityKeyPair): Promise<void> {
    await this.ensureInitialized();
    
    const serialized = this.serializeIdentityKeyPair(identityKey);
    const encrypted = await this.encryptData(serialized);
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.IDENTITY_KEY,
      this.arrayBufferToBase64(encrypted)
    );
  }

  /**
   * Load identity key pair
   */
  async loadIdentityKeyPair(): Promise<IdentityKeyPair | null> {
    await this.ensureInitialized();
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.IDENTITY_KEY);
      if (!stored) return null;

      const encrypted = this.base64ToArrayBuffer(stored);
      const decrypted = await this.decryptData(encrypted);
      
      return this.deserializeIdentityKeyPair(decrypted);
    } catch (error) {
      console.error('Failed to load identity key pair:', error);
		return null;
	}
}

  /**
   * Store session
   */
  async storeSession(userId: string, session: StoredSession): Promise<void> {
    await this.ensureInitialized();
    
    const sessions = await this.loadAllSessions();
    sessions.set(userId, session);
    
    const serialized = this.serializeSessions(sessions);
    const encrypted = await this.encryptData(serialized);
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.SESSIONS,
      this.arrayBufferToBase64(encrypted)
    );
  }

  /**
   * Load session
   */
  async loadSession(userId: string): Promise<StoredSession | null> {
    const sessions = await this.loadAllSessions();
    return sessions.get(userId) || null;
  }

  /**
   * Load all sessions
   */
  async loadAllSessions(): Promise<Map<string, StoredSession>> {
    await this.ensureInitialized();
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!stored) return new Map();

      const encrypted = this.base64ToArrayBuffer(stored);
      const decrypted = await this.decryptData(encrypted);
      
      return this.deserializeSessions(decrypted);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return new Map();
    }
  }

  /**
   * Delete session
   */
  async deleteSession(userId: string): Promise<void> {
    const sessions = await this.loadAllSessions();
    sessions.delete(userId);
    
    const serialized = this.serializeSessions(sessions);
    const encrypted = await this.encryptData(serialized);
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.SESSIONS,
      this.arrayBufferToBase64(encrypted)
    );
  }

  /**
   * Store group session
   */
  async storeGroupSession(groupId: string, groupSession: StoredGroupSession): Promise<void> {
    await this.ensureInitialized();
    
    const groupSessions = await this.loadAllGroupSessions();
    groupSessions.set(groupId, groupSession);
    
    const serialized = this.serializeGroupSessions(groupSessions);
    const encrypted = await this.encryptData(serialized);
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.GROUP_SESSIONS,
      this.arrayBufferToBase64(encrypted)
    );
  }

  /**
   * Load group session
   */
  async loadGroupSession(groupId: string): Promise<StoredGroupSession | null> {
    const groupSessions = await this.loadAllGroupSessions();
    return groupSessions.get(groupId) || null;
  }

  /**
   * Load all group sessions
   */
  async loadAllGroupSessions(): Promise<Map<string, StoredGroupSession>> {
    await this.ensureInitialized();
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.GROUP_SESSIONS);
      if (!stored) return new Map();

      const encrypted = this.base64ToArrayBuffer(stored);
      const decrypted = await this.decryptData(encrypted);
      
      return this.deserializeGroupSessions(decrypted);
    } catch (error) {
      console.error('Failed to load group sessions:', error);
      return new Map();
    }
  }

  /**
   * Store registration ID
   */
  async storeRegistrationId(registrationId: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.REGISTRATION_ID, registrationId.toString());
  }

  /**
   * Load registration ID
   */
  async loadRegistrationId(): Promise<number | null> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.REGISTRATION_ID);
    return stored ? parseInt(stored, 10) : null;
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.IDENTITY_KEY,
      STORAGE_KEYS.SESSIONS,
      STORAGE_KEYS.GROUP_SESSIONS,
      STORAGE_KEYS.PRE_KEYS,
      STORAGE_KEYS.SIGNED_PRE_KEY,
      STORAGE_KEYS.REGISTRATION_ID,
      STORAGE_KEYS.STORAGE_KEY,
    ]);
    
    this.storageKey = null;
    this.isInitialized = false;
  }

  // Serialization helpers
  private serializeIdentityKeyPair(identityKey: IdentityKeyPair): ArrayBuffer {
    const keyIdBytes = new TextEncoder().encode(identityKey.keyId);
    const keyIdLength = new Uint32Array([keyIdBytes.length]);
    const publicKeyLength = new Uint32Array([identityKey.publicKey.byteLength]);
    const privateKeyLength = new Uint32Array([identityKey.privateKey.byteLength]);

    const total = 12 + keyIdBytes.length + identityKey.publicKey.byteLength + identityKey.privateKey.byteLength;
    const result = new Uint8Array(total);
    let offset = 0;

    result.set(new Uint8Array(keyIdLength.buffer), offset);
    offset += 4;
    result.set(new Uint8Array(publicKeyLength.buffer), offset);
    offset += 4;
    result.set(new Uint8Array(privateKeyLength.buffer), offset);
    offset += 4;
    result.set(new Uint8Array(keyIdBytes), offset);
    offset += keyIdBytes.length;
    result.set(new Uint8Array(identityKey.publicKey), offset);
    offset += identityKey.publicKey.byteLength;
    result.set(new Uint8Array(identityKey.privateKey), offset);

    return result.buffer;
  }

  private deserializeIdentityKeyPair(data: ArrayBuffer): IdentityKeyPair {
    const view = new DataView(data);
    let offset = 0;

    const keyIdLength = view.getUint32(offset, true);
    offset += 4;
    const publicKeyLength = view.getUint32(offset, true);
    offset += 4;
    const privateKeyLength = view.getUint32(offset, true);
    offset += 4;

    const keyIdBytes = data.slice(offset, offset + keyIdLength);
    offset += keyIdLength;
    const publicKey = data.slice(offset, offset + publicKeyLength);
    offset += publicKeyLength;
    const privateKey = data.slice(offset, offset + privateKeyLength);

    return {
      keyId: new TextDecoder().decode(keyIdBytes),
      publicKey,
      privateKey,
    };
  }

  // Session serialization methods would be implemented similarly
  private serializeSessions(sessions: Map<string, StoredSession>): ArrayBuffer {
    const serialized = JSON.stringify(Array.from(sessions.entries()));
    return new TextEncoder().encode(serialized).buffer;
  }

  private deserializeSessions(data: ArrayBuffer): Map<string, StoredSession> {
    const json = new TextDecoder().decode(data);
    const entries = JSON.parse(json);
    return new Map(entries);
  }

  private serializeGroupSessions(sessions: Map<string, StoredGroupSession>): ArrayBuffer {
    const serialized = JSON.stringify(Array.from(sessions.entries()));
    return new TextEncoder().encode(serialized).buffer;
  }

  private deserializeGroupSessions(data: ArrayBuffer): Map<string, StoredGroupSession> {
    const json = new TextDecoder().decode(data);
    const entries = JSON.parse(json);
    return new Map(entries);
  }

  // Utility methods
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

export const signalStorage = new SignalStorage(); 