/**
 * End-to-End Encryption Secure Storage
 * 
 * This file contains functions for securely storing and retrieving
 * cryptographic keys and other sensitive data for the E2EE implementation.
 * It utilizes Expo SecureStore for encrypted storage on the device.
 */

import * as SecureStore from 'expo-secure-store';
import { ENCRYPTION_CONFIG } from './config';

// Constants for storage
const { keyPrefix } = ENCRYPTION_CONFIG.STORAGE;

/**
 * Options for secure storage
 */
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: 'app.e2ee.keys', // Used for iOS keychain
  keychainAccessible: SecureStore.WHEN_UNLOCKED, // When the data is accessible (iOS)
};

/**
 * Securely stores a value with the given key
 * @param key The key to store the value under
 * @param value The value to store
 * @returns Promise resolving when the operation is complete
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    // Apply the prefix to ensure consistent naming and avoid conflicts
    const prefixedKey = `${keyPrefix}${key}`;
    
    // Store the value securely
    await SecureStore.setItemAsync(prefixedKey, value, SECURE_STORE_OPTIONS);
  } catch (error) {
    console.error(`Error storing item with key ${key}:`, error);
    throw new Error('Failed to securely store data');
  }
};

/**
 * Retrieves a securely stored value by key
 * @param key The key to retrieve the value for
 * @returns Promise resolving to the stored value, or null if not found
 */
export const getItem = async (key: string): Promise<string | null> => {
  try {
    // Apply the prefix for consistent access
    const prefixedKey = `${keyPrefix}${key}`;
    
    // Retrieve the value
    return await SecureStore.getItemAsync(prefixedKey, SECURE_STORE_OPTIONS);
  } catch (error) {
    console.error(`Error retrieving item with key ${key}:`, error);
    throw new Error('Failed to retrieve securely stored data');
  }
};

/**
 * Removes a securely stored value by key
 * @param key The key to remove
 * @returns Promise resolving when the operation is complete
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    // Apply the prefix for consistent access
    const prefixedKey = `${keyPrefix}${key}`;
    
    // Delete the value
    await SecureStore.deleteItemAsync(prefixedKey, SECURE_STORE_OPTIONS);
  } catch (error) {
    console.error(`Error removing item with key ${key}:`, error);
    throw new Error('Failed to remove securely stored data');
  }
};

/**
 * Checks if a key exists in secure storage
 * @param key The key to check
 * @returns Promise resolving to true if the key exists, false otherwise
 */
export const hasKey = async (key: string): Promise<boolean> => {
  try {
    // Apply the prefix for consistent access
    const prefixedKey = `${keyPrefix}${key}`;
    
    // Check if the key exists
    const value = await SecureStore.getItemAsync(prefixedKey, SECURE_STORE_OPTIONS);
    return value !== null;
  } catch (error) {
    console.error(`Error checking for key ${key}:`, error);
    throw new Error('Failed to check for key in secure storage');
  }
};

/**
 * Clears all E2EE-related data from secure storage
 * Warning: This will remove all encryption keys and is destructive
 * @returns Promise resolving when the operation is complete
 */
export const clearE2EEData = async (): Promise<void> => {
  try {
    // Since we can't list all keys in SecureStore, we delete the known keys
    const keysToRemove = Object.values(ENCRYPTION_CONFIG.STORAGE.keys);
    
    // Delete each key
    await Promise.all(keysToRemove.map(key => removeItem(key)));
  } catch (error) {
    console.error('Error clearing E2EE data:', error);
    throw new Error('Failed to clear E2EE data from secure storage');
  }
};

/**
 * Securely stores a session key for a specific user
 * @param userId The ID of the user to store the session key for
 * @param sessionKey The session key to store
 * @returns Promise resolving when the operation is complete
 */
export const storeSessionKey = async (userId: string, sessionKey: string): Promise<void> => {
  try {
    // Get existing session keys
    const sessionsKey = ENCRYPTION_CONFIG.STORAGE.keys.sessionKeys;
    const sessionsJson = await getItem(sessionsKey) || '{}';
    const sessions = JSON.parse(sessionsJson);
    
    // Add or update this user's session key
    sessions[userId] = sessionKey;
    
    // Store the updated sessions object
    await setItem(sessionsKey, JSON.stringify(sessions));
  } catch (error) {
    console.error(`Error storing session key for user ${userId}:`, error);
    throw new Error('Failed to store session key');
  }
};

/**
 * Retrieves a session key for a specific user
 * @param userId The ID of the user to retrieve the session key for
 * @returns Promise resolving to the session key, or null if not found
 */
export const getSessionKey = async (userId: string): Promise<string | null> => {
  try {
    // Get existing session keys
    const sessionsKey = ENCRYPTION_CONFIG.STORAGE.keys.sessionKeys;
    const sessionsJson = await getItem(sessionsKey) || '{}';
    const sessions = JSON.parse(sessionsJson);
    
    // Return this user's session key if it exists
    return sessions[userId] || null;
  } catch (error) {
    console.error(`Error retrieving session key for user ${userId}:`, error);
    throw new Error('Failed to retrieve session key');
  }
};

/**
 * Removes a session key for a specific user
 * @param userId The ID of the user to remove the session key for
 * @returns Promise resolving when the operation is complete
 */
export const removeSessionKey = async (userId: string): Promise<void> => {
  try {
    // Get existing session keys
    const sessionsKey = ENCRYPTION_CONFIG.STORAGE.keys.sessionKeys;
    const sessionsJson = await getItem(sessionsKey) || '{}';
    const sessions = JSON.parse(sessionsJson);
    
    // Remove this user's session key if it exists
    if (sessions[userId]) {
      delete sessions[userId];
      
      // Store the updated sessions object
      await setItem(sessionsKey, JSON.stringify(sessions));
    }
  } catch (error) {
    console.error(`Error removing session key for user ${userId}:`, error);
    throw new Error('Failed to remove session key');
  }
};

/**
 * Gets all users with stored session keys
 * @returns Promise resolving to an array of user IDs
 */
export const getAllSessionUsers = async (): Promise<string[]> => {
  try {
    // Get existing session keys
    const sessionsKey = ENCRYPTION_CONFIG.STORAGE.keys.sessionKeys;
    const sessionsJson = await getItem(sessionsKey) || '{}';
    const sessions = JSON.parse(sessionsJson);
    
    // Return an array of user IDs
    return Object.keys(sessions);
  } catch (error) {
    console.error('Error getting all session users:', error);
    throw new Error('Failed to get users with session keys');
  }
};

/**
 * Backup function for memory storage when SecureStore is unavailable
 * Only used in testing or when SecureStore is not available
 */
const memoryStorage = new Map<string, string>();

/**
 * Fallback storage implementation for environments where SecureStore is not available
 * @param key The key to store under
 * @param value The value to store
 */
export const setItemFallback = (key: string, value: string): void => {
  const prefixedKey = `${keyPrefix}${key}`;
  memoryStorage.set(prefixedKey, value);
};

/**
 * Fallback retrieval implementation for environments where SecureStore is not available
 * @param key The key to retrieve
 * @returns The stored value, or null if not found
 */
export const getItemFallback = (key: string): string | null => {
  const prefixedKey = `${keyPrefix}${key}`;
  return memoryStorage.has(prefixedKey) ? memoryStorage.get(prefixedKey)! : null;
};

/**
 * Checks if SecureStore is available in the current environment
 * @returns Promise resolving to true if SecureStore is available
 */
export const isSecureStoreAvailable = async (): Promise<boolean> => {
  try {
    // Try to set and get a test value
    const testKey = `${keyPrefix}test`;
    const testValue = 'test-value';
    
    await SecureStore.setItemAsync(testKey, testValue, SECURE_STORE_OPTIONS);
    const retrieved = await SecureStore.getItemAsync(testKey, SECURE_STORE_OPTIONS);
    
    // Clean up the test value
    await SecureStore.deleteItemAsync(testKey, SECURE_STORE_OPTIONS);
    
    // If we got back the same value, SecureStore is working
    return retrieved === testValue;
  } catch (error) {
    console.warn('SecureStore is not available in this environment:', error);
    return false;
  }
};