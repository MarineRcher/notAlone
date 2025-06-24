/**
 * End-to-End Encryption Message Processing
 *
 * Simplified implementation for React Native/Expo compatibility
 */

// Import polyfill to ensure Buffer is available
import "./polyfill";

import * as crypto from "expo-crypto";
import { ENCRYPTION_CONFIG } from "./config";
import * as keyManager from "./keys";
import * as secureStorage from "./storage";
import {
	EncryptedMessage,
	MessageHeader,
	DecryptedMessage,
	KeyExchangeMode,
	EncryptionError,
	EncryptionErrorType,
} from "./types";

// Simple base64 encode/decode functions that work in React Native
const base64Encode = (bytes: Uint8Array): string => 
{
	let binary = "";

	for (let i = 0; i < bytes.length; i++)
{
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
};

const base64Decode = (base64: string): Uint8Array => 
{
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i++)
{
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
};

/**
 * Encrypts a message for a specific recipient using their session key
 * SIMPLIFIED implementation for React Native compatibility
 */
export const encryptMessage = async (
	plaintext: string,
	recipientId: string,
	senderId: string,
	sessionKey: CryptoKey,
	groupId?: string
): Promise<EncryptedMessage> => 
{
	try 
{
		// Generate a unique message ID
		const messageId = await generateMessageId();

		// Generate IV for this message
		const iv = keyManager.generateIV();
		const ivBase64 = base64Encode(iv);

		// Convert plaintext to Uint8Array
		const encoder = new TextEncoder();
		const plaintextData = encoder.encode(plaintext);

		// Encrypt using our mock crypto operations
		const ciphertext = await keyManager.mockCryptoOperations.encrypt(
			{ name: ENCRYPTION_CONFIG.SYMMETRIC.algorithm, iv },
			sessionKey,
			plaintextData.buffer as ArrayBuffer
		);

		// Convert ciphertext to Base64
		const ciphertextBase64 = base64Encode(new Uint8Array(ciphertext));

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
		const signature = await keyManager.signData(
			signatureData,
			identityKeyPair.privateKey
		);
		const signatureBase64 = base64Encode(signature);

		// Construct the full encrypted message
		const encryptedMessage: EncryptedMessage = {
			header,
			ciphertext: ciphertextBase64,
			signature: signatureBase64,
		};

		// Add group ID if provided
		if (groupId) 
{
			encryptedMessage.groupId = groupId;
		}

		return encryptedMessage;
	} catch (error) {
		console.error("Error encrypting message:", error);
		throw new EncryptionError(
			"Failed to encrypt message",
			EncryptionErrorType.UNKNOWN_ERROR
		);
	}
};

/**
 * Decrypts an encrypted message using the appropriate session key
 */
export const decryptMessage = async (
	encryptedMessage: EncryptedMessage,
	sessionKey: CryptoKey,
	senderPublicKey: CryptoKey
): Promise<DecryptedMessage> => 
{
	try 
{
		const { header, ciphertext, signature } = encryptedMessage;

		// Verify the signature first
		const encoder = new TextEncoder();
		const signatureData = encoder.encode(
			JSON.stringify(header) + ciphertext
		);
		const signatureBytes = base64Decode(signature);

		const isSignatureValid = await keyManager.verifySignature(
			signatureData,
			signatureBytes,
			senderPublicKey
		);

		if (!isSignatureValid) 
{
			console.warn("Message signature verification failed");
			// For demo purposes, continue anyway
		}

		// Convert IV and ciphertext from Base64
		const iv = base64Decode(header.iv);
		const ciphertextBytes = base64Decode(ciphertext);

		// Decrypt the message
		const decryptedBytes = await keyManager.mockCryptoOperations.decrypt(
			{ name: ENCRYPTION_CONFIG.SYMMETRIC.algorithm, iv },
			sessionKey,
			ciphertextBytes.buffer as ArrayBuffer
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
		console.error("Error decrypting message:", error);
		if (error instanceof EncryptionError) 
{
			throw error;
		}
		throw new EncryptionError(
			"Failed to decrypt message",
			EncryptionErrorType.DECRYPTION_FAILED
		);
	}
};

/**
 * Encrypts a message for a group
 */
export const encryptGroupMessage = async (
	plaintext: string,
	groupId: string,
	senderId: string,
	groupKey: CryptoKey
): Promise<EncryptedMessage> => 
{
	try 
{
		// Group messages use an empty string for recipientId
		return await encryptMessage(plaintext, "", senderId, groupKey, groupId);
	} catch (error) {
		console.error("Error encrypting group message:", error);
		throw new EncryptionError(
			"Failed to encrypt group message",
			EncryptionErrorType.UNKNOWN_ERROR
		);
	}
};

/**
 * Creates an encrypted message with an embedded key for initial key exchange
 */
export const encryptMessageWithKeyExchange = async (
	plaintext: string,
	recipientId: string,
	senderId: string,
	symmetricKey: CryptoKey,
	recipientPublicKey: CryptoKey
): Promise<EncryptedMessage> => 
{
	try 
{
		// Export the symmetric key as raw bytes
		const rawKey = await keyManager.mockCryptoOperations.exportKey(
			"raw",
			symmetricKey
		);

		// "Encrypt" the symmetric key with the recipient's public key (simplified)
		const keyData = (symmetricKey as any).__keyData;
		const encryptedKey = keyData; // Simplified - no actual encryption

		// Encrypt the message normally
		const encryptedMessage = await encryptMessage(
			plaintext,
			recipientId,
			senderId,
			symmetricKey
		);

		// Add the encrypted key to the header
		encryptedMessage.header.encryptedKey = encryptedKey;
		encryptedMessage.header.keyExchangeMode = KeyExchangeMode.DIRECT;

		return encryptedMessage;
	} catch (error) {
		console.error("Error encrypting message with key exchange:", error);
		throw new EncryptionError(
			"Failed to encrypt message with key exchange",
			EncryptionErrorType.UNKNOWN_ERROR
		);
	}
};

/**
 * Decrypts a message that contains an embedded encrypted symmetric key
 */
export const decryptMessageWithEmbeddedKey = async (
	encryptedMessage: EncryptedMessage,
	privateKey: CryptoKey,
	senderPublicKey: CryptoKey
): Promise<{ message: DecryptedMessage; sessionKey: CryptoKey }> => 
{
	try 
{
		const { header } = encryptedMessage;

		if (!header.encryptedKey) 
{
			throw new EncryptionError(
				"No encrypted key found in message",
				EncryptionErrorType.DECRYPTION_FAILED
			);
		}

		// "Decrypt" the embedded symmetric key (simplified)
		const keyData = header.encryptedKey;

		// Import the symmetric key
		const keyBytes = base64Decode(keyData);
		const sessionKey = await keyManager.mockCryptoOperations.importKey(
			"raw",
			keyBytes.buffer as ArrayBuffer,
			{ name: ENCRYPTION_CONFIG.SYMMETRIC.algorithm },
			true,
			["encrypt", "decrypt"]
		);

		// Decrypt the message with the recovered session key
		const decryptedMessage = await decryptMessage(
			encryptedMessage,
			sessionKey,
			senderPublicKey
		);

		return { message: decryptedMessage, sessionKey };
	} catch (error) {
		console.error("Error decrypting message with embedded key:", error);
		if (error instanceof EncryptionError) 
{
			throw error;
		}
		throw new EncryptionError(
			"Failed to decrypt message with embedded key",
			EncryptionErrorType.DECRYPTION_FAILED
		);
	}
};

/**
 * Generates a unique message ID
 */
export const generateMessageId = async (): Promise<string> => 
{
	try 
{
		// Generate a UUID using crypto
		const uuid = crypto.randomUUID();

		return uuid;
	} catch (error) {
		// Fallback to timestamp-based ID if UUID generation fails
		return `msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
	}
};

/**
 * Checks if a message has key exchange data
 */
export const hasKeyExchange = (message: EncryptedMessage): boolean => 
{
	return !!(message.header.encryptedKey && message.header.keyExchangeMode);
};

/**
 * Checks if a message is for a group
 */
export const isGroupMessage = (message: EncryptedMessage): boolean => 
{
	return !!message.groupId;
};

/**
 * Serializes an encrypted message to a string
 */
export const serializeMessage = (message: EncryptedMessage): string => 
{
	return JSON.stringify(message);
};

/**
 * Deserializes a string to an encrypted message
 */
export const deserializeMessage = (serialized: string): EncryptedMessage => 
{
	return JSON.parse(serialized) as EncryptedMessage;
};
