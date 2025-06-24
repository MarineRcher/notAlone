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

class CryptoEngine {
	private initialized = false;
	private userKeyPair: KeyPair | null = null;
	private groupKeys: Map<string, string> = new Map();

	/**
	 * Loads existing key pair from secure storage
	 */
	private async loadExistingKeyPair(userId: string): Promise<KeyPair | null> {
		const existingPrivateKey = await SecureStore.getItemAsync(
			`private_key_${userId}`
		);
		const existingPublicKey = await SecureStore.getItemAsync(
			`public_key_${userId}`
		);

		if (existingPrivateKey && existingPublicKey) {
			return {
				privateKey: existingPrivateKey,
				publicKey: existingPublicKey,
			};
		}

		return null;
	}

	/**
	 * Generates and stores new key pair
	 */
	private async generateAndStoreKeyPair(userId: string): Promise<KeyPair> {
		const keyPair = await this.generateKeyPair();

		await SecureStore.setItemAsync(
			`private_key_${userId}`,
			keyPair.privateKey
		);
		await SecureStore.setItemAsync(
			`public_key_${userId}`,
			keyPair.publicKey
		);

		return keyPair;
	}

	/**
	 * Initialize the crypto engine for a user
	 */
	async initialize(userId: string): Promise<void> {
		try {
			console.log("🔐 Initializing crypto engine for user:", userId);

			// Try to load existing key pair
			const existingKeyPair = await this.loadExistingKeyPair(userId);

			if (existingKeyPair) {
				this.userKeyPair = existingKeyPair;
				console.log("✅ Loaded existing key pair");
			} else {
				// Generate new key pair
				this.userKeyPair = await this.generateAndStoreKeyPair(userId);
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
	private async generateKeyPair(): Promise<KeyPair> {
		try {
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
	private generateGroupKey(): string {
		const key = QuickCrypto.randomBytes(32); // 256 bits

		return key.toString("base64");
	}

	/**
	 * Gets or creates group key
	 */
	private async getOrCreateGroupKey(groupId: string): Promise<string> {
		let groupKey = this.groupKeys.get(groupId);

		if (!groupKey) {
			// Check storage first
			groupKey = await SecureStore.getItemAsync(`group_key_${groupId}`);
			if (groupKey) {
				this.groupKeys.set(groupId, groupKey);
			} else {
				// Generate new group key
				groupKey = this.generateGroupKey();
				this.groupKeys.set(groupId, groupKey);

				// Store group key securely
				await SecureStore.setItemAsync(
					`group_key_${groupId}`,
					groupKey
				);
			}
		}

		return groupKey;
	}

	/**
	 * Create or join a group session
	 */
	async createGroupSession(
		groupId: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		memberIds: string[]
	): Promise<void> {
		try {
			if (!this.initialized) {
				throw new Error("Crypto engine not initialized");
			}

			console.log("🔐 Creating group session for group:", groupId);

			await this.getOrCreateGroupKey(groupId);
			console.log("✅ Group session created for group:", groupId);
		} catch (error) {
			console.error("❌ Failed to create group session:", error);
			throw new Error("Group session creation failed");
		}
	}

	/**
	 * Gets group key for encryption
	 */
	private async getGroupKeyForEncryption(groupId: string): Promise<string> {
		let groupKey = this.groupKeys.get(groupId);

		if (!groupKey) {
			// Try to load from secure storage
			groupKey = await SecureStore.getItemAsync(`group_key_${groupId}`);
			if (groupKey) {
				this.groupKeys.set(groupId, groupKey);
			} else {
				throw new Error(`No group key found for group: ${groupId}`);
			}
		}

		return groupKey;
	}

	/**
	 * Creates cipher for encryption
	 */
	private createEncryptionCipher(
		keyBuffer: Buffer,
		senderId: string
	): { cipher: any; iv: Buffer } {
		// Generate random IV (12 bytes for AES-GCM)
		const iv = QuickCrypto.randomBytes(12);

		// Create cipher
		const cipher = QuickCrypto.createCipherGCM("aes-256-gcm", keyBuffer);

		cipher.setAAD(Buffer.from(senderId));

		return { cipher, iv };
	}

	/**
	 * Encrypt a message for group chat
	 */
	async encryptGroupMessage(
		message: string,
		groupId: string,
		senderId: string
	): Promise<EncryptedMessage> {
		try {
			if (!this.initialized) {
				throw new Error("Crypto engine not initialized");
			}

			console.log("🔐 Encrypting message for group:", groupId);

			// Get group key
			const groupKey = await this.getGroupKeyForEncryption(groupId);

			// Convert base64 key to buffer
			const keyBuffer = Buffer.from(groupKey, "base64");

			// Create cipher and IV
			const { cipher, iv } = this.createEncryptionCipher(
				keyBuffer,
				senderId
			);

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
	 * Gets group key for decryption
	 */
	private async getGroupKeyForDecryption(groupId: string): Promise<string> {
		let groupKey = this.groupKeys.get(groupId);

		if (!groupKey) {
			// Try to load from secure storage
			groupKey = await SecureStore.getItemAsync(`group_key_${groupId}`);
			if (groupKey) {
				this.groupKeys.set(groupId, groupKey);
			} else {
				throw new Error(`No group key found for group: ${groupId}`);
			}
		}

		return groupKey;
	}

	/**
	 * Creates decipher for decryption
	 */
	private createDecryptionDecipher(
		keyBuffer: Buffer,
		iv: Buffer,
		tag: Buffer,
		senderId: string
	): any {
		const decipher = QuickCrypto.createDecipherGCM(
			"aes-256-gcm",
			keyBuffer
		);

		decipher.setAAD(Buffer.from(senderId));
		decipher.setAuthTag(tag);

		return decipher;
	}

	/**
	 * Decrypt a group message
	 */
	async decryptGroupMessage(
		encryptedMessage: EncryptedMessage
	): Promise<DecryptedMessage> {
		try {
			if (!this.initialized) {
				throw new Error("Crypto engine not initialized");
			}

			const { iv, ciphertext, tag, senderId, timestamp, groupId } =
				encryptedMessage;

			if (!groupId) {
				throw new Error("Group ID is required for group message");
			}

			console.log("🔐 Decrypting message for group:", groupId);

			// Get group key
			const groupKey = await this.getGroupKeyForDecryption(groupId);

			// Convert base64 data to buffers
			const keyBuffer = Buffer.from(groupKey, "base64");
			const ivBuffer = Buffer.from(iv, "base64");
			const tagBuffer = Buffer.from(tag, "base64");

			// Create decipher
			const decipher = this.createDecryptionDecipher(
				keyBuffer,
				ivBuffer,
				tagBuffer,
				senderId
			);

			// Decrypt the message
			let decrypted = decipher.update(ciphertext, "base64", "utf8");

			decrypted += decipher.final("utf8");

			const result: DecryptedMessage = {
				content: decrypted,
				senderId,
				timestamp,
				groupId,
			};

			console.log("✅ Message decrypted successfully");
			return result;
		} catch (error) {
			console.error("❌ Failed to decrypt message:", error);
			throw new Error("Message decryption failed");
		}
	}

	/**
	 * Get user's public key
	 */
	getPublicKey(): string | null {
		return this.userKeyPair ? this.userKeyPair.publicKey : null;
	}

	/**
	 * Check if crypto engine is initialized
	 */
	isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * Clear all keys for a user
	 */
	async clearKeys(userId: string): Promise<void> {
		try {
			// Clear stored keys
			await SecureStore.deleteItemAsync(`private_key_${userId}`);
			await SecureStore.deleteItemAsync(`public_key_${userId}`);

			// Clear in-memory keys
			this.userKeyPair = null;
			this.groupKeys.clear();
			this.initialized = false;

			console.log("✅ Keys cleared successfully");
		} catch (error) {
			console.error("❌ Failed to clear keys:", error);
			throw new Error("Failed to clear keys");
		}
	}
}

// Export a singleton instance
export default new CryptoEngine();
