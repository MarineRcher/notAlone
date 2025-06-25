// Main Signal Protocol Implementation
// Coordinates group messaging, identity management, and key distribution

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NobleSignalCrypto } from './noble-crypto';
import { SenderKeySession } from './sender-key';
import type { IdentityKeys, DeviceInfo, SenderKeyBundle } from './types';

export class NobleSignalProtocol {
  private static initialized = false;
  private static identityKeys?: IdentityKeys;
  private static groupSessions = new Map<string, SenderKeySession>();
  private static senderKeys = new Map<string, Uint8Array>();

  static async initialize(): Promise<void> {
    console.log('🔑 [NOBLE-SIGNAL] Initializing Signal Protocol with Noble cryptography...');
    
    try {
      // Load or generate identity keys
      this.identityKeys = await this.getOrCreateIdentityKeys();
      this.initialized = true;
      
      console.log('🔑 [NOBLE-SIGNAL] ✅ Signal Protocol initialized successfully');
      console.log('🔑 [NOBLE-SIGNAL] Identity fingerprint:', 
        Array.from(this.identityKeys.identityKey.publicKey.slice(0, 8))
          .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
      );
    } catch (error) {
      console.error('🔑 [NOBLE-SIGNAL] ❌ Failed to initialize:', error);
      throw error;
    }
  }

  static async createGroup(groupId: string, userId: string): Promise<void> {
    if (!this.initialized) throw new Error('Protocol not initialized');
    
    console.log(`🔑 [NOBLE-SIGNAL] Creating group session for: ${groupId}`);
    
    try {
      let session = await SenderKeySession.load(groupId, userId);
      if (!session) {
        session = new SenderKeySession(groupId, userId);
      }
      
      this.groupSessions.set(groupId, session);
      console.log(`🔑 [NOBLE-SIGNAL] ✅ Group session ready for ${groupId}`);
    } catch (error) {
      console.error(`🔑 [NOBLE-SIGNAL] ❌ Failed to create group: ${error}`);
      throw error;
    }
  }

  static async sendGroupMessage(groupId: string, message: string): Promise<any> {
    if (!this.initialized) throw new Error('Protocol not initialized');
    
    const session = this.groupSessions.get(groupId);
    if (!session) throw new Error(`Group session not found for ${groupId}`);
    
    try {
      const groupMessage = await session.encryptMessage(message);
      
      // Convert to wire format (arrays for JSON serialization)
      return {
        messageId: groupMessage.messageId,
        timestamp: groupMessage.timestamp,
        groupId: groupMessage.groupId,
        senderId: groupMessage.senderId,
        encryptedPayload: Array.from(groupMessage.encryptedPayload),
        signature: Array.from(groupMessage.signature),
        keyIndex: groupMessage.keyIndex
      };
    } catch (error) {
      console.error(`🔑 [NOBLE-SIGNAL] ❌ Failed to encrypt group message: ${error}`);
      throw error;
    }
  }

  static async receiveGroupMessage(groupId: string, encryptedMessage: any): Promise<string> {
    if (!this.initialized) throw new Error('Protocol not initialized');
    
    try {
      // Get sender's public key for signature verification
      const senderPublicKey = this.senderKeys.get(encryptedMessage.senderId);
      if (!senderPublicKey) {
        console.warn(`🔑 [NOBLE-SIGNAL] ⚠️ No public key for sender ${encryptedMessage.senderId}, using dummy key`);
        // In production, this would be an error or we'd fetch the key
      }

      // Convert wire format back to typed message
      const groupMessage = {
        messageId: encryptedMessage.messageId,
        timestamp: encryptedMessage.timestamp,
        groupId: encryptedMessage.groupId,
        senderId: encryptedMessage.senderId,
        encryptedPayload: new Uint8Array(encryptedMessage.encryptedPayload),
        signature: new Uint8Array(encryptedMessage.signature),
        keyIndex: encryptedMessage.keyIndex
      };
      
      // Use a dummy session for decryption (simplified for demo)
      const tempSession = new SenderKeySession(groupId, 'temp');
      const dummyPublicKey = senderPublicKey || NobleSignalCrypto.randomBytes(32);
      
      return await tempSession.decryptMessage(groupMessage, dummyPublicKey);
    } catch (error) {
      console.error(`🔑 [NOBLE-SIGNAL] ❌ Failed to decrypt group message: ${error}`);
      throw error;
    }
  }

  static async addGroupMember(groupId: string, memberData: any): Promise<void> {
    if (!this.initialized) throw new Error('Protocol not initialized');
    
    try {
      // Store sender's public key for signature verification
      if (memberData.signingPublicKey) {
        this.senderKeys.set(memberData.userId, new Uint8Array(memberData.signingPublicKey));
        console.log(`🔑 [NOBLE-SIGNAL] Added member: ${memberData.userId} to group ${groupId}`);
      }
      
      // Update existing session with new member's bundle
      const session = this.groupSessions.get(groupId);
      if (session && memberData.chainKey) {
        session.updateFromBundle(memberData);
      }
    } catch (error) {
      console.error(`🔑 [NOBLE-SIGNAL] ❌ Failed to add group member: ${error}`);
      throw error;
    }
  }

  static async removeGroupMember(groupId: string, userId: string): Promise<void> {
    if (!this.initialized) throw new Error('Protocol not initialized');
    
    try {
      this.senderKeys.delete(userId);
      console.log(`🔑 [NOBLE-SIGNAL] Removed member: ${userId} from group ${groupId}`);
      
      // In a production implementation, we'd rotate the group key here
      // to ensure the removed member can't decrypt future messages
    } catch (error) {
      console.error(`🔑 [NOBLE-SIGNAL] ❌ Failed to remove group member: ${error}`);
      throw error;
    }
  }

  static async getSenderKeyBundle(groupId: string): Promise<SenderKeyBundle> {
    if (!this.initialized) throw new Error('Protocol not initialized');
    
    const session = this.groupSessions.get(groupId);
    if (!session) throw new Error(`Group session not found for ${groupId}`);
    
    return session.getSenderKeyBundle();
  }

  static getDeviceInfo(): DeviceInfo {
    if (!this.identityKeys) throw new Error('Protocol not initialized');
    
    return {
      deviceId: `noble-signal-${Date.now()}`,
      registrationId: this.identityKeys.registrationId,
      identityKey: Array.from(this.identityKeys.identityKey.publicKey),
      signedPreKey: Array.from(this.identityKeys.signedPreKey.publicKey),
      preKeys: this.identityKeys.preKeys.map(pk => Array.from(pk.publicKey))
    };
  }

  // Get identity key fingerprint for verification
  static getIdentityFingerprint(): string {
    if (!this.identityKeys) throw new Error('Protocol not initialized');
    
    return NobleSignalCrypto.toHex(this.identityKeys.identityKey.publicKey.slice(0, 16));
  }

  // Verify another user's identity key
  static verifyIdentity(publicKey: Uint8Array, expectedFingerprint: string): boolean {
    const fingerprint = NobleSignalCrypto.toHex(publicKey.slice(0, 16));
    return fingerprint.toLowerCase() === expectedFingerprint.toLowerCase();
  }

  // Reset a group session (useful for key rotation)
  static async resetGroupSession(groupId: string, userId: string): Promise<void> {
    if (!this.initialized) throw new Error('Protocol not initialized');
    
    try {
      // Delete old session
      await SenderKeySession.delete(groupId, userId);
      this.groupSessions.delete(groupId);
      
      // Create new session
      await this.createGroup(groupId, userId);
      console.log(`🔑 [NOBLE-SIGNAL] Reset group session for ${groupId}`);
    } catch (error) {
      console.error(`🔑 [NOBLE-SIGNAL] ❌ Failed to reset group session: ${error}`);
      throw error;
    }
  }

  // List all active group sessions
  static getActiveGroups(): string[] {
    return Array.from(this.groupSessions.keys());
  }

  static async clearAll(): Promise<void> {
    try {
      // Clear AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const signalKeys = keys.filter(key => 
        key.startsWith('noble-signal-') || key.startsWith('sender-key-')
      );
      await AsyncStorage.multiRemove(signalKeys);
      
      // Clear in-memory state
      this.groupSessions.clear();
      this.senderKeys.clear();
      this.identityKeys = undefined;
      this.initialized = false;
      
      console.log('🔑 [NOBLE-SIGNAL] Cleared all protocol data');
    } catch (error) {
      console.error('🔑 [NOBLE-SIGNAL] ❌ Failed to clear data:', error);
      throw error;
    }
  }

  private static async getOrCreateIdentityKeys(): Promise<IdentityKeys> {
    try {
      const stored = await AsyncStorage.getItem('noble-signal-identity');
      
      if (stored) {
        const data = JSON.parse(stored);
        console.log('🔑 [NOBLE-SIGNAL] Loading existing identity keys');
        return {
          identityKey: {
            privateKey: new Uint8Array(data.identityKey.privateKey),
            publicKey: new Uint8Array(data.identityKey.publicKey)
          },
          signedPreKey: {
            privateKey: new Uint8Array(data.signedPreKey.privateKey),
            publicKey: new Uint8Array(data.signedPreKey.publicKey)
          },
          preKeys: data.preKeys.map((pk: any) => ({
            privateKey: new Uint8Array(pk.privateKey),
            publicKey: new Uint8Array(pk.publicKey)
          })),
          registrationId: data.registrationId
        };
      }

      console.log('🔑 [NOBLE-SIGNAL] Generating new identity keys');
      
      // Generate fresh identity
      const identityKey = NobleSignalCrypto.generateKeyPair();
      const signedPreKey = NobleSignalCrypto.generateKeyPair();
      const preKeys = Array.from({ length: 10 }, () => NobleSignalCrypto.generateKeyPair());
      const registrationId = Math.floor(Math.random() * 16384);

      const identityKeys: IdentityKeys = {
        identityKey,
        signedPreKey,
        preKeys,
        registrationId
      };

      // Persist to storage
      const data = {
        identityKey: {
          privateKey: Array.from(identityKey.privateKey),
          publicKey: Array.from(identityKey.publicKey)
        },
        signedPreKey: {
          privateKey: Array.from(signedPreKey.privateKey),
          publicKey: Array.from(signedPreKey.publicKey)
        },
        preKeys: preKeys.map(pk => ({
          privateKey: Array.from(pk.privateKey),
          publicKey: Array.from(pk.publicKey)
        })),
        registrationId
      };

      await AsyncStorage.setItem('noble-signal-identity', JSON.stringify(data));
      console.log('🔑 [NOBLE-SIGNAL] Identity keys generated and saved');
      
      return identityKeys;
    } catch (error) {
      console.error('🔑 [NOBLE-SIGNAL] ❌ Failed to get/create identity keys:', error);
      throw error;
    }
  }
} 