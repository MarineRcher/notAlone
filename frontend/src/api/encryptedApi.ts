/**
 * Encrypted API Service
 * 
 * This file contains functions for making encrypted API calls,
 * handling key exchange, and managing encrypted communication with the server.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as keyManager from '../crypto/keys';
import * as messageManager from '../crypto/messages';
import * as secureStorage from '../crypto/storage';
import * as utils from '../crypto/utils';
import { ENCRYPTION_CONFIG } from '../crypto/config';
import { 
  EncryptedMessage, 
  DecryptedMessage, 
  SessionInitRequest, 
  SessionInitResponse,
  KeyUpdateRequest,
  EncryptionError,
  EncryptionErrorType
} from '../crypto/types';

// Create a base axios instance
const api: AxiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Sets the base URL for API calls
 * @param baseUrl The base URL for the API
 */
export const setBaseUrl = (baseUrl: string): void => {
  api.defaults.baseURL = baseUrl;
};

/**
 * Sets an authentication token for API calls
 * @param token The authentication token
 */
export const setAuthToken = (token: string): void => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

/**
 * Initiates a new encrypted session with another user
 * @param userId The ID of the current user
 * @param recipientId The ID of the user to establish a session with
 * @returns Promise resolving to the established session ID
 */
export const initiateSession = async (
  userId: string,
  recipientId: string
): Promise<string> => {
  try {
    // Get or create our identity key pair
    const identityKeyPair = await keyManager.getOrCreateIdentityKeyPair();
    
    // Generate a new asymmetric key pair for this session
    const sessionKeyPair = await keyManager.generateAsymmetricKeyPair();
    
    // Export the public key
    const publicKeyData = await keyManager.exportKey(sessionKeyPair.publicKey);
    const publicKeyBase64 = utils.bytesToBase64(publicKeyData);
    
    // Create a timestamp
    const timestamp = utils.getCurrentTimestamp();
    
    // Create a signature for authentication
    const signatureData = utils.stringToBytes(
      `${userId}:${recipientId}:${publicKeyBase64}:${timestamp}`
    );
    const signature = await keyManager.signData(signatureData, identityKeyPair.privateKey);
    const signatureBase64 = utils.bytesToBase64(signature);
    
    // Create the session init request
    const sessionInitRequest: SessionInitRequest = {
      userId,
      publicKey: publicKeyBase64,
      timestamp,
      signature: signatureBase64,
    };
    
    // Send the session init request to the server
    const response = await api.post<SessionInitResponse>(
      `/users/${recipientId}/sessions`,
      sessionInitRequest
    );
    
    const sessionInitResponse = response.data;
    
    // Verify the response signature
    // Note: In a real app, you'd need to fetch the recipient's identity public key
    // This is simplified for the example
    const recipientPublicKeyData = utils.base64ToBytes(sessionInitResponse.publicKey);
    const recipientPublicKey = await keyManager.importPublicKey(recipientPublicKeyData);
    
    const responseSignatureData = utils.stringToBytes(
      `${sessionInitResponse.userId}:${userId}:${sessionInitResponse.publicKey}:${sessionInitResponse.timestamp}`
    );
    const responseSignature = utils.base64ToBytes(sessionInitResponse.signature);
    
    const isSignatureValid = await keyManager.verifySignature(
      responseSignatureData,
      responseSignature,
      recipientPublicKey
    );
    
    if (!isSignatureValid) {
      throw new EncryptionError(
        'Session initialization response signature verification failed',
        EncryptionErrorType.INVALID_SIGNATURE
      );
    }
    
    // Generate a symmetric key for the session
    const symmetricKey = await keyManager.generateSymmetricKey();
    
    // Export the symmetric key
    const rawSymmetricKey = await cryptoSubtle.exportKey('raw', symmetricKey);
    const symmetricKeyBase64 = utils.bytesToBase64(new Uint8Array(rawSymmetricKey));
    
    // Generate a unique session ID
    const sessionId = await utils.generateSessionId();
    
    // Store the session key
    await secureStorage.storeSessionKey(recipientId, symmetricKeyBase64);
    
    // Send an encrypted "session established" message
    const initialMessage = 'Session established';
    const encryptedMessage = await messageManager.encryptMessageWithKeyExchange(
      initialMessage,
      recipientId,
      userId,
      symmetricKey,
      recipientPublicKey
    );
    
    // Send the message to establish the session
    await api.post(`/messages`, {
      to: recipientId,
      encrypted: messageManager.serializeMessage(encryptedMessage),
    });
    
    return sessionId;
  } catch (error) {
    console.error('Error initiating session:', error);
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError(
      'Failed to initiate encrypted session',
      EncryptionErrorType.INITIALIZATION_FAILED
    );
  }
};

// Access to cryptoSubtle
const cryptoSubtle = global.crypto.subtle;

/**
 * Sends an encrypted message to a recipient
 * @param content The plaintext message content
 * @param recipientId The ID of the recipient
 * @param senderId The ID of the sender
 * @returns Promise resolving to the message ID
 */
export const sendEncryptedMessage = async (
  content: string,
  recipientId: string,
  senderId: string
): Promise<string> => {
  try {
    // Get the session key for this recipient
    const sessionKeyBase64 = await secureStorage.getSessionKey(recipientId);
    
    if (!sessionKeyBase64) {
      // No session exists yet, initiate one
      await initiateSession(senderId, recipientId);
      
      // Retry getting the session key
      const newSessionKeyBase64 = await secureStorage.getSessionKey(recipientId);
      
      if (!newSessionKeyBase64) {
        throw new EncryptionError(
          'Failed to establish session with recipient',
          EncryptionErrorType.SESSION_NOT_ESTABLISHED
        );
      }
    }
    
    // Import the symmetric key from storage
    const sessionKeyBytes = utils.base64ToBytes(sessionKeyBase64!);
    const sessionKey = await cryptoSubtle.importKey(
      'raw',
      sessionKeyBytes,
      {
        name: ENCRYPTION_CONFIG.SYMMETRIC.algorithm,
        length: ENCRYPTION_CONFIG.SYMMETRIC.keySize,
      },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Encrypt the message
    const encryptedMessage = await messageManager.encryptMessage(
      content,
      recipientId,
      senderId,
      sessionKey
    );
    
    // Send the encrypted message
    const response = await api.post('/messages', {
      to: recipientId,
      encrypted: messageManager.serializeMessage(encryptedMessage),
    });
    
    // Return the message ID
    return encryptedMessage.header.messageId;
  } catch (error) {
    console.error('Error sending encrypted message:', error);
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError(
      'Failed to send encrypted message',
      EncryptionErrorType.UNKNOWN_ERROR
    );
  }
};

/**
 * Sends an encrypted message to a group
 * @param content The plaintext message content
 * @param groupId The ID of the group
 * @param senderId The ID of the sender
 * @returns Promise resolving to the message ID
 */
export const sendEncryptedGroupMessage = async (
  content: string,
  groupId: string,
  senderId: string
): Promise<string> => {
  try {
    // Get the group key
    const groupKeyBase64 = await secureStorage.getItem(`group_key_${groupId}`);
    
    if (!groupKeyBase64) {
      throw new EncryptionError(
        'No encryption key for this group',
        EncryptionErrorType.SESSION_NOT_ESTABLISHED
      );
    }
    
    // Import the group key
    const groupKeyBytes = utils.base64ToBytes(groupKeyBase64);
    const groupKey = await cryptoSubtle.importKey(
      'raw',
      groupKeyBytes,
      {
        name: ENCRYPTION_CONFIG.SYMMETRIC.algorithm,
        length: ENCRYPTION_CONFIG.SYMMETRIC.keySize,
      },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Encrypt the message for the group
    const encryptedMessage = await messageManager.encryptGroupMessage(
      content,
      groupId,
      senderId,
      groupKey
    );
    
    // Send the encrypted message
    const response = await api.post('/group-messages', {
      groupId,
      encrypted: messageManager.serializeMessage(encryptedMessage),
    });
    
    // Return the message ID
    return encryptedMessage.header.messageId;
  } catch (error) {
    console.error('Error sending encrypted group message:', error);
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError(
      'Failed to send encrypted group message',
      EncryptionErrorType.UNKNOWN_ERROR
    );
  }
};

/**
 * Receives and decrypts an encrypted message
 * @param encryptedData The serialized encrypted message
 * @param currentUserId The ID of the current user
 * @returns Promise resolving to the decrypted message
 */
export const receiveEncryptedMessage = async (
  encryptedData: string,
  currentUserId: string
): Promise<DecryptedMessage> => {
  try {
    // Deserialize the message
    const encryptedMessage = messageManager.deserializeMessage(encryptedData);
    
    // Validate that this message is for us
    if (
      encryptedMessage.header.recipientId !== currentUserId &&
      !messageManager.isGroupMessage(encryptedMessage)
    ) {
      throw new EncryptionError(
        'Message not intended for this recipient',
        EncryptionErrorType.DECRYPTION_FAILED
      );
    }
    
    const senderId = encryptedMessage.header.senderId;
    
    // Check if this message contains a key exchange
    if (messageManager.hasKeyExchange(encryptedMessage)) {
      // This is a session initialization or key rotation message
      
      // Get our identity key pair
      const identityKeyPair = await keyManager.getOrCreateIdentityKeyPair();
      
      // For this example, we assume we already have the sender's public key
      // In a real app, you'd need to fetch it from a trusted directory or use a certificate
      // This is simplified for the example
      const senderPublicKeyBase64 = await api.get(`/users/${senderId}/public-key`);
      const senderPublicKeyBytes = utils.base64ToBytes(senderPublicKeyBase64.data);
      const senderPublicKey = await keyManager.importPublicKey(senderPublicKeyBytes);
      
      // Decrypt the message with the embedded key
      const result = await messageManager.decryptMessageWithEmbeddedKey(
        encryptedMessage,
        identityKeyPair.privateKey,
        senderPublicKey
      );
      
      // Extract the session key and store it
      const rawSessionKey = await cryptoSubtle.exportKey('raw', result.sessionKey);
      const sessionKeyBase64 = utils.bytesToBase64(new Uint8Array(rawSessionKey));
      
      // Store the session key for future messages
      if (messageManager.isGroupMessage(encryptedMessage)) {
        // This is a group key
        await secureStorage.setItem(
          `group_key_${encryptedMessage.groupId}`,
          sessionKeyBase64
        );
      } else {
        // This is a direct message key
        await secureStorage.storeSessionKey(senderId, sessionKeyBase64);
      }
      
      // Return the decrypted message
      return result.message;
    } else {
      // Regular message with established session
      
      // Get the appropriate key
      let sessionKeyBase64: string | null;
      
      if (messageManager.isGroupMessage(encryptedMessage)) {
        // Get the group key
        sessionKeyBase64 = await secureStorage.getItem(
          `group_key_${encryptedMessage.groupId}`
        );
      } else {
        // Get the direct message session key
        sessionKeyBase64 = await secureStorage.getSessionKey(senderId);
      }
      
      if (!sessionKeyBase64) {
        throw new EncryptionError(
          'No session key found for sender',
          EncryptionErrorType.SESSION_NOT_ESTABLISHED
        );
      }
      
      // Import the session key
      const sessionKeyBytes = utils.base64ToBytes(sessionKeyBase64);
      const sessionKey = await cryptoSubtle.importKey(
        'raw',
        sessionKeyBytes,
        {
          name: ENCRYPTION_CONFIG.SYMMETRIC.algorithm,
          length: ENCRYPTION_CONFIG.SYMMETRIC.keySize,
        },
        false,
        ['encrypt', 'decrypt']
      );
      
      // For this example, we assume we already have the sender's public key
      // In a real app, you'd need to fetch it from a trusted directory or use a certificate
      const senderPublicKeyBase64 = await api.get(`/users/${senderId}/public-key`);
      const senderPublicKeyBytes = utils.base64ToBytes(senderPublicKeyBase64.data);
      const senderPublicKey = await keyManager.importPublicKey(senderPublicKeyBytes);
      
      // Decrypt the message
      return await messageManager.decryptMessage(
        encryptedMessage,
        sessionKey,
        senderPublicKey
      );
    }
  } catch (error) {
    console.error('Error receiving encrypted message:', error);
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError(
      'Failed to decrypt received message',
      EncryptionErrorType.DECRYPTION_FAILED
    );
  }
};

/**
 * Creates a new group with end-to-end encryption
 * @param groupId The ID of the group
 * @param memberIds Array of member user IDs
 * @param creatorId The ID of the group creator
 * @returns Promise resolving when the group is created
 */
export const createEncryptedGroup = async (
  groupId: string,
  memberIds: string[],
  creatorId: string
): Promise<void> => {
  try {
    // Generate a symmetric key for the group
    const groupKey = await keyManager.generateSymmetricKey();
    
    // Export the key to raw bytes
    const rawGroupKey = await cryptoSubtle.exportKey('raw', groupKey);
    const groupKeyBase64 = utils.bytesToBase64(new Uint8Array(rawGroupKey));
    
    // Store the group key locally
    await secureStorage.setItem(`group_key_${groupId}`, groupKeyBase64);
    
    // Create the group on the server
    await api.post('/groups', {
      groupId,
      members: memberIds,
      creator: creatorId,
    });
    
    // Get public keys for all members
    const memberPublicKeys = new Map<string, CryptoKey>();
    
    for (const memberId of memberIds) {
      if (memberId !== creatorId) {
        // In a real app, fetch from server or key directory
        const response = await api.get(`/users/${memberId}/public-key`);
        const publicKeyBase64 = response.data;
        const publicKeyBytes = utils.base64ToBytes(publicKeyBase64);
        const publicKey = await keyManager.importPublicKey(publicKeyBytes);
        memberPublicKeys.set(memberId, publicKey);
      }
    }
    
    // Create key distribution messages for all members
    const keyMessages = await messageManager.createGroupKeyRotationMessages(
      groupId,
      creatorId,
      groupKey,
      memberPublicKeys
    );
    
    // Send key distribution messages to all members
    for (const [memberId, encryptedMessage] of keyMessages.entries()) {
      await api.post('/messages', {
        to: memberId,
        encrypted: messageManager.serializeMessage(encryptedMessage),
      });
    }
  } catch (error) {
    console.error('Error creating encrypted group:', error);
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError(
      'Failed to create encrypted group',
      EncryptionErrorType.UNKNOWN_ERROR
    );
  }
};

/**
 * Rotates the encryption key for a group
 * @param groupId The ID of the group
 * @param memberIds Array of member user IDs
 * @param organizerId The ID of the user organizing the rotation
 * @returns Promise resolving when the key rotation is complete
 */
export const rotateGroupKey = async (
  groupId: string,
  memberIds: string[],
  organizerId: string
): Promise<void> => {
  try {
    // Generate a new symmetric key for the group
    const newGroupKey = await keyManager.generateSymmetricKey();
    
    // Export the key to raw bytes
    const rawGroupKey = await cryptoSubtle.exportKey('raw', newGroupKey);
    const groupKeyBase64 = utils.bytesToBase64(new Uint8Array(rawGroupKey));
    
    // Store the new group key locally
    await secureStorage.setItem(`group_key_${groupId}`, groupKeyBase64);
    
    // Get public keys for all members
    const memberPublicKeys = new Map<string, CryptoKey>();
    
    for (const memberId of memberIds) {
      if (memberId !== organizerId) {
        // In a real app, fetch from server or key directory
        const response = await api.get(`/users/${memberId}/public-key`);
        const publicKeyBase64 = response.data;
        const publicKeyBytes = utils.base64ToBytes(publicKeyBase64);
        const publicKey = await keyManager.importPublicKey(publicKeyBytes);
        memberPublicKeys.set(memberId, publicKey);
      }
    }
    
    // Create key distribution messages for all members
    const keyMessages = await messageManager.createGroupKeyRotationMessages(
      groupId,
      organizerId,
      newGroupKey,
      memberPublicKeys
    );
    
    // Send key distribution messages to all members
    for (const [memberId, encryptedMessage] of keyMessages.entries()) {
      await api.post('/messages', {
        to: memberId,
        encrypted: messageManager.serializeMessage(encryptedMessage),
      });
    }
    
    // Notify the server about key rotation (for bookkeeping only - the key itself is never sent to the server)
    await api.post(`/groups/${groupId}/rotate-key`, {
      organizer: organizerId,
      timestamp: utils.getCurrentTimestamp(),
    });
  } catch (error) {
    console.error('Error rotating group key:', error);
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError(
      'Failed to rotate group key',
      EncryptionErrorType.UNKNOWN_ERROR
    );
  }
};

/**
 * Makes a generic encrypted API call
 * @param config The axios request config
 * @param encrypt Whether to encrypt the request body
 * @param decrypt Whether to decrypt the response
 * @param userId The ID of the current user
 * @returns Promise resolving to the response
 */
export const encryptedApiCall = async <T>(
  config: AxiosRequestConfig,
  encrypt: boolean = false,
  decrypt: boolean = false,
  userId?: string
): Promise<AxiosResponse<T>> => {
  try {
    let requestConfig = { ...config };
    
    // Encrypt request body if needed
    if (encrypt && config.data && userId) {
      // This is a simplified example. In a real app, you'd need to handle
      // different recipient types (user vs group) and session establishment.
      const recipientId = config.url?.includes('/groups/') 
        ? config.url.split('/').pop() || ''  // Extract group ID
        : config.url?.split('/').pop() || ''; // Extract user ID
      
      // Convert request body to string if needed
      const stringData = typeof config.data === 'string' 
        ? config.data 
        : JSON.stringify(config.data);
      
      // Send as encrypted message
      if (config.url?.includes('/groups/')) {
        await sendEncryptedGroupMessage(stringData, recipientId, userId);
      } else {
        await sendEncryptedMessage(stringData, recipientId, userId);
      }
      
      // Remove the original data (it's now part of the encrypted envelope)
      delete requestConfig.data;
    }
    
    // Make the API call
    const response = await api(requestConfig);
    
    // Decrypt response if needed
    if (decrypt && response.data && userId) {
      // Assume response.data contains a serialized encrypted message
      const decrypted = await receiveEncryptedMessage(response.data, userId);
      
      // Parse the decrypted content if it's JSON
      try {
        const parsedData = JSON.parse(decrypted.content);
        response.data = parsedData;
      } catch {
        // If not valid JSON, just use the raw decrypted content
        response.data = decrypted.content as any;
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error in encrypted API call:', error);
    throw error;
  }
};

export default {
  setBaseUrl,
  setAuthToken,
  initiateSession,
  sendEncryptedMessage,
  sendEncryptedGroupMessage,
  receiveEncryptedMessage,
  createEncryptedGroup,
  rotateGroupKey,
  encryptedApiCall,
};