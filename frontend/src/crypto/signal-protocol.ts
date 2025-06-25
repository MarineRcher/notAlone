// Main Signal Protocol Manager

import { DoubleRatchet } from './double-ratchet';
import { GroupProtocol } from './group-protocol';
import { signalStorage } from './storage';
import {
  SessionState,
  GroupSessionState,
  StoredSession,
  StoredGroupSession,
  IdentityKeyPair,
  PreKeyBundle,
  SignalMessage,
  GroupMessage,
  DeviceInfo,
  SignalError,
  NoSessionError,
  KeyPair,
} from './types';
import {
  generateKeyPair,
  generateSigningKeyPair,
  exportKey,
  generateRandomBytes,
} from './utils';

export class SignalProtocolManager {
  private identityKey: IdentityKeyPair | null = null;
  private registrationId: number | null = null;
  private sessions: Map<string, DoubleRatchet> = new Map();
  private groupSessions: Map<string, GroupProtocol> = new Map();

  /**
   * Initialize the Signal protocol
   */
  async initialize(password?: string): Promise<void> {
    await signalStorage.initialize(password);
    
    // Load or generate identity key
    this.identityKey = await signalStorage.loadIdentityKeyPair();
    if (!this.identityKey) {
      this.generateIdentityKey();
    }

    // Load or generate registration ID
    this.registrationId = await signalStorage.loadRegistrationId();
    if (!this.registrationId) {
      this.registrationId = Math.floor(Math.random() * 16384) + 1;
      await signalStorage.storeRegistrationId(this.registrationId);
    }

    // Load existing sessions
    await this.loadExistingSessions();
  }

  /**
   * Generate new identity key
   */
  private generateIdentityKey(): void {
    console.log(`🔑 [DEVICE IDENTITY] ===== GENERATING DEVICE IDENTITY KEY =====`);
    const keyPair = generateKeyPair();
    
    const deviceId = this.generateUUID();
    console.log(`🔑 [DEVICE IDENTITY] Device ID: ${deviceId}`);
    
    this.identityKey = {
      keyId: deviceId,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };

    const publicKeyPreview = Array.from(new Uint8Array(keyPair.publicKey).slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
    
    console.log(`🔑 [DEVICE IDENTITY] ✅ Identity key created for device ${deviceId}`);
    console.log(`🔑 [DEVICE IDENTITY] Public key preview: ${publicKeyPreview}`);
    console.log(`🔑 [DEVICE IDENTITY] Storing to persistent storage...`);

    signalStorage.storeIdentityKeyPair(this.identityKey);
    console.log(`🔑 [DEVICE IDENTITY] ✅ Identity key stored to storage`);
    console.log(`🔑 [DEVICE IDENTITY] ===== DEVICE IDENTITY SETUP COMPLETE =====`);
  }

  /**
   * Generate a simple UUID (for environments without crypto.randomUUID)
   */
  private generateUUID(): string {
    const bytes = new Uint8Array(generateRandomBytes(16));
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  /**
   * Load existing sessions from storage
   */
  private async loadExistingSessions(): Promise<void> {
    const sessions = await signalStorage.loadAllSessions();
    for (const [userId, storedSession] of sessions) {
      const ratchet = new DoubleRatchet(storedSession.sessionState);
      this.sessions.set(userId, ratchet);
    }

    const groupSessions = await signalStorage.loadAllGroupSessions();
    for (const [groupId, storedGroupSession] of groupSessions) {
      const groupProtocol = new GroupProtocol(storedGroupSession.groupState);
      this.groupSessions.set(groupId, groupProtocol);
    }
  }

  /**
   * Get device info for key exchange
   */
  getDeviceInfo(): DeviceInfo {
    if (!this.identityKey || !this.registrationId) {
      throw new SignalError('Protocol not initialized', 'NOT_INITIALIZED');
    }

    console.log(`🔑 [DEVICE INFO] ===== GENERATING DEVICE INFO FOR KEY EXCHANGE =====`);
    console.log(`🔑 [DEVICE INFO] Device ID: ${this.identityKey.keyId}`);
    console.log(`🔑 [DEVICE INFO] Registration ID: ${this.registrationId}`);

    // Generate pre-keys (simplified - in practice you'd generate many)
    console.log(`🔑 [DEVICE INFO] Generating one-time pre-key...`);
    const preKeyPair = generateKeyPair();
    
    console.log(`🔑 [DEVICE INFO] Generating signed pre-key...`);
    const signedPreKeyPair = generateKeyPair();
    
    console.log(`🔑 [DEVICE INFO] Generating signing key for pre-key signature...`);
    const signingKey = generateSigningKeyPair();

    const preKeyBundle: PreKeyBundle = {
      identityKey: this.identityKey.publicKey,
      signedPreKey: {
        publicKey: signedPreKeyPair.publicKey,
        signature: new ArrayBuffer(64), // Would be actual signature
        keyId: 1,
      },
      preKey: {
        publicKey: preKeyPair.publicKey,
        keyId: 1,
      },
    };

    const deviceInfo = {
      deviceId: this.identityKey.keyId,
      registrationId: this.registrationId,
      identityKey: this.identityKey.publicKey,
      preKeys: [preKeyBundle],
    };

    console.log(`🔑 [DEVICE INFO] ✅ Device info bundle created with ${deviceInfo.preKeys.length} pre-key(s)`);
    console.log(`🔑 [DEVICE INFO] ===== DEVICE INFO READY FOR EXCHANGE =====`);

    return deviceInfo;
  }

  /**
   * Start a new session with a user
   */
  async startSession(
    userId: string,
    remoteDeviceInfo: DeviceInfo,
    isInitiator: boolean = true
  ): Promise<void> {
    if (!this.identityKey) {
      throw new SignalError('Protocol not initialized', 'NOT_INITIALIZED');
    }

    const preKeyBundle = remoteDeviceInfo.preKeys[0];
    
    let ratchet: DoubleRatchet;

    if (isInitiator) {
      // We're starting the conversation
      ratchet = await DoubleRatchet.initializeAsSender(
        this.identityKey,
        remoteDeviceInfo.identityKey,
        preKeyBundle.signedPreKey.publicKey
      );
    } else {
      // We're responding to an initial message
      throw new SignalError('Receiver initialization requires initial message', 'INVALID_OPERATION');
    }

    this.sessions.set(userId, ratchet);
    
    // Store session
    const storedSession: StoredSession = {
      userId,
      sessionState: ratchet.getSessionState(),
      lastActivity: Date.now(),
    };
    
    await signalStorage.storeSession(userId, storedSession);
  }

  /**
   * Process initial message from new contact
   */
  async processInitialMessage(
    userId: string,
    initialMessage: SignalMessage,
    remoteIdentityKey: ArrayBuffer
  ): Promise<string> {
    if (!this.identityKey) {
      throw new SignalError('Protocol not initialized', 'NOT_INITIALIZED');
    }

    // For simplicity, we'll need the local signed pre-key
    // In practice, this would be retrieved based on the message
    const localSignedPreKey = generateKeyPair();

    const ratchet = await DoubleRatchet.initializeAsReceiver(
      this.identityKey,
      localSignedPreKey,
      remoteIdentityKey,
      initialMessage
    );

    this.sessions.set(userId, ratchet);
    
    // Store session
    const storedSession: StoredSession = {
      userId,
      sessionState: ratchet.getSessionState(),
      lastActivity: Date.now(),
    };
    
    await signalStorage.storeSession(userId, storedSession);

    // Decrypt the initial message
    return await this.decryptMessage(userId, initialMessage);
  }

  /**
   * Encrypt a message for a user
   */
  async encryptMessage(userId: string, plaintext: string): Promise<SignalMessage> {
    const session = this.sessions.get(userId);
    if (!session) {
      throw new NoSessionError(`No session exists for user ${userId}`);
    }

    const plaintextBytes = new TextEncoder().encode(plaintext);
    const plaintextBuffer = plaintextBytes.buffer.slice(plaintextBytes.byteOffset, plaintextBytes.byteOffset + plaintextBytes.byteLength);
    const signalMessage = await session.encryptMessage(plaintextBuffer);

    // Update stored session
    await this.updateStoredSession(userId, session);

    return signalMessage;
  }

  /**
   * Decrypt a message from a user
   */
  async decryptMessage(userId: string, signalMessage: SignalMessage): Promise<string> {
    const session = this.sessions.get(userId);
    if (!session) {
      throw new NoSessionError(`No session exists for user ${userId}`);
    }

    const decryptedBuffer = await session.decryptMessage(signalMessage);
    
    // Update stored session
    await this.updateStoredSession(userId, session);

    return new TextDecoder().decode(decryptedBuffer);
  }

  /**
   * Create a new group
   */
  async createGroup(groupId: string, myUserId: string): Promise<void> {
    const groupProtocol = await GroupProtocol.createGroup(groupId, myUserId);
    this.groupSessions.set(groupId, groupProtocol);

    // Store group session
    const storedGroupSession: StoredGroupSession = {
      groupId,
      groupState: groupProtocol.getGroupState(),
      lastActivity: Date.now(),
    };

    await signalStorage.storeGroupSession(groupId, storedGroupSession);
  }

  /**
   * Join an existing group
   */
  async joinGroup(
    groupId: string,
    myUserId: string,
    memberBundles: Array<{
      userId: string;
      signingKey: ArrayBuffer;
      chainKey: ArrayBuffer;
      counter: number;
    }>
  ): Promise<void> {
    const groupProtocol = await GroupProtocol.createGroup(groupId, myUserId);
    
    // Add all existing members
    for (const bundle of memberBundles) {
      await groupProtocol.processSenderKeyBundle(bundle);
    }

    this.groupSessions.set(groupId, groupProtocol);

    // Store group session
    const storedGroupSession: StoredGroupSession = {
      groupId,
      groupState: groupProtocol.getGroupState(),
      lastActivity: Date.now(),
    };

    await signalStorage.storeGroupSession(groupId, storedGroupSession);
  }

  /**
   * Add a member to a group
   */
  async addGroupMember(
    groupId: string,
    memberBundle: {
      userId: string;
      signingKey: ArrayBuffer;
      chainKey: ArrayBuffer;
      counter: number;
    }
  ): Promise<void> {
    const groupSession = this.groupSessions.get(groupId);
    if (!groupSession) {
      throw new SignalError(`No group session for ${groupId}`, 'NO_GROUP_SESSION');
    }

    await groupSession.processSenderKeyBundle(memberBundle);
    await this.updateStoredGroupSession(groupId, groupSession);
  }

  /**
   * Remove a member from a group
   */
  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    const groupSession = this.groupSessions.get(groupId);
    if (!groupSession) {
      throw new SignalError(`No group session for ${groupId}`, 'NO_GROUP_SESSION');
    }

    groupSession.removeMember(userId);
    await this.updateStoredGroupSession(groupId, groupSession);
  }

  /**
   * Encrypt a message for a group
   */
  async encryptGroupMessage(groupId: string, plaintext: string): Promise<GroupMessage> {
    const groupSession = this.groupSessions.get(groupId);
    if (!groupSession) {
      throw new SignalError(`No group session for ${groupId}`, 'NO_GROUP_SESSION');
    }

    const groupMessage = await groupSession.encryptGroupMessage(plaintext);
    await this.updateStoredGroupSession(groupId, groupSession);

    return groupMessage;
  }

  /**
   * Decrypt a group message
   */
  async decryptGroupMessage(groupId: string, groupMessage: GroupMessage): Promise<string> {
    const groupSession = this.groupSessions.get(groupId);
    if (!groupSession) {
      throw new SignalError(`No group session for ${groupId}`, 'NO_GROUP_SESSION');
    }

    const plaintext = await groupSession.decryptGroupMessage(groupMessage);
    await this.updateStoredGroupSession(groupId, groupSession);

    return plaintext;
  }

  /**
   * Get sender key bundle for sharing
   */
  async getSenderKeyBundle(groupId: string): Promise<{
    userId: string;
    signingKey: ArrayBuffer;
    chainKey: ArrayBuffer;
    counter: number;
  }> {
    const groupSession = this.groupSessions.get(groupId);
    if (!groupSession) {
      throw new SignalError(`No group session for ${groupId}`, 'NO_GROUP_SESSION');
    }

    return await groupSession.getSenderKeyBundle();
  }

  /**
   * Update stored session
   */
  private async updateStoredSession(userId: string, session: DoubleRatchet): Promise<void> {
    const storedSession: StoredSession = {
      userId,
      sessionState: session.getSessionState(),
      lastActivity: Date.now(),
    };
    
    await signalStorage.storeSession(userId, storedSession);
  }

  /**
   * Update stored group session
   */
  private async updateStoredGroupSession(groupId: string, groupSession: GroupProtocol): Promise<void> {
    const storedGroupSession: StoredGroupSession = {
      groupId,
      groupState: groupSession.getGroupState(),
      lastActivity: Date.now(),
    };
    
    await signalStorage.storeGroupSession(groupId, storedGroupSession);
  }

  /**
   * Clear all sessions and data
   */
  async clearAll(): Promise<void> {
    this.identityKey = null;
    this.registrationId = null;
    this.sessions.clear();
    this.groupSessions.clear();
    
    await signalStorage.clearAll();
  }

  /**
   * Get identity key (for debugging/testing)
   */
  getIdentityKey(): IdentityKeyPair | null {
    return this.identityKey;
  }

  /**
   * Get registration ID (for debugging/testing)
   */
  getRegistrationId(): number | null {
    return this.registrationId;
  }
}

// Export singleton instance
export const signalProtocol = new SignalProtocolManager(); 