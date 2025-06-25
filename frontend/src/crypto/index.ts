// Pure TypeScript Signal Protocol Implementation using Noble Cryptography
// Modular architecture for better maintainability

import { NobleSignalProtocol } from './protocol';

console.log('🔑 [NOBLE-SIGNAL] Loading modular Signal Protocol implementation...');

// ========================= PUBLIC API =========================

export class CryptoAPI {
  static async initialize(): Promise<void> {
    await NobleSignalProtocol.initialize();
  }

  static async startSession(userId: string, remoteDeviceInfo: any): Promise<void> {
    console.log('🔑 [CRYPTO-API] 1:1 sessions available in full implementation');
  }

  static async sendMessage(userId: string, message: string): Promise<any> {
    throw new Error('Use sendGroupMessage for group communication');
  }

  static async receiveMessage(userId: string, encryptedMessage: any): Promise<string> {
    throw new Error('Use receiveGroupMessage for group communication');
  }

  static async createGroup(groupId: string, myUserId: string): Promise<void> {
    await NobleSignalProtocol.createGroup(groupId, myUserId);
  }

  static async sendGroupMessage(groupId: string, message: string): Promise<any> {
    return await NobleSignalProtocol.sendGroupMessage(groupId, message);
  }

  static async receiveGroupMessage(groupId: string, encryptedMessage: any): Promise<string> {
    return await NobleSignalProtocol.receiveGroupMessage(groupId, encryptedMessage);
  }

  static async addGroupMember(groupId: string, memberBundle: any): Promise<void> {
    await NobleSignalProtocol.addGroupMember(groupId, memberBundle);
  }

  static async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await NobleSignalProtocol.removeGroupMember(groupId, userId);
  }

  static getDeviceInfo(): any {
    return NobleSignalProtocol.getDeviceInfo();
  }

  static async getSenderKeyBundle(groupId: string): Promise<any> {
    return await NobleSignalProtocol.getSenderKeyBundle(groupId);
  }

  static async clearAll(): Promise<void> {
    await NobleSignalProtocol.clearAll();
  }

  // Additional utility methods
  static getIdentityFingerprint(): string {
    return NobleSignalProtocol.getIdentityFingerprint();
  }

  static verifyIdentity(publicKey: Uint8Array, expectedFingerprint: string): boolean {
    return NobleSignalProtocol.verifyIdentity(publicKey, expectedFingerprint);
  }

  static async resetGroupSession(groupId: string, userId: string): Promise<void> {
    await NobleSignalProtocol.resetGroupSession(groupId, userId);
  }

  static getActiveGroups(): string[] {
    return NobleSignalProtocol.getActiveGroups();
  }
}

// Re-export types for external use
export type {
  KeyPair,
  IdentityKeys,
  MessageKeys,
  ChainKey,
  SenderKeyState,
  GroupMessage,
  EncryptedMessage,
  DecryptedMessage,
  DeviceInfo,
  SenderKeyBundle
} from './types';

// Re-export classes for advanced usage
export { NobleSignalProtocol } from './protocol';
export { NobleSignalCrypto } from './noble-crypto';
export { SenderKeySession } from './sender-key';

console.log('🔑 [NOBLE-SIGNAL] Modular implementation loaded successfully'); 