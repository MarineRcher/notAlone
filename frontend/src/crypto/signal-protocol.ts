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
      await this.generateIdentityKey();
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
  private async generateIdentityKey(): Promise<void> {
    const keyPair = await generateKeyPair();
    
    this.identityKey = {
      keyId: crypto.randomUUID(),
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };

    await signalStorage.storeIdentityKeyPair(this.identityKey);
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
  async getDeviceInfo(): Promise<DeviceInfo> {
    if (!this.identityKey || !this.registrationId) {
      throw new SignalError('Protocol not initialized', 'NOT_INITIALIZED');
    }

    // Generate pre-keys (simplified - in practice you'd generate many)
    const preKeyPair = await generateKeyPair();
    const signedPreKeyPair = await generateKeyPair();
    const signingKey = await generateSigningKeyPair();

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

    return {
      deviceId: this.identityKey.keyId,
      registrationId: this.registrationId,
      identityKey: this.identityKey.publicKey,
      preKeys: [preKeyBundle],
    };
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
    const localSignedPreKey = await generateKeyPair();

    const ratchet = await DoubleRatchet.initializeAsReceiver(
      this.identityKey,
      {
        publicKey: localSignedPreKey.publicKey,
        privateKey: localSignedPreKey.privateKey,
      },
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

    const plaintextBuffer = new TextEncoder().encode(plaintext);
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
    
    // Process all member bundles
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
   * Add member to group
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
   * Remove member from group
   */
  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    const groupSession = this.groupSessions.get(groupId);
    if (!groupSession) {
      throw new SignalError(`No group session for ${groupId}`, 'NO_GROUP_SESSION');
    }

    await groupSession.handleMemberLeave(userId);
    await this.updateStoredGroupSession(groupId, groupSession);
  }

  /**
   * Encrypt message for group
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
   * Decrypt group message
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
    this.sessions.clear();
    this.groupSessions.clear();
    this.identityKey = null;
    this.registrationId = null;
    
    await signalStorage.clearAll();
  }

  /**
   * Get identity key
   */
  getIdentityKey(): IdentityKeyPair | null {
    return this.identityKey;
  }

  /**
   * Get registration ID
   */
  getRegistrationId(): number | null {
    return this.registrationId;
  }
}

// Export singleton instance
export const signalProtocol = new SignalProtocolManager(); 