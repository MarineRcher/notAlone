// Signal Protocol Main Export

export { SignalProtocolManager, signalProtocol } from './signal-protocol';
export { DoubleRatchet } from './double-ratchet';
export { GroupProtocol } from './group-protocol';
export { signalStorage } from './storage';

// Key Exchange Algorithms
export { 
  DiffieHellmanKeyExchange,
  TripleDiffieHellman,
  KeyDerivation,
  DH,
  TripleDH,
  KDF
} from './key-exchange';

export * from './types';
export * from './utils';

// Import for internal use
import { signalProtocol } from './signal-protocol';

// Main API for easy integration
export class CryptoAPI {
  /**
   * Initialize the crypto system
   */
  static async initialize(password?: string): Promise<void> {
    await signalProtocol.initialize(password);
  }

  /**
   * Start 1:1 session
   */
  static async startSession(userId: string, remoteDeviceInfo: any): Promise<void> {
    await signalProtocol.startSession(userId, remoteDeviceInfo);
  }

  /**
   * Send encrypted message to user
   */
  static async sendMessage(userId: string, message: string): Promise<any> {
    return await signalProtocol.encryptMessage(userId, message);
  }

  /**
   * Decrypt received message
   */
  static async receiveMessage(userId: string, encryptedMessage: any): Promise<string> {
    return await signalProtocol.decryptMessage(userId, encryptedMessage);
  }

  /**
   * Create new group
   */
  static async createGroup(groupId: string, myUserId: string): Promise<void> {
    await signalProtocol.createGroup(groupId, myUserId);
  }

  /**
   * Send group message
   */
  static async sendGroupMessage(groupId: string, message: string): Promise<any> {
    return await signalProtocol.encryptGroupMessage(groupId, message);
  }

  /**
   * Decrypt group message
   */
  static async receiveGroupMessage(groupId: string, encryptedMessage: any): Promise<string> {
    return await signalProtocol.decryptGroupMessage(groupId, encryptedMessage);
  }

  /**
   * Add member to group
   */
  static async addGroupMember(groupId: string, memberBundle: any): Promise<void> {
    await signalProtocol.addGroupMember(groupId, memberBundle);
  }

  /**
   * Remove member from group
   */
  static async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await signalProtocol.removeGroupMember(groupId, userId);
  }

  /**
   * Get device info for key exchange
   */
  static getDeviceInfo(): any {
    return signalProtocol.getDeviceInfo();
  }

  /**
   * Get sender key bundle for group
   */
  static async getSenderKeyBundle(groupId: string): Promise<any> {
    return await signalProtocol.getSenderKeyBundle(groupId);
  }

  /**
   * Clear all crypto data
   */
  static async clearAll(): Promise<void> {
    await signalProtocol.clearAll();
  }
} 