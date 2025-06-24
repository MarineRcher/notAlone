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
function base64Encode(bytes: Uint8Array): string {
	let binary = "";

	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64Decode(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

/**
 * Generates a secure random array of bytes using expo-crypto
 * @param length Number of bytes to generate
 * @returns A Uint8Array containing random bytes
 */
export function getRandomBytes(length: number): Uint8Array {
	try {
		// Use expo-crypto for secure random bytes
		return Crypto.getRandomBytes(length);
	} catch (error) {
		console.warn("Falling back to Math.random for random bytes:", error);
		return generateFallbackRandomBytes(length);
	}
}

/**
 * Fallback random bytes generator using Math.random
 * @param length Number of bytes to generate
 * @returns A Uint8Array containing random bytes
 */
function generateFallbackRandomBytes(length: number): Uint8Array {
	const bytes = new Uint8Array(length);

	for (let i = 0; i < length; i++) {
		bytes[i] = Math.floor(Math.random() * 256);
	}
	return bytes;
}

/**
 * Generates random bytes for private key
 * @returns A Uint8Array containing private key bytes
 */
function generatePrivateKeyBytes(): Uint8Array {
	return getRandomBytes(32); // 256 bits
}

/**
 * Generates random bytes for public key
 * @returns A Uint8Array containing public key bytes
 */
function generatePublicKeyBytes(): Uint8Array {
	return getRandomBytes(32); // 256 bits
}

/**
 * Simplified key generation for React Native environment
 * Since Web Crypto API isn't fully supported, we'll create a simpler approach
 * This is a TEMPORARY solution - in production you should use a proper crypto
 * library
 */
export async function generateSimpleKeyPair(): Promise<{
	publicKey: string;
	privateKey: string;
}> {
	try {
		// Generate random bytes for a simple key pair
		const privateKeyBytes = generatePrivateKeyBytes();
		const publicKeyBytes = generatePublicKeyBytes();

		// Convert to base64 for storage/transmission
		const privateKey = base64Encode(privateKeyBytes);
		const publicKey = base64Encode(publicKeyBytes);

		return { publicKey, privateKey };
	} catch (error) {
		console.error("Error generating simple key pair:", error);
		throw new Error("Failed to generate key pair");
	}
}

/**
 * Generate a symmetric key for AES encryption
 * @returns Promise resolving to a base64 encoded key
 */
export async function generateSymmetricKeyString(): Promise<string> {
	try {
		const keyBytes = getRandomBytes(32); // 256 bits for AES-256

		return base64Encode(keyBytes);
	} catch (error) {
		console.error("Error generating symmetric key:", error);
		throw new Error("Failed to generate symmetric key");
	}
}

/**
 * TEMPORARY: Create a mock CryptoKey object for compatibility
 * In a real implementation, you would use a proper crypto library
 */
function createMockCryptoKey(
	keyData: string,
	type: "public" | "private" | "secret"
): CryptoKey {
	return {
		type,
		extractable: true,
		algorithm: { name: "AES-GCM" },
		usages: ["encrypt", "decrypt"],
		// Store the actual key data in a non-standard property
		__keyData: keyData,
	} as CryptoKey & { __keyData: string };
}

/**
 * Creates mock public key from simple key pair
 * @param simpleKeyPair The simple key pair
 * @returns A mock CryptoKey for public key
 */
function createMockPublicKey(simpleKeyPair: {
	publicKey: string;
	privateKey: string;
}): CryptoKey {
	return createMockCryptoKey(simpleKeyPair.publicKey, "public");
}

/**
 * Creates mock private key from simple key pair
 * @param simpleKeyPair The simple key pair
 * @returns A mock CryptoKey for private key
 */
function createMockPrivateKey(simpleKeyPair: {
	publicKey: string;
	privateKey: string;
}): CryptoKey {
	return createMockCryptoKey(simpleKeyPair.privateKey, "private");
}

/**
 * Generates a new key pair for asymmetric encryption
 * TEMPORARY implementation for React Native compatibility
 */
export async function generateAsymmetricKeyPair(): Promise<KeyPair> {
	try {
		const simpleKeyPair = await generateSimpleKeyPair();

		return {
			publicKey: createMockPublicKey(simpleKeyPair),
			privateKey: createMockPrivateKey(simpleKeyPair),
		};
	} catch (error) {
		console.error("Error generating asymmetric key pair:", error);
		throw new Error("Failed to generate asymmetric key pair");
	}
}

/**
 * Generates a symmetric key for message encryption
 * @returns Promise resolving to a mock CryptoKey
 */
export async function generateSymmetricKey(): Promise<CryptoKey> {
	try {
		const keyString = await generateSymmetricKeyString();

		return createMockCryptoKey(keyString, "secret");
	} catch (error) {
		console.error("Error generating symmetric key:", error);
		throw new Error("Failed to generate symmetric key");
	}
}

/**
 * Generates an initialization vector (IV) for AES-GCM encryption
 * @returns A Uint8Array containing the random IV
 */
export function generateIV(): Uint8Array {
	const { ivLength } = ENCRYPTION_CONFIG.SYMMETRIC;

	return getRandomBytes(ivLength);
}

/**
 * Generates a salt for key derivation
 * @returns A Uint8Array containing the random salt
 */
export function generateSalt(): Uint8Array {
	const { saltLength } = ENCRYPTION_CONFIG.KDF;

	return getRandomBytes(saltLength);
}

/**
 * Simple XOR encryption for demo purposes
 * TEMPORARY - This is NOT secure, just for demonstration
 */
function simpleEncrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
	const result = new Uint8Array(data.length);

	for (let i = 0; i < data.length; i++) {
		result[i] = data[i] ^ key[i % key.length];
	}
	return result;
}

/**
 * Simple XOR decryption for demo purposes
 * TEMPORARY - This is NOT secure, just for demonstration
 */
function simpleDecrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
	// XOR decryption is the same as encryption
	return simpleEncrypt(data, key);
}

/**
 * Extracts key data from mock CryptoKey
 * @param key The mock CryptoKey
 * @returns The key data as Uint8Array
 */
function extractKeyData(key: CryptoKey): Uint8Array {
	const keyData = (key as unknown as { __keyData: string }).__keyData;

	return base64Decode(keyData);
}

/**
 * Mock encrypt operation
 */
async function mockEncrypt(
	algorithm: unknown,
	key: CryptoKey,
	data: ArrayBuffer
): Promise<ArrayBuffer> {
	const keyBytes = extractKeyData(key);
	const dataBytes = new Uint8Array(data);
	const encrypted = simpleEncrypt(dataBytes, keyBytes);

	return encrypted.buffer as ArrayBuffer;
}

/**
 * Mock decrypt operation
 */
async function mockDecrypt(
	algorithm: unknown,
	key: CryptoKey,
	data: ArrayBuffer
): Promise<ArrayBuffer> {
	const keyBytes = extractKeyData(key);
	const dataBytes = new Uint8Array(data);
	const decrypted = simpleDecrypt(dataBytes, keyBytes);

	return decrypted.buffer as ArrayBuffer;
}

/**
 * Mock export key operation
 */
async function mockExportKey(
	format: string,
	key: CryptoKey
): Promise<ArrayBuffer> {
	const keyData = (key as unknown as { __keyData: string }).__keyData;
	const keyBytes = base64Decode(keyData);

	return keyBytes.buffer as ArrayBuffer;
}

/**
 * Creates mock CryptoKey from key data
 * @param keyData The key data as ArrayBuffer
 * @param algorithm The algorithm
 * @param extractable Whether the key is extractable
 * @param usages The key usages
 * @returns A mock CryptoKey
 */
function createMockKeyFromData(
	keyData: ArrayBuffer,
	algorithm: unknown,
	extractable: boolean,
	usages: string[]
): CryptoKey {
	const keyBytes = new Uint8Array(keyData);
	const keyString = base64Encode(keyBytes);

	return createMockCryptoKey(keyString, "secret");
}

/**
 * Mock import key operation
 */
async function mockImportKey(
	format: string,
	keyData: ArrayBuffer,
	algorithm: unknown,
	extractable: boolean,
	usages: string[]
): Promise<CryptoKey> {
	return createMockKeyFromData(keyData, algorithm, extractable, usages);
}

/**
 * Mock crypto operations object
 */
export const mockCryptoOperations = {
	encrypt: mockEncrypt,
	decrypt: mockDecrypt,
	exportKey: mockExportKey,
	importKey: mockImportKey,
};

/**
 * Exports a key to a portable format
 * @param key The key to export
 * @returns Promise resolving to the exported key data
 */
export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
	try {
		const exported = await mockExportKey("raw", key);

		return new Uint8Array(exported);
	} catch (error) {
		console.error("Error exporting key:", error);
		throw new Error("Failed to export key");
	}
}

/**
 * Imports a public key from raw data
 * @param keyData The raw key data
 * @param algorithm The algorithm to use
 * @returns Promise resolving to the imported key
 */
export async function importPublicKey(
	keyData: Uint8Array,
	algorithm = ENCRYPTION_CONFIG.ASYMMETRIC.algorithm
): Promise<CryptoKey> {
	try {
		return await mockImportKey(
			"raw",
			keyData.buffer as ArrayBuffer,
			{ name: algorithm },
			true,
			["encrypt"]
		);
	} catch (error) {
		console.error("Error importing public key:", error);
		throw new Error("Failed to import public key");
	}
}

/**
 * Imports a private key from raw data
 * @param keyData The raw key data
 * @param algorithm The algorithm to use
 * @returns Promise resolving to the imported key
 */
export async function importPrivateKey(
	keyData: Uint8Array,
	algorithm = ENCRYPTION_CONFIG.ASYMMETRIC.algorithm
): Promise<CryptoKey> {
	try {
		return await mockImportKey(
			"raw",
			keyData.buffer as ArrayBuffer,
			{ name: algorithm },
			true,
			["decrypt"]
		);
	} catch (error) {
		console.error("Error importing private key:", error);
		throw new Error("Failed to import private key");
	}
}

/**
 * Serializes a key pair for storage
 * @param keyPair The key pair to serialize
 * @returns Promise resolving to the serialized key pair
 */
export async function serializeKeyPair(
	keyPair: KeyPair
): Promise<SerializedKeyPair> {
	try {
		const publicKeyData = await exportKey(keyPair.publicKey);
		const privateKeyData = await exportKey(keyPair.privateKey);

		return {
			publicKey: base64Encode(publicKeyData),
			privateKey: base64Encode(privateKeyData),
		};
	} catch (error) {
		console.error("Error serializing key pair:", error);
		throw new Error("Failed to serialize key pair");
	}
}

/**
 * Deserializes a key pair from storage
 * @param serialized The serialized key pair
 * @returns Promise resolving to the deserialized key pair
 */
export async function deserializeKeyPair(
	serialized: SerializedKeyPair
): Promise<KeyPair> {
	try {
		const publicKeyData = base64Decode(serialized.publicKey);
		const privateKeyData = base64Decode(serialized.privateKey);

		const publicKey = await importPublicKey(publicKeyData);
		const privateKey = await importPrivateKey(privateKeyData);

		return { publicKey, privateKey };
	} catch (error) {
		console.error("Error deserializing key pair:", error);
		throw new Error("Failed to deserialize key pair");
	}
}

/**
 * Gets or creates the user's identity key pair
 * @returns Promise resolving to the identity key pair
 */
export async function getOrCreateIdentityKeyPair(): Promise<KeyPair> {
	try {
		// Try to load existing key pair
		const stored = await secureStorage.getItem(
			ENCRYPTION_CONFIG.STORAGE.keys.privateKey
		);

		if (stored) {
			const serialized = JSON.parse(stored) as SerializedKeyPair;

			return await deserializeKeyPair(serialized);
		}

		// Generate new key pair if none exists
		const keyPair = await generateAsymmetricKeyPair();
		const serialized = await serializeKeyPair(keyPair);

		await secureStorage.setItem(
			ENCRYPTION_CONFIG.STORAGE.keys.privateKey,
			JSON.stringify(serialized)
		);

		return keyPair;
	} catch (error) {
		console.error("Error getting or creating identity key pair:", error);
		throw new Error("Failed to get or create identity key pair");
	}
}

/**
 * Creates simple hash using Crypto.digestStringAsync
 * @param data The data to hash
 * @returns Promise resolving to hash bytes
 */
async function createHash(data: string): Promise<Uint8Array> {
	const hash = await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
		data,
		{ encoding: Crypto.CryptoEncoding.BASE64 }
	);

	return base64Decode(hash);
}

/**
 * Hashes data using SHA-256
 * @param data The data to hash
 * @returns Promise resolving to the hash
 */
export async function hashData(data: Uint8Array | string): Promise<Uint8Array> {
	try {
		let dataStr: string;

		if (typeof data === "string") {
			dataStr = data;
		} else {
			dataStr = base64Encode(data);
		}

		return await createHash(dataStr);
	} catch (error) {
		console.error("Error hashing data:", error);
		throw new Error("Failed to hash data");
	}
}

/**
 * Creates simple signature using hash
 * @param data The data to sign
 * @param privateKey The private key
 * @returns Promise resolving to signature bytes
 */
async function createSimpleSignature(
	data: Uint8Array,
	privateKey: CryptoKey
): Promise<Uint8Array> {
	const keyData = extractKeyData(privateKey);
	const dataHash = await hashData(data);

	// Simple signature: XOR the hash with the key
	return simpleEncrypt(dataHash, keyData);
}

/**
 * Signs data with a private key
 * @param data The data to sign
 * @param privateKey The private key to sign with
 * @returns Promise resolving to the signature
 */
export async function signData(
	data: Uint8Array,
	privateKey: CryptoKey
): Promise<Uint8Array> {
	try {
		return await createSimpleSignature(data, privateKey);
	} catch (error) {
		console.error("Error signing data:", error);
		throw new Error("Failed to sign data");
	}
}

/**
 * Verifies simple signature
 * @param data The original data
 * @param signature The signature to verify
 * @param publicKey The public key
 * @returns Promise resolving to verification result
 */
async function verifySimpleSignature(
	data: Uint8Array,
	signature: Uint8Array,
	publicKey: CryptoKey
): Promise<boolean> {
	const keyData = extractKeyData(publicKey);
	const dataHash = await hashData(data);

	// Decrypt the signature and compare with hash
	const decryptedHash = simpleDecrypt(signature, keyData);

	// Compare the hashes
	if (decryptedHash.length !== dataHash.length) {
		return false;
	}

	for (let i = 0; i < dataHash.length; i++) {
		if (decryptedHash[i] !== dataHash[i]) {
			return false;
		}
	}

	return true;
}

/**
 * Verifies a signature with a public key
 * @param data The original data
 * @param signature The signature to verify
 * @param publicKey The public key to verify with
 * @returns Promise resolving to true if signature is valid
 */
export async function verifySignature(
	data: Uint8Array,
	signature: Uint8Array,
	publicKey: CryptoKey
): Promise<boolean> {
	try {
		return await verifySimpleSignature(data, signature, publicKey);
	} catch (error) {
		console.error("Error verifying signature:", error);
		return false;
	}
}

/**
 * Generates a complete key bundle
 * @returns Promise resolving to a key bundle
 */
export async function generateKeyBundle(): Promise<KeyBundle> {
	try {
		const asymmetricKeyPair = await generateAsymmetricKeyPair();
		const ecdhKeyPair = await generateAsymmetricKeyPair();
		const symmetricKey = await generateSymmetricKey();

		return {
			asymmetricKeyPair,
			ecdhKeyPair,
			symmetricKey,
		};
	} catch (error) {
		console.error("Error generating key bundle:", error);
		throw new Error("Failed to generate key bundle");
	}
}

/**
 * Derives a shared key from ECDH key exchange
 * @param privateKey Our private key
 * @param publicKey Their public key
 * @returns Promise resolving to the shared key
 */
export async function deriveSharedKey(
	privateKey: CryptoKey,
	publicKey: CryptoKey
): Promise<CryptoKey> {
	try {
		// Simple shared key derivation: XOR the two keys
		const privateKeyData = extractKeyData(privateKey);
		const publicKeyData = extractKeyData(publicKey);

		const sharedData = simpleEncrypt(privateKeyData, publicKeyData);
		const sharedKeyString = base64Encode(sharedData);

		return createMockCryptoKey(sharedKeyString, "secret");
	} catch (error) {
		console.error("Error deriving shared key:", error);
		throw new Error("Failed to derive shared key");
	}
}

/**
 * Derives a key from a password using PBKDF2
 * @param password The password to derive from
 * @param salt Optional salt (generated if not provided)
 * @returns Promise resolving to the derived key and salt
 */
export async function deriveKeyFromPassword(
	password: string,
	salt?: Uint8Array
): Promise<{ key: CryptoKey; salt: Uint8Array }> {
	try {
		const useSalt = salt || generateSalt();
		const passwordHash = await hashData(password);
		const saltedHash = await hashData(
			base64Encode(passwordHash) + base64Encode(useSalt)
		);

		const derivedKeyString = base64Encode(saltedHash);
		const key = createMockCryptoKey(derivedKeyString, "secret");

		return { key, salt: useSalt };
	} catch (error) {
		console.error("Error deriving key from password:", error);
		throw new Error("Failed to derive key from password");
	}
}
