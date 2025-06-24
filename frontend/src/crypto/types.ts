// Signal Protocol Types for E2E Encrypted Group Chat

export interface KeyPair {
  publicKey: ArrayBuffer;
  privateKey: ArrayBuffer;
}

export interface IdentityKeyPair extends KeyPair {
  keyId: string;
}

export interface PreKeyBundle {
  identityKey: ArrayBuffer;
  signedPreKey: {
    publicKey: ArrayBuffer;
    signature: ArrayBuffer;
    keyId: number;
  };
  preKey?: {
    publicKey: ArrayBuffer;
    keyId: number;
  };
}

export interface ChainKey {
  key: ArrayBuffer;
  counter: number;
}

export interface MessageKeys {
  cipherKey: ArrayBuffer;
  macKey: ArrayBuffer;
  iv: ArrayBuffer;
}

export interface RatchetState {
  rootKey: ArrayBuffer;
  sendingChain: ChainKey | null;
  receivingChains: Map<string, ChainKey>;
  dhSendingKey: KeyPair | null;
  dhReceivingKey: ArrayBuffer | null;
  prevSendingCounter: number;
  messageCounter: number;
  skippedMessages: Map<string, MessageKeys>;
}

export interface SessionState {
  localIdentityKey: IdentityKeyPair;
  remoteIdentityKey: ArrayBuffer | null;
  ratchetState: RatchetState;
  sessionVersion: number;
  isInitialized: boolean;
}

export interface GroupSessionState {
  groupId: string;
  members: Map<string, SessionState>;
  senderKeys: Map<string, SenderKeyState>;
  myUserId: string;
}

export interface SenderKeyState {
  sendingChain: ChainKey;
  signingKey: KeyPair;
  chainKeyHistory: Array<{
    chainKey: ChainKey;
    signingKey: ArrayBuffer;
  }>;
}

export interface SignalMessage {
  type: 'PREKEY_MESSAGE' | 'SIGNAL_MESSAGE' | 'SENDER_KEY_MESSAGE';
  version: number;
  registrationId?: number;
  preKeyId?: number;
  signedPreKeyId?: number;
  identityKey?: ArrayBuffer;
  message: ArrayBuffer;
  signature?: ArrayBuffer;
}

export interface GroupMessage {
  groupId: string;
  senderId: string;
  messageId: string;
  timestamp: number;
  encryptedPayload: ArrayBuffer;
  signature: ArrayBuffer;
  keyVersion: number;
}

export interface DeviceInfo {
  deviceId: string;
  registrationId: number;
  identityKey: ArrayBuffer;
  preKeys: PreKeyBundle[];
}

export interface StoredSession {
  userId: string;
  sessionState: SessionState;
  lastActivity: number;
}

export interface StoredGroupSession {
  groupId: string;
  groupState: GroupSessionState;
  lastActivity: number;
}

export interface CryptoConfig {
  maxSkippedMessages: number;
  maxChainKeyHistory: number;
  sessionTimeout: number;
  ratchetAdvanceThreshold: number;
}

export interface KeyDerivationResult {
  rootKey: ArrayBuffer;
  chainKey: ArrayBuffer;
}

export interface PreKeyBundle {
  identityKey: ArrayBuffer;
  signedPreKey: {
    publicKey: ArrayBuffer;
    signature: ArrayBuffer;
    keyId: number;
  };
  preKey?: {
    publicKey: ArrayBuffer;
    keyId: number;
  };
}

// Error types
export class SignalError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SignalError';
  }
}

export class DuplicateMessageError extends SignalError {
  constructor(message: string = 'Duplicate message detected') {
    super(message, 'DUPLICATE_MESSAGE');
  }
}

export class InvalidKeyError extends SignalError {
  constructor(message: string = 'Invalid cryptographic key') {
    super(message, 'INVALID_KEY');
  }
}

export class UntrustedIdentityError extends SignalError {
  constructor(message: string = 'Untrusted identity key') {
    super(message, 'UNTRUSTED_IDENTITY');
  }
}

export class NoSessionError extends SignalError {
  constructor(message: string = 'No session exists') {
    super(message, 'NO_SESSION');
  }
} 