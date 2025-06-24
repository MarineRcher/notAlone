/**
 * End-to-End Encryption Key Management
 *
 * This file contains functions for generating, importing, exporting,
 * and managing cryptographic keys for the E2EE implementation.
 * It utilizes expo-crypto for cryptographic operations.
 */

// Import polyfill to ensure Buffer is available
import "./polyfill";

import * as Crypto from "expo-crypto";
import { ENCRYPTION_CONFIG } from "./config";
import * as secureStorage from "./storage";
import { KeyPair, SymmetricKey, KeyBundle, SerializedKeyPair } from "./types";

// Simple base64 encode/decode functions that work in React Native
const base64Encode = (bytes: Uint8Array): string => 
{
	let binary = "";

	for (let i = 0; i < bytes.length; i++)
{
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
};

const base64Decode = (base64: string): Uint8Array => 
{
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i++)
{
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
};

/**
 * Generates a secure random array of bytes using expo-crypto
 * @param length Number of bytes to generate
 * @returns A Uint8Array containing random bytes
 */
export const getRandomBytes = (length: number): Uint8Array => 
{
	try 
{
		// Use expo-crypto for secure random bytes
		return Crypto.getRandomBytes(length);
	} catch (error) {
		console.warn("Falling back to Math.random for random bytes:", error);
		// Fallback to Math.random as a synchronous implementation
		const bytes = new Uint8Array(length);

		for (let i = 0; i < length; i++)
{
			bytes[i] = Math.floor(Math.random() * 256);
		}
		return bytes;
	}
};

/**
 * Simplified key generation for React Native environment
 * Since Web Crypto API isn't fully supported, we'll create a simpler approach
 * This is a TEMPORARY solution - in production you should use a proper crypto library
 */
export const generateSimpleKeyPair = async (): Promise<{
	publicKey: string;
	privateKey: string;
}> => 
{
	try 
{
		// Generate random bytes for a simple key pair
		const privateKeyBytes = getRandomBytes(32); // 256 bits
		const publicKeyBytes = getRandomBytes(32); // 256 bits

		// Convert to base64 for storage/transmission
		const privateKey = base64Encode(privateKeyBytes);
		const publicKey = base64Encode(publicKeyBytes);

		return { publicKey, privateKey };
	} catch (error) {
		console.error("Error generating simple key pair:", error);
		throw new Error("Failed to generate key pair");
	}
};

/**
 * Generate a symmetric key for AES encryption
 * @returns Promise resolving to a base64 encoded key
 */
export const generateSymmetricKeyString = async (): Promise<string> => 
{
	try 
{
		const keyBytes = getRandomBytes(32); // 256 bits for AES-256

		return base64Encode(keyBytes);
	} catch (error) {
		console.error("Error generating symmetric key:", error);
		throw new Error("Failed to generate symmetric key");
	}
};

/**
 * TEMPORARY: Create a mock CryptoKey object for compatibility
 * In a real implementation, you would use a proper crypto library
 */
const createMockCryptoKey = (
	keyData: string,
	type: "public" | "private" | "secret"
): CryptoKey => 
{
	return {
		type,
		extractable: true,
		algorithm: { name: "AES-GCM" },
		usages: ["encrypt", "decrypt"],
		// Store the actual key data in a non-standard property
		__keyData: keyData,
	} as any;
};

/**
 * Generates a new key pair for asymmetric encryption
 * TEMPORARY implementation for React Native compatibility
 */
export const generateAsymmetricKeyPair = async (): Promise<KeyPair> => 
{
	try 
{
		const simpleKeyPair = await generateSimpleKeyPair();

		return {
			publicKey: createMockCryptoKey(simpleKeyPair.publicKey, "public"),
			privateKey: createMockCryptoKey(
				simpleKeyPair.privateKey,
				"private"
			),
		};
	} catch (error) {
		console.error("Error generating asymmetric key pair:", error);
		throw new Error("Failed to generate asymmetric key pair");
	}
};

/**
 * Generates a symmetric key for message encryption
 * @returns Promise resolving to a mock CryptoKey
 */
export const generateSymmetricKey = async (): Promise<CryptoKey> => 
{
	try 
{
		const keyString = await generateSymmetricKeyString();

		return createMockCryptoKey(keyString, "secret");
	} catch (error) {
		console.error("Error generating symmetric key:", error);
		throw new Error("Failed to generate symmetric key");
	}
};

/**
 * Generates an initialization vector (IV) for AES-GCM encryption
 * @returns A Uint8Array containing the random IV
 */
export const generateIV = (): Uint8Array => 
{
	const { ivLength } = ENCRYPTION_CONFIG.SYMMETRIC;

	return getRandomBytes(ivLength);
};

/**
 * Generates a salt for key derivation
 * @returns A Uint8Array containing the random salt
 */
export const generateSalt = (): Uint8Array => 
{
	const { saltLength } = ENCRYPTION_CONFIG.KDF;

	return getRandomBytes(saltLength);
};

/**
 * Simple XOR encryption for demo purposes
 * TEMPORARY - This is NOT secure, just for demonstration
 */
const simpleEncrypt = (data: Uint8Array, key: Uint8Array): Uint8Array => 
{
	const result = new Uint8Array(data.length);

	for (let i = 0; i < data.length; i++)
{
		result[i] = data[i] ^ key[i % key.length];
	}
	return result;
};

/**
 * Simple XOR decryption for demo purposes
 * TEMPORARY - This is NOT secure, just for demonstration
 */
const simpleDecrypt = (data: Uint8Array, key: Uint8Array): Uint8Array => 
{
	// XOR decryption is the same as encryption
	return simpleEncrypt(data, key);
};

/**
 * TEMPORARY: Mock Web Crypto API operations
 * These are simplified implementations for React Native compatibility
 */
export const mockCryptoOperations = {
	async encrypt(
		algorithm: any,
		key: CryptoKey,
		data: ArrayBuffer
	): Promise<ArrayBuffer> 
{
		try 
{
			const keyData = (key as any).__keyData;

			if (!keyData)
{
				throw new Error("Invalid key");
			}

			const keyBytes = base64Decode(keyData);
			const dataBytes = new Uint8Array(data);
			const encrypted = simpleEncrypt(dataBytes, keyBytes);

			return encrypted.buffer as ArrayBuffer;
		} catch (error) {
			throw new Error("Encryption failed: " + error);
		}
	},

	async decrypt(
		algorithm: any,
		key: CryptoKey,
		data: ArrayBuffer
	): Promise<ArrayBuffer> 
{
		try 
{
			const keyData = (key as any).__keyData;

			if (!keyData)
{
				throw new Error("Invalid key");
			}

			const keyBytes = base64Decode(keyData);
			const dataBytes = new Uint8Array(data);
			const decrypted = simpleDecrypt(dataBytes, keyBytes);

			return decrypted.buffer as ArrayBuffer;
		} catch (error) {
			throw new Error("Decryption failed: " + error);
		}
	},

	async exportKey(format: string, key: CryptoKey): Promise<ArrayBuffer> 
{
		const keyData = (key as any).__keyData;

		if (!keyData)
{
			throw new Error("Invalid key");
		}

		const keyBytes = base64Decode(keyData);

		return keyBytes.buffer as ArrayBuffer;
	},

	async importKey(
		format: string,
		keyData: ArrayBuffer,
		algorithm: any,
		extractable: boolean,
		usages: string[]
	): Promise<CryptoKey> 
{
		const keyBytes = new Uint8Array(keyData);
		const keyString = base64Encode(keyBytes);

		return createMockCryptoKey(keyString, "secret");
	},
};

/**
 * Exports a CryptoKey to raw bytes
 * @param key The CryptoKey to export
 * @returns Promise resolving to the exported key as a Uint8Array
 */
export const exportKey = async (key: CryptoKey): Promise<Uint8Array> => 
{
	try 
{
		const exported = await mockCryptoOperations.exportKey("raw", key);

		return new Uint8Array(exported);
	} catch (error) {
		console.error("Error exporting key:", error);
		throw new Error("Failed to export key");
	}
};

/**
 * Imports a public key from raw bytes
 * @param keyData The key data as a Uint8Array
 * @param algorithm The algorithm to use for the key
 * @returns Promise resolving to the imported CryptoKey
 */
export const importPublicKey = async (
	keyData: Uint8Array,
	algorithm: string = ENCRYPTION_CONFIG.ASYMMETRIC.algorithm
): Promise<CryptoKey> => 
{
	try 
{
		const keyString = base64Encode(keyData);

		return createMockCryptoKey(keyString, "public");
	} catch (error) {
		console.error("Error importing public key:", error);
		throw new Error("Failed to import public key");
	}
};

/**
 * Imports a private key from raw bytes
 * @param keyData The key data as a Uint8Array
 * @param algorithm The algorithm to use for the key
 * @returns Promise resolving to the imported CryptoKey
 */
export const importPrivateKey = async (
	keyData: Uint8Array,
	algorithm: string = ENCRYPTION_CONFIG.ASYMMETRIC.algorithm
): Promise<CryptoKey> => 
{
	try 
{
		const keyString = base64Encode(keyData);

		return createMockCryptoKey(keyString, "private");
	} catch (error) {
		console.error("Error importing private key:", error);
		throw new Error("Failed to import private key");
	}
};

/**
 * Serializes a KeyPair to a format that can be stored
 * @param keyPair The KeyPair to serialize
 * @returns Promise resolving to a SerializedKeyPair
 */
export const serializeKeyPair = async (
	keyPair: KeyPair
): Promise<SerializedKeyPair> => 
{
	const publicKeyData = await exportKey(keyPair.publicKey);
	const privateKeyData = await exportKey(keyPair.privateKey);

	return {
		publicKey: base64Encode(publicKeyData),
		privateKey: base64Encode(privateKeyData),
	};
};

/**
 * Deserializes a SerializedKeyPair back to a KeyPair
 * @param serialized The serialized key pair
 * @returns Promise resolving to a KeyPair
 */
export const deserializeKeyPair = async (
	serialized: SerializedKeyPair
): Promise<KeyPair> => 
{
	const publicKeyBytes = base64Decode(serialized.publicKey);
	const privateKeyBytes = base64Decode(serialized.privateKey);

	const publicKey = await importPublicKey(publicKeyBytes);
	const privateKey = await importPrivateKey(privateKeyBytes);

	return { publicKey, privateKey };
};

/**
 * Gets or creates an identity key pair for the user
 * @returns Promise resolving to a KeyPair
 */
export const getOrCreateIdentityKeyPair = async (): Promise<KeyPair> => 
{
	try 
{
		// Try to load existing identity key pair
		const existingKeyPair = await secureStorage.getItem(
			ENCRYPTION_CONFIG.STORAGE.keys.identityKey
		);

		if (existingKeyPair) 
{
			const serialized = JSON.parse(existingKeyPair) as SerializedKeyPair;

			return await deserializeKeyPair(serialized);
		}

		// Generate new identity key pair
		const keyPair = await generateAsymmetricKeyPair();
		const serialized = await serializeKeyPair(keyPair);

		// Store the new key pair
		await secureStorage.setItem(
			ENCRYPTION_CONFIG.STORAGE.keys.identityKey,
			JSON.stringify(serialized)
		);

		return keyPair;
	} catch (error) {
		console.error("Error getting or creating identity key pair:", error);
		throw new Error("Failed to get or create identity key pair");
	}
};

/**
 * Simple hash function using expo-crypto
 * @param data The data to hash
 * @returns Promise resolving to the hash
 */
export const hashData = async (
	data: Uint8Array | string
): Promise<Uint8Array> => 
{
	try 
{
		const inputString
			= typeof data === "string" ? data : base64Encode(data);
		const hash = await Crypto.digestStringAsync(
			Crypto.CryptoDigestAlgorithm.SHA256,
			inputString,
			{ encoding: Crypto.CryptoEncoding.HEX }
		);
		// Convert hex string to Uint8Array
		const bytes = new Uint8Array(hash.length / 2);

		for (let i = 0; i < hash.length; i += 2)
{
			bytes[i / 2] = parseInt(hash.substr(i, 2), 16);
		}
		return bytes;
	} catch (error) {
		console.error("Error hashing data:", error);
		throw new Error("Failed to hash data");
	}
};

// TEMPORARY: Mock signature operations
export const signData = async (
	data: Uint8Array,
	privateKey: CryptoKey
): Promise<Uint8Array> => 
{
	// For demo purposes, we'll just hash the data + private key
	const keyData = (privateKey as any).__keyData;
	const keyBytes = base64Decode(keyData);

	// Simple concatenation
	const combined = new Uint8Array(data.length + keyBytes.length);

	combined.set(data, 0);
	combined.set(keyBytes, data.length);

	return hashData(combined);
};

export const verifySignature = async (
	data: Uint8Array,
	signature: Uint8Array,
	publicKey: CryptoKey
): Promise<boolean> => 
{
	// For demo purposes, we'll recreate the signature and compare
	try 
{
		// This is a simplified verification - in reality you'd need the corresponding private key
		const keyData = (publicKey as any).__keyData;
		const keyBytes = base64Decode(keyData);

		const combined = new Uint8Array(data.length + keyBytes.length);

		combined.set(data, 0);
		combined.set(keyBytes, data.length);

		const expectedSignature = await hashData(combined);

		// Compare signatures
		if (signature.length !== expectedSignature.length) {
			return false;
		}
		for (let i = 0; i < signature.length; i++) 
{
			if (signature[i] !== expectedSignature[i]) {
				return false;
			}
		}
		return true;
	} catch (error) {
		return false;
	}
};

// Additional helper functions for compatibility
export const generateKeyBundle = async (): Promise<KeyBundle> => 
{
	const asymmetricKeyPair = await generateAsymmetricKeyPair();
	const ecdhKeyPair = await generateAsymmetricKeyPair(); // Use same function for simplicity
	const symmetricKey = await generateSymmetricKey();

	return {
		asymmetricKeyPair,
		ecdhKeyPair,
		symmetricKey,
	};
};

export const deriveSharedKey = async (
	privateKey: CryptoKey,
	publicKey: CryptoKey
): Promise<CryptoKey> => 
{
	// Simplified key derivation
	const privateKeyData = (privateKey as any).__keyData;
	const publicKeyData = (publicKey as any).__keyData;

	const privateKeyBytes = base64Decode(privateKeyData);
	const publicKeyBytes = base64Decode(publicKeyData);

	const combined = new Uint8Array(
		privateKeyBytes.length + publicKeyBytes.length
	);

	combined.set(privateKeyBytes, 0);
	combined.set(publicKeyBytes, privateKeyBytes.length);

	const derived = await hashData(combined);
	const keyString = base64Encode(derived);

	return createMockCryptoKey(keyString, "secret");
};

export const deriveKeyFromPassword = async (
	password: string,
	salt?: Uint8Array
): Promise<{ key: CryptoKey; salt: Uint8Array }> => 
{
	const usedSalt = salt || generateSalt();

	// Simple password-based key derivation
	const combined = password + base64Encode(usedSalt);
	const hash = await hashData(combined);
	const keyString = base64Encode(hash);

	return {
		key: createMockCryptoKey(keyString, "secret"),
		salt: usedSalt,
	};
};
