// Sponsor Chat Protocol - 1-on-1 E2EE using Signal Protocol
// Adapted from group chat implementation for direct messaging

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NobleSignalCrypto } from './noble-crypto';
import type { KeyPair, MessageKeys } from './types';

export interface SponsorMessage {
	messageId: string;
	timestamp: number;
	senderId: string;
	receiverId: string;
	encryptedPayload: Uint8Array;
	signature: Uint8Array;
}

export interface SponsorSession {
	sponsorshipId: number;
	myUserId: string;
	otherUserId: string;
	myKeys: KeyPair;
	otherPublicKey?: Uint8Array;
	sharedSecret?: Uint8Array;
	sendingChainKey: Uint8Array;
	receivingChainKey: Uint8Array;
	messageIndex: number;
}

export class SponsorChatProtocol {
	private static sessions = new Map<number, SponsorSession>();
	private static myIdentityKeys?: KeyPair;

	static async initialize(): Promise<void> {
		console.log('🔑 [SPONSOR-CHAT] Initializing sponsor chat protocol...');

		try {
			// Load or generate identity keys
			this.myIdentityKeys = await this.getOrCreateIdentityKeys();
			console.log('🔑 [SPONSOR-CHAT] ✅ Protocol initialized successfully');
		} catch (error) {
			console.error('🔑 [SPONSOR-CHAT] ❌ Failed to initialize:', error);
			throw error;
		}
	}

	// Create or join a sponsor chat session
	static async createSession(sponsorshipId: number, myUserId: string, otherUserId: string): Promise<void> {
		console.log(`🔑 [SPONSOR-CHAT] Creating session for sponsorship ${sponsorshipId}`);

		const myKeys = NobleSignalCrypto.generateKeyPair();
		const session: SponsorSession = {
			sponsorshipId,
			myUserId,
			otherUserId,
			myKeys,
			sendingChainKey: NobleSignalCrypto.randomBytes(32),
			receivingChainKey: NobleSignalCrypto.randomBytes(32),
			messageIndex: 0,
		};

		this.sessions.set(sponsorshipId, session);
		await this.saveSession(sponsorshipId, session);

		console.log(`🔑 [SPONSOR-CHAT] ✅ Session created for sponsorship ${sponsorshipId}`);
	}

	// Get my public key for sharing with the other party
	static getMyPublicKey(sponsorshipId: number): Uint8Array | null {
		const session = this.sessions.get(sponsorshipId);
		return session ? session.myKeys.publicKey : null;
	}

	// Set the other party's public key and compute shared secret
	static async setOtherPublicKey(sponsorshipId: number, otherPublicKey: Uint8Array): Promise<void> {
		const session = this.sessions.get(sponsorshipId);
		if (!session) {
			throw new Error(`No session found for sponsorship ${sponsorshipId}`);
		}

		session.otherPublicKey = otherPublicKey;
		
		// Compute shared secret using Diffie-Hellman
		session.sharedSecret = NobleSignalCrypto.dh(session.myKeys.privateKey, otherPublicKey);

		// Derive initial chain keys from shared secret
		const salt = new Uint8Array(32); // Zero salt for simplicity
		const info = `sponsor_chat_${sponsorshipId}`;
		const keyMaterial = NobleSignalCrypto.deriveKeys(session.sharedSecret, salt, info, 64);
		
		session.sendingChainKey = keyMaterial.slice(0, 32);
		session.receivingChainKey = keyMaterial.slice(32, 64);

		await this.saveSession(sponsorshipId, session);
		console.log(`🔑 [SPONSOR-CHAT] ✅ Key exchange complete for sponsorship ${sponsorshipId}`);
	}

	// Encrypt and send a message
	static async encryptMessage(sponsorshipId: number, plaintext: string): Promise<any> {
		const session = this.sessions.get(sponsorshipId);
		if (!session) {
			throw new Error(`No session found for sponsorship ${sponsorshipId}`);
		}

		if (!session.sharedSecret) {
			throw new Error('Key exchange not complete - cannot encrypt message');
		}

		// Advance the sending chain
		const { chainKey, messageKey } = NobleSignalCrypto.kdfChainKey(session.sendingChainKey);
		session.sendingChainKey = chainKey;
		session.messageIndex++;

		// Derive message encryption keys
		const msgKeys = NobleSignalCrypto.deriveMessageKeys(messageKey);

		// Encrypt the plaintext
		const plaintextBytes = new TextEncoder().encode(plaintext);
		const { ciphertext, nonce } = NobleSignalCrypto.encrypt(msgKeys.cipherKey, plaintextBytes);

		// Create message with metadata
		const messageId = `sponsor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const timestamp = Date.now();
		const encryptedPayload = new Uint8Array([...nonce, ...ciphertext]);

		// Create signature over the entire message
		const signatureData = new Uint8Array([
			...new TextEncoder().encode(messageId),
			...new TextEncoder().encode(session.myUserId),
			...new TextEncoder().encode(session.otherUserId),
			...new Uint8Array(8).map((_, i) => (timestamp >> (i * 8)) & 0xff),
			...encryptedPayload
		]);
		const signature = NobleSignalCrypto.sign(session.myKeys.privateKey, signatureData);

		await this.saveSession(sponsorshipId, session);

		const sponsorMessage: SponsorMessage = {
			messageId,
			timestamp,
			senderId: session.myUserId,
			receiverId: session.otherUserId,
			encryptedPayload,
			signature,
		};

		// Convert to wire format for JSON serialization
		return {
			messageId: sponsorMessage.messageId,
			timestamp: sponsorMessage.timestamp,
			senderId: sponsorMessage.senderId,
			receiverId: sponsorMessage.receiverId,
			encryptedPayload: Array.from(sponsorMessage.encryptedPayload),
			signature: Array.from(sponsorMessage.signature),
		};
	}

	// Decrypt a received message
	static async decryptMessage(sponsorshipId: number, encryptedMessage: any): Promise<string> {
		const session = this.sessions.get(sponsorshipId);
		if (!session) {
			throw new Error(`No session found for sponsorship ${sponsorshipId}`);
		}

		if (!session.otherPublicKey) {
			throw new Error('Other party public key not available');
		}

		// Convert wire format back to typed message
		const message: SponsorMessage = {
			messageId: encryptedMessage.messageId,
			timestamp: encryptedMessage.timestamp,
			senderId: encryptedMessage.senderId,
			receiverId: encryptedMessage.receiverId,
			encryptedPayload: new Uint8Array(encryptedMessage.encryptedPayload),
			signature: new Uint8Array(encryptedMessage.signature),
		};

		// Verify signature
		const signatureData = new Uint8Array([
			...new TextEncoder().encode(message.messageId),
			...new TextEncoder().encode(message.senderId),
			...new TextEncoder().encode(message.receiverId),
			...new Uint8Array(8).map((_, i) => (message.timestamp >> (i * 8)) & 0xff),
			...message.encryptedPayload
		]);

		if (!NobleSignalCrypto.verify(session.otherPublicKey, signatureData, message.signature)) {
			throw new Error(`Message signature verification failed for ${message.messageId}`);
		}

		// Advance the receiving chain
		const { chainKey, messageKey } = NobleSignalCrypto.kdfChainKey(session.receivingChainKey);
		session.receivingChainKey = chainKey;

		// Derive message decryption keys
		const msgKeys = NobleSignalCrypto.deriveMessageKeys(messageKey);

		// Extract nonce and ciphertext
		const nonce = message.encryptedPayload.slice(0, 12);
		const ciphertext = message.encryptedPayload.slice(12);

		try {
			const plaintext = NobleSignalCrypto.decrypt(msgKeys.cipherKey, ciphertext, nonce);
			const decryptedText = new TextDecoder().decode(plaintext);

			await this.saveSession(sponsorshipId, session);
			console.log(`🔑 [SPONSOR-CHAT] ✅ Decrypted message ${message.messageId} successfully`);
			return decryptedText;
		} catch (error) {
			throw new Error(`Failed to decrypt message ${message.messageId}: ${error}`);
		}
	}

	// Load session from storage
	static async loadSession(sponsorshipId: number): Promise<void> {
		try {
			const stored = await AsyncStorage.getItem(`sponsor-session-${sponsorshipId}`);
			if (stored) {
				const data = JSON.parse(stored);
				const session: SponsorSession = {
					...data,
					myKeys: {
						privateKey: new Uint8Array(data.myKeys.privateKey),
						publicKey: new Uint8Array(data.myKeys.publicKey),
					},
					otherPublicKey: data.otherPublicKey ? new Uint8Array(data.otherPublicKey) : undefined,
					sharedSecret: data.sharedSecret ? new Uint8Array(data.sharedSecret) : undefined,
					sendingChainKey: new Uint8Array(data.sendingChainKey),
					receivingChainKey: new Uint8Array(data.receivingChainKey),
				};
				this.sessions.set(sponsorshipId, session);
				console.log(`🔑 [SPONSOR-CHAT] Loaded session for sponsorship ${sponsorshipId}`);
			}
		} catch (error) {
			console.error(`🔑 [SPONSOR-CHAT] Failed to load session for sponsorship ${sponsorshipId}:`, error);
		}
	}

	// Save session to storage
	private static async saveSession(sponsorshipId: number, session: SponsorSession): Promise<void> {
		try {
			const data = {
				...session,
				myKeys: {
					privateKey: Array.from(session.myKeys.privateKey),
					publicKey: Array.from(session.myKeys.publicKey),
				},
				otherPublicKey: session.otherPublicKey ? Array.from(session.otherPublicKey) : undefined,
				sharedSecret: session.sharedSecret ? Array.from(session.sharedSecret) : undefined,
				sendingChainKey: Array.from(session.sendingChainKey),
				receivingChainKey: Array.from(session.receivingChainKey),
			};
			await AsyncStorage.setItem(`sponsor-session-${sponsorshipId}`, JSON.stringify(data));
		} catch (error) {
			console.error(`🔑 [SPONSOR-CHAT] Failed to save session for sponsorship ${sponsorshipId}:`, error);
		}
	}

	// Get or create identity keys
	private static async getOrCreateIdentityKeys(): Promise<KeyPair> {
		try {
			const stored = await AsyncStorage.getItem('sponsor-chat-identity');
			if (stored) {
				const data = JSON.parse(stored);
				return {
					privateKey: new Uint8Array(data.privateKey),
					publicKey: new Uint8Array(data.publicKey),
				};
			}

			// Generate new identity keys
			const identityKeys = NobleSignalCrypto.generateKeyPair();
			const data = {
				privateKey: Array.from(identityKeys.privateKey),
				publicKey: Array.from(identityKeys.publicKey),
			};
			await AsyncStorage.setItem('sponsor-chat-identity', JSON.stringify(data));
			return identityKeys;
		} catch (error) {
			console.error('🔑 [SPONSOR-CHAT] Failed to get/create identity keys:', error);
			throw error;
		}
	}
} 