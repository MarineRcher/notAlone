/**
 * Expo Go Compatible Encryption Hook
 * Works with Expo Go without requiring development build
 */

import { useState, useCallback } from "react";
import {
	EncryptedMessage,
	DecryptedMessage,
	KeyExchangeMessage,
} from "../crypto/expoCompatibleCrypto";
import expoCompatibleCrypto from "../crypto/expoCompatibleCrypto";

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
	encryptGroupMessage: (
		message: string,
		groupId: string,
		senderId: string
	) => Promise<EncryptedMessage>;
	decryptGroupMessage: (
		encryptedMessage: EncryptedMessage
	) => Promise<DecryptedMessage>;
	createGroupSession: (groupId: string, memberIds: string[]) => Promise<void>;
	getPublicKey: () => string | null;
	clearKeys: (userId: string) => Promise<void>;
	clearGroupKey: (groupId: string) => Promise<void>;

	// New key management functions
	joinGroup: (
		groupId: string,
		memberIds: string[],
		userId: string
	) => Promise<KeyExchangeMessage>;
	leaveGroup: (
		groupId: string,
		userId: string
	) => Promise<KeyExchangeMessage>;
	processKeyExchange: (
		message: KeyExchangeMessage,
		currentUserId: string
	) => Promise<void>;
	refreshGroupKeys: (
		groupId: string,
		userId: string
	) => Promise<KeyExchangeMessage>;
}

export function useExpoCompatibleEncryption(): ExpoEncryptionHook 
{
	const [state, setState] = useState<EncryptionState>({
		initialized: false,
		initializing: false,
		error: null,
	});

	// Initialize encryption
	const initialize = useCallback(async (userId: string): Promise<void> => 
{
		try 
{
			setState((prev) => ({ ...prev, initializing: true, error: null }));
			await expoCompatibleCrypto.initialize(userId);
			setState({ initialized: true, initializing: false, error: null });
		} catch (error) {
			const errorMessage
				= error instanceof Error
					? error.message
					: "Initialization failed";

			setState({
				initialized: false,
				initializing: false,
				error: errorMessage,
			});
			console.error("❌ Initialization failed in hook:", error);
			throw error;
		}
	}, []);

	// Encrypt group message
	const encryptGroupMessage = useCallback(
		async (
			message: string,
			groupId: string,
			senderId: string
		): Promise<EncryptedMessage> => 
{
			try 
{
				return await expoCompatibleCrypto.encryptGroupMessage(
					message,
					groupId,
					senderId
				);
			} catch (error) {
				console.error("❌ Encryption failed in hook:", error);
				throw error;
			}
		},
		[]
	);

	// Decrypt group message
	const decryptGroupMessage = useCallback(
		async (
			encryptedMessage: EncryptedMessage
		): Promise<DecryptedMessage> => 
{
			try 
{
				return await expoCompatibleCrypto.decryptGroupMessage(
					encryptedMessage
				);
			} catch (error) {
				console.error("❌ Decryption failed in hook:", error);
				throw error;
			}
		},
		[]
	);

	// Create group session (legacy method - now redirects to joinGroup)
	const createGroupSession = useCallback(
		async (groupId: string, memberIds: string[]): Promise<void> => 
{
			try 
{
				console.log(
					"⚠️ createGroupSession is deprecated, use joinGroup instead"
				);
				// This is kept for backward compatibility but doesn't do the key exchange
				await expoCompatibleCrypto.createGroupSession(
					groupId,
					memberIds
				);
			} catch (error) {
				console.error("❌ Create group session failed in hook:", error);
				throw error;
			}
		},
		[]
	);

	// Join group with key exchange
	const joinGroup = useCallback(
		async (
			groupId: string,
			memberIds: string[],
			userId: string
		): Promise<KeyExchangeMessage> => 
{
			try 
{
				return await expoCompatibleCrypto.joinGroup(
					groupId,
					memberIds,
					userId
				);
			} catch (error) {
				console.error("❌ Join group failed in hook:", error);
				throw error;
			}
		},
		[]
	);

	// Leave group with key exchange
	const leaveGroup = useCallback(
		async (
			groupId: string,
			userId: string
		): Promise<KeyExchangeMessage> => 
{
			try 
{
				return await expoCompatibleCrypto.leaveGroup(groupId, userId);
			} catch (error) {
				console.error("❌ Leave group failed in hook:", error);
				throw error;
			}
		},
		[]
	);

	// Process key exchange message
	const processKeyExchange = useCallback(
		async (
			message: KeyExchangeMessage,
			currentUserId: string
		): Promise<void> => 
{
			try 
{
				await expoCompatibleCrypto.processKeyExchange(
					message,
					currentUserId
				);
			} catch (error) {
				console.error("❌ Process key exchange failed in hook:", error);
				throw error;
			}
		},
		[]
	);

	// Get public key
	const getPublicKey = useCallback((): string | null => 
{
		try 
{
			return expoCompatibleCrypto.getPublicKey();
		} catch (error) {
			console.error("❌ Get public key failed in hook:", error);
			return null;
		}
	}, []);

	// Clear all keys
	const clearKeys = useCallback(async (userId: string): Promise<void> => 
{
		try 
{
			await expoCompatibleCrypto.clearKeys(userId);
			setState({
				initialized: false,
				initializing: false,
				error: null,
			});
		} catch (error) {
			console.error("❌ Clear keys failed in hook:", error);
			throw error;
		}
	}, []);

	// Clear group key
	const clearGroupKey = useCallback(
		async (groupId: string): Promise<void> => 
{
			try 
{
				await expoCompatibleCrypto.clearGroupKey(groupId);
			} catch (error) {
				console.error("❌ Clear group key failed in hook:", error);
				throw error;
			}
		},
		[]
	);

	// Refresh group keys
	const refreshGroupKeys = useCallback(
		async (
			groupId: string,
			userId: string
		): Promise<KeyExchangeMessage> => 
{
			try 
{
				return await expoCompatibleCrypto.refreshGroupKeys(
					groupId,
					userId
				);
			} catch (error) {
				console.error("❌ Refresh group keys failed in hook:", error);
				throw error;
			}
		},
		[]
	);

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
		clearKeys,
		clearGroupKey,

		// New key management functions
		joinGroup,
		leaveGroup,
		processKeyExchange,
		refreshGroupKeys,
	};
}

export default useExpoCompatibleEncryption;
