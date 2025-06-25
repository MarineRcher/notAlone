// Signal Protocol Secure Storage - Simplified Version

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoredSession, StoredGroupSession, IdentityKeyPair } from './types';

const STORAGE_KEYS = {
  IDENTITY_KEY: 'signal_identity_key',
  SESSIONS: 'signal_sessions',
  GROUP_SESSIONS: 'signal_group_sessions',
  REGISTRATION_ID: 'signal_registration_id',
};

class SignalStorage {
  private isInitialized = false;

  /**
   * Initialize storage (simplified version)
   */
  async initialize(password?: string): Promise<void> {
    try {
      // Simple initialization without complex encryption for now
      this.isInitialized = true;
      console.log('✅ Storage initialized successfully');
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      throw new Error('Storage initialization failed');
    }
  }

  /**
   * Store identity key pair
   */
  async storeIdentityKeyPair(identityKey: IdentityKeyPair): Promise<void> {
    try {
      const serialized = JSON.stringify({
        keyId: identityKey.keyId,
        publicKey: this.arrayBufferToBase64(identityKey.publicKey),
        privateKey: this.arrayBufferToBase64(identityKey.privateKey),
      });
      
      await AsyncStorage.setItem(STORAGE_KEYS.IDENTITY_KEY, serialized);
    } catch (error) {
      console.error('Failed to store identity key pair:', error);
      throw error;
    }
  }

  /**
   * Load identity key pair
   */
  async loadIdentityKeyPair(): Promise<IdentityKeyPair | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.IDENTITY_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return {
        keyId: parsed.keyId,
        publicKey: this.base64ToArrayBuffer(parsed.publicKey),
        privateKey: this.base64ToArrayBuffer(parsed.privateKey),
      };
    } catch (error) {
      console.error('Failed to load identity key pair:', error);
      return null;
    }
  }

  /**
   * Store session
   */
  async storeSession(userId: string, session: StoredSession): Promise<void> {
    try {
      const sessions = await this.loadAllSessions();
      sessions.set(userId, session);
      
      const serialized = JSON.stringify(Array.from(sessions.entries()));
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, serialized);
    } catch (error) {
      console.error('Failed to store session:', error);
      throw error;
    }
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
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!stored) return new Map();

      const entries = JSON.parse(stored);
      return new Map(entries);
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
    
    const serialized = JSON.stringify(Array.from(sessions.entries()));
    await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, serialized);
  }

  /**
   * Store group session
   */
  async storeGroupSession(groupId: string, groupSession: StoredGroupSession): Promise<void> {
    try {
      const groupSessions = await this.loadAllGroupSessions();
      groupSessions.set(groupId, groupSession);
      
      const serialized = JSON.stringify(Array.from(groupSessions.entries()));
      await AsyncStorage.setItem(STORAGE_KEYS.GROUP_SESSIONS, serialized);
    } catch (error) {
      console.error('Failed to store group session:', error);
      throw error;
    }
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
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.GROUP_SESSIONS);
      if (!stored) return new Map();

      const entries = JSON.parse(stored);
      return new Map(entries);
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
    const keys = Object.values(STORAGE_KEYS);
    await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
    this.isInitialized = false;
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Export singleton instance
export const signalStorage = new SignalStorage(); 