// Signal Protocol Double Ratchet Implementation

import {
  KeyPair,
  ChainKey,
  MessageKeys,
  RatchetState,
  SessionState,
  SignalMessage,
  SignalError,
  DuplicateMessageError,
  InvalidKeyError,
} from './types';
import {
  generateKeyPair,
  deriveKeys,
  deriveMessageKeys,
  performDH,
  deriveRootKey,
  exportKey,
  importKey,
  generateRandomBytes,
  concatArrayBuffers,
  encrypt,
  decrypt,
  signMessage,
  verifySignature,
  CRYPTO_CONFIG,
} from './utils';

export class DoubleRatchet {
  private sessionState: SessionState;

  constructor(sessionState: SessionState) {
    this.sessionState = sessionState;
  }

  /**
   * Initialize a new ratchet session as the sender (Alice)
   */
  static async initializeAsSender(
    localIdentityKey: KeyPair,
    remoteIdentityKey: ArrayBuffer,
    remoteSignedPreKey: ArrayBuffer
  ): Promise<DoubleRatchet> {
    console.log(`🔑 [DOUBLE RATCHET] ===== INITIALIZING AS SENDER =====`);
    
    // Generate initial DH key pair
    console.log(`🔑 [DOUBLE RATCHET] Generating initial DH ratchet key pair...`);
    const initialKeyPair = generateKeyPair();
    
    // Perform initial DH exchanges for root key
    const dh1 = performDH(localIdentityKey.privateKey, remoteSignedPreKey);
    const dh2 = performDH(initialKeyPair.privateKey, remoteIdentityKey);
    const dh3 = performDH(initialKeyPair.privateKey, remoteSignedPreKey);
    
    // Derive initial root key
    const initialSharedSecret = concatArrayBuffers(dh1, dh2, dh3);
    const initialRootKey = generateRandomBytes(32); // Start with random root key
    const { newRootKey, chainKey } = deriveRootKey(initialRootKey, initialSharedSecret);

    const sessionState: SessionState = {
      localIdentityKey: {
        keyId: generateUUID(),
        publicKey: exportKey(localIdentityKey.publicKey),
        privateKey: exportKey(localIdentityKey.privateKey),
      },
      remoteIdentityKey,
      ratchetState: {
        rootKey: newRootKey,
        sendingChain: {
          key: chainKey,
          counter: 0,
        },
        receivingChains: new Map(),
        dhSendingKey: {
          publicKey: initialKeyPair.publicKey,
          privateKey: initialKeyPair.privateKey,
        },
        dhReceivingKey: null,
        prevSendingCounter: 0,
        messageCounter: 0,
        skippedMessages: new Map(),
      },
      sessionVersion: 1,
      isInitialized: true,
    };

    return new DoubleRatchet(sessionState);
  }

  /**
   * Initialize a new ratchet session as the receiver (Bob)
   */
  static async initializeAsReceiver(
    localIdentityKey: KeyPair,
    localSignedPreKey: KeyPair,
    remoteIdentityKey: ArrayBuffer,
    initialMessage: SignalMessage
  ): Promise<DoubleRatchet> {
    if (!initialMessage.identityKey) {
      throw new InvalidKeyError('Initial message missing identity key');
    }

    // Perform initial DH exchanges
    const dh1 = performDH(localSignedPreKey.privateKey, remoteIdentityKey);
    const dh2 = performDH(localIdentityKey.privateKey, initialMessage.identityKey);
    const dh3 = performDH(localSignedPreKey.privateKey, initialMessage.identityKey);
    
    // Derive initial root key
    const initialSharedSecret = concatArrayBuffers(dh1, dh2, dh3);
    const initialRootKey = generateRandomBytes(32);
    const { newRootKey } = deriveRootKey(initialRootKey, initialSharedSecret);

    const sessionState: SessionState = {
      localIdentityKey: {
        keyId: generateUUID(),
        publicKey: exportKey(localIdentityKey.publicKey),
        privateKey: exportKey(localIdentityKey.privateKey),
      },
      remoteIdentityKey,
      ratchetState: {
        rootKey: newRootKey,
        sendingChain: null,
        receivingChains: new Map(),
        dhSendingKey: null,
        dhReceivingKey: initialMessage.identityKey,
        prevSendingCounter: 0,
        messageCounter: 0,
        skippedMessages: new Map(),
      },
      sessionVersion: 1,
      isInitialized: true,
    };

    return new DoubleRatchet(sessionState);
  }

  /**
   * Encrypt a message
   */
  async encryptMessage(plaintext: ArrayBuffer): Promise<SignalMessage> {
    if (!this.sessionState.isInitialized) {
      throw new SignalError('Session not initialized', 'SESSION_NOT_INITIALIZED');
    }

    // Ensure we have a sending chain
    if (!this.sessionState.ratchetState.sendingChain) {
      this.performDHRatchetStep();
    }

    const sendingChain = this.sessionState.ratchetState.sendingChain!;
    
    // Derive message keys from current chain key
    const { nextChainKey, messageKey } = deriveKeys(sendingChain.key);
    const messageKeys = deriveMessageKeys(messageKey);

    // Encrypt the message
    const ciphertext = encrypt(plaintext, messageKeys.cipherKey, messageKeys.iv);

    // Create message header
    const header = this.createMessageHeader(sendingChain.counter);
    
    // Sign the message
    const messageToSign = concatArrayBuffers(header, ciphertext);
    const signature = signMessage(messageToSign, messageKeys.macKey);

    // Update sending chain
    this.sessionState.ratchetState.sendingChain = {
      key: nextChainKey,
      counter: sendingChain.counter + 1,
    };

    this.sessionState.ratchetState.messageCounter++;

    return {
      type: 'SIGNAL_MESSAGE',
      version: this.sessionState.sessionVersion,
      message: concatArrayBuffers(header, ciphertext),
      signature,
    };
  }

  /**
   * Decrypt a message
   */
  async decryptMessage(signalMessage: SignalMessage): Promise<ArrayBuffer> {
    if (!this.sessionState.isInitialized) {
      throw new SignalError('Session not initialized', 'SESSION_NOT_INITIALIZED');
    }

    const { header, ciphertext } = this.parseMessage(signalMessage.message);
    const messageId = this.getMessageId(header);

    // Check for duplicate message
    if (this.sessionState.ratchetState.skippedMessages.has(messageId)) {
      throw new DuplicateMessageError();
    }

    // Try to decrypt with existing chains
    const messageKeys = this.tryExistingChains(header);
    if (messageKeys) {
      return this.decryptWithKeys(ciphertext, messageKeys, signalMessage.signature!);
    }

    // Need to advance DH ratchet
    this.performDHRatchetStepForReceiving(header);
    
    // Try again with new chain
    const newMessageKeys = this.tryExistingChains(header);
    if (!newMessageKeys) {
      throw new SignalError('Failed to derive message keys', 'DECRYPT_FAILED');
    }

    return this.decryptWithKeys(ciphertext, newMessageKeys, signalMessage.signature!);
  }

  /**
   * Perform DH ratchet step (sending)
   */
  private performDHRatchetStep(): void {
    console.log(`🔑 [RATCHET ADVANCE] ===== PERFORMING DH RATCHET STEP (SENDING) =====`);
    
    // Generate new DH key pair
    console.log(`🔑 [RATCHET ADVANCE] Generating new DH key pair for ratchet step...`);
    const newKeyPair = generateKeyPair();
    
    if (this.sessionState.ratchetState.dhReceivingKey) {
      // Perform DH with remote's public key
      const dhOutput = performDH(newKeyPair.privateKey, this.sessionState.ratchetState.dhReceivingKey);
      
      // Derive new root key and sending chain key
      const { newRootKey, chainKey } = deriveRootKey(
        this.sessionState.ratchetState.rootKey,
        dhOutput
      );
      
      // Update state
      this.sessionState.ratchetState.rootKey = newRootKey;
      this.sessionState.ratchetState.dhSendingKey = {
        publicKey: newKeyPair.publicKey,
        privateKey: newKeyPair.privateKey,
      };
      this.sessionState.ratchetState.sendingChain = {
        key: chainKey,
        counter: 0,
      };
      this.sessionState.ratchetState.prevSendingCounter = 0;
    }
  }

  /**
   * Perform DH ratchet step (receiving)
   */
  private performDHRatchetStepForReceiving(header: ArrayBuffer): void {
    const remotePublicKey = this.extractPublicKeyFromHeader(header);
    
    if (this.sessionState.ratchetState.dhSendingKey) {
      // Perform DH with remote's new public key
      const dhOutput = performDH(
        this.sessionState.ratchetState.dhSendingKey.privateKey,
        remotePublicKey
      );
      
      // Derive new root key and receiving chain key
      const { newRootKey, chainKey } = deriveRootKey(
        this.sessionState.ratchetState.rootKey,
        dhOutput
      );
      
      // Update state
      this.sessionState.ratchetState.rootKey = newRootKey;
      this.sessionState.ratchetState.dhReceivingKey = remotePublicKey;
      
      // Create new receiving chain
      const chainId = this.getChainId(remotePublicKey);
      this.sessionState.ratchetState.receivingChains.set(chainId, {
        key: chainKey,
        counter: 0,
      });
    }
  }

  /**
   * Try to decrypt with existing chains
   */
  private tryExistingChains(header: ArrayBuffer): MessageKeys | null {
    const remotePublicKey = this.extractPublicKeyFromHeader(header);
    const messageCounter = this.extractCounterFromHeader(header);
    const chainId = this.getChainId(remotePublicKey);
    
    const chain = this.sessionState.ratchetState.receivingChains.get(chainId);
    if (!chain) {
      return null;
    }
    
    // Skip messages if necessary
    if (messageCounter > chain.counter) {
      this.skipMessages(chainId, chain, messageCounter);
    }
    
    // Derive message keys
    const { nextChainKey, messageKey } = deriveKeys(chain.key);
    const messageKeys = deriveMessageKeys(messageKey);
    
    // Update chain
    this.sessionState.ratchetState.receivingChains.set(chainId, {
      key: nextChainKey,
      counter: chain.counter + 1,
    });
    
    return messageKeys;
  }

  /**
   * Skip messages to handle out-of-order delivery
   */
  private skipMessages(
    chainId: string,
    chain: ChainKey,
    targetCounter: number
  ): void {
    let currentChain = { ...chain };
    
    for (let i = chain.counter; i < targetCounter; i++) {
      const { nextChainKey, messageKey } = deriveKeys(currentChain.key);
      const messageKeys = deriveMessageKeys(messageKey);
      
      // Store skipped message keys
      const messageId = `${chainId}-${i}`;
      this.sessionState.ratchetState.skippedMessages.set(messageId, messageKeys);
      
      currentChain = {
        key: nextChainKey,
        counter: i + 1,
      };
      
             // Limit number of skipped messages
       if (this.sessionState.ratchetState.skippedMessages.size > CRYPTO_CONFIG.maxSkippedMessages) {
         // Remove oldest skipped message
         const firstKey = this.sessionState.ratchetState.skippedMessages.keys().next().value;
         if (firstKey) {
           this.sessionState.ratchetState.skippedMessages.delete(firstKey);
         }
       }
    }
    
    // Update the chain
    this.sessionState.ratchetState.receivingChains.set(chainId, currentChain);
  }

  /**
   * Decrypt with specific keys
   */
  private decryptWithKeys(
    ciphertext: ArrayBuffer,
    messageKeys: MessageKeys,
    signature: ArrayBuffer
  ): ArrayBuffer {
    // Verify signature
    const messageToVerify = ciphertext;
    const isValidSignature = verifySignature(signature, messageToVerify, messageKeys.macKey);
    
    if (!isValidSignature) {
      throw new SignalError('Invalid message signature', 'INVALID_SIGNATURE');
    }
    
    // Decrypt the message
    return decrypt(ciphertext, messageKeys.cipherKey, messageKeys.iv);
  }

  /**
   * Create message header
   */
  private createMessageHeader(counter: number): ArrayBuffer {
    const counterBytes = new Uint32Array([counter]);
    const dhPublicKey = this.sessionState.ratchetState.dhSendingKey?.publicKey || new ArrayBuffer(32);
    
    return concatArrayBuffers(
      dhPublicKey,
      counterBytes.buffer
    );
  }

  /**
   * Parse message into header and ciphertext
   */
  private parseMessage(message: ArrayBuffer): { header: ArrayBuffer; ciphertext: ArrayBuffer } {
    // Header: 32 bytes DH public key + 4 bytes counter
    const headerSize = 36;
    
    return {
      header: message.slice(0, headerSize),
      ciphertext: message.slice(headerSize),
    };
  }

  /**
   * Extract public key from header
   */
  private extractPublicKeyFromHeader(header: ArrayBuffer): ArrayBuffer {
    return header.slice(0, 32);
  }

  /**
   * Extract counter from header
   */
  private extractCounterFromHeader(header: ArrayBuffer): number {
    const counterBytes = new Uint32Array(header.slice(32, 36));
    return counterBytes[0];
  }

  /**
   * Generate chain ID from public key
   */
  private getChainId(publicKey: ArrayBuffer): string {
    const bytes = new Uint8Array(publicKey);
    return Array.from(bytes.slice(0, 8))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate message ID from header
   */
  private getMessageId(header: ArrayBuffer): string {
    const publicKey = this.extractPublicKeyFromHeader(header);
    const counter = this.extractCounterFromHeader(header);
    return `${this.getChainId(publicKey)}-${counter}`;
  }

  /**
   * Get session state
   */
  getSessionState(): SessionState {
    return this.sessionState;
  }

  /**
   * Update session state
   */
  updateSessionState(newState: SessionState): void {
    this.sessionState = newState;
  }
}

/**
 * Generate a simple UUID for environments without crypto.randomUUID
 */
function generateUUID(): string {
  const bytes = new Uint8Array(generateRandomBytes(16));
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
} 