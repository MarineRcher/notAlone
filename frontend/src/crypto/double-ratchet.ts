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
    // Generate initial DH key pair
    const initialKeyPair = await generateKeyPair();
    
    // Perform initial DH exchanges for root key (simplified for React Native)
    const dh1 = await performDH(localIdentityKey.privateKey as ArrayBuffer, remoteSignedPreKey);
    const dh2 = await performDH(initialKeyPair.privateKey, remoteIdentityKey);
    const dh3 = await performDH(initialKeyPair.privateKey, remoteSignedPreKey);
    
    // Derive initial root key
    const initialSharedSecret = concatArrayBuffers(dh1, dh2, dh3);
    const { newRootKey, chainKey } = await deriveRootKey(new ArrayBuffer(32), initialSharedSecret);

    const sessionState: SessionState = {
      localIdentityKey: {
        keyId: crypto.randomUUID(),
        publicKey: await exportKey(localIdentityKey.publicKey as CryptoKey),
        privateKey: await exportKey(localIdentityKey.privateKey as CryptoKey),
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

    // Perform initial DH exchanges (simplified for React Native)
    const dh1 = await performDH(localSignedPreKey.privateKey as ArrayBuffer, remoteIdentityKey);
    const dh2 = await performDH(localIdentityKey.privateKey as ArrayBuffer, initialMessage.identityKey);
    const dh3 = await performDH(localSignedPreKey.privateKey as ArrayBuffer, initialMessage.identityKey);
    
    // Derive initial root key
    const initialSharedSecret = concatArrayBuffers(dh1, dh2, dh3);
    const { newRootKey } = await deriveRootKey(new ArrayBuffer(32), initialSharedSecret);

    const sessionState: SessionState = {
      localIdentityKey: {
        keyId: crypto.randomUUID(),
        publicKey: await exportKey(localIdentityKey.publicKey as CryptoKey),
        privateKey: await exportKey(localIdentityKey.privateKey as CryptoKey),
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
      await this.performDHRatchetStep();
    }

    const sendingChain = this.sessionState.ratchetState.sendingChain!;
    
    // Derive message keys from current chain key
    const { nextChainKey, messageKey } = await deriveKeys(sendingChain.key);
    const messageKeys = await deriveMessageKeys(messageKey);

    // Encrypt the message
    const { encrypt } = await import('./utils');
    const ciphertext = await encrypt(plaintext, messageKeys.cipherKey, messageKeys.iv);

    // Create message header
    const header = this.createMessageHeader(sendingChain.counter);
    
    // Sign the message
    const messageToSign = concatArrayBuffers(header, ciphertext);
    const { signMessage } = await import('./utils');
    const signature = await signMessage(messageToSign, messageKeys.macKey);

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
    const messageKeys = await this.tryExistingChains(header);
    if (messageKeys) {
      return await this.decryptWithKeys(ciphertext, messageKeys, signalMessage.signature!);
    }

    // Need to advance DH ratchet
    await this.performDHRatchetStepForReceiving(header);
    
    // Try again with new chain
    const newMessageKeys = await this.tryExistingChains(header);
    if (!newMessageKeys) {
      throw new SignalError('Failed to derive message keys', 'DECRYPT_FAILED');
    }

    return await this.decryptWithKeys(ciphertext, newMessageKeys, signalMessage.signature!);
  }

  /**
   * Perform DH ratchet step (sending)
   */
  private async performDHRatchetStep(): Promise<void> {
    // Generate new DH key pair
    const newKeyPair = await generateKeyPair();
    
    if (this.sessionState.ratchetState.dhReceivingKey) {
      // Perform DH with remote's public key
      const remoteCryptoKey = await importKey(
        this.sessionState.ratchetState.dhReceivingKey,
        'ECDH',
        ['deriveKey', 'deriveBits']
      );
      const dhOutput = await performDH(newKeyPair.privateKey, remoteCryptoKey);
      
      // Derive new root key and sending chain key
      const { newRootKey, chainKey } = await deriveRootKey(
        this.sessionState.ratchetState.rootKey,
        dhOutput
      );
      
      // Update state
      this.sessionState.ratchetState.rootKey = newRootKey;
      this.sessionState.ratchetState.dhSendingKey = {
        publicKey: await exportKey(newKeyPair.publicKey),
        privateKey: await exportKey(newKeyPair.privateKey),
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
  private async performDHRatchetStepForReceiving(header: ArrayBuffer): Promise<void> {
    const remotePublicKey = this.extractPublicKeyFromHeader(header);
    
    if (this.sessionState.ratchetState.dhSendingKey) {
      // Perform DH with our private key and remote's new public key
      const localPrivateKey = await importKey(
        this.sessionState.ratchetState.dhSendingKey.privateKey,
        'ECDH',
        ['deriveKey', 'deriveBits']
      );
      const remoteKey = await importKey(remotePublicKey, 'ECDH', ['deriveKey', 'deriveBits']);
      const dhOutput = await performDH(localPrivateKey, remoteKey);
      
      // Derive new root key and receiving chain key
      const { newRootKey, chainKey } = await deriveRootKey(
        this.sessionState.ratchetState.rootKey,
        dhOutput
      );
      
      // Update state
      this.sessionState.ratchetState.rootKey = newRootKey;
      this.sessionState.ratchetState.dhReceivingKey = remotePublicKey;
      
      // Store new receiving chain
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
  private async tryExistingChains(header: ArrayBuffer): Promise<MessageKeys | null> {
    const remotePublicKey = this.extractPublicKeyFromHeader(header);
    const messageCounter = this.extractCounterFromHeader(header);
    const chainId = this.getChainId(remotePublicKey);
    
    const receivingChain = this.sessionState.ratchetState.receivingChains.get(chainId);
    if (!receivingChain) {
      return null;
    }

    // Skip messages if necessary
    if (messageCounter > receivingChain.counter) {
      await this.skipMessages(chainId, receivingChain, messageCounter);
    }

    // Derive message keys
    let currentChainKey = receivingChain.key;
    for (let i = receivingChain.counter; i < messageCounter; i++) {
      const { nextChainKey } = await deriveKeys(currentChainKey);
      currentChainKey = nextChainKey;
    }

    const { messageKey } = await deriveKeys(currentChainKey);
    return await deriveMessageKeys(messageKey);
  }

  /**
   * Skip messages and store keys for out-of-order delivery
   */
  private async skipMessages(
    chainId: string,
    chain: ChainKey,
    targetCounter: number
  ): Promise<void> {
    if (targetCounter - chain.counter > CRYPTO_CONFIG.maxSkippedMessages) {
      throw new SignalError('Too many skipped messages', 'TOO_MANY_SKIPPED');
    }

    let currentChainKey = chain.key;
    for (let i = chain.counter; i < targetCounter; i++) {
      const { nextChainKey, messageKey } = await deriveKeys(currentChainKey);
      const messageKeys = await deriveMessageKeys(messageKey);
      
      const messageId = `${chainId}:${i}`;
      this.sessionState.ratchetState.skippedMessages.set(messageId, messageKeys);
      
      currentChainKey = nextChainKey;
    }

    // Update chain
    this.sessionState.ratchetState.receivingChains.set(chainId, {
      key: currentChainKey,
      counter: targetCounter,
    });
  }

  /**
   * Decrypt message with specific keys
   */
  private async decryptWithKeys(
    ciphertext: ArrayBuffer,
    messageKeys: MessageKeys,
    signature: ArrayBuffer
  ): Promise<ArrayBuffer> {
    // Verify signature
    const { verifySignature } = await import('./utils');
    const isValid = await verifySignature(signature, ciphertext, messageKeys.macKey);
    if (!isValid) {
      throw new SignalError('Invalid message signature', 'INVALID_SIGNATURE');
    }

    // Decrypt
    const { decrypt } = await import('./utils');
    return await decrypt(ciphertext, messageKeys.cipherKey, messageKeys.iv);
  }

  /**
   * Create message header
   */
  private createMessageHeader(counter: number): ArrayBuffer {
    const dhPublicKey = this.sessionState.ratchetState.dhSendingKey?.publicKey || new ArrayBuffer(32);
    const counterBytes = new Uint32Array([counter]);
    const prevCounterBytes = new Uint32Array([this.sessionState.ratchetState.prevSendingCounter]);
    
    return concatArrayBuffers(dhPublicKey, counterBytes.buffer, prevCounterBytes.buffer);
  }

  /**
   * Parse message into header and ciphertext
   */
  private parseMessage(message: ArrayBuffer): { header: ArrayBuffer; ciphertext: ArrayBuffer } {
    const headerLength = 32 + 4 + 4; // DH key + counter + prev counter
    return {
      header: message.slice(0, headerLength),
      ciphertext: message.slice(headerLength),
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
    const view = new DataView(header);
    return view.getUint32(32, true);
  }

  /**
   * Generate chain ID from public key
   */
  private getChainId(publicKey: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(publicKey.slice(0, 16))));
  }

  /**
   * Generate message ID
   */
  private getMessageId(header: ArrayBuffer): string {
    const publicKey = this.extractPublicKeyFromHeader(header);
    const counter = this.extractCounterFromHeader(header);
    return `${this.getChainId(publicKey)}:${counter}`;
  }

  /**
   * Get current session state
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