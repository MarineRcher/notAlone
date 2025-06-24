// Signal Protocol Group Messaging Implementation

import {
  GroupSessionState,
  SenderKeyState,
  GroupMessage,
  ChainKey,
  MessageKeys,
  SignalError,
  KeyPair,
} from './types';
import {
  generateKeyPair,
  generateSigningKeyPair,
  deriveKeys,
  deriveMessageKeys,
  encrypt,
  decrypt,
  signWithEd25519,
  verifyEd25519Signature,
  exportKey,
  importKey,
  generateRandomBytes,
  generateMessageId,
  concatArrayBuffers,
  CRYPTO_CONFIG,
} from './utils';

export class GroupProtocol {
  private groupState: GroupSessionState;

  constructor(groupState: GroupSessionState) {
    this.groupState = groupState;
  }

  /**
   * Create a new group session
   */
  static async createGroup(groupId: string, myUserId: string): Promise<GroupProtocol> {
    const groupState: GroupSessionState = {
      groupId,
      members: new Map(),
      senderKeys: new Map(),
      myUserId,
    };

    const groupProtocol = new GroupProtocol(groupState);
    await groupProtocol.initializeSenderKey();
    
    return groupProtocol;
  }

  /**
   * Initialize sender key for this user
   */
  async initializeSenderKey(): Promise<void> {
    const chainKey: ChainKey = {
      key: generateRandomBytes(32),
      counter: 0,
    };

    const signingKeyPair = await generateSigningKeyPair();
    
    const senderKeyState: SenderKeyState = {
      sendingChain: chainKey,
      signingKey: {
        publicKey: await exportKey(signingKeyPair.publicKey),
        privateKey: await exportKey(signingKeyPair.privateKey),
      },
      chainKeyHistory: [],
    };

    this.groupState.senderKeys.set(this.groupState.myUserId, senderKeyState);
  }

  /**
   * Add a member to the group
   */
  async addMember(userId: string, senderKeyState: SenderKeyState): Promise<void> {
    this.groupState.senderKeys.set(userId, senderKeyState);
  }

  /**
   * Remove a member from the group
   */
  removeMember(userId: string): void {
    this.groupState.senderKeys.delete(userId);
    this.groupState.members.delete(userId);
  }

  /**
   * Encrypt a message for the group
   */
  async encryptGroupMessage(plaintext: string): Promise<GroupMessage> {
    const mySenderKey = this.groupState.senderKeys.get(this.groupState.myUserId);
    if (!mySenderKey) {
      throw new SignalError('No sender key for current user', 'NO_SENDER_KEY');
    }

    // Derive message keys from current chain key
    const { nextChainKey, messageKey } = await deriveKeys(mySenderKey.sendingChain.key);
    const messageKeys = await deriveMessageKeys(messageKey);

    // Encrypt the message
    const plaintextBuffer = new TextEncoder().encode(plaintext);
    const ciphertext = await encrypt(plaintextBuffer, messageKeys.cipherKey, messageKeys.iv);

    // Create message header
    const header = this.createGroupMessageHeader(
      mySenderKey.sendingChain.counter,
      this.groupState.myUserId
    );

    // Create complete message payload
    const messagePayload = concatArrayBuffers(header, ciphertext);

    // Sign the message
    const signingKey = await importKey(
      mySenderKey.signingKey.privateKey,
      'Ed25519',
      ['sign']
    );
    const signature = await signWithEd25519(messagePayload, signingKey);

    // Update sender key state
    mySenderKey.sendingChain = {
      key: nextChainKey,
      counter: mySenderKey.sendingChain.counter + 1,
    };

    // Add to history for forward secrecy
    mySenderKey.chainKeyHistory.push({
      chainKey: {
        key: messageKey,
        counter: mySenderKey.sendingChain.counter - 1,
      },
      signingKey: mySenderKey.signingKey.publicKey,
    });

    // Limit history size
    if (mySenderKey.chainKeyHistory.length > CRYPTO_CONFIG.maxChainKeyHistory) {
      mySenderKey.chainKeyHistory.shift();
    }

    return {
      groupId: this.groupState.groupId,
      senderId: this.groupState.myUserId,
      messageId: generateMessageId(),
      timestamp: Date.now(),
      encryptedPayload: messagePayload,
      signature,
      keyVersion: mySenderKey.sendingChain.counter - 1,
    };
  }

  /**
   * Decrypt a group message
   */
  async decryptGroupMessage(groupMessage: GroupMessage): Promise<string> {
    const senderKey = this.groupState.senderKeys.get(groupMessage.senderId);
    if (!senderKey) {
      throw new SignalError('No sender key for message sender', 'NO_SENDER_KEY');
    }

    // Parse message
    const { header, ciphertext } = this.parseGroupMessage(groupMessage.encryptedPayload);
    const messageCounter = this.extractCounterFromHeader(header);

    // Verify signature
    const signingKey = await importKey(
      senderKey.signingKey.publicKey,
      'Ed25519',
      ['verify']
    );
    
    const isValidSignature = await verifyEd25519Signature(
      groupMessage.signature,
      groupMessage.encryptedPayload,
      signingKey
    );

    if (!isValidSignature) {
      throw new SignalError('Invalid message signature', 'INVALID_SIGNATURE');
    }

    // Derive message keys
    const messageKeys = await this.deriveMessageKeysForCounter(
      senderKey,
      messageCounter
    );

    // Decrypt message
    const decryptedBuffer = await decrypt(
      ciphertext,
      messageKeys.cipherKey,
      messageKeys.iv
    );

    return new TextDecoder().decode(decryptedBuffer);
  }

  /**
   * Get sender key bundle for sharing with new members
   */
  async getSenderKeyBundle(): Promise<{
    userId: string;
    signingKey: ArrayBuffer;
    chainKey: ArrayBuffer;
    counter: number;
  }> {
    const mySenderKey = this.groupState.senderKeys.get(this.groupState.myUserId);
    if (!mySenderKey) {
      throw new SignalError('No sender key for current user', 'NO_SENDER_KEY');
    }

    return {
      userId: this.groupState.myUserId,
      signingKey: mySenderKey.signingKey.publicKey,
      chainKey: mySenderKey.sendingChain.key,
      counter: mySenderKey.sendingChain.counter,
    };
  }

  /**
   * Process received sender key bundle
   */
  async processSenderKeyBundle(bundle: {
    userId: string;
    signingKey: ArrayBuffer;
    chainKey: ArrayBuffer;
    counter: number;
  }): Promise<void> {
    const senderKeyState: SenderKeyState = {
      sendingChain: {
        key: bundle.chainKey,
        counter: bundle.counter,
      },
      signingKey: {
        publicKey: bundle.signingKey,
        privateKey: new ArrayBuffer(0), // We don't need their private key
      },
      chainKeyHistory: [],
    };

    this.groupState.senderKeys.set(bundle.userId, senderKeyState);
  }

  /**
   * Advance sender key for forward secrecy
   */
  async advanceSenderKey(): Promise<void> {
    const mySenderKey = this.groupState.senderKeys.get(this.groupState.myUserId);
    if (!mySenderKey) {
      throw new SignalError('No sender key for current user', 'NO_SENDER_KEY');
    }

    // Generate new signing key
    const newSigningKeyPair = await generateSigningKeyPair();
    
    // Generate new chain key
    const newChainKey: ChainKey = {
      key: generateRandomBytes(32),
      counter: 0,
    };

    // Store old key in history
    mySenderKey.chainKeyHistory.push({
      chainKey: mySenderKey.sendingChain,
      signingKey: mySenderKey.signingKey.publicKey,
    });

    // Update with new keys
    mySenderKey.sendingChain = newChainKey;
    mySenderKey.signingKey = {
      publicKey: await exportKey(newSigningKeyPair.publicKey),
      privateKey: await exportKey(newSigningKeyPair.privateKey),
    };

    // Limit history
    if (mySenderKey.chainKeyHistory.length > CRYPTO_CONFIG.maxChainKeyHistory) {
      mySenderKey.chainKeyHistory.shift();
    }
  }

  /**
   * Handle member leaving the group (forward secrecy)
   */
  async handleMemberLeave(userId: string): Promise<void> {
    // Remove the member
    this.removeMember(userId);
    
    // Advance our sender key to ensure forward secrecy
    await this.advanceSenderKey();
  }

  /**
   * Create group message header
   */
  private createGroupMessageHeader(counter: number, senderId: string): ArrayBuffer {
    const senderIdBytes = new TextEncoder().encode(senderId);
    const counterBytes = new Uint32Array([counter]);
    const senderIdLengthBytes = new Uint32Array([senderIdBytes.length]);
    
    return concatArrayBuffers(
      senderIdLengthBytes.buffer,
      senderIdBytes.buffer,
      counterBytes.buffer
    );
  }

  /**
   * Parse group message
   */
  private parseGroupMessage(payload: ArrayBuffer): {
    header: ArrayBuffer;
    ciphertext: ArrayBuffer;
  } {
    const view = new DataView(payload);
    const senderIdLength = view.getUint32(0, true);
    const headerLength = 4 + senderIdLength + 4; // length + senderId + counter
    
    return {
      header: payload.slice(0, headerLength),
      ciphertext: payload.slice(headerLength),
    };
  }

  /**
   * Extract counter from header
   */
  private extractCounterFromHeader(header: ArrayBuffer): number {
    const view = new DataView(header);
    const senderIdLength = view.getUint32(0, true);
    return view.getUint32(4 + senderIdLength, true);
  }

  /**
   * Derive message keys for specific counter
   */
  private async deriveMessageKeysForCounter(
    senderKey: SenderKeyState,
    targetCounter: number
  ): Promise<MessageKeys> {
    let currentChainKey = senderKey.sendingChain.key;
    let currentCounter = senderKey.sendingChain.counter;

    // If we need to go backwards, check history
    if (targetCounter < currentCounter) {
      for (const historyEntry of senderKey.chainKeyHistory) {
        if (historyEntry.chainKey.counter === targetCounter) {
          const { messageKey } = await deriveKeys(historyEntry.chainKey.key);
          return await deriveMessageKeys(messageKey);
        }
      }
      throw new SignalError('Message key not found in history', 'KEY_NOT_FOUND');
    }

    // Derive forward to target counter
    while (currentCounter < targetCounter) {
      const { nextChainKey } = await deriveKeys(currentChainKey);
      currentChainKey = nextChainKey;
      currentCounter++;
    }

    const { messageKey } = await deriveKeys(currentChainKey);
    return await deriveMessageKeys(messageKey);
  }

  /**
   * Get group state
   */
  getGroupState(): GroupSessionState {
    return this.groupState;
  }

  /**
   * Update group state
   */
  updateGroupState(newState: GroupSessionState): void {
    this.groupState = newState;
  }

  /**
   * Get all member IDs
   */
  getMemberIds(): string[] {
    return Array.from(this.groupState.senderKeys.keys());
  }

  /**
   * Check if user is member
   */
  isMember(userId: string): boolean {
    return this.groupState.senderKeys.has(userId);
  }
} 