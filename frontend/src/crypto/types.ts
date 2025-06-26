// TypeScript types and interfaces for Signal Protocol implementation

export interface KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

export interface IdentityKeys {
  identityKey: KeyPair;
  signedPreKey: KeyPair;
  preKeys: KeyPair[];
  registrationId: string;
}

export interface MessageKeys {
  cipherKey: Uint8Array;
  macKey: Uint8Array;
  iv: Uint8Array;
}

export interface ChainKey {
  key: Uint8Array;
  index: number;
}

export interface SenderKeyState {
  chainKey: ChainKey;
  signingKey: KeyPair;
  messageKeys: Map<number, MessageKeys>;
}

export interface GroupMessage {
  messageId: string;
  timestamp: number;
  groupId: string;
  senderId: string;
  encryptedPayload: Uint8Array;
  signature: Uint8Array;
  keyIndex: number;
}

// Public API types
export interface EncryptedMessage {
  messageId: string;
  timestamp: number;
  groupId: string;
  senderId: string;
  encryptedPayload: number[];
  signature: number[];
  keyIndex: number;
}

export interface DecryptedMessage {
  messageId: string;
  content: string;
  senderId: string;
  timestamp: number;
  verified: boolean;
  groupId?: string;
}

// Device and member bundle types
export interface DeviceInfo {
  deviceId: string;
  registrationId: string;
  identityKey: number[];
  signedPreKey: number[];
  preKeys: number[][];
}

export interface SenderKeyBundle {
  userId: string;
  groupId: string;
  chainKey: number[];
  signingPublicKey: number[];
  keyIndex: number;
}