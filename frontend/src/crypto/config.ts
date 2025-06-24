export const CRYPTO_CONFIG = {
	keyLength: 256,
	saltLength: 32,
	maxGroupSize: 10,
	keyRotationInterval: 24 * 60 * 60 * 1000,
	messageRetentionDays: 30,
	secureStorageKeys: {
		userKeyPair: "crypto_user_key_pair",
		groupKeys: "crypto_group_keys",
		memberKeys: "crypto_member_keys"
	},
	algorithms: {
		keyDerivation: "SHA-256",
		groupKeyDerivation: "SHA-512",
		messageEncryption: "XOR"
	}
} as const;

export const CRYPTO_ERRORS = {
	KEY_NOT_FOUND: "Cryptographic key not found",
	INVALID_KEY_VERSION: "Invalid key version",
	USER_NOT_INITIALIZED: "User not initialized",
	GROUP_NOT_FOUND: "Group not found",
	STORAGE_FAILED: "Storage operation failed",
	ENCRYPTION_FAILED: "Encryption operation failed",
	DECRYPTION_FAILED: "Decryption operation failed",
	KEY_EXCHANGE_FAILED: "Key exchange operation failed"
} as const;
