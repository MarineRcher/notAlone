/**
 * End-to-End Encryption Message Processing
 * 
 * This file contains functions for encrypting and decrypting messages,
 * managing message formats, and handling signatures for the E2EE implementation.
 */

import * as crypto from 'expo-crypto';
import { ENCRYPTION_CONFIG } from './config';
import * as keyManager from './keys';
import * as secureStorage from './storage';
import { 
  EncryptedMessage, 
  MessageHeader, 
  DecryptedMessage,
  KeyExchangeMode,
  EncryptionError,
  EncryptionErrorType
} from './types';

// TypeScript interface for RsaOaepParams (to fix Web Crypto API type issues)
interface RsaOaepParams extends Algorithm {
  name: string;
}

// For operations not available in expo-crypto, we still use the Web Crypto API
const cryptoSubtle = global.crypto.subtle;

/**
 * Encrypts a message for a specific recipient using their session key
 * @param plaintext The plaintext message to encrypt
 * @param recipientId The ID of the recipient
 * @param senderId The ID of the sender
 * @param sessionKey The symmetric key to use for encryption
 * @param groupId Optional group ID for group messages
 * @returns Promise resolving to an EncryptedMessage
 */
export const encryptMessage = async (
  plaintext: string,
  recipientId: string,
  senderId: string,
  sessionKey: CryptoKey,
  groupId?: string
): Promise<EncryptedMessage> => {
  try {
    // Generate a unique message ID
    const messageId = await generateMessageId();
    
    // Generate IV for this message
    const iv = keyManager.generateIV();
    const ivBase64 = Buffer.from(iv).toString('base64');
    
    // Convert plaintext to Uint8Array
    const encoder = new TextEncoder();
    const plaintextData = encoder.encode(plaintext);
    
    // Encrypt the message with AES-GCM
    const algorithm = ENCRYPTION_CONFIG.SYMMETRIC.algorithm;
    const ciphertext = await cryptoSubtle.encrypt(
      {
        name: algorithm,
        iv,
      },
      sessionKey,
      plaintextData
    );
    
    // Convert ciphertext to Base64
    const ciphertextBase64 = Buffer.from(ciphertext).toString('base64');
    
    // Create message header
    const header: MessageHeader = {
      version: ENCRYPTION_CONFIG.MESSAGE.version,
      senderId,
      recipientId,
      messageId,
      timestamp: Date.now(),
      iv: ivBase64,
    };
    
    // Get identity key pair for signing
    const identityKeyPair = await keyManager.getOrCreateIdentityKeyPair();
    
    // Create a signature of the header and ciphertext
    const headerStr = JSON.stringify(header);
    const signatureData = encoder.encode(headerStr + ciphertextBase64);
    const signature = await keyManager.signData(signatureData, identityKeyPair.privateKey);
    const signatureBase64 = Buffer.from(signature).toString('base64');
    
    // Construct the full encrypted message
    const encryptedMessage: EncryptedMessage = {
      header,
      ciphertext: ciphertextBase64,
      signature: signatureBase64,
    };
    
    // Add group ID if provided
    if (groupId) {
      encryptedMessage.groupId = groupId;
    }
    
    return encryptedMessage;
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw new EncryptionError('Failed to encrypt message', EncryptionErrorType.UNKNOWN_ERROR);
  }
};

/**
 * Decrypts an encrypted message using the appropriate session key
 * @param encryptedMessage The encrypted message to decrypt
 * @param sessionKey The symmetric key to use for decryption
 * @param senderPublicKey The public key of the sender for verifying signature
 * @returns Promise resolving to a DecryptedMessage
 */
export const decryptMessage = async (
  encryptedMessage: EncryptedMessage,
  sessionKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<DecryptedMessage> => {
  try {
    const { header, ciphertext, signature } = encryptedMessage;
    
    // Verify the signature first
    const encoder = new TextEncoder();
    const signatureData = encoder.encode(JSON.stringify(header) + ciphertext);
    const signatureBytes = new Uint8Array(Buffer.from(signature, 'base64'));
    
    const isSignatureValid = await keyManager.verifySignature(
      signatureData,
      signatureBytes,
      senderPublicKey
    );
    
    if (!isSignatureValid) {
      throw new EncryptionError(
        'Message signature verification failed', 
        EncryptionErrorType.INVALID_SIGNATURE
      );
    }
    
    // Convert IV and ciphertext from Base64
    const iv = Buffer.from(header.iv, 'base64');
    const ciphertextBytes = Buffer.from(ciphertext, 'base64');
    
    // Decrypt the message
    const algorithm = ENCRYPTION_CONFIG.SYMMETRIC.algorithm;
    const decryptedBytes = await cryptoSubtle.decrypt(
      {
        name: algorithm,
        iv,
      },
      sessionKey,
      ciphertextBytes
    );
    
    // Convert decrypted bytes to plaintext
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decryptedBytes);
    
    // Return the decrypted message
    return {
      content: plaintext,
      senderId: header.senderId,
      recipientId: header.recipientId,
      messageId: header.messageId,
      timestamp: header.timestamp,
      groupId: encryptedMessage.groupId,
      verified: isSignatureValid,
    };
  } catch (error) {
    console.error('Error decrypting message:', error);
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError(
      'Failed to decrypt message', 
      EncryptionErrorType.DECRYPTION_FAILED
    );
  }
};

/**
 * Encrypts a message for a group
 * @param plaintext The plaintext message to encrypt
 * @param groupId The ID of the group
 * @param senderId The ID of the sender
 * @param groupKey The symmetric key for the group
 * @returns Promise resolving to an EncryptedMessage
 */
export const encryptGroupMessage = async (
  plaintext: string,
  groupId: string,
  senderId: string,
  groupKey: CryptoKey
): Promise<EncryptedMessage> => {
  try {
    // Group messages use an empty string for recipientId instead of undefined
    return await encryptMessage(plaintext, "", senderId, groupKey, groupId);
  } catch (error) {
    console.error('Error encrypting group message:', error);
    throw new EncryptionError('Failed to encrypt group message', EncryptionErrorType.UNKNOWN_ERROR);
  }
};

/**
 * Creates an encrypted message with an embedded key for initial key exchange
 * @param plaintext The plaintext message to encrypt
 * @param recipientId The ID of the recipient
 * @param senderId The ID of the sender
 * @param symmetricKey The symmetric key to use for encryption
 * @param recipientPublicKey The public key of the recipient
 * @returns Promise resolving to an EncryptedMessage with embedded key
 */
export const encryptMessageWithKeyExchange = async (
  plaintext: string,
  recipientId: string,
  senderId: string,
  symmetricKey: CryptoKey,
  recipientPublicKey: CryptoKey
): Promise<EncryptedMessage> => {
  try {
    // Export the symmetric key as raw bytes
    const rawKey = await cryptoSubtle.exportKey('raw', symmetricKey);
    
    // Encrypt the symmetric key with the recipient's public key
    const encryptedKey = await cryptoSubtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.ASYMMETRIC.algorithm,
      } as RsaOaepParams,
      recipientPublicKey,
      rawKey
    );
    
    // Convert encrypted key to Base64
    const encryptedKeyBase64 = Buffer.from(encryptedKey).toString('base64');
    
    // Encrypt the message normally
    const encryptedMessage = await encryptMessage(
      plaintext,
      recipientId,
      senderId,
      symmetricKey
    );
    
    // Add the encrypted key to the header
    encryptedMessage.header.encryptedKey = encryptedKeyBase64;
    encryptedMessage.header.keyExchangeMode = KeyExchangeMode.DIRECT;
    
    return encryptedMessage;
  } catch (error) {
    console.error('Error encrypting message with key exchange:', error);
    throw new EncryptionError('Failed to encrypt message with key exchange', EncryptionErrorType.UNKNOWN_ERROR);
  }
};

/**
 * Decrypts a message that contains an embedded encrypted symmetric key
 * @param encryptedMessage The encrypted message with embedded key
 * @param privateKey The private key to decrypt the embedded symmetric key
 * @param senderPublicKey The public key of the sender for verifying signature
 * @returns Promise resolving to an object with the decrypted message and the session key
 */
export const decryptMessageWithEmbeddedKey = async (
  encryptedMessage: EncryptedMessage,
  privateKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<{ message: DecryptedMessage; sessionKey: CryptoKey }> => {
  try {
    const { header } = encryptedMessage;
    
    if (!header.encryptedKey) {
      throw new EncryptionError('No encrypted key found in message', EncryptionErrorType.DECRYPTION_FAILED);
    }
    
    // Decrypt the embedded symmetric key
    const encryptedKeyBytes = Buffer.from(header.encryptedKey, 'base64');
    const keyBytes = await cryptoSubtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.ASYMMETRIC.algorithm,
      } as RsaOaepParams,
      privateKey,
      encryptedKeyBytes
    );
    
    // Import the symmetric key
    const sessionKey = await cryptoSubtle.importKey(
      'raw',
      keyBytes,
      {
        name: ENCRYPTION_CONFIG.SYMMETRIC.algorithm,
        length: ENCRYPTION_CONFIG.SYMMETRIC.keySize,
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Decrypt the message with the recovered session key
    const decryptedMessage = await decryptMessage(
      encryptedMessage,
      sessionKey,
      senderPublicKey
    );
    
    return { message: decryptedMessage, sessionKey };
  } catch (error) {
    console.error('Error decrypting message with embedded key:', error);
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError(
      'Failed to decrypt message with embedded key', 
      EncryptionErrorType.DECRYPTION_FAILED
    );
  }
};

/**
 * Generates a unique message ID
 * @returns Promise resolving to a unique message ID
 */
export const generateMessageId = async (): Promise<string> => {
  try {
    // Generate a UUID using crypto
    const uuid = await crypto.randomUUID();
    return uuid;
  } catch (error) {
    // Fallback to timestamp-based ID if UUID generation fails
    return `msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
};

/**
 * Creates key rotation message for group chats
 * @param groupId The ID of the group
 * @param senderId The ID of the sender
 * @param newKey The new symmetric key for the group
 * @param recipientPublicKeys Map of user IDs to their public keys
 * @returns Promise resolving to a map of user IDs to encrypted messages
 */
export const createGroupKeyRotationMessages = async (
  groupId: string,
  senderId: string,
  newKey: CryptoKey,
  recipientPublicKeys: Map<string, CryptoKey>
): Promise<Map<string, EncryptedMessage>> => {
  try {
    const messages = new Map<string, EncryptedMessage>();
    
    // Export the new key as raw bytes
    const rawKey = await cryptoSubtle.exportKey('raw', newKey);
    
    // Create a rotation announcement message
    const rotationMessage = `KEY_ROTATION_${Date.now()}`;
    
    // Create encrypted messages for each recipient
    for (const [userId, publicKey] of recipientPublicKeys.entries()) {
      // Encrypt the symmetric key with the recipient's public key
      const encryptedKey = await cryptoSubtle.encrypt(
        {
          name: ENCRYPTION_CONFIG.ASYMMETRIC.algorithm,
        } as RsaOaepParams,
        publicKey,
        rawKey
      );
      
      // Convert encrypted key to Base64
      const encryptedKeyBase64 = Buffer.from(encryptedKey).toString('base64');
      
      // Encrypt the rotation message
      const encryptedMessage = await encryptMessage(
        rotationMessage,
        userId,
        senderId,
        newKey,
        groupId
      );
      
      // Add key exchange info to the header
      encryptedMessage.header.encryptedKey = encryptedKeyBase64;
      encryptedMessage.header.keyExchangeMode = KeyExchangeMode.GROUP;
      
      messages.set(userId, encryptedMessage);
    }
    
    return messages;
  } catch (error) {
    console.error('Error creating group key rotation messages:', error);
    throw new EncryptionError('Failed to create group key rotation messages', EncryptionErrorType.UNKNOWN_ERROR);
  }
};

/**
 * Processes an incoming key rotation message
 * @param encryptedMessage The encrypted key rotation message
 * @param privateKey The private key to decrypt the embedded symmetric key
 * @param senderPublicKey The public key of the sender for verifying signature
 * @returns Promise resolving to the new decrypted session key
 */
export const processKeyRotationMessage = async (
  encryptedMessage: EncryptedMessage,
  privateKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<CryptoKey> => {
  try {
    // Decrypt the message with the embedded key
    const { sessionKey } = await decryptMessageWithEmbeddedKey(
      encryptedMessage,
      privateKey,
      senderPublicKey
    );
    
    // Return the new session key
    return sessionKey;
  } catch (error) {
    console.error('Error processing key rotation message:', error);
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError('Failed to process key rotation message', EncryptionErrorType.UNKNOWN_ERROR);
  }
};

/**
 * Determines if a message contains an embedded key exchange
 * @param message The encrypted message to check
 * @returns Boolean indicating if the message contains a key exchange
 */
export const hasKeyExchange = (message: EncryptedMessage): boolean => {
  return !!message.header.encryptedKey && !!message.header.keyExchangeMode;
};

/**
 * Determines if a message is a group message
 * @param message The encrypted message to check
 * @returns Boolean indicating if the message is for a group
 */
export const isGroupMessage = (message: EncryptedMessage): boolean => {
  return !!message.groupId;
};

/**
 * Serializes an encrypted message for transmission
 * @param message The encrypted message to serialize
 * @returns The serialized message as a string
 */
export const serializeMessage = (message: EncryptedMessage): string => {
  return JSON.stringify(message);
};

/**
 * Deserializes a message received from transmission
 * @param serialized The serialized message string
 * @returns The deserialized EncryptedMessage
 */
export const deserializeMessage = (serialized: string): EncryptedMessage => {
  try {
    return JSON.parse(serialized) as EncryptedMessage;
  } catch (error) {
    console.error('Error deserializing message:', error);
    throw new EncryptionError('Failed to deserialize message', EncryptionErrorType.UNKNOWN_ERROR);
  }
};