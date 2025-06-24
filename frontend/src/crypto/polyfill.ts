/**
 * Simplified Crypto Setup for React Native
 *
 * This file creates a minimal crypto setup using only expo-crypto
 * and react-native-get-random-values for basic encryption needs.
 */

import * as Crypto from "expo-crypto";

console.log("🔍 Setting up simplified crypto for React Native...");

// Add Buffer polyfill for React Native
if (typeof global !== "undefined" && typeof global.Buffer === "undefined") {
	console.log("📦 Adding Buffer polyfill...");

	// Simple Buffer polyfill for basic functionality
	const BufferPolyfill = {
		from: function (data: unknown, encoding?: string): unknown {
			if (typeof data === "string") {
				if (encoding === "base64") {
					// Simple base64 to Uint8Array conversion
					const binaryString = atob(data);
					const bytes = new Uint8Array(binaryString.length);

					for (let i = 0; i < binaryString.length; i++) {
						bytes[i] = binaryString.charCodeAt(i);
					}
					return {
						buffer: bytes.buffer,
						toString: function (enc?: string): string {
							if (enc === "base64") {
								return btoa(String.fromCharCode(...bytes));
							}
							return String.fromCharCode(...bytes);
						},
					};
				} else {
					// String to Uint8Array
					const encoder = new TextEncoder();
					const bytes = encoder.encode(data);

					return {
						buffer: bytes.buffer,
						toString: function (enc?: string): string {
							if (enc === "base64") {
								return btoa(String.fromCharCode(...bytes));
							}
							return data;
						},
					};
				}
			} else if (data instanceof Uint8Array) {
				return {
					buffer: data.buffer,
					toString: function (enc?: string): string {
						if (enc === "base64") {
							return btoa(String.fromCharCode(...data));
						} else if (enc === "hex") {
							return Array.from(data)
								.map(function (b: number): string {
									return b.toString(16).padStart(2, "0");
								})
								.join("");
						}
						return String.fromCharCode(...data);
					},
				};
			}
			return data;
		},

		concat: function (arrays: unknown[]): unknown {
			let totalLength = 0;

			for (const arr of arrays) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				totalLength +=
					(arr as any).length || (arr as any).byteLength || 0;
			}

			const result = new Uint8Array(totalLength);
			let offset = 0;

			for (const arr of arrays) {
				if (arr instanceof Uint8Array) {
					result.set(arr, offset);
					offset += arr.length;
				} else if ((arr as any).buffer) {
					const bytes = new Uint8Array((arr as any).buffer);

					result.set(bytes, offset);
					offset += bytes.length;
				}
			}

			return BufferPolyfill.from(result);
		},
	};

	// Add Buffer to global
	(global as any).Buffer = BufferPolyfill;
	console.log("✅ Buffer polyfill added");
}

// Ensure global.crypto exists with basic functionality
if (typeof global !== "undefined") {
	if (!global.crypto) {
		console.log("📦 Creating basic crypto object...");
		(global as any).crypto = {};
	}

	// Add getRandomValues if not present (should be provided by
	// react-native-get-random-values)
	if (!global.crypto.getRandomValues) {
		global.crypto.getRandomValues = function <T extends ArrayBufferView>(
			array: T
		): T {
			// Fallback implementation
			const typedArray = array as unknown as Uint8Array;

			for (let i = 0; i < typedArray.length; i++) {
				typedArray[i] = Math.floor(Math.random() * 256);
			}
			return array;
		};
		console.log("📦 Added fallback getRandomValues");
	}

	// Add basic subtle crypto functions using expo-crypto
	if (!global.crypto.subtle) {
		console.log(
			"📦 Creating simplified subtle crypto using expo-crypto..."
		);

		// Create simplified subtle object
		(global as any).crypto.subtle = {
			// For now, these will throw descriptive errors
			generateKey: function (): Promise<never> {
				return Promise.reject(
					new Error(
						"Use expo-crypto for key generation instead of Web Crypto API"
					)
				);
			},
			encrypt: function (): Promise<never> {
				return Promise.reject(
					new Error(
						"Use expo-crypto for encryption instead of Web Crypto API"
					)
				);
			},
			decrypt: function (): Promise<never> {
				return Promise.reject(
					new Error(
						"Use expo-crypto for decryption instead of Web Crypto API"
					)
				);
			},
			importKey: function (): Promise<never> {
				return Promise.reject(
					new Error(
						"Use expo-crypto for key import instead of Web Crypto API"
					)
				);
			},
			exportKey: function (): Promise<never> {
				return Promise.reject(
					new Error(
						"Use expo-crypto for key export instead of Web Crypto API"
					)
				);
			},
			sign: function (): Promise<never> {
				return Promise.reject(
					new Error(
						"Use expo-crypto for signing instead of Web Crypto API"
					)
				);
			},
			verify: function (): Promise<never> {
				return Promise.reject(
					new Error(
						"Use expo-crypto for verification instead of Web Crypto API"
					)
				);
			},
			digest: function (
				algorithm: string,
				data: ArrayBuffer
			): Promise<ArrayBuffer> {
				// Use expo-crypto for digesting
				const algName = algorithm.replace("-", "").toLowerCase();

				if (algName === "sha256" || algName === "sha-256") {
					const input = new Uint8Array(data);
					const base64 = btoa(String.fromCharCode(...input));

					return Crypto.digestStringAsync(
						Crypto.CryptoDigestAlgorithm.SHA256,
						base64,
						{ encoding: Crypto.CryptoEncoding.BASE64 }
					).then(function (digest: string): ArrayBuffer {
						const binaryString = atob(digest);
						const bytes = new Uint8Array(binaryString.length);

						for (let i = 0; i < binaryString.length; i++) {
							bytes[i] = binaryString.charCodeAt(i);
						}
						return bytes.buffer;
					});
				}

				return Promise.reject(
					new Error(`Unsupported digest algorithm: ${algorithm}`)
				);
			},
		};
		console.log("✅ Simplified subtle crypto created");
	}

	console.log("✅ Basic crypto setup complete:", {
		crypto: !!global.crypto,
		getRandomValues: typeof global.crypto.getRandomValues === "function",
		subtle: !!global.crypto.subtle,
		expoCrypto: !!Crypto,
	});

	// Test expo-crypto availability
	try {
		const testBytes = Crypto.getRandomBytes(16);

		console.log("✅ expo-crypto is working:", {
			randomBytesLength: testBytes.length,
		});
	} catch (error) {
		console.error("❌ expo-crypto test failed:", error);
	}
} else {
	console.error("❌ global object not available");
}

export default global.crypto;
