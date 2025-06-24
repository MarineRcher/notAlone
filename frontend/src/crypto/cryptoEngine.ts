/**
 * Robust Crypto Engine for E2EE Group Chat
 * Using react-native-quick-crypto for secure encryption
 */

import QuickCrypto from "react-native-quick-crypto";
import * as SecureStore from "expo-secure-store";

// Initialize react-native-quick-crypto
QuickCrypto.install();

export interface EncryptedMessage {
	iv: string;
	ciphertext: string;
	tag: string;
	senderId: string;
	timestamp: number;
	groupId?: string;
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

class CryptoEngine 
{
	private initialized = false;
	private userKeyPair: KeyPair | null = null;
	private groupKeys: Map<string, string> = new Map();

	/**
	 * Initialize the crypto engine for a user
	 */
	async initialize(userId: string): Promise<void> 
{
		try 
{
			console.log("🔐 Initializing crypto engine for user:", userId);

			// Try to load existing key pair
			const existingPrivateKey = await SecureStore.getItemAsync(
				`private_key_${userId}`
			);
			const existingPublicKey = await SecureStore.getItemAsync(
				`public_key_${userId}`
			);

			if (existingPrivateKey && existingPublicKey) 
{
				this.userKeyPair = {
					privateKey: existingPrivateKey,
					publicKey: existingPublicKey,
				};
				console.log("✅ Loaded existing key pair");
			} else {
				// Generate new key pair
				this.userKeyPair = await this.generateKeyPair();

				// Store the key pair securely
				await SecureStore.setItemAsync(
					`private_key_${userId}`,
					this.userKeyPair.privateKey
				);
				await SecureStore.setItemAsync(
					`public_key_${userId}`,
					this.userKeyPair.publicKey
				);
				console.log("✅ Generated and stored new key pair");
			}

			this.initialized = true;
			console.log("✅ Crypto engine initialized successfully");
		} catch (error) {
			console.error("❌ Failed to initialize crypto engine:", error);
			throw new Error("Crypto initialization failed");
		}
	}

	/**
	 * Generate a new asymmetric key pair using RSA
	 */
	private async generateKeyPair(): Promise<KeyPair> 
{
		try 
{
			const keyPair = QuickCrypto.generateKeyPairSync("rsa", {
				modulusLength: 2048,
				publicKeyEncoding: {
					type: "spki",
					format: "pem",
				},
				privateKeyEncoding: {
					type: "pkcs8",
					format: "pem",
				},
			});

			return {
				publicKey: keyPair.publicKey,
				privateKey: keyPair.privateKey,
			};
		} catch (error) {
			console.error("❌ Failed to generate key pair:", error);
			throw new Error("Key pair generation failed");
		}
	}

	/**
	 * Generate a symmetric key for group encryption (AES-256)
	 */
	private generateGroupKey(): string 
{
		const key = QuickCrypto.randomBytes(32); // 256 bits

		return key.toString("base64");
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
			if (!this.initialized) 
{
				throw new Error("Crypto engine not initialized");
			}

			console.log("🔐 Creating group session for group:", groupId);

			// Check if we already have a key for this group
			let groupKey = this.groupKeys.get(groupId);

			if (!groupKey) 
{
				// Generate new group key
				groupKey = this.generateGroupKey();
				this.groupKeys.set(groupId, groupKey);

				// Store group key securely
				await SecureStore.setItemAsync(
					`group_key_${groupId}`,
					groupKey
				);
				console.log("✅ Generated new group key for group:", groupId);
			} else {
				console.log("✅ Using existing group key for group:", groupId);
			}
		} catch (error) {
			console.error("❌ Failed to create group session:", error);
			throw new Error("Group session creation failed");
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
			if (!this.initialized) 
{
				throw new Error("Crypto engine not initialized");
			}

			console.log("🔐 Encrypting message for group:", groupId);

			// Get group key
			let groupKey = this.groupKeys.get(groupId);

			if (!groupKey)
{
				// Try to load from secure storage
				groupKey = await SecureStore.getItemAsync(
					`group_key_${groupId}`
				);
				if (groupKey) 
{
					this.groupKeys.set(groupId, groupKey);
				} else {
					throw new Error(`No group key found for group: ${groupId}`);
				}
			}

			// Convert base64 key to buffer
			const keyBuffer = Buffer.from(groupKey, "base64");

			// Generate random IV (12 bytes for AES-GCM)
			const iv = QuickCrypto.randomBytes(12);

			// Create cipher
			const cipher = QuickCrypto.createCipherGCM(
				"aes-256-gcm",
				keyBuffer
			);

			cipher.setAAD(Buffer.from(senderId)); // Additional authenticated data

			// Encrypt the message
			let ciphertext = cipher.update(message, "utf8", "base64");

			ciphertext += cipher.final("base64");

			// Get authentication tag
			const tag = cipher.getAuthTag();

			const encrypted: EncryptedMessage = {
				iv: iv.toString("base64"),
				ciphertext,
				tag: tag.toString("base64"),
				senderId,
				timestamp: Date.now(),
				groupId,
			};

			console.log("✅ Message encrypted successfully");
			return encrypted;
		} catch (error) {
			console.error("❌ Failed to encrypt message:", error);
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
			if (!this.initialized) 
{
				throw new Error("Crypto engine not initialized");
			}

			const { iv, ciphertext, tag, senderId, timestamp, groupId }
				= encryptedMessage;

			if (!groupId) 
{
				throw new Error("Group ID missing from encrypted message");
			}

			console.log("🔓 Decrypting message for group:", groupId);

			// Get group key
			let groupKey = this.groupKeys.get(groupId);

			if (!groupKey)
{
				// Try to load from secure storage
				groupKey = await SecureStore.getItemAsync(
					`group_key_${groupId}`
				);
				if (groupKey) 
{
					this.groupKeys.set(groupId, groupKey);
				} else {
					throw new Error(`No group key found for group: ${groupId}`);
				}
			}

			// Convert base64 data to buffers
			const keyBuffer = Buffer.from(groupKey, "base64");
			const ivBuffer = Buffer.from(iv, "base64");
			const tagBuffer = Buffer.from(tag, "base64");

			// Create decipher
			const decipher = QuickCrypto.createDecipherGCM(
				"aes-256-gcm",
				keyBuffer
			);

			decipher.setAAD(Buffer.from(senderId)); // Additional authenticated data
			decipher.setAuthTag(tagBuffer);

			// Decrypt the message
			let plaintext = decipher.update(ciphertext, "base64", "utf8");

			plaintext += decipher.final("utf8");

			const decrypted: DecryptedMessage = {
				content: plaintext,
				senderId,
				timestamp,
				groupId,
			};

			console.log("✅ Message decrypted successfully");
			return decrypted;
		} catch (error) {
			console.error("❌ Failed to decrypt message:", error);
			throw new Error("Message decryption failed");
		}
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
			this.groupKeys.clear();
			this.initialized = false;

			// Clear from secure storage
			await SecureStore.deleteItemAsync(`private_key_${userId}`);
			await SecureStore.deleteItemAsync(`public_key_${userId}`);

			// Clear group keys
			const keys = await SecureStore.getAllKeysAsync();

			for (const key of keys)
{
				if (key.startsWith("group_key_")) 
{
					await SecureStore.deleteItemAsync(key);
				}
			}

			console.log("✅ Crypto keys cleared successfully");
		} catch (error) {
			console.error("❌ Failed to clear crypto keys:", error);
		}
	}
}

// Export singleton instance
export const cryptoEngine = new CryptoEngine();
export default cryptoEngine;
