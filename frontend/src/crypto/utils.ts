/**
 * End-to-End Encryption Utilities
 * 
 * This file contains helper functions for the E2EE implementation,
 * including data conversion, validation, and other common tasks.
 */

import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import * as crypto from 'expo-crypto';
import { ENCRYPTION_CONFIG } from './config';
import { EncryptionError, EncryptionErrorType } from './types';

/**
 * Converts a string to a Uint8Array using UTF-8 encoding
 * @param str The string to convert
 * @returns A Uint8Array representing the string
 */
export const stringToBytes = (str: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

/**
 * Converts a Uint8Array to a string using UTF-8 encoding
 * @param bytes The Uint8Array to convert
 * @returns The decoded string
 */
export const bytesToString = (bytes: Uint8Array): string => {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
};

/**
 * Converts a Uint8Array to a Base64 string
 * @param bytes The Uint8Array to convert
 * @returns The Base64 encoded string
 */
export const bytesToBase64 = (bytes: Uint8Array): string => {
  return Buffer.from(bytes).toString('base64');
};

/**
 * Converts a Base64 string to a Uint8Array
 * @param base64 The Base64 string to convert
 * @returns The decoded Uint8Array
 */
export const base64ToBytes = (base64: string): Uint8Array => {
  return new Uint8Array(Buffer.from(base64, 'base64'));
};

/**
 * Validates that a value is a non-empty string
 * @param value The value to validate
 * @param name The name of the parameter (for error messages)
 * @throws EncryptionError if validation fails
 */
export const validateString = (value: any, name: string): void => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new EncryptionError(
      `${name} must be a non-empty string`,
      EncryptionErrorType.UNKNOWN_ERROR
    );
  }
};

/**
 * Validates that a value is a valid encrypted message object
 * @param message The message to validate
 * @throws EncryptionError if validation fails
 */
export const validateEncryptedMessage = (message: any): void => {
  if (!message || typeof message !== 'object') {
    throw new EncryptionError(
      'Invalid message format',
      EncryptionErrorType.DECRYPTION_FAILED
    );
  }

  if (!message.header || !message.ciphertext || !message.signature) {
    throw new EncryptionError(
      'Message is missing required fields',
      EncryptionErrorType.DECRYPTION_FAILED
    );
  }

  const { header } = message;
  if (!header.version || !header.senderId || !header.messageId || !header.timestamp || !header.iv) {
    throw new EncryptionError(
      'Message header is missing required fields',
      EncryptionErrorType.DECRYPTION_FAILED
    );
  }
};

/**
 * Checks if crypto APIs are available in the current environment
 * @returns True if crypto is fully available, false otherwise
 */
export const isCryptoAvailable = (): boolean => {
  try {
    return (
      typeof global.crypto !== 'undefined' &&
      typeof global.crypto.subtle !== 'undefined' &&
      typeof global.crypto.subtle.encrypt === 'function'
    );
  } catch (error) {
    return false;
  }
};

/**
 * Generates a random string of the specified length
 * @param length The desired length of the random string
 * @returns A random string
 */
export const generateRandomString = async (length: number = 16): Promise<string> => {
  try {
    // Use crypto.getRandomValues if available (modern browsers)
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytesToBase64(bytes).substring(0, length);
  } catch (error) {
    // Fallback for environments without crypto.getRandomValues
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};

/**
 * Generates a unique session ID
 * @returns A unique session ID string
 */
export const generateSessionId = async (): Promise<string> => {
  try {
    // Use randomUUID if available
    return await crypto.randomUUID();
  } catch (error) {
    // Fallback to timestamp + random string
    const timestamp = Date.now().toString(36);
    const randomStr = await generateRandomString(8);
    return `session-${timestamp}-${randomStr}`;
  }
};

/**
 * Safely parses JSON with error handling
 * @param jsonString The JSON string to parse
 * @param defaultValue The default value to return if parsing fails
 * @returns The parsed object or the default value
 */
export const safeJsonParse = <T>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('Error parsing JSON:', error);
    return defaultValue;
  }
};

/**
 * Checks if the current environment supports SecureStore
 * @returns True if SecureStore is supported, false otherwise
 */
export const isSecureStoreSupported = (): boolean => {
  // SecureStore is only available on iOS and Android
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Compares two strings in constant time to prevent timing attacks
 * @param a The first string
 * @param b The second string
 * @returns True if the strings match, false otherwise
 */
export const constantTimeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

/**
 * Creates a deep copy of an object
 * @param obj The object to clone
 * @returns A deep copy of the object
 */
export const deepCopy = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj)) as T;
};

/**
 * Verifies that the version in a message header is compatible
 * @param version The version to check
 * @returns True if the version is compatible, false otherwise
 */
export const isVersionCompatible = (version: string): boolean => {
  const currentVersion = ENCRYPTION_CONFIG.MESSAGE.version;
  
  // Simple version check - can be extended for more complex version compatibility
  return version === currentVersion;
};

/**
 * Gets the current timestamp in milliseconds
 * @returns The current timestamp
 */
export const getCurrentTimestamp = (): number => {
  return Date.now();
};

/**
 * Validates that a timestamp is within an acceptable range
 * @param timestamp The timestamp to validate
 * @param maxAgeMinutes The maximum age in minutes (default: 5)
 * @returns True if the timestamp is valid, false otherwise
 */
export const isTimestampValid = (timestamp: number, maxAgeMinutes: number = 5): boolean => {
  const now = getCurrentTimestamp();
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  
  // Check if timestamp is in the future (with small buffer for clock skew)
  if (timestamp > now + 60 * 1000) {
    return false;
  }
  
  // Check if timestamp is too old
  if (now - timestamp > maxAgeMs) {
    return false;
  }
  
  return true;
};

/**
 * Trims or pads a key to the specified length
 * @param key The key to normalize
 * @param length The desired length
 * @returns A Uint8Array of the specified length
 */
export const normalizeKeyLength = (key: Uint8Array, length: number): Uint8Array => {
  if (key.length === length) {
    return key;
  }
  
  if (key.length > length) {
    // Trim the key
    return key.slice(0, length);
  }
  
  // Pad the key
  const result = new Uint8Array(length);
  result.set(key);
  
  // Fill the rest with zeros
  for (let i = key.length; i < length; i++) {
    result[i] = 0;
  }
  
  return result;
};

/**
 * Delays execution for the specified number of milliseconds
 * @param ms The number of milliseconds to delay
 * @returns A promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retries a function multiple times with exponential backoff
 * @param fn The function to retry
 * @param maxRetries The maximum number of retries
 * @param baseDelayMs The base delay in milliseconds
 * @returns The result of the function
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 300
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Calculate exponential backoff
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      
      // Wait before next attempt
      await delay(delayMs);
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
};

/**
 * Converts an ArrayBuffer to a Uint8Array
 * @param buffer The ArrayBuffer to convert
 * @returns A Uint8Array
 */
export const arrayBufferToUint8Array = (buffer: ArrayBuffer): Uint8Array => {
  return new Uint8Array(buffer);
};

/**
 * Generates a deterministic key identifier from a CryptoKey
 * @param key The CryptoKey
 * @returns Promise resolving to a string key identifier
 */
export const generateKeyId = async (key: CryptoKey): Promise<string> => {
  try {
    // Export the key (if possible) to generate its fingerprint
    const subtle = global.crypto.subtle;
    const format = key.type === 'private' ? 'pkcs8' : 'spki';
    
    const exported = await subtle.exportKey(format, key);
    const keyData = new Uint8Array(exported);
    
    // Hash the key data
    const hashBuffer = await crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      bytesToBase64(keyData)
    );
    
    // Return the first 16 characters of the hash
    return hashBuffer.substring(0, 16);
  } catch (error) {
    // If we can't export the key, use a random identifier
    console.warn('Unable to generate deterministic key ID, using random ID instead');
    return await generateRandomString(16);
  }
};