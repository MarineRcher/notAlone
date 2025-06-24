/**
 * Encryption Helpers
 *
 * This file contains helper utilities for encryption that don't fit directly
 * in the main encryption modules but are useful for common encryption tasks.
 */

import { EncryptedMessage, DecryptedMessage } from "../crypto/types";
import * as utils from "../crypto/utils";

/**
 * Formats a timestamp from an encrypted message into a readable date/time
 * @param timestamp The timestamp in milliseconds
 * @returns A formatted date string
 */
export const formatMessageTime = (timestamp: number): string => 
{
	const date = new Date(timestamp);

	return date.toLocaleString();
};

/**
 * Creates a unique chat ID for a conversation between two users
 * @param userId1 First user ID
 * @param userId2 Second user ID
 * @returns A deterministic chat ID for the conversation
 */
export const createDirectChatId = (
	userId1: string,
	userId2: string
): string => 
{
	// Sort the IDs to ensure the same chat ID regardless of order
	const sortedIds = [userId1, userId2].sort();

	return `chat-${sortedIds[0]}-${sortedIds[1]}`;
};

/**
 * Validates if a message was received within the acceptable time range
 * to prevent replay attacks
 * @param timestamp The message timestamp
 * @param maxAgeMinutes Maximum acceptable age in minutes (default: 5)
 * @returns True if the message is within the valid time range
 */
export const isMessageTimeValid = (
	timestamp: number,
	maxAgeMinutes = 5
): boolean => 
{
	return utils.isTimestampValid(timestamp, maxAgeMinutes);
};

/**
 * Prepares a message object for display in the UI
 * @param decryptedMessage The decrypted message from encryption
 * @param currentUserId The current user's ID
 * @returns A formatted message object ready for UI rendering
 */
export const prepareMessageForDisplay = (
	decryptedMessage: DecryptedMessage,
	currentUserId: string
) => 
{
	const isOwnMessage = decryptedMessage.senderId === currentUserId;

	return {
		id: decryptedMessage.messageId,
		text: decryptedMessage.content,
		sender: decryptedMessage.senderId,
		timestamp: decryptedMessage.timestamp,
		time: formatMessageTime(decryptedMessage.timestamp),
		isOwn: isOwnMessage,
		isVerified: decryptedMessage.verified,
		groupId: decryptedMessage.groupId,
	};
};

/**
 * Generates a fingerprint for a public key that can be displayed to users
 * for manual verification
 * @param publicKeyBase64 Base64-encoded public key
 * @returns A readable fingerprint string (e.g., "AB12 CD34 EF56...")
 */
export const generateKeyFingerprint = (publicKeyBase64: string): string => 
{
	try 
{
		// Convert base64 to bytes
		const keyBytes = utils.base64ToBytes(publicKeyBase64);

		// Take the first 16 bytes and convert to hex
		const fingerprintBytes = keyBytes.slice(0, 16);
		const fingerprintHex = Array.from(fingerprintBytes)
			.map((byte) => byte.toString(16).padStart(2, "0"))
			.join("");

		// Format with spaces for readability (groups of 4 characters)
		return (
			fingerprintHex
				.toUpperCase()
				.match(/.{1,4}/g)
				?.join(" ") || ""
		);
	} catch (error) {
		console.error("Error generating key fingerprint:", error);
		return "";
	}
};

/**
 * Checks if a message needs to be retried because the session is still initializing
 * @param error The error from an encryption operation
 * @returns True if the message should be retried
 */
export const shouldRetryMessage = (error: any): boolean => 
{
	return (
		error
		&& error.name === "EncryptionError"
		&& error.type === "session_not_established"
	);
};

/**
 * Estimates the security strength of the encryption configuration
 * @returns An object with security metrics
 */
export const getEncryptionSecurityMetrics = () => 
{
	return {
		keyStrength: "Strong (2048-bit RSA / 256-bit AES)",
		forwardSecrecy: true,
		verifiedMessages: true,
		recommendedRotationPeriod: "7 days for group chats",
		endToEndEncrypted: true,
	};
};

/**
 * Safely serializes an encrypted message for storage or transmission
 * @param message The encrypted message object
 * @returns A string representation of the message
 */
export const serializeForStorage = (message: EncryptedMessage): string => 
{
	try 
{
		return JSON.stringify(message);
	} catch (error) {
		console.error("Error serializing message:", error);
		throw new Error("Failed to serialize encrypted message");
	}
};

/**
 * Safely parses a serialized encrypted message
 * @param serialized The serialized message string
 * @returns The parsed EncryptedMessage object
 */
export const parseFromStorage = (serialized: string): EncryptedMessage => 
{
	try 
{
		return JSON.parse(serialized) as EncryptedMessage;
	} catch (error) {
		console.error("Error parsing encrypted message:", error);
		throw new Error("Failed to parse encrypted message");
	}
};
