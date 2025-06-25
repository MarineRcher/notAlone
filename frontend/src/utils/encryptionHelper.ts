/**
 * Encryption Helper Utilities
 * 
 * This file contains helper utilities for encryption that work with
 * the modular Noble Signal Protocol implementation.
 */

import type { EncryptedMessage, DecryptedMessage } from '../crypto/types';

// Updated interfaces to work with the new Noble implementation
interface MessageMetadata {
	messageId: string;
	timestamp: number;
	groupId: string;
	senderId: string;
	keyIndex: number;
}

/**
 * Formats a timestamp from an encrypted message into a readable date/time
 * @param timestamp The timestamp in milliseconds
 * @returns A formatted date string
 */
export function formatMessageTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diffMs = now.getTime() - timestamp;
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffMins < 1) {
		return 'Just now';
	} else if (diffMins < 60) {
		return `${diffMins}m ago`;
	} else if (diffHours < 24) {
		return `${diffHours}h ago`;
	} else if (diffDays < 7) {
		return `${diffDays}d ago`;
	} else {
		return date.toLocaleDateString();
	}
}

/**
 * Extracts metadata from an encrypted message without decrypting it
 * @param encryptedMessage The encrypted message
 * @returns Message metadata
 */
export function extractMessageMetadata(encryptedMessage: EncryptedMessage): MessageMetadata {
	return {
		messageId: encryptedMessage.messageId,
		timestamp: encryptedMessage.timestamp,
		groupId: encryptedMessage.groupId,
		senderId: encryptedMessage.senderId,
		keyIndex: encryptedMessage.keyIndex
	};
}

/**
 * Validates that an encrypted message has all required fields
 * @param message The message to validate
 * @returns True if valid, false otherwise
 */
export function validateEncryptedMessage(message: any): message is EncryptedMessage {
	return (
		typeof message === 'object' &&
		typeof message.messageId === 'string' &&
		typeof message.timestamp === 'number' &&
		typeof message.groupId === 'string' &&
		typeof message.senderId === 'string' &&
		Array.isArray(message.encryptedPayload) &&
		Array.isArray(message.signature) &&
		typeof message.keyIndex === 'number'
	);
}

/**
 * Creates a DecryptedMessage object from decrypted content and metadata
 * @param content The decrypted message content
 * @param metadata The message metadata
 * @param verified Whether the signature was verified
 * @returns A DecryptedMessage object
 */
export function createDecryptedMessage(
	content: string,
	metadata: MessageMetadata,
	verified: boolean = true
): DecryptedMessage {
	return {
		messageId: metadata.messageId,
		content,
		senderId: metadata.senderId,
		timestamp: metadata.timestamp,
		verified,
		groupId: metadata.groupId
	};
}

/**
 * Truncates a message ID for display purposes
 * @param messageId The full message ID
 * @param maxLength Maximum length to display
 * @returns Truncated message ID
 */
export function truncateMessageId(messageId: string, maxLength: number = 12): string {
	if (messageId.length <= maxLength) {
		return messageId;
	}
	const start = Math.floor(maxLength / 2) - 1;
	const end = messageId.length - (maxLength - start - 3);
	return `${messageId.substring(0, start)}...${messageId.substring(end)}`;
}

/**
 * Gets a display name for a sender (could be extended to use a user lookup)
 * @param senderId The sender's ID
 * @returns A display name
 */
export function getSenderDisplayName(senderId: string): string {
	// For now, just return the sender ID
	// In a real app, you'd look up the user's display name
	return senderId;
}

/**
 * Checks if a message is from the current user
 * @param senderId The sender's ID
 * @param currentUserId The current user's ID
 * @returns True if the message is from the current user
 */
export function isOwnMessage(senderId: string, currentUserId: string): boolean {
	return senderId === currentUserId;
}

/**
 * Estimates the encrypted message size
 * @param plaintext The original plaintext
 * @returns Estimated size in bytes
 */
export function estimateEncryptedSize(plaintext: string): number {
	const plaintextBytes = new TextEncoder().encode(plaintext).length;
	const overhead = 12 + 16 + 64 + 100; // nonce + auth tag + signature + metadata
	return plaintextBytes + overhead;
}

/**
 * Creates a debug summary of an encrypted message (without revealing content)
 * @param message The encrypted message
 * @returns Debug information
 */
export function getMessageDebugInfo(message: EncryptedMessage): string {
	const payloadSize = message.encryptedPayload.length;
	const signatureSize = message.signature.length;
	const age = Date.now() - message.timestamp;
	
	return [
		`ID: ${truncateMessageId(message.messageId)}`,
		`Group: ${message.groupId}`,
		`From: ${message.senderId}`,
		`Size: ${payloadSize}b + ${signatureSize}b sig`,
		`Age: ${Math.floor(age / 1000)}s`,
		`KeyIdx: ${message.keyIndex}`
	].join(' | ');
}

/**
 * Validates message ordering (helpful for debugging out-of-order delivery)
 * @param messages Array of encrypted messages
 * @returns True if messages are in chronological order
 */
export function validateMessageOrder(messages: EncryptedMessage[]): boolean {
	for (let i = 1; i < messages.length; i++) {
		if (messages[i].timestamp < messages[i - 1].timestamp) {
			return false;
		}
	}
	return true;
}

/**
 * Sorts messages by timestamp
 * @param messages Array of messages to sort
 * @returns Sorted array (new array, doesn't mutate original)
 */
export function sortMessagesByTime<T extends { timestamp: number }>(messages: T[]): T[] {
	return [...messages].sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Groups messages by sender
 * @param messages Array of messages
 * @returns Map of senderId to messages
 */
export function groupMessagesBySender<T extends { senderId: string }>(
	messages: T[]
): Map<string, T[]> {
	const groups = new Map<string, T[]>();
	
	for (const message of messages) {
		const existing = groups.get(message.senderId) || [];
		existing.push(message);
		groups.set(message.senderId, existing);
	}
	
	return groups;
}

/**
 * Filters messages within a time range
 * @param messages Array of messages
 * @param startTime Start timestamp (inclusive)
 * @param endTime End timestamp (inclusive)
 * @returns Filtered messages
 */
export function filterMessagesByTimeRange<T extends { timestamp: number }>(
	messages: T[],
	startTime: number,
	endTime: number
): T[] {
	return messages.filter(msg => 
		msg.timestamp >= startTime && msg.timestamp <= endTime
	);
}

/**
 * Constants for common crypto operations
 */
export const CRYPTO_CONSTANTS = {
	MAX_MESSAGE_SIZE: 1024 * 64, // 64KB max message size
	KEY_ROTATION_INTERVAL: 1000, // Rotate keys every 1000 messages
	MAX_SKIPPED_MESSAGES: 1000, // Maximum messages to skip before failing
	SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
} as const;
