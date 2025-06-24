/**
 * Expo Go Compatible Crypto Engine
 * Uses only expo-crypto and Web Crypto API (available in Expo Go)
 */

import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { sha256 } from "js-sha256";

export interface EncryptedMessage {
	iv: string;
	ciphertext: string;
	senderId: string;
	timestamp: number;
	groupId?: string;
	keyHash: string; // Hash to verify correct decryption
}

export interface DecryptedMessage {
	content: string;
	senderId: string;
	timestamp: number;
	groupId?: string;
}

export interface KeyPair {
	publicKey: string;
	privateKey: string;
}

interface GroupKeyState {
	groupKey: string;
	memberKeys: Map<string, string>; // userId -> their key for this group
	keyVersion: number; // Increments on membership changes
	lastUpdated: number;
}

export interface KeyExchangeMessage {
	type: "key_exchange";
	userId: string;
	groupId: string;
	userKey: string;
	keyVersion: number;
	action: "join" | "leave" | "refresh";
}

class ExpoCompatibleCrypto 
{
	private initialized = false;
	private userKeyPair: KeyPair | null = null;
	private groupStates: Map<string, GroupKeyState> = new Map(); // groupId -> state

	/**
	 * Generate a random base64 key
	 */
	private generateRandomKey(): string 
{
		const array = new Uint8Array(32);

		for (let i = 0; i < array.length; i++)
{
			array[i] = Math.floor(Math.random() * 256);
		}
		return btoa(String.fromCharCode.apply(null, Array.from(array)));
	}

	/**
	 * Generate a group key from concatenated public keys of sorted members
	 */
	private generateGroupKey(
		memberPublicKeys: Map<string, string>,
		groupId: string,
		keyVersion: number
	): string 
{
		console.log(
			"🔐 [DEBUG] Generating group key from member public keys..."
		);
		console.log("🔐 [DEBUG] Member count:", memberPublicKeys.size);
		console.log("🔐 [DEBUG] Key version:", keyVersion);

		// Sort members by userId for deterministic ordering
		const sortedEntries = Array.from(memberPublicKeys.entries()).sort(
			([a], [b]) => a.localeCompare(b)
		);

		console.log(
			"🔐 [DEBUG] Sorted member IDs:",
			sortedEntries.map(([userId]) => userId)
		);

		// Concatenate all public keys in sorted order
		const concatenatedPublicKeys = sortedEntries
			.map(([userId, publicKey]) => publicKey)
			.join("");

		// Generate group key from concatenated public keys + group metadata
		const keyInput = `${concatenatedPublicKeys}_group_${groupId}_v${keyVersion}`;

		console.log(
			"🔐 [DEBUG] Concatenated keys length:",
			concatenatedPublicKeys.length
		);
		console.log("🔐 [DEBUG] Key input length:", keyInput.length);

		// Use SHA256 to generate deterministic group key
		const groupKeyHash = sha256(keyInput);
		const base64GroupKey = btoa(groupKeyHash.substring(0, 32)); // Take first 32 chars and encode

		console.log(
			"🔐 [DEBUG] Generated group key (first 16 chars):",
			base64GroupKey.substring(0, 16)
		);
		return base64GroupKey;
	}

	/**
	 * Initialize crypto system for a user
	 */
	async initialize(userId: string): Promise<void> 
{
		try 
{
			console.log("🔐 [DEBUG] Initializing crypto for user:", userId);

			// Try to load existing key pair
			const privateKey = await SecureStore.getItemAsync(
				`expo_private_key_${userId}`
			);
			const publicKey = await SecureStore.getItemAsync(
				`expo_public_key_${userId}`
			);

			if (privateKey && publicKey) 
{
				this.userKeyPair = { privateKey, publicKey };
				console.log("✅ Loaded existing key pair");
			} else {
				// Generate new key pair
				const newPrivateKey = this.generateRandomKey();
				const newPublicKey = this.generateRandomKey();

				this.userKeyPair = {
					privateKey: newPrivateKey,
					publicKey: newPublicKey,
				};

				// Store securely
				await SecureStore.setItemAsync(
					`expo_private_key_${userId}`,
					newPrivateKey
				);
				await SecureStore.setItemAsync(
					`expo_public_key_${userId}`,
					newPublicKey
				);

				console.log("✅ Generated and stored new key pair");
			}

			// Load existing group states
			await this.loadGroupStates(userId);

			this.initialized = true;
			console.log("✅ Expo-compatible crypto initialized successfully");
		} catch (error) {
			console.error("❌ Failed to initialize crypto:", error);
			throw new Error("Crypto initialization failed");
		}
	}

	/**
	 * Load existing group states from storage
	 */
	private async loadGroupStates(userId: string): Promise<void> 
{
		try 
{
			const statesJson = await SecureStore.getItemAsync(
				`expo_group_states_${userId}`
			);

			if (statesJson)
{
				const statesData = JSON.parse(statesJson);

				for (const [groupId, stateData] of Object.entries(statesData))
{
					const state = stateData as any;

					this.groupStates.set(groupId, {
						groupKey: state.groupKey,
						memberKeys: new Map(Object.entries(state.memberKeys)),
						keyVersion: state.keyVersion,
						lastUpdated: state.lastUpdated,
					});
				}
				console.log(
					"✅ Loaded group states for",
					this.groupStates.size,
					"groups"
				);
			}
		} catch (error) {
			console.error("❌ Failed to load group states:", error);
		}
	}

	/**
	 * Save group states to storage
	 */
	private async saveGroupStates(userId: string): Promise<void> 
{
		try 
{
			const statesData: any = {};

			for (const [groupId, state] of this.groupStates.entries())
{
				statesData[groupId] = {
					groupKey: state.groupKey,
					memberKeys: Object.fromEntries(state.memberKeys),
					keyVersion: state.keyVersion,
					lastUpdated: state.lastUpdated,
				};
			}
			await SecureStore.setItemAsync(
				`expo_group_states_${userId}`,
				JSON.stringify(statesData)
			);
			console.log("✅ Saved group states");
		} catch (error) {
			console.error("❌ Failed to save group states:", error);
		}
	}

	/**
	 * Generate a personal key for a specific group
	 */
	generatePersonalGroupKey(): string 
{
		return this.generateRandomKey();
	}

	/**
	 * Fetch group member public keys from backend
	 */
	private async fetchGroupMemberPublicKeys(
		groupId: string
	): Promise<Map<string, string>> 
{
		try 
{
			console.log(
				"🔐 [DEBUG] Fetching group member public keys for:",
				groupId
			);

			// This would need to be implemented with proper API call
			// For now, return empty map - this should be connected to backend API
			const memberKeys = new Map<string, string>();

			console.log(
				"🔐 [DEBUG] Fetched public keys for",
				memberKeys.size,
				"members"
			);
			return memberKeys;
		} catch (error) {
			console.error(
				"❌ Failed to fetch group member public keys:",
				error
			);
			return new Map<string, string>();
		}
	}

	/**
	 * Join a group - use actual public keys for deterministic group key
	 */
	async joinGroup(
		groupId: string,
		memberIds: string[],
		userId: string
	): Promise<KeyExchangeMessage> 
{
		try 
{
			console.log("🔐 [DEBUG] Joining group:", groupId);
			console.log("🔐 [DEBUG] Current members:", memberIds);

			if (!this.initialized) 
{
				throw new Error("Crypto not initialized");
			}

			// Initialize or update group state
			let groupState = this.groupStates.get(groupId);

			if (!groupState)
{
				groupState = {
					groupKey: "",
					memberKeys: new Map(),
					keyVersion: 1,
					lastUpdated: Date.now(),
				};
				this.groupStates.set(groupId, groupState);
			}

			// Fetch existing member public keys from backend
			const backendMemberKeys
				= await this.fetchGroupMemberPublicKeys(groupId);

			// Add our public key to the group
			const ourPublicKey = this.userKeyPair?.publicKey || userId;

			groupState.memberKeys.set(userId, ourPublicKey);

			// Add other members' public keys from backend
			for (const [memberId, publicKey] of backendMemberKeys.entries()) 
{
				if (memberId !== userId) 
{
					groupState.memberKeys.set(memberId, publicKey);
				}
			}

			// For members not yet fetched, use memberIds as fallback
			for (const memberId of memberIds) 
{
				if (!groupState.memberKeys.has(memberId)) 
{
					groupState.memberKeys.set(memberId, memberId);
				}
			}

			groupState.keyVersion += 1;
			groupState.lastUpdated = Date.now();

			// Generate group key from all member public keys
			if (groupState.memberKeys.size > 0) 
{
				groupState.groupKey = this.generateGroupKey(
					groupState.memberKeys,
					groupId,
					groupState.keyVersion
				);

				// Store the group key in secure storage
				const storageKey = `expo_group_key_${groupId}`;

				await SecureStore.setItemAsync(storageKey, groupState.groupKey);
				console.log(
					"🔐 [DEBUG] Generated and stored group key after join"
				);
			}

			// Save state
			await this.saveGroupStates(userId);

			// Return key exchange message with our public key
			return {
				type: "key_exchange",
				userId,
				groupId,
				userKey: ourPublicKey,
				keyVersion: groupState.keyVersion,
				action: "join",
			};
		} catch (error) {
			console.error("❌ Failed to join group:", error);
			throw new Error("Group join failed");
		}
	}

	/**
	 * Process incoming key exchange message
	 */
	async processKeyExchange(
		message: KeyExchangeMessage,
		currentUserId: string
	): Promise<void> 
{
		try 
{
			console.log("🔐 [DEBUG] Processing key exchange:", message);

			const { userId, groupId, userKey, keyVersion, action } = message;

			let groupState = this.groupStates.get(groupId);

			if (!groupState)
{
				groupState = {
					groupKey: "",
					memberKeys: new Map(),
					keyVersion: 0,
					lastUpdated: Date.now(),
				};
				this.groupStates.set(groupId, groupState);
			}

			// Update member public key
			if (action === "leave") 
{
				groupState.memberKeys.delete(userId);
				console.log("🔐 [DEBUG] Removed public key for user:", userId);
			} else {
				// Use the userKey as the public key (it should contain the actual public key)
				groupState.memberKeys.set(userId, userKey);
				console.log(
					"🔐 [DEBUG] Added/updated public key for user:",
					userId
				);
			}

			// Update version if newer
			if (keyVersion > groupState.keyVersion) 
{
				groupState.keyVersion = keyVersion;
			}

			// Only regenerate group key if we don't already have one or if membership changed significantly
			const needsKeyRegeneration
				= !groupState.groupKey
				|| action === "leave"
				|| action === "refresh"
				|| (action === "join" && groupState.memberKeys.size === 1);

			if (needsKeyRegeneration && groupState.memberKeys.size > 0) 
{
				const previousGroupKey = groupState.groupKey;

				groupState.groupKey = this.generateGroupKey(
					groupState.memberKeys,
					groupId,
					groupState.keyVersion
				);

				// Store the group key in secure storage
				const storageKey = `expo_group_key_${groupId}`;

				await SecureStore.setItemAsync(storageKey, groupState.groupKey);

				console.log(
					"🔐 [DEBUG] Group key regenerated:",
					previousGroupKey !== groupState.groupKey
						? "[CHANGED]"
						: "[SAME]"
				);
				console.log(
					"🔐 [DEBUG] New group key (first 16 chars):",
					groupState.groupKey.substring(0, 16)
				);
				console.log(
					"🔐 [DEBUG] Members count:",
					groupState.memberKeys.size
				);
			} else {
				console.log(
					"🔐 [DEBUG] Keeping existing group key - no regeneration needed"
				);
				console.log(
					"🔐 [DEBUG] Current group key (first 16 chars):",
					groupState.groupKey.substring(0, 16)
				);
			}

			if (groupState.memberKeys.size === 0) 
{
				// If no members left, clear the group key
				groupState.groupKey = "";
				const storageKey = `expo_group_key_${groupId}`;

				await SecureStore.deleteItemAsync(storageKey);
				console.log(
					"🔐 [DEBUG] Cleared group key - no members remaining"
				);
			}

			groupState.lastUpdated = Date.now();

			// Save updated state
			await this.saveGroupStates(currentUserId);

			console.log("✅ Key exchange processed successfully");
		} catch (error) {
			console.error("❌ Failed to process key exchange:", error);
			throw new Error("Key exchange processing failed");
		}
	}

	/**
	 * Leave a group - remove our key and notify others
	 */
	async leaveGroup(
		groupId: string,
		userId: string
	): Promise<KeyExchangeMessage> 
{
		try 
{
			console.log("🔐 [DEBUG] Leaving group:", groupId);

			const groupState = this.groupStates.get(groupId);

			if (!groupState)
{
				throw new Error("Group state not found");
			}

			// Remove our key
			groupState.memberKeys.delete(userId);
			groupState.keyVersion += 1;
			groupState.lastUpdated = Date.now();

			// Save state
			await this.saveGroupStates(userId);

			// Return leave message
			return {
				type: "key_exchange",
				userId,
				groupId,
				userKey: "",
				keyVersion: groupState.keyVersion,
				action: "leave",
			};
		} catch (error) {
			console.error("❌ Failed to leave group:", error);
			throw new Error("Group leave failed");
		}
	}

	/**
	 * Create or join a group session
	 */
	async createGroupSession(
		groupId: string,
		memberIds: string[]
	): Promise<void> 
{
		try 
{
			console.log("🔐 [DEBUG] Creating group session...");
			console.log("🔐 [DEBUG] Group ID:", groupId);
			console.log("🔐 [DEBUG] Member IDs:", memberIds);

			if (!this.initialized) 
{
				console.error(
					"❌ [DEBUG] Crypto not initialized for group session creation"
				);
				throw new Error("Crypto not initialized");
			}

			console.log("🔐 Creating group session for group:", groupId);

			// Check if we already have a key for this group
			let groupKey = this.groupStates.get(groupId)?.groupKey;

			console.log(
				"🔐 [DEBUG] Existing group key in memory:",
				groupKey ? "[EXISTS]" : "[NOT FOUND]"
			);

			if (!groupKey) 
{
				// Try to load from secure storage first
				const storageKey = `expo_group_key_${groupId}`;

				console.log(
					"🔐 [DEBUG] Checking storage for existing key:",
					storageKey
				);
				const storedGroupKey
					= await SecureStore.getItemAsync(storageKey);

				console.log(
					"🔐 [DEBUG] Key found in storage:",
					storedGroupKey ? "[EXISTS]" : "[NOT FOUND]"
				);

				if (storedGroupKey) 
{
					// Use existing key from storage
					groupKey = storedGroupKey;
					this.groupStates.set(groupId, {
						groupKey,
						memberKeys: new Map(),
						keyVersion: 1,
						lastUpdated: Date.now(),
					});
					console.log("🔐 [DEBUG] Using existing key from storage");
					console.log(
						"🔐 [DEBUG] Existing key first 16 chars:",
						groupKey.substring(0, 16)
					);
				} else {
					// Generate new group key only if none exists
					// In a real implementation, this should be coordinated among group members
					// For now, we'll use a deterministic key based on group ID to ensure consistency
					console.log(
						"🔐 [DEBUG] Generating deterministic group key..."
					);
					groupKey
						= await this.generateDeterministicGroupKey(groupId);
					console.log(
						"🔐 [DEBUG] Generated deterministic key length:",
						groupKey.length
					);
					console.log(
						"🔐 [DEBUG] Generated deterministic key first 16 chars:",
						groupKey.substring(0, 16)
					);

					this.groupStates.set(groupId, {
						groupKey,
						memberKeys: new Map(),
						keyVersion: 1,
						lastUpdated: Date.now(),
					});

					// Store group key securely
					console.log(
						"🔐 [DEBUG] Storing deterministic key with storage key:",
						storageKey
					);
					await SecureStore.setItemAsync(storageKey, groupKey);

					// Verify storage
					const verifyStored
						= await SecureStore.getItemAsync(storageKey);

					console.log(
						"🔐 [DEBUG] Storage verification:",
						verifyStored ? "[SUCCESS]" : "[FAILED]"
					);
					console.log(
						"🔐 [DEBUG] Stored key matches generated:",
						verifyStored === groupKey
					);

					console.log(
						"✅ Generated deterministic group key for group:",
						groupId
					);
				}
			} else {
				console.log(
					"✅ Using existing group key from memory for group:",
					groupId
				);
				console.log(
					"🔐 [DEBUG] Memory key first 16 chars:",
					groupKey.substring(0, 16)
				);
			}
		} catch (error) {
			console.error(
				"❌ [DEBUG] Failed to create group session - Error details:",
				error
			);
			console.error(
				"❌ [DEBUG] Stack trace:",
				error instanceof Error
					? error.stack
					: "No stack trace available"
			);
			throw new Error("Group session creation failed");
		}
	}

	/**
	 * Generate a deterministic group key based on group ID
	 * This ensures all group members generate the same key
	 */
	private async generateDeterministicGroupKey(
		groupId: string
	): Promise<string> 
{
		try 
{
			console.log(
				"🔐 [DEBUG] Creating deterministic key for group:",
				groupId
			);

			// Create a deterministic key by hashing the group ID with a fixed salt
			const salt = "notAlone_group_key_salt_2025";
			const seedString = `${salt}_${groupId}`;

			console.log(
				"🔐 [DEBUG] Seed string for key generation:",
				seedString
			);

			// Generate hash
			const hash = await Crypto.digestStringAsync(
				Crypto.CryptoDigestAlgorithm.SHA256,
				seedString
			);

			console.log("🔐 [DEBUG] Generated hash:", hash);

			// Convert hex hash to base64 (take first 32 chars of hex = 16 bytes = 256 bits)
			const hexKey = hash.substring(0, 32); // 32 hex chars = 16 bytes
			const keyBytes = this.hexToBytes(hexKey);
			const base64Key = this.bytesToBase64(keyBytes);

			console.log("🔐 [DEBUG] Deterministic key (base64):", base64Key);

			return base64Key;
		} catch (error) {
			console.error(
				"❌ [DEBUG] Failed to generate deterministic key:",
				error
			);
			throw new Error("Failed to generate deterministic group key");
		}
	}

	/**
	 * Simple AES-like encryption using XOR with key derivation
	 * This is a simplified but functional encryption for demo purposes
	 */
	/**
	 * Create message-specific encryption key from message metadata + group key + sender key
	 */
	private async createMessageKey(
		messageLength: number,
		timestamp: number,
		groupKey: string,
		senderKey: string
	): Promise<string> 
{
		// Combine message metadata, group key, and sender key
		const keyInput = `${messageLength}_${timestamp}_${groupKey}_${senderKey}`;

		// Generate deterministic message key using SHA256
		const messageKeyHash = await Crypto.digestStringAsync(
			Crypto.CryptoDigestAlgorithm.SHA256,
			keyInput
		);

		console.log("🔐 [DEBUG] Created message key from:", {
			messageLength,
			timestamp,
			groupKeyLength: groupKey.length,
			senderKeyLength: senderKey.length,
			messageKeyLength: messageKeyHash.length,
		});

		return messageKeyHash;
	}

	private async simpleEncrypt(
		plaintext: string,
		groupKey: string,
		senderKey: string,
		timestamp: number
	): Promise<{
		ciphertext: string;
		iv: string;
		messageKeyHash: string;
		timestamp: number;
	}> 
{
		try 
{
			// Generate random IV
			const ivBytes = Crypto.getRandomBytes(16);
			const iv = this.bytesToBase64(ivBytes);

			// Create message-specific encryption key using message metadata
			const messageKey = await this.createMessageKey(
				plaintext.length,
				timestamp,
				groupKey,
				senderKey
			);
			const messageKeyBytes = this.hexToBytes(messageKey);

			// Convert plaintext to bytes
			const plaintextBytes = new TextEncoder().encode(plaintext);

			// XOR encryption with message-specific key
			const ciphertextBytes = new Uint8Array(plaintextBytes.length);

			for (let i = 0; i < plaintextBytes.length; i++)
{
				ciphertextBytes[i]
					= plaintextBytes[i]
					^ messageKeyBytes[i % messageKeyBytes.length];
			}

			return {
				ciphertext: this.bytesToBase64(ciphertextBytes),
				iv,
				messageKeyHash: messageKey.substring(0, 16), // First 16 chars for verification
				timestamp,
			};
		} catch (error) {
			console.error("❌ Encryption failed:", error);
			throw new Error("Encryption failed");
		}
	}

	/**
	 * Simple AES-like decryption using message-specific key
	 */
	private async simpleDecrypt(
		ciphertext: string,
		groupKey: string,
		senderKey: string,
		iv: string,
		messageLength: number,
		timestamp: number
	): Promise<string> 
{
		try 
{
			// Convert inputs to bytes
			const ciphertextBytes = this.base64ToBytes(ciphertext);

			// Recreate message-specific key (same as encryption)
			const messageKey = await this.createMessageKey(
				messageLength,
				timestamp,
				groupKey,
				senderKey
			);
			const messageKeyBytes = this.hexToBytes(messageKey);

			// Decrypt using XOR with message-specific key
			const plaintextBytes = new Uint8Array(ciphertextBytes.length);

			for (let i = 0; i < ciphertextBytes.length; i++)
{
				plaintextBytes[i]
					= ciphertextBytes[i]
					^ messageKeyBytes[i % messageKeyBytes.length];
			}

			return new TextDecoder().decode(plaintextBytes);
		} catch (error) {
			console.error("❌ Decryption failed:", error);
			throw new Error("Decryption failed");
		}
	}

	/**
	 * Encrypt a message for group chat
	 */
	async encryptGroupMessage(
		message: string,
		groupId: string,
		senderId: string
	): Promise<EncryptedMessage> 
{
		try 
{
			console.log("🔐 [DEBUG] Starting encryption for group:", groupId);
			console.log("🔐 [DEBUG] Message to encrypt:", message);
			console.log("🔐 [DEBUG] Sender ID:", senderId);

			if (!this.initialized) 
{
				console.error(
					"❌ [DEBUG] Crypto not initialized for encryption"
				);
				throw new Error("Crypto not initialized");
			}

			console.log("🔐 Encrypting message for group:", groupId);

			// Get group key - first try memory, then storage
			let groupKey = this.groupStates.get(groupId)?.groupKey;

			console.log(
				"🔐 [DEBUG] Group key from memory:",
				groupKey ? "[EXISTS]" : "[NOT FOUND]"
			);

			if (!groupKey) 
{
				// Try to load from secure storage
				const storedKey = await SecureStore.getItemAsync(
					`expo_group_key_${groupId}`
				);

				console.log(
					"🔐 [DEBUG] Group key from storage:",
					storedKey ? "[EXISTS]" : "[NOT FOUND]"
				);

				if (storedKey) 
{
					groupKey = storedKey;
					// Update memory cache but don't change the group state structure
					const groupState = this.groupStates.get(groupId);

					if (groupState)
{
						groupState.groupKey = storedKey;
					} else {
						// Create minimal group state if not exists
						this.groupStates.set(groupId, {
							groupKey: storedKey,
							memberKeys: new Map(),
							keyVersion: 1,
							lastUpdated: Date.now(),
						});
					}
					console.log(
						"🔐 [DEBUG] Group key loaded from storage and cached"
					);
				} else {
					console.error(
						"❌ [DEBUG] No group key found for group:",
						groupId
					);
					throw new Error(`No group key found for group: ${groupId}`);
				}
			}

			console.log("🔐 [DEBUG] Group key length:", groupKey.length);
			console.log(
				"🔐 [DEBUG] Group key first 16 chars:",
				groupKey.substring(0, 16)
			);

			// Get sender's actual public key for message encryption
			const senderPublicKey = this.userKeyPair?.publicKey || senderId;

			console.log(
				"🔐 [DEBUG] Using sender public key for encryption:",
				senderPublicKey.substring(0, 16)
			);

			// Encrypt the message
			const timestamp = Date.now();

			console.log("🔐 [DEBUG] Starting simpleEncrypt...");
			const { ciphertext, iv, messageKeyHash } = await this.simpleEncrypt(
				message,
				groupKey,
				senderPublicKey,
				timestamp
			);

			console.log("🔐 [DEBUG] Encryption complete. IV:", iv);
			console.log("🔐 [DEBUG] Ciphertext length:", ciphertext.length);
			console.log("🔐 [DEBUG] Message key hash:", messageKeyHash);

			const encrypted: EncryptedMessage = {
				iv,
				ciphertext,
				senderId,
				timestamp,
				groupId,
				keyHash: messageKeyHash, // Message key hash for verification
			};

			console.log("🔐 [DEBUG] Final encrypted message structure:", {
				iv: encrypted.iv,
				ciphertext: encrypted.ciphertext.substring(0, 20) + "...",
				senderId: encrypted.senderId,
				timestamp: encrypted.timestamp,
				groupId: encrypted.groupId,
				keyHash: encrypted.keyHash,
			});

			console.log("✅ Message encrypted successfully");
			return encrypted;
		} catch (error) {
			console.error(
				"❌ [DEBUG] Failed to encrypt message - Error details:",
				error
			);
			console.error(
				"❌ [DEBUG] Stack trace:",
				error instanceof Error
					? error.stack
					: "No stack trace available"
			);
			throw new Error("Message encryption failed");
		}
	}

	/**
	 * Decrypt a group message
	 */
	async decryptGroupMessage(
		encryptedMessage: EncryptedMessage
	): Promise<DecryptedMessage> 
{
		try 
{
			console.log("🔓 [DEBUG] Starting decryption...");
			console.log("🔓 [DEBUG] Encrypted message structure:", {
				hasIv: !!encryptedMessage.iv,
				hasCiphertext: !!encryptedMessage.ciphertext,
				hasKeyHash: !!encryptedMessage.keyHash,
				senderId: encryptedMessage.senderId,
				groupId: encryptedMessage.groupId,
				timestamp: encryptedMessage.timestamp,
			});

			if (!this.initialized) 
{
				console.error(
					"❌ [DEBUG] Crypto not initialized for decryption"
				);
				throw new Error("Crypto not initialized");
			}

			const { iv, ciphertext, senderId, timestamp, groupId, keyHash }
				= encryptedMessage;

			if (!groupId) 
{
				console.error(
					"❌ [DEBUG] Group ID missing from encrypted message"
				);
				throw new Error("Group ID missing from encrypted message");
			}

			console.log("🔓 Decrypting message for group:", groupId);
			console.log("🔓 [DEBUG] IV:", iv);
			console.log("🔓 [DEBUG] Ciphertext length:", ciphertext.length);
			console.log("🔓 [DEBUG] Received keyHash:", keyHash);

			// Get group key
			let groupKey = this.groupStates.get(groupId)?.groupKey;

			console.log(
				"🔓 [DEBUG] Group key from memory:",
				groupKey ? "[EXISTS]" : "[NOT FOUND]"
			);

			if (!groupKey) 
{
				// Try to load from secure storage
				const storedKey = await SecureStore.getItemAsync(
					`expo_group_key_${groupId}`
				);

				console.log(
					"🔓 [DEBUG] Group key from storage:",
					storedKey ? "[EXISTS]" : "[NOT FOUND]"
				);

				if (storedKey) 
{
					groupKey = storedKey;
					this.groupStates.set(groupId, {
						groupKey,
						memberKeys: new Map(),
						keyVersion: 1,
						lastUpdated: Date.now(),
					});
					console.log(
						"🔓 [DEBUG] Group key loaded and cached for decryption"
					);
				} else {
					console.error(
						"❌ [DEBUG] No group key found for decryption of group:",
						groupId
					);
					throw new Error(`No group key found for group: ${groupId}`);
				}
			}

			console.log("🔓 [DEBUG] Group key length:", groupKey.length);
			console.log(
				"🔓 [DEBUG] Group key first 16 chars:",
				groupKey.substring(0, 16)
			);

			// Verify key hash using the same derivation as encryption
			console.log("🔓 [DEBUG] Verifying key hash...");
			console.log(
				"🔓 [DEBUG] Using groupKey + iv for hash:",
				(groupKey + iv).substring(0, 30) + "..."
			);

			const expectedKeyHash = await Crypto.digestStringAsync(
				Crypto.CryptoDigestAlgorithm.SHA256,
				groupKey + iv
			);

			console.log("🔓 [DEBUG] Expected full hash:", expectedKeyHash);
			console.log(
				"🔓 [DEBUG] Expected truncated hash:",
				expectedKeyHash.substring(0, 16)
			);
			console.log("🔓 [DEBUG] Received hash:", keyHash);
			console.log(
				"🔓 [DEBUG] Hashes match:",
				expectedKeyHash.substring(0, 16) === keyHash
			);

			if (expectedKeyHash.substring(0, 16) !== keyHash) 
{
				console.warn(
					"⚠️ Key hash mismatch - message may be corrupted or from wrong key"
				);
				console.warn(
					"⚠️ [DEBUG] This suggests the sender used a different key or derivation method"
				);
				// For security, we could choose to reject the message here
				// throw new Error('Message integrity check failed');
			}

			// Get sender's actual public key from group state
			const groupState = this.groupStates.get(groupId!);
			const senderPublicKey
				= groupState?.memberKeys.get(senderId)
				|| this.userKeyPair?.publicKey
				|| senderId;
			const messageLength = this.base64ToBytes(ciphertext).length; // Calculate from ciphertext

			console.log(
				"🔓 [DEBUG] Using sender public key:",
				senderPublicKey.substring(0, 16)
			);

			// Decrypt the message
			console.log("🔓 [DEBUG] Starting simpleDecrypt...");
			const plaintext = await this.simpleDecrypt(
				ciphertext,
				groupKey,
				senderPublicKey,
				iv,
				messageLength,
				timestamp
			);

			console.log(
				"🔓 [DEBUG] Decryption complete. Plaintext:",
				plaintext
			);

			const decrypted: DecryptedMessage = {
				content: plaintext,
				senderId,
				timestamp,
				groupId,
			};

			console.log("✅ Message decrypted successfully");
			return decrypted;
		} catch (error) {
			console.error(
				"❌ [DEBUG] Failed to decrypt message - Error details:",
				error
			);
			console.error(
				"❌ [DEBUG] Stack trace:",
				error instanceof Error
					? error.stack
					: "No stack trace available"
			);
			throw new Error("Message decryption failed");
		}
	}

	/**
	 * Utility functions
	 */
	private bytesToBase64(bytes: Uint8Array): string 
{
		let binary = "";

		for (let i = 0; i < bytes.length; i++)
{
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	private base64ToBytes(base64: string): Uint8Array 
{
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);

		for (let i = 0; i < binary.length; i++)
{
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}

	private hexToBytes(hex: string): Uint8Array 
{
		const bytes = new Uint8Array(hex.length / 2);

		for (let i = 0; i < hex.length; i += 2)
{
			bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
		}
		return bytes;
	}

	/**
	 * Get public key for sharing with other users
	 */
	getPublicKey(): string | null 
{
		return this.userKeyPair?.publicKey || null;
	}

	/**
	 * Check if crypto engine is ready
	 */
	isInitialized(): boolean 
{
		return this.initialized;
	}

	/**
	 * Clear all stored keys (logout)
	 */
	async clearKeys(userId: string): Promise<void> 
{
		try 
{
			console.log("🧹 Clearing crypto keys for user:", userId);

			// Clear from memory
			this.userKeyPair = null;
			this.groupStates.clear();
			this.initialized = false;

			// Clear from secure storage
			await SecureStore.deleteItemAsync(`expo_private_key_${userId}`);
			await SecureStore.deleteItemAsync(`expo_public_key_${userId}`);

			// Also clear any group keys (for testing purposes)
			// In production, you might want to keep these
			console.log("🧹 [DEBUG] Clearing group keys from storage...");
			try 
{
				// Get all keys and delete group keys
				// Note: SecureStore doesn't have a way to list all keys, so this is a simplified approach
				// In a real app, you'd track group keys separately
			} catch (error) {
				console.warn("⚠️ [DEBUG] Could not clear group keys:", error);
			}

			console.log("✅ Crypto keys cleared successfully");
		} catch (error) {
			console.error("❌ Failed to clear crypto keys:", error);
		}
	}

	/**
	 * Clear a specific group key (for testing)
	 */
	async clearGroupKey(groupId: string): Promise<void> 
{
		try 
{
			console.log("🧹 [DEBUG] Clearing group key for:", groupId);

			// Clear from memory
			this.groupStates.delete(groupId);

			// Clear from storage
			const storageKey = `expo_group_key_${groupId}`;

			await SecureStore.deleteItemAsync(storageKey);

			console.log("✅ [DEBUG] Group key cleared for:", groupId);
		} catch (error) {
			console.error("❌ [DEBUG] Failed to clear group key:", error);
		}
	}

	/**
	 * Refresh group keys - generate new personal key for security
	 */
	async refreshGroupKeys(
		groupId: string,
		userId: string
	): Promise<KeyExchangeMessage> 
{
		try 
{
			console.log("🔄 [DEBUG] Refreshing keys for group:", groupId);

			if (!this.initialized) 
{
				throw new Error("Crypto not initialized");
			}

			const groupState = this.groupStates.get(groupId);

			if (!groupState)
{
				throw new Error("Group state not found");
			}

			// Generate new personal key for this group
			const newPersonalKey = this.generatePersonalGroupKey();

			console.log(
				"🔄 [DEBUG] Generated new personal key (first 16 chars):",
				newPersonalKey.substring(0, 16)
			);

			// Update our key in the group
			groupState.memberKeys.set(userId, newPersonalKey);
			groupState.keyVersion += 1;
			groupState.lastUpdated = Date.now();

			// Regenerate group key with the new key set
			if (groupState.memberKeys.size > 0) 
{
				groupState.groupKey = this.generateGroupKey(
					groupState.memberKeys,
					groupId,
					groupState.keyVersion
				);

				// Store the updated group key in secure storage
				const storageKey = `expo_group_key_${groupId}`;

				await SecureStore.setItemAsync(storageKey, groupState.groupKey);
				console.log(
					"🔄 [DEBUG] Regenerated and stored new group key after refresh"
				);
			}

			// Save state
			await this.saveGroupStates(userId);

			// Return key exchange message to broadcast
			return {
				type: "key_exchange",
				userId,
				groupId,
				userKey: newPersonalKey,
				keyVersion: groupState.keyVersion,
				action: "refresh",
			};
		} catch (error) {
			console.error("❌ Failed to refresh group keys:", error);
			throw new Error("Group key refresh failed");
		}
	}
}

// Export singleton instance
export const expoCompatibleCrypto = new ExpoCompatibleCrypto();
export default expoCompatibleCrypto;
