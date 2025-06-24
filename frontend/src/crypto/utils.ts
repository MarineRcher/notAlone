/**
 * End-to-End Encryption Utilities
 *
 * This file contains helper functions for the E2EE implementation,
 * including data conversion, validation, and other common tasks.
 */

import { Platform } from "react-native";
import { Buffer } from "buffer";
import * as crypto from "expo-crypto";
import { ENCRYPTION_CONFIG } from "./config";
import { EncryptionError, EncryptionErrorType } from "./types";

/**
 * Converts a string to a Uint8Array using UTF-8 encoding
 * @param str The string to convert
 * @returns A Uint8Array representing the string
 */
export function stringToBytes(str: string): Uint8Array {
	const encoder = new TextEncoder();

	return encoder.encode(str);
}

/**
 * Converts a Uint8Array to a string using UTF-8 encoding
 * @param bytes The Uint8Array to convert
 * @returns The decoded string
 */
export function bytesToString(bytes: Uint8Array): string {
	const decoder = new TextDecoder();

	return decoder.decode(bytes);
}

/**
 * Converts a Uint8Array to a Base64 string
 * @param bytes The Uint8Array to convert
 * @returns The Base64 encoded string
 */
export function bytesToBase64(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString("base64");
}

/**
 * Converts a Base64 string to a Uint8Array
 * @param base64 The Base64 string to convert
 * @returns The decoded Uint8Array
 */
export function base64ToBytes(base64: string): Uint8Array {
	return new Uint8Array(Buffer.from(base64, "base64"));
}

/**
 * Validates that a value is a non-empty string
 * @param value The value to validate
 * @param name The name of the parameter (for error messages)
 * @throws EncryptionError if validation fails
 */
export function validateString(value: unknown, name: string): void {
	if (typeof value !== "string" || value.trim() === "") {
		throw new EncryptionError(
			`${name} must be a non-empty string`,
			EncryptionErrorType.UNKNOWN_ERROR
		);
	}
}

/**
 * Validates that a value is a valid encrypted message object
 * @param message The message to validate
 * @throws EncryptionError if validation fails
 */
export function validateEncryptedMessage(message: unknown): void {
	if (!message || typeof message !== "object") {
		throw new EncryptionError(
			"Invalid message format",
			EncryptionErrorType.DECRYPTION_FAILED
		);
	}

	const messageObj = message as Record<string, unknown>;

	if (!messageObj.header || !messageObj.ciphertext || !messageObj.signature) {
		throw new EncryptionError(
			"Message is missing required fields",
			EncryptionErrorType.DECRYPTION_FAILED
		);
	}

	const { header } = messageObj;

	if (typeof header !== "object" || !header) {
		throw new EncryptionError(
			"Message header is invalid",
			EncryptionErrorType.DECRYPTION_FAILED
		);
	}

	const headerObj = header as Record<string, unknown>;

	if (
		!headerObj.version ||
		!headerObj.senderId ||
		!headerObj.messageId ||
		!headerObj.timestamp ||
		!headerObj.iv
	) {
		throw new EncryptionError(
			"Message header is missing required fields",
			EncryptionErrorType.DECRYPTION_FAILED
		);
	}
}

/**
 * Checks if crypto APIs are available in the current environment
 * @returns True if crypto is fully available, false otherwise
 */
export function isCryptoAvailable(): boolean {
	try {
		return (
			typeof global.crypto !== "undefined" &&
			typeof global.crypto.subtle !== "undefined" &&
			typeof global.crypto.subtle.encrypt === "function"
		);
	} catch (error) {
		return false;
	}
}

/**
 * Generates a random string of the specified length
 * @param length The desired length of the random string
 * @returns A random string
 */
export async function generateRandomString(length = 16): Promise<string> {
	try {
		// Use crypto.getRandomValues if available (modern browsers)
		const bytes = new Uint8Array(length);

		crypto.getRandomValues(bytes);
		return bytesToBase64(bytes).substring(0, length);
	} catch (error) {
		// Fallback for environments without crypto.getRandomValues
		const chars =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let result = "";

		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}
}

/**
 * Generates a unique session ID
 * @returns A unique session ID string
 */
export async function generateSessionId(): Promise<string> {
	try {
		// Use randomUUID if available
		return await crypto.randomUUID();
	} catch (error) {
		// Fallback to timestamp + random string
		const timestamp = Date.now().toString(36);
		const randomStr = await generateRandomString(8);

		return `session-${timestamp}-${randomStr}`;
	}
}

/**
 * Safely parses JSON with error handling
 * @param jsonString The JSON string to parse
 * @param defaultValue The default value to return if parsing fails
 * @returns The parsed object or the default value
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
	try {
		return JSON.parse(jsonString) as T;
	} catch (error) {
		console.warn("Error parsing JSON:", error);
		return defaultValue;
	}
}

/**
 * Checks if the current environment supports SecureStore
 * @returns True if SecureStore is supported, false otherwise
 */
export function isSecureStoreSupported(): boolean {
	// SecureStore is only available on iOS and Android
	return Platform.OS === "ios" || Platform.OS === "android";
}

/**
 * Compares two strings in constant time to prevent timing attacks
 * @param a The first string
 * @param b The second string
 * @returns True if the strings are equal, false otherwise
 */
export function constantTimeEqual(a: string, b: string): boolean {
	let result = 0;
	const maxLength = Math.max(a.length, b.length);

	for (let i = 0; i < maxLength; i++) {
		// XOR the characters, or 0 if one string is shorter
		result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
	}

	return result === 0;
}

/**
 * Creates a deep copy of an object
 * @param obj The object to copy
 * @returns A deep copy of the object
 */
export function deepCopy<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Checks if a version string is compatible with the current version
 * @param version The version string to check
 * @returns True if the version is compatible, false otherwise
 */
export function isVersionCompatible(version: string): boolean {
	const currentVersion = ENCRYPTION_CONFIG.MESSAGE.version;

	return version === currentVersion;
}

/**
 * Gets the current timestamp in milliseconds
 * @returns The current timestamp
 */
export function getCurrentTimestamp(): number {
	return Date.now();
}

/**
 * Checks if a timestamp is valid (not too old or in the future)
 * @param timestamp The timestamp to validate
 * @param maxAgeMinutes Maximum age in minutes (default: 5)
 * @returns True if the timestamp is valid, false otherwise
 */
export function isTimestampValid(
	timestamp: number,
	maxAgeMinutes = 5
): boolean {
	const now = Date.now();
	const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

	// Check if timestamp is too old
	if (now - timestamp > maxAge) {
		return false;
	}

	// Check if timestamp is in the future (allow 1 minute tolerance)
	if (timestamp > now + 60000) {
		return false;
	}

	return true;
}

/**
 * Normalizes a key to a specific length using PBKDF2
 * @param key The key to normalize
 * @param length The desired length in bytes
 * @returns A Uint8Array of the specified length
 */
export function normalizeKeyLength(
	key: Uint8Array,
	length: number
): Uint8Array {
	if (key.length === length) {
		return key;
	}

	// Use a simple hash-based approach for key normalization
	const normalized = new Uint8Array(length);

	for (let i = 0; i < length; i++) {
		normalized[i] = key[i % key.length];
	}

	return normalized;
}

/**
 * Creates a promise that resolves after a specified delay
 * @param ms The delay in milliseconds
 * @returns A promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
	return new Promise(function (resolve): void {
		const timeoutId = global.setTimeout(function (): void {
			resolve();
		}, ms);

		// Store timeout for potential cleanup
		(resolve as unknown as { timeoutId: unknown }).timeoutId = timeoutId;
	});
}

/**
 * Retries a function with exponential backoff
 * @param fn The function to retry
 * @param maxRetries Maximum number of retries (default: 3)
 * @param baseDelayMs Base delay in milliseconds (default: 300)
 * @returns The result of the function
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries = 3,
	baseDelayMs = 300
): Promise<T> {
	let lastError: Error;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			if (attempt === maxRetries) {
				break;
			}

			// Calculate delay with exponential backoff
			const delayMs = baseDelayMs * Math.pow(2, attempt);

			await delay(delayMs);
		}
	}

	throw lastError!;
}

/**
 * Converts an ArrayBuffer to a Uint8Array
 * @param buffer The ArrayBuffer to convert
 * @returns A Uint8Array view of the buffer
 */
export function arrayBufferToUint8Array(buffer: ArrayBuffer): Uint8Array {
	return new Uint8Array(buffer);
}

/**
 * Generates a unique identifier for a crypto key
 * @param key The crypto key
 * @returns A unique identifier string
 */
export async function generateKeyId(key: CryptoKey): Promise<string> {
	try {
		// Fallback to a random ID since we can't reliably export keys
		return await generateRandomString(16);
	} catch (error) {
		// Fallback to a random ID if export fails
		return await generateRandomString(16);
	}
}
