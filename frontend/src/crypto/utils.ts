import * as Crypto from "expo-crypto";
import { CryptoEncoding } from "expo-crypto";

const SALT_LENGTH = 32;
const KEY_LENGTH = 256;

export function generateRandomBytes(length: number): Uint8Array
{
	return Crypto.getRandomBytes(length);
}

export function generateRandomString(length: number): string
{
	const bytes = generateRandomBytes(length);

	return Array.from(bytes)
		.map(byte => byte.toString(16).padStart(2, "0"))
		.join("");
}

export async function deriveKeyFromPassword(
	password: string,
	salt: Uint8Array
): Promise<string>
{
	const combinedData = password + arrayBufferToHex(salt);

	const hash = await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
		combinedData,
		{ encoding: CryptoEncoding.HEX }
	);

	return hash;
}

export async function generateKeyPair(): Promise<{
	publicKey: string;
	privateKey: string;
}>
{
	const privateKeyBytes = generateRandomBytes(32);
	const privateKey = arrayBufferToHex(privateKeyBytes);

	const publicKeyData = await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
		privateKey,
		{ encoding: CryptoEncoding.HEX }
	);

	return {
		publicKey: publicKeyData,
		privateKey: privateKey
	};
}

export function arrayBufferToHex(buffer: Uint8Array): string
{
	return Array.from(buffer)
		.map(byte => byte.toString(16).padStart(2, "0"))
		.join("");
}

export function hexToArrayBuffer(hex: string): Uint8Array
{
	const bytes = new Uint8Array(hex.length / 2);

	for (let i = 0; i < hex.length; i += 2)
	{
		bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
	}

	return bytes;
}

export async function combineKeysToGroupKey(
	publicKeys: string[]
): Promise<string>
{
	const sortedKeys = [...publicKeys].sort();
	const combinedKeys = sortedKeys.join("");

	const groupKey = await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA512,
		combinedKeys,
		{ encoding: CryptoEncoding.HEX }
	);

	return groupKey;
}

function simpleXorEncrypt(data: string, key: string): string
{
	let result = "";

	for (let i = 0; i < data.length; i++)
	{
		const dataChar = data.charCodeAt(i);
		const keyChar = key.charCodeAt(i % key.length);
		const encryptedChar = dataChar ^ keyChar;

		result += String.fromCharCode(encryptedChar);
	}

	return result;
}

export function encryptWithKey(message: string, key: string): string
{
	const messageBytes = new TextEncoder().encode(message);
	const keyBytes = hexToArrayBuffer(key.substring(0, 64));

	const encrypted = new Uint8Array(messageBytes.length);

	for (let i = 0; i < messageBytes.length; i++)
	{
		encrypted[i] = messageBytes[i] ^ keyBytes[i % keyBytes.length];
	}

	return arrayBufferToHex(encrypted);
}

export function decryptWithKey(encryptedHex: string, key: string): string
{
	const encryptedBytes = hexToArrayBuffer(encryptedHex);
	const keyBytes = hexToArrayBuffer(key.substring(0, 64));

	const decrypted = new Uint8Array(encryptedBytes.length);

	for (let i = 0; i < encryptedBytes.length; i++)
	{
		decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
	}

	return new TextDecoder().decode(decrypted);
}
