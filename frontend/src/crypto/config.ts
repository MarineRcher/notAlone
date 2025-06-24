// Algorithm configurations
export const ENCRYPTION_CONFIG = {
	// Key generation parameters
	KEY_GENERATION: {
		// RSA key pair for asymmetric encryption
		// (public/private key encryption)
		RSA: {
			modulusLength: 2048, // Key size in bits
			// 65537 - standard RSA public exponent
			publicExponent: 0x10001,
		},
		// For ECDH (Elliptic Curve Diffie-Hellman) key exchange
		ECDH: {
			// NIST P-256 curve (also known as secp256r1)
			namedCurve: "P-256",
		},
	},

	// Symmetric encryption parameters (for message encryption)
	SYMMETRIC: {
		algorithm: "AES-GCM", // AES with Galois/Counter Mode
		keySize: 256, // Key size in bits
		ivLength: 12, // Initialization vector length in bytes
	},

	// Asymmetric encryption parameters (for key exchange)
	ASYMMETRIC: {
		// RSA with Optimal Asymmetric Encryption Padding
		algorithm: "RSA-OAEP",
		hashAlgorithm: "SHA-256", // Hash algorithm for OAEP
	},

	// Digital signature parameters
	SIGNATURE: {
		// RSA Signature Scheme with PKCS #1 v1.5
		algorithm: "RSASSA-PKCS1-v1_5",
		hashAlgorithm: "SHA-256", // Hash algorithm for signature
	},

	// Key derivation function parameters
	KDF: {
		algorithm: "PBKDF2", // Password-Based Key Derivation Function 2
		iterations: 100000, // Number of iterations
		hashAlgorithm: "SHA-256", // Hash algorithm for PBKDF2
		saltLength: 16, // Salt length in bytes
	},

	// Storage configuration
	STORAGE: {
		keyPrefix: "e2ee_", // Prefix for keys stored in secure storage
		// These represent the keys used to store different encryption
		// items
		keys: {
			privateKey: "e2ee_private_key",
			publicKey: "e2ee_public_key",
			identityKey: "e2ee_identity",
			sessionKeys: "e2ee_sessions",
		},
	},

	// Message format configuration
	MESSAGE: {
		version: "1.0", // Protocol version
		headerSize: 16, // Size of message header in bytes
	},
};

// Environment-specific configuration
export const ENV_CONFIG = {
	development: {
		// Development-specific overrides
		keyStorage: "secure-store", // Use Expo SecureStore in development
		debugLogging: true, // Enable debug logging in development
	},
	production: {
		// Production-specific overrides
		keyStorage: "secure-store", // Use Expo SecureStore in production
		debugLogging: false, // Disable debug logging in production
	},
	test: {
		// Test-specific overrides
		keyStorage: "memory", // Use in-memory storage in tests
		debugLogging: true, // Enable debug logging in tests
	},
};

// Get the current environment
export function getEnvironment(): "development" | "production" | "test" {
	// In a real app, you would get this from environment variables or
	// build config. For simplicity, defaulting to 'development'
	const isDev =
		typeof (globalThis as unknown as { __DEV__?: boolean }).__DEV__ !== "undefined"
			? (globalThis as unknown as { __DEV__?: boolean }).__DEV__
			: true;

	return isDev ? "development" : "production";
}

// Helper to get the current configuration based on environment
export function getCurrentConfig(): typeof ENCRYPTION_CONFIG & {
	keyStorage: string;
	debugLogging: boolean;
} {
	const env = getEnvironment();

	return {
		...ENCRYPTION_CONFIG,
		...ENV_CONFIG[env],
	};
}

export default getCurrentConfig();
