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
function base64Encode(bytes: Uint8Array): string {
	let binary = "";

	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64Decode(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

/**
 * Encrypts a message for a specific recipient using their session key
 * SIMPLIFIED implementation for React Native compatibility
 */
export async function encryptMessage(
	plaintext: string,
	recipientId: string,
	senderId: string,
	sessionKey: CryptoKey,
	groupId?: string
): Promise<EncryptedMessage> {
	try {
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
		if (groupId) {
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
}

/**
 * Decrypts an encrypted message using the appropriate session key
 */
export async function decryptMessage(
	encryptedMessage: EncryptedMessage,
	sessionKey: CryptoKey,
	senderPublicKey: CryptoKey
): Promise<DecryptedMessage> {
	try {
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

		if (!isSignatureValid) {
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
		if (error instanceof EncryptionError) {
			throw error;
		}
		throw new EncryptionError(
			"Failed to decrypt message",
			EncryptionErrorType.DECRYPTION_FAILED
		);
	}
}

/**
 * Encrypts a message for a group
 */
export async function encryptGroupMessage(
	plaintext: string,
	groupId: string,
	senderId: string,
	groupKey: CryptoKey
): Promise<EncryptedMessage> {
	try {
		// Group messages use an empty string for recipientId
		return await encryptMessage(plaintext, "", senderId, groupKey, groupId);
	} catch (error) {
		console.error("Error encrypting group message:", error);
		throw new EncryptionError(
			"Failed to encrypt group message",
			EncryptionErrorType.UNKNOWN_ERROR
		);
	}
}

/**
 * Encrypts a message with key exchange for first-time communication
 */
export async function encryptMessageWithKeyExchange(
	plaintext: string,
	recipientId: string,
	senderId: string,
	symmetricKey: CryptoKey,
	recipientPublicKey: CryptoKey
): Promise<EncryptedMessage> {
	try {
		// First, encrypt the message normally
		const encryptedMessage = await encryptMessage(
			plaintext,
			recipientId,
			senderId,
			symmetricKey
		);

		// Export the symmetric key and encrypt it with recipient's public key
		const keyData = await keyManager.mockCryptoOperations.exportKey(
			"raw",
			symmetricKey
		);

		const encryptedKey = await keyManager.mockCryptoOperations.encrypt(
			{ name: "RSA-OAEP" },
			recipientPublicKey,
			keyData
		);

		// Add the encrypted key to the message header
		encryptedMessage.header.encryptedKey = base64Encode(
			new Uint8Array(encryptedKey)
		);
		encryptedMessage.header.keyExchangeMode = KeyExchangeMode.DIRECT;

		return encryptedMessage;
	} catch (error) {
		console.error("Error encrypting message with key exchange:", error);
		throw new EncryptionError(
			"Failed to encrypt message with key exchange",
			EncryptionErrorType.UNKNOWN_ERROR
		);
	}
}

/**
 * Decrypts a message that includes an embedded encrypted session key
 */
export async function decryptMessageWithEmbeddedKey(
	encryptedMessage: EncryptedMessage,
	privateKey: CryptoKey,
	senderPublicKey: CryptoKey
): Promise<{ message: DecryptedMessage; sessionKey: CryptoKey }> {
	try {
		if (!encryptedMessage.header.encryptedKey) {
			throw new EncryptionError(
				"Message does not contain embedded key",
				EncryptionErrorType.DECRYPTION_FAILED
			);
		}

		// Decrypt the session key using our private key
		const encryptedKeyBytes = base64Decode(
			encryptedMessage.header.encryptedKey
		);

		const decryptedKeyData = await keyManager.mockCryptoOperations.decrypt(
			{ name: "RSA-OAEP" },
			privateKey,
			encryptedKeyBytes.buffer as ArrayBuffer
		);

		// Import the session key
		const sessionKey = await keyManager.mockCryptoOperations.importKey(
			"raw",
			decryptedKeyData,
			{ name: ENCRYPTION_CONFIG.SYMMETRIC.algorithm },
			false,
			["encrypt", "decrypt"]
		);

		// Now decrypt the message using the recovered session key
		const message = await decryptMessage(
			encryptedMessage,
			sessionKey,
			senderPublicKey
		);

		return { message, sessionKey };
	} catch (error) {
		console.error("Error decrypting message with embedded key:", error);
		if (error instanceof EncryptionError) {
			throw error;
		}
		throw new EncryptionError(
			"Failed to decrypt message with embedded key",
			EncryptionErrorType.DECRYPTION_FAILED
		);
	}
}

/**
 * Generates a unique message ID
 */
export async function generateMessageId(): Promise<string> {
	try {
		// Use crypto.randomUUID if available
		return await crypto.randomUUID();
	} catch (error) {
		// Fallback to timestamp + random bytes
		const timestamp = Date.now().toString(36);
		const random = base64Encode(crypto.getRandomBytes(8)).substring(0, 8);

		return `msg-${timestamp}-${random}`;
	}
}

/**
 * Checks if a message contains a key exchange
 */
export function hasKeyExchange(message: EncryptedMessage): boolean {
	return !!message.header.encryptedKey;
}

/**
 * Checks if a message is a group message
 */
export function isGroupMessage(message: EncryptedMessage): boolean {
	return !!message.groupId;
}

/**
 * Serializes an encrypted message to a JSON string
 */
export function serializeMessage(message: EncryptedMessage): string {
	return JSON.stringify(message);
}

/**
 * Deserializes a JSON string to an encrypted message
 */
export function deserializeMessage(serialized: string): EncryptedMessage {
	return JSON.parse(serialized) as EncryptedMessage;
}
