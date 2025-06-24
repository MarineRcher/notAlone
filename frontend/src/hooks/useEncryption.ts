/**
 * End-to-End Encryption Hook
 *
 * This custom hook provides an interface for using end-to-end encryption
 * in the application, managing keys, sessions, and encryption/decryption.
 */

// Import polyfill to ensure Buffer and crypto are available
import "../crypto/polyfill";

import { useState, useEffect, useCallback } from "react";
import * as keyManager from "../crypto/keys";
import * as messageManager from "../crypto/messages";
import * as secureStorage from "../crypto/storage";
import * as utils from "../crypto/utils";
import { ENCRYPTION_CONFIG } from "../crypto/config";
import {
	EncryptionState,
	EncryptionFunctions,
	EncryptionContextValue,
	EncryptedMessage,
	DecryptedMessage,
	Session,
	GroupSession,
	EncryptionError,
	EncryptionErrorType,
	KeyExchangeMode,
} from "../crypto/types";

// For operations not available in expo-crypto, we still use the Web Crypto API
// Check if global.crypto.subtle is available, fallback to a mock implementation
const getCryptoSubtle = () => 
{
	if (
		typeof global !== "undefined"
		&& global.crypto
		&& global.crypto.subtle
	) 
{
		return global.crypto.subtle;
	}

	// If crypto is not available, return a mock object that will throw descriptive errors
	return {
		generateKey: () =>
			Promise.reject(
				new Error(
					"Web Crypto API not available. Please install expo-standard-web-crypto polyfill."
				)
			),
		encrypt: () =>
			Promise.reject(
				new Error(
					"Web Crypto API not available. Please install expo-standard-web-crypto polyfill."
				)
			),
		decrypt: () =>
			Promise.reject(
				new Error(
					"Web Crypto API not available. Please install expo-standard-web-crypto polyfill."
				)
			),
		importKey: () =>
			Promise.reject(
				new Error(
					"Web Crypto API not available. Please install expo-standard-web-crypto polyfill."
				)
			),
		exportKey: () =>
			Promise.reject(
				new Error(
					"Web Crypto API not available. Please install expo-standard-web-crypto polyfill."
				)
			),
		sign: () =>
			Promise.reject(
				new Error(
					"Web Crypto API not available. Please install expo-standard-web-crypto polyfill."
				)
			),
		verify: () =>
			Promise.reject(
				new Error(
					"Web Crypto API not available. Please install expo-standard-web-crypto polyfill."
				)
			),
		deriveKey: () =>
			Promise.reject(
				new Error(
					"Web Crypto API not available. Please install expo-standard-web-crypto polyfill."
				)
			),
		deriveBits: () =>
			Promise.reject(
				new Error(
					"Web Crypto API not available. Please install expo-standard-web-crypto polyfill."
				)
			),
	};
};

const cryptoSubtle = getCryptoSubtle();

/**
 * Custom hook for managing end-to-end encryption
 * @returns An object containing encryption state and functions
 */
export const useEncryption = (): EncryptionContextValue => 
{
	// Encryption state management
	const [state, setState] = useState<EncryptionState>({
		initialized: false,
		identity: null,
		sessions: {},
		groupSessions: {},
		pendingSessions: [],
	});

	/**
	 * Simulates fetching a public key for a user
	 * In a real app, this would come from a server or public key directory
	 * @param userId The ID of the user to fetch the public key for
	 * @returns Promise resolving to the user's public key (base64 encoded)
	 */
	const simulatePublicKeyFetch = async (userId: string): Promise<string> => 
{
		// This is a placeholder - in a real app, you would fetch from a server
		// For testing, we generate a deterministic but fake public key based on the user ID
		const hash = await keyManager.hashData(userId);

		return utils.bytesToBase64(hash);
	};

	/**
	 * Handles an encrypted message that contains a key exchange
	 * @param message The encrypted message with key exchange
	 * @returns Promise resolving to the decrypted message
	 */
	const handleKeyExchangeMessage = useCallback(
		async (message: EncryptedMessage): Promise<DecryptedMessage> => 
{
			try 
{
				if (!state.initialized || !state.identity) 
{
					throw new EncryptionError(
						"Encryption not initialized",
						EncryptionErrorType.INITIALIZATION_FAILED
					);
				}

				const userId = state.identity.userId;
				const senderId = message.header.senderId;

				// Get our identity key pair
				const identityKeyPair
					= await keyManager.getOrCreateIdentityKeyPair();

				// In a real app, you would need to verify the sender's identity
				// For this example, we'll assume we can trust the sender

				// Get the sender's public key (in a real app, this would come from a trusted source)
				const senderPublicKey = await simulatePublicKeyFetch(senderId);
				const senderPublicKeyBytes
					= utils.base64ToBytes(senderPublicKey);
				const importedSenderPublicKey
					= await keyManager.importPublicKey(senderPublicKeyBytes);

				// Decrypt the message with the embedded key
				const result
					= await messageManager.decryptMessageWithEmbeddedKey(
						message,
						identityKeyPair.privateKey,
						importedSenderPublicKey
					);

				// Extract and store the session key
				const rawSessionKey = await cryptoSubtle.exportKey(
					"raw",
					result.sessionKey
				);
				const sessionKeyBase64 = utils.bytesToBase64(
					new Uint8Array(rawSessionKey)
				);

				if (message.groupId) 
{
					// This is a group key
					const groupId = message.groupId;

					// Store the key
					await secureStorage.setItem(
						`group_key_${groupId}`,
						sessionKeyBase64
					);

					// Create or update the group session
					const existingGroupSession = state.groupSessions[groupId];

					const groupSession: GroupSession = {
						groupId,
						sessionId:
							existingGroupSession?.sessionId
							|| `group-${groupId}`,
						symmetricKey: sessionKeyBase64,
						members: existingGroupSession?.members || [
							senderId,
							userId,
						],
						established: true,
						lastRotationTimestamp: utils.getCurrentTimestamp(),
					};

					// Update state
					setState((prevState) => ({
						...prevState,
						groupSessions: {
							...prevState.groupSessions,
							[groupId]: groupSession,
						},
					}));
				} else {
					// This is a direct message key
					await secureStorage.storeSessionKey(
						senderId,
						sessionKeyBase64
					);

					// Create or update the session
					const session: Session = {
						userId: senderId,
						sessionId: `session-${userId}-${senderId}`,
						symmetricKey: sessionKeyBase64,
						established: true,
						publicKey: senderPublicKey,
					};

					// Update state
					setState((prevState) => ({
						...prevState,
						sessions: {
							...prevState.sessions,
							[senderId]: session,
						},
						pendingSessions: prevState.pendingSessions.filter(
							(id) => id !== senderId
						),
					}));
				}

				return result.message;
			} catch (error) {
				console.error("Error handling key exchange message:", error);
				if (error instanceof EncryptionError) 
{
					throw error;
				}
				throw new EncryptionError(
					"Failed to process key exchange",
					EncryptionErrorType.DECRYPTION_FAILED
				);
			}
		},
		[
			state.initialized,
			state.identity,
			state.groupSessions,
			state.sessions,
			state.pendingSessions,
		]
	);

	/**
	 * Initializes the encryption system for a user
	 * @param userId The ID of the user to initialize encryption for
	 */
	const initialize = useCallback(
		async (userId: string): Promise<void> => 
{
			try 
{
				// Check if already initialized
				if (state.initialized && state.identity?.userId === userId) 
{
					return;
				}

				// Check if crypto is available
				if (!utils.isCryptoAvailable()) 
{
					throw new EncryptionError(
						"Cryptography API is not available in this environment",
						EncryptionErrorType.INITIALIZATION_FAILED
					);
				}

				// Get or create identity key pair
				const identityKeyPair
					= await keyManager.getOrCreateIdentityKeyPair();
				const publicKeyData = await keyManager.exportKey(
					identityKeyPair.publicKey
				);
				const publicKeyBase64 = utils.bytesToBase64(publicKeyData);

				// Load existing sessions
				const sessionUsers = await secureStorage.getAllSessionUsers();
				const sessions: Record<string, Session> = {};

				for (const sessionUserId of sessionUsers) 
{
					const sessionKeyBase64
						= await secureStorage.getSessionKey(sessionUserId);

					if (sessionKeyBase64)
{
						sessions[sessionUserId] = {
							userId: sessionUserId,
							sessionId: `session-${userId}-${sessionUserId}`,
							symmetricKey: sessionKeyBase64,
							established: true,
						};
					}
				}

				// Load group sessions
				const groupSessions: Record<string, GroupSession> = {};
				// In a real app, you would load group sessions from storage here

				// Update state
				setState((prevState) => ({
					...prevState,
					initialized: true,
					identity: {
						userId,
						publicKey: publicKeyBase64,
					},
					sessions,
					groupSessions,
				}));
			} catch (error) {
				console.error("Error initializing encryption:", error);
				throw new EncryptionError(
					"Failed to initialize encryption",
					EncryptionErrorType.INITIALIZATION_FAILED
				);
			}
		},
		[state.initialized, state.identity]
	);

	/**
	 * Initiates a new encryption session with another user
	 * @param userId The ID of the user to establish a session with
	 */
	const initSession = useCallback(
		async (userId: string): Promise<void> => 
{
			try 
{
				if (!state.initialized || !state.identity) 
{
					throw new EncryptionError(
						"Encryption not initialized",
						EncryptionErrorType.INITIALIZATION_FAILED
					);
				}

				const currentUserId = state.identity.userId;

				// Don't try to establish a session with ourselves
				if (userId === currentUserId) 
{
					throw new EncryptionError(
						"Cannot establish session with self",
						EncryptionErrorType.INITIALIZATION_FAILED
					);
				}

				// Check if we already have a pending session request
				if (state.pendingSessions.includes(userId)) 
{
					return; // Already in progress
				}

				// Check if we already have an established session
				if (state.sessions[userId]?.established) 
{
					return; // Already established
				}

				// Add to pending sessions
				setState((prevState) => ({
					...prevState,
					pendingSessions: [...prevState.pendingSessions, userId],
				}));

				// Get our identity key pair
				const identityKeyPair
					= await keyManager.getOrCreateIdentityKeyPair();

				// Generate a new key pair for this session
				const sessionKeyPair
					= await keyManager.generateAsymmetricKeyPair();

				// Generate a symmetric key for this session
				const symmetricKey = await keyManager.generateSymmetricKey();

				// Export the symmetric key
				const rawSymmetricKey = await cryptoSubtle.exportKey(
					"raw",
					symmetricKey
				);
				const symmetricKeyBase64 = utils.bytesToBase64(
					new Uint8Array(rawSymmetricKey)
				);

				// Generate a unique session ID
				const sessionId = await utils.generateSessionId();

				// Store the session information locally
				await secureStorage.storeSessionKey(userId, symmetricKeyBase64);

				// In a real app, you would need to exchange public keys and verify identities
				// This is a simplified version that assumes you can get the recipient's public key

				// Simulate receiving the recipient's public key (in a real app, this would come from a server)
				const recipientPublicKey = await simulatePublicKeyFetch(userId);

				// Export our public key
				const publicKeyData = await keyManager.exportKey(
					sessionKeyPair.publicKey
				);
				const publicKeyBase64 = utils.bytesToBase64(publicKeyData);

				// Create new session
				const newSession: Session = {
					userId,
					sessionId,
					symmetricKey: symmetricKeyBase64,
					established: true,
					publicKey: recipientPublicKey,
				};

				// Update state with the new session
				setState((prevState) => ({
					...prevState,
					sessions: {
						...prevState.sessions,
						[userId]: newSession,
					},
					pendingSessions: prevState.pendingSessions.filter(
						(id) => id !== userId
					),
				}));
			} catch (error) {
				console.error("Error initiating session:", error);

				// Remove from pending sessions
				setState((prevState) => ({
					...prevState,
					pendingSessions: prevState.pendingSessions.filter(
						(id) => id !== userId
					),
				}));

				if (error instanceof EncryptionError) 
{
					throw error;
				}
				throw new EncryptionError(
					"Failed to initiate session",
					EncryptionErrorType.INITIALIZATION_FAILED
				);
			}
		},
		[
			state.initialized,
			state.identity,
			state.pendingSessions,
			state.sessions,
		]
	);

	/**
	 * Encrypts a message for a specific recipient
	 * @param message The plaintext message to encrypt
	 * @param recipientId The ID of the recipient
	 * @returns Promise resolving to an EncryptedMessage
	 */
	const encryptMessage = useCallback(
		async (
			message: string,
			recipientId: string
		): Promise<EncryptedMessage> => 
{
			try 
{
				if (!state.initialized || !state.identity) 
{
					throw new EncryptionError(
						"Encryption not initialized",
						EncryptionErrorType.INITIALIZATION_FAILED
					);
				}

				const userId = state.identity.userId;

				// Check if we have a session with this user
				const session = state.sessions[recipientId];

				if (!session || !session.established) 
{
					// No established session, initiate one
					await initSession(recipientId);

					// Throw an error to indicate that the message couldn't be sent yet
					throw new EncryptionError(
						"Session initialization in progress",
						EncryptionErrorType.SESSION_NOT_ESTABLISHED
					);
				}

				// Import the symmetric key from storage
				const sessionKeyBytes = utils.base64ToBytes(
					session.symmetricKey
				);
				const sessionKey = await cryptoSubtle.importKey(
					"raw",
					sessionKeyBytes,
					{
						name: ENCRYPTION_CONFIG.SYMMETRIC.algorithm,
						length: ENCRYPTION_CONFIG.SYMMETRIC.keySize,
					},
					false,
					["encrypt", "decrypt"]
				);

				// Encrypt the message
				return await messageManager.encryptMessage(
					message,
					recipientId,
					userId,
					sessionKey
				);
			} catch (error) {
				console.error("Error encrypting message:", error);
				if (error instanceof EncryptionError) 
{
					throw error;
				}
				throw new EncryptionError(
					"Failed to encrypt message",
					EncryptionErrorType.UNKNOWN_ERROR
				);
			}
		},
		[state.initialized, state.identity, state.sessions, initSession]
	);

	/**
	 * Decrypts an encrypted message
	 * @param message The encrypted message to decrypt
	 * @returns Promise resolving to a DecryptedMessage
	 */
	const decryptMessage = useCallback(
		async (message: EncryptedMessage): Promise<DecryptedMessage> => 
{
			try 
{
				if (!state.initialized || !state.identity) 
{
					throw new EncryptionError(
						"Encryption not initialized",
						EncryptionErrorType.INITIALIZATION_FAILED
					);
				}

				const userId = state.identity.userId;

				// Ensure the message is intended for us
				if (message.header.recipientId !== userId && !message.groupId) 
{
					throw new EncryptionError(
						"Message not intended for this recipient",
						EncryptionErrorType.DECRYPTION_FAILED
					);
				}

				const senderId = message.header.senderId;

				// Check if this is a key exchange message
				if (
					message.header.encryptedKey
					&& message.header.keyExchangeMode
				) 
{
					// Handle key exchange
					return await handleKeyExchangeMessage(message);
				}

				// Get the appropriate session
				let sessionKey: CryptoKey;
				let senderPublicKey: CryptoKey;

				if (message.groupId) 
{
					// Group message
					const groupSession = state.groupSessions[message.groupId];

					if (!groupSession || !groupSession.established) 
{
						throw new EncryptionError(
							"No established group session",
							EncryptionErrorType.SESSION_NOT_ESTABLISHED
						);
					}

					// Import the group key
					const groupKeyBytes = utils.base64ToBytes(
						groupSession.symmetricKey
					);

					sessionKey = await cryptoSubtle.importKey(
						"raw",
						groupKeyBytes,
						{
							name: ENCRYPTION_CONFIG.SYMMETRIC.algorithm,
							length: ENCRYPTION_CONFIG.SYMMETRIC.keySize,
						},
						false,
						["encrypt", "decrypt"]
					);

					// In a real app, you would get the sender's public key from a trusted source
					// For this example, we'll assume we already have it
					if (!state.sessions[senderId]?.publicKey) 
{
						throw new EncryptionError(
							"Sender public key not available",
							EncryptionErrorType.DECRYPTION_FAILED
						);
					}

					const senderPublicKeyBytes = utils.base64ToBytes(
						state.sessions[senderId].publicKey!
					);

					senderPublicKey =
						await keyManager.importPublicKey(senderPublicKeyBytes);
				} else {
					// Direct message
					const session = state.sessions[senderId];

					if (!session || !session.established) 
{
						throw new EncryptionError(
							"No established session with sender",
							EncryptionErrorType.SESSION_NOT_ESTABLISHED
						);
					}

					// Import the session key
					const sessionKeyBytes = utils.base64ToBytes(
						session.symmetricKey
					);

					sessionKey = await cryptoSubtle.importKey(
						"raw",
						sessionKeyBytes,
						{
							name: ENCRYPTION_CONFIG.SYMMETRIC.algorithm,
							length: ENCRYPTION_CONFIG.SYMMETRIC.keySize,
						},
						false,
						["encrypt", "decrypt"]
					);

					// In a real app, you would get the sender's public key from a trusted source
					if (!session.publicKey) 
{
						throw new EncryptionError(
							"Sender public key not available",
							EncryptionErrorType.DECRYPTION_FAILED
						);
					}

					const senderPublicKeyBytes = utils.base64ToBytes(
						session.publicKey
					);

					senderPublicKey =
						await keyManager.importPublicKey(senderPublicKeyBytes);
				}

				// Decrypt the message
				return await messageManager.decryptMessage(
					message,
					sessionKey,
					senderPublicKey
				);
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
		},
		[
			state.initialized,
			state.identity,
			state.sessions,
			state.groupSessions,
			handleKeyExchangeMessage,
		]
	);

	/**
	 * Encrypts a message for a group
	 * @param message The plaintext message to encrypt
	 * @param groupId The ID of the group
	 * @returns Promise resolving to an EncryptedMessage
	 */
	const encryptGroupMessage = useCallback(
		async (message: string, groupId: string): Promise<EncryptedMessage> => 
{
			try 
{
				if (!state.initialized || !state.identity) 
{
					throw new EncryptionError(
						"Encryption not initialized",
						EncryptionErrorType.INITIALIZATION_FAILED
					);
				}

				const userId = state.identity.userId;

				// Check if we have a session for this group
				const groupSession = state.groupSessions[groupId];

				if (!groupSession || !groupSession.established) 
{
					throw new EncryptionError(
						"No established group session",
						EncryptionErrorType.SESSION_NOT_ESTABLISHED
					);
				}

				// Import the group key
				const groupKeyBytes = utils.base64ToBytes(
					groupSession.symmetricKey
				);
				const groupKey = await cryptoSubtle.importKey(
					"raw",
					groupKeyBytes,
					{
						name: ENCRYPTION_CONFIG.SYMMETRIC.algorithm,
						length: ENCRYPTION_CONFIG.SYMMETRIC.keySize,
					},
					false,
					["encrypt", "decrypt"]
				);

				// Encrypt the message for the group
				return await messageManager.encryptGroupMessage(
					message,
					groupId,
					userId,
					groupKey
				);
			} catch (error) {
				console.error("Error encrypting group message:", error);
				if (error instanceof EncryptionError) 
{
					throw error;
				}
				throw new EncryptionError(
					"Failed to encrypt group message",
					EncryptionErrorType.UNKNOWN_ERROR
				);
			}
		},
		[state.initialized, state.identity, state.groupSessions]
	);

	/**
	 * Rotates the encryption key for a group
	 * @param groupId The ID of the group
	 */
	const rotateGroupKey = useCallback(
		async (groupId: string): Promise<void> => 
{
			try 
{
				if (!state.initialized || !state.identity) 
{
					throw new EncryptionError(
						"Encryption not initialized",
						EncryptionErrorType.INITIALIZATION_FAILED
					);
				}

				const userId = state.identity.userId;

				// Check if we have a session for this group
				const groupSession = state.groupSessions[groupId];

				if (!groupSession) 
{
					throw new EncryptionError(
						"No group session found",
						EncryptionErrorType.SESSION_NOT_ESTABLISHED
					);
				}

				// Generate a new symmetric key for the group
				const newGroupKey = await keyManager.generateSymmetricKey();

				// Export the key to raw bytes
				const rawGroupKey = await cryptoSubtle.exportKey(
					"raw",
					newGroupKey
				);
				const groupKeyBase64 = utils.bytesToBase64(
					new Uint8Array(rawGroupKey)
				);

				// Store the new group key locally
				await secureStorage.setItem(
					`group_key_${groupId}`,
					groupKeyBase64
				);

				// In a real app, you would need to distribute the new key to all group members
				// This would involve fetching their public keys and sending encrypted messages

				// Update the group session
				const updatedGroupSession: GroupSession = {
					...groupSession,
					symmetricKey: groupKeyBase64,
					lastRotationTimestamp: utils.getCurrentTimestamp(),
				};

				// Update state
				setState((prevState) => ({
					...prevState,
					groupSessions: {
						...prevState.groupSessions,
						[groupId]: updatedGroupSession,
					},
				}));
			} catch (error) {
				console.error("Error rotating group key:", error);
				if (error instanceof EncryptionError) 
{
					throw error;
				}
				throw new EncryptionError(
					"Failed to rotate group key",
					EncryptionErrorType.UNKNOWN_ERROR
				);
			}
		},
		[state.initialized, state.identity, state.groupSessions]
	);

	/**
	 * Exports the user's identity (userId and public key)
	 * @returns Promise resolving to the user's identity
	 */
	const exportIdentity = useCallback(async (): Promise<{
		userId: string;
		publicKey: string;
	}> => 
{
		try 
{
			if (!state.initialized || !state.identity) 
{
				throw new EncryptionError(
					"Encryption not initialized",
					EncryptionErrorType.INITIALIZATION_FAILED
				);
			}

			return {
				userId: state.identity.userId,
				publicKey: state.identity.publicKey,
			};
		} catch (error) {
			console.error("Error exporting identity:", error);
			throw new EncryptionError(
				"Failed to export identity",
				EncryptionErrorType.UNKNOWN_ERROR
			);
		}
	}, [state.initialized, state.identity]);

	/**
	 * Imports a user identity (for development/testing only)
	 * WARNING: This should not be used in production as it bypasses proper key exchange
	 * @param userId The user ID to import
	 * @param privateKey The private key (base64 encoded)
	 */
	const importIdentity = useCallback(
		async (userId: string, privateKey: string): Promise<void> => 
{
			try 
{
				// This is for development/testing only
				console.warn(
					"Importing identity - this should only be used for development"
				);

				// Import the private key
				const privateKeyBytes = utils.base64ToBytes(privateKey);
				const importedPrivateKey
					= await keyManager.importPrivateKey(privateKeyBytes);

				// Generate corresponding public key
				// This is simplified - in a real app, you would need proper key pair generation

				// Reset the state
				setState({
					initialized: false,
					identity: null,
					sessions: {},
					groupSessions: {},
					pendingSessions: [],
				});

				// Reinitialize with the imported identity
				await initialize(userId);
			} catch (error) {
				console.error("Error importing identity:", error);
				throw new EncryptionError(
					"Failed to import identity",
					EncryptionErrorType.UNKNOWN_ERROR
				);
			}
		},
		[initialize]
	);

	/**
	 * Creates an encrypted group session
	 * @param groupId The ID of the group
	 * @param memberIds Array of member user IDs
	 * @returns Promise resolving when the group is created
	 */
	const createGroupSession = useCallback(
		async (groupId: string, memberIds: string[]): Promise<void> => 
{
			try 
{
				if (!state.initialized || !state.identity) 
{
					throw new EncryptionError(
						"Encryption not initialized",
						EncryptionErrorType.INITIALIZATION_FAILED
					);
				}

				const userId = state.identity.userId;

				// Check if we already have a session for this group
				if (state.groupSessions[groupId]?.established) 
{
					return; // Already established
				}

				// Generate a symmetric key for the group
				const groupKey = await keyManager.generateSymmetricKey();

				// Export the key to raw bytes
				const rawGroupKey = await cryptoSubtle.exportKey(
					"raw",
					groupKey
				);
				const groupKeyBase64 = utils.bytesToBase64(
					new Uint8Array(rawGroupKey)
				);

				// Store the group key locally
				await secureStorage.setItem(
					`group_key_${groupId}`,
					groupKeyBase64
				);

				// Create the group session
				const groupSession: GroupSession = {
					groupId,
					sessionId: `group-${groupId}`,
					symmetricKey: groupKeyBase64,
					members: [...memberIds, userId],
					established: true,
					lastRotationTimestamp: utils.getCurrentTimestamp(),
				};

				// Update state
				setState((prevState) => ({
					...prevState,
					groupSessions: {
						...prevState.groupSessions,
						[groupId]: groupSession,
					},
				}));

				// In a real app, you would need to distribute the key to all members
				// This would involve fetching their public keys and sending encrypted messages
			} catch (error) {
				console.error("Error creating group session:", error);
				if (error instanceof EncryptionError) 
{
					throw error;
				}
				throw new EncryptionError(
					"Failed to create group session",
					EncryptionErrorType.INITIALIZATION_FAILED
				);
			}
		},
		[state.initialized, state.identity, state.groupSessions]
	);

	// Bundle all functions
	const encryptionFunctions: EncryptionFunctions = {
		initialize,
		encryptMessage,
		decryptMessage,
		encryptGroupMessage,
		initSession,
		rotateGroupKey,
		exportIdentity,
		importIdentity,
		createGroupSession,
	};

	// Return combined state and functions
	return {
		...state,
		...encryptionFunctions,
	};
};

export default useEncryption;
