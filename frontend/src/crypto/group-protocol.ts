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
    groupProtocol.initializeSenderKey();
    
    return groupProtocol;
  }

  /**
   * Initialize sender key for this user
   */
  initializeSenderKey(): void {
    console.log(`🔑 [GROUP SENDER KEY] ===== INITIALIZING SENDER KEY =====`);
    console.log(`🔑 [GROUP SENDER KEY] User ID: ${this.groupState.myUserId}`);
    console.log(`🔑 [GROUP SENDER KEY] Group ID: ${this.groupState.groupId}`);
    
    console.log(`🔑 [GROUP SENDER KEY] Generating chain key...`);
    const chainKey: ChainKey = {
      key: generateRandomBytes(32),
      counter: 0,
    };

    const chainKeyPreview = Array.from(new Uint8Array(chainKey.key).slice(0, 4))
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
    console.log(`🔑 [GROUP SENDER KEY] ✅ Chain key generated - Preview: ${chainKeyPreview}, Counter: ${chainKey.counter}`);

    console.log(`🔑 [GROUP SENDER KEY] Generating signing key pair...`);
    const signingKeyPair = generateSigningKeyPair();
    
    const senderKeyState: SenderKeyState = {
      sendingChain: chainKey,
      signingKey: {
        publicKey: signingKeyPair.publicKey,
        privateKey: signingKeyPair.privateKey,
      },
      chainKeyHistory: [],
    };

    this.groupState.senderKeys.set(this.groupState.myUserId, senderKeyState);
    console.log(`🔑 [GROUP SENDER KEY] ✅ Sender key state created and stored`);
    console.log(`🔑 [GROUP SENDER KEY] ===== SENDER KEY INITIALIZATION COMPLETE =====`);
  }

  /**
   * Add a member to the group
   */
  addMember(userId: string, senderKeyState: SenderKeyState): void {
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
    const { nextChainKey, messageKey } = deriveKeys(mySenderKey.sendingChain.key);
    const messageKeys = deriveMessageKeys(messageKey);

    // Encrypt the message
    const plaintextBytes = new TextEncoder().encode(plaintext);
    const plaintextBuffer = plaintextBytes.buffer.slice(plaintextBytes.byteOffset, plaintextBytes.byteOffset + plaintextBytes.byteLength);
    const ciphertext = encrypt(plaintextBuffer, messageKeys.cipherKey, messageKeys.iv);

    // Create message header
    const header = this.createGroupMessageHeader(
      mySenderKey.sendingChain.counter,
      this.groupState.myUserId
    );

    // Create complete message payload
    const messagePayload = concatArrayBuffers(header, ciphertext);

    // Sign the message
    const signature = signWithEd25519(messagePayload, mySenderKey.signingKey.privateKey);

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
    const isValidSignature = verifyEd25519Signature(
      groupMessage.signature,
      groupMessage.encryptedPayload,
      senderKey.signingKey.publicKey
    );

    if (!isValidSignature) {
      throw new SignalError('Invalid message signature', 'INVALID_SIGNATURE');
    }

    // Derive message keys
    const messageKeys = this.deriveMessageKeysForCounter(
      senderKey,
      messageCounter
    );

    // Decrypt message
    const decryptedBuffer = decrypt(
      ciphertext,
      messageKeys.cipherKey,
      messageKeys.iv
    );

    return new TextDecoder().decode(decryptedBuffer);
  }

  /**
   * Get sender key bundle for sharing with new members
   */
  getSenderKeyBundle(): {
    userId: string;
    signingKey: ArrayBuffer;
    chainKey: ArrayBuffer;
    counter: number;
  } {
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
  processSenderKeyBundle(bundle: {
    userId: string;
    signingKey: ArrayBuffer;
    chainKey: ArrayBuffer;
    counter: number;
  }): void {
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
   * Advance sender key for forward secrecy (rotate keys periodically)
   */
  advanceSenderKey(): void {
    const mySenderKey = this.groupState.senderKeys.get(this.groupState.myUserId);
    if (!mySenderKey) {
      throw new SignalError('No sender key for current user', 'NO_SENDER_KEY');
    }

    // Generate new signing key
    const newSigningKey = generateSigningKeyPair();
    
    // Advance the chain key multiple times for forward secrecy
    let chainKey = mySenderKey.sendingChain.key;
    for (let i = 0; i < CRYPTO_CONFIG.ratchetAdvanceThreshold; i++) {
      const { nextChainKey } = deriveKeys(chainKey);
      chainKey = nextChainKey;
    }

    // Update sender key
    mySenderKey.signingKey = {
      publicKey: newSigningKey.publicKey,
      privateKey: newSigningKey.privateKey,
    };
    mySenderKey.sendingChain = {
      key: chainKey,
      counter: 0, // Reset counter with new key
    };
  }

  /**
   * Handle member leave (called when someone leaves the group)
   */
  handleMemberLeave(userId: string): void {
    this.removeMember(userId);
    
    // Advance our sender key for forward secrecy
    // This ensures the leaving member can't decrypt future messages
    this.advanceSenderKey();
  }

  /**
   * Create group message header
   */
  private createGroupMessageHeader(counter: number, senderId: string): ArrayBuffer {
    const counterBytes = new Uint32Array([counter]);
    const senderIdBytes = new TextEncoder().encode(senderId);
    const senderIdLength = new Uint32Array([senderIdBytes.length]);
    
    return concatArrayBuffers(
      counterBytes.buffer,
      senderIdLength.buffer,
      senderIdBytes.buffer
    );
  }

  /**
   * Parse group message payload
   */
  private parseGroupMessage(payload: ArrayBuffer): {
    header: ArrayBuffer;
    ciphertext: ArrayBuffer;
  } {
    const view = new DataView(payload);
    
    // Read counter (4 bytes)
    const counter = view.getUint32(0, true);
    
    // Read sender ID length (4 bytes)
    const senderIdLength = view.getUint32(4, true);
    
    // Calculate header size
    const headerSize = 8 + senderIdLength; // counter + length + senderId
    
    return {
      header: payload.slice(0, headerSize),
      ciphertext: payload.slice(headerSize),
    };
  }

  /**
   * Extract counter from header
   */
  private extractCounterFromHeader(header: ArrayBuffer): number {
    const view = new DataView(header);
    return view.getUint32(0, true);
  }

  /**
   * Derive message keys for specific counter
   */
  private deriveMessageKeysForCounter(
    senderKey: SenderKeyState,
    targetCounter: number
  ): MessageKeys {
    let chainKey = senderKey.sendingChain.key;
    let currentCounter = senderKey.sendingChain.counter;

    // Advance chain key to target counter
    while (currentCounter < targetCounter) {
      const { nextChainKey } = deriveKeys(chainKey);
      chainKey = nextChainKey;
      currentCounter++;
    }

    // Derive message key from final chain key
    const { messageKey } = deriveKeys(chainKey);
    return deriveMessageKeys(messageKey);
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
   * Check if user is a member
   */
  isMember(userId: string): boolean {
    return this.groupState.senderKeys.has(userId);
  }
} 