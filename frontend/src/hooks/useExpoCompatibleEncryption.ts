/**
 * Expo Go Compatible Encryption Hook
 * Works with Expo Go without requiring development build
 */

import { useState, useEffect, useCallback } from 'react';
import expoCompatibleCrypto, { EncryptedMessage, DecryptedMessage } from '../crypto/expoCompatibleCrypto';

interface EncryptionState {
  initialized: boolean;
  initializing: boolean;
  error: string | null;
}

interface ExpoEncryptionHook {
  // State
  initialized: boolean;
  initializing: boolean;
  error: string | null;
  
  // Functions
  initialize: (userId: string) => Promise<void>;
  encryptGroupMessage: (message: string, groupId: string, senderId: string) => Promise<EncryptedMessage>;
  decryptGroupMessage: (encryptedMessage: EncryptedMessage) => Promise<DecryptedMessage>;
  createGroupSession: (groupId: string, memberIds: string[]) => Promise<void>;
  getPublicKey: () => string | null;
  clearKeys: (userId: string) => Promise<void>;
}

export const useExpoCompatibleEncryption = (): ExpoEncryptionHook => {
  const [state, setState] = useState<EncryptionState>({
    initialized: false,
    initializing: false,
    error: null
  });

  // Initialize encryption for a user
  const initialize = useCallback(async (userId: string): Promise<void> => {
    if (state.initialized || state.initializing) {
      return;
    }

    setState(prev => ({ ...prev, initializing: true, error: null }));

    try {
      await expoCompatibleCrypto.initialize(userId);
      setState(prev => ({ 
        ...prev, 
        initialized: true, 
        initializing: false, 
        error: null 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ 
        ...prev, 
        initialized: false, 
        initializing: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, [state.initialized, state.initializing]);

  // Encrypt a group message
  const encryptGroupMessage = useCallback(async (
    message: string, 
    groupId: string, 
    senderId: string
  ): Promise<EncryptedMessage> => {
    if (!state.initialized) {
      throw new Error('Encryption not initialized');
    }

    try {
      return await expoCompatibleCrypto.encryptGroupMessage(message, groupId, senderId);
    } catch (error) {
      console.error('❌ Encryption failed in hook:', error);
      throw error;
    }
  }, [state.initialized]);

  // Decrypt a group message
  const decryptGroupMessage = useCallback(async (
    encryptedMessage: EncryptedMessage
  ): Promise<DecryptedMessage> => {
    if (!state.initialized) {
      throw new Error('Encryption not initialized');
    }

    try {
      return await expoCompatibleCrypto.decryptGroupMessage(encryptedMessage);
    } catch (error) {
      console.error('❌ Decryption failed in hook:', error);
      throw error;
    }
  }, [state.initialized]);

  // Create a group session
  const createGroupSession = useCallback(async (
    groupId: string, 
    memberIds: string[]
  ): Promise<void> => {
    if (!state.initialized) {
      throw new Error('Encryption not initialized');
    }

    try {
      await expoCompatibleCrypto.createGroupSession(groupId, memberIds);
    } catch (error) {
      console.error('❌ Group session creation failed in hook:', error);
      throw error;
    }
  }, [state.initialized]);

  // Get public key
  const getPublicKey = useCallback((): string | null => {
    return expoCompatibleCrypto.getPublicKey();
  }, []);

  // Clear all keys
  const clearKeys = useCallback(async (userId: string): Promise<void> => {
    try {
      await expoCompatibleCrypto.clearKeys(userId);
      setState({
        initialized: false,
        initializing: false,
        error: null
      });
    } catch (error) {
      console.error('❌ Clear keys failed in hook:', error);
      throw error;
    }
  }, []);

  return {
    // State
    initialized: state.initialized,
    initializing: state.initializing,
    error: state.error,
    
    // Functions
    initialize,
    encryptGroupMessage,
    decryptGroupMessage,
    createGroupSession,
    getPublicKey,
    clearKeys
  };
};

export default useExpoCompatibleEncryption; 