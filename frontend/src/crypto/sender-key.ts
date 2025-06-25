// Sender Key Session for Signal Group Messaging
// Implements Signal's Sender Key protocol for efficient group encryption

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NobleSignalCrypto } from './noble-crypto';
import type { SenderKeyState, GroupMessage, MessageKeys } from './types';

export class SenderKeySession
{
	private state: SenderKeyState;
	private groupId: string;
	private userId: string;

	constructor(groupId: string, userId: string)
	{
		this.groupId = groupId;
		this.userId = userId;

		this.state = {
			chainKey: { key: NobleSignalCrypto.randomBytes(32), index: 0 },
			signingKey: NobleSignalCrypto.generateSigningKeyPair(),
			messageKeys: new Map()
		};

		console.log(`🔑 [SENDER-KEY] Created session for group: ${groupId}, user: ${userId}`);
	}

	async encryptMessage(plaintext: string): Promise<GroupMessage>
	{
		// Derive new message key from chain key
		const { chainKey, messageKey } = NobleSignalCrypto.kdfChainKey(this.state.chainKey.key);
		const msgKeys = NobleSignalCrypto.deriveMessageKeys(messageKey);

		// Store message key for potential out-of-order delivery
		this.state.messageKeys.set(this.state.chainKey.index, msgKeys);

		// Update chain state
		const keyIndex = this.state.chainKey.index++;

		this.state.chainKey.key = chainKey;

		// Encrypt the plaintext
		const plaintextBytes = new TextEncoder().encode(plaintext);
		const { ciphertext, nonce } = NobleSignalCrypto.encrypt(msgKeys.cipherKey, plaintextBytes);

		// Create message with metadata
		const messageId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const timestamp = Date.now();
		const encryptedPayload = new Uint8Array([...nonce, ...ciphertext]);

		// Create signature over the entire message
		const signatureData = new Uint8Array([
			...new TextEncoder().encode(messageId),
			...new TextEncoder().encode(this.groupId),
			...new TextEncoder().encode(this.userId),
			...new Uint8Array(8).map((_, i) => (timestamp >> (i * 8)) & 0xff),
			...encryptedPayload
		]);
		const signature = NobleSignalCrypto.sign(this.state.signingKey.privateKey, signatureData);

		// Save state to storage
		await this.save();

		const groupMessage: GroupMessage = {
			messageId,
			timestamp,
			groupId: this.groupId,
			senderId: this.userId,
			encryptedPayload,
			signature,
			keyIndex
		};

		console.log(`🔑 [SENDER-KEY] Encrypted message ${messageId} with key index ${keyIndex}`);
		return groupMessage;
	}

	async decryptMessage(message: GroupMessage, senderPublicKey: Uint8Array): Promise<string>
	{
		// Verify the message signature
		const signatureData = new Uint8Array([
			...new TextEncoder().encode(message.messageId),
			...new TextEncoder().encode(message.groupId),
			...new TextEncoder().encode(message.senderId),
			...new Uint8Array(8).map((_, i) => (message.timestamp >> (i * 8)) & 0xff),
			...message.encryptedPayload
		]);

		if (!NobleSignalCrypto.verify(senderPublicKey, signatureData, message.signature))
		{
			throw new Error(`Message signature verification failed for ${message.messageId}`);
		}

		// Try to get the correct message key for this key index
		let msgKeys = this.state.messageKeys.get(message.keyIndex);

		if (!msgKeys)
		{
			// If we don't have the message key, derive it from the current chain state
			// This is a simplified approach - in production, we'd handle out-of-order messages better
			const { chainKey, messageKey } = NobleSignalCrypto.kdfChainKey(this.state.chainKey.key);

			msgKeys = NobleSignalCrypto.deriveMessageKeys(messageKey);

			// Store for future use
			this.state.messageKeys.set(message.keyIndex, msgKeys);
			this.state.chainKey.key = chainKey;
			this.state.chainKey.index = message.keyIndex + 1;
		}

		// Extract nonce and ciphertext
		const nonce = message.encryptedPayload.slice(0, 12);
		const ciphertext = message.encryptedPayload.slice(12);

		try
		{
			const plaintext = NobleSignalCrypto.decrypt(msgKeys.cipherKey, ciphertext, nonce);
			const decryptedText = new TextDecoder().decode(plaintext);

			console.log(`🔑 [SENDER-KEY] Decrypted message ${message.messageId} successfully`);
			return decryptedText;
		}
		catch (error)
		{
			throw new Error(`Failed to decrypt message ${message.messageId}: ${error}`);
		}
	}

	getSenderKeyBundle(): any
	{
		return {
			userId: this.userId,
			groupId: this.groupId,
			chainKey: Array.from(this.state.chainKey.key),
			signingPublicKey: Array.from(this.state.signingKey.publicKey),
			keyIndex: this.state.chainKey.index
		};
	}

	// Get message key for a specific index (for out-of-order decryption)
	getMessageKey(keyIndex: number): MessageKeys | null
	{
		return this.state.messageKeys.get(keyIndex) || null;
	}

	// Update sender key from bundle (when receiving from another user)
	updateFromBundle(bundle: any): void
	{
		if (bundle.chainKey && bundle.chainKey.length === 32)
		{
			this.state.chainKey.key = new Uint8Array(bundle.chainKey);
		}
		if (bundle.keyIndex !== undefined)
		{
			this.state.chainKey.index = Math.max(this.state.chainKey.index, bundle.keyIndex);
		}
		console.log(`🔑 [SENDER-KEY] Updated from bundle, key index: ${this.state.chainKey.index}`);
	}

	// Clean up old message keys to prevent memory bloat
	cleanupOldKeys(maxAge: number = 1000): void
	{
		const cutoff = this.state.chainKey.index - maxAge;

		for (const [index] of this.state.messageKeys)
		{
			if (index < cutoff)
			{
				this.state.messageKeys.delete(index);
			}
		}
	}

	private async save(): Promise<void>
	{
		const data = {
			chainKey: {
				key: Array.from(this.state.chainKey.key),
				index: this.state.chainKey.index
			},
			signingKey: {
				privateKey: Array.from(this.state.signingKey.privateKey),
				publicKey: Array.from(this.state.signingKey.publicKey)
			}
		};

		await AsyncStorage.setItem(`sender-key-${this.groupId}-${this.userId}`, JSON.stringify(data));
	}

	static async load(groupId: string, userId: string): Promise<SenderKeySession | null>
	{
		try
		{
			const stored = await AsyncStorage.getItem(`sender-key-${groupId}-${userId}`);

			if (!stored)
			{
				return null;
			}

			const data = JSON.parse(stored);
			const session = new SenderKeySession(groupId, userId);

			session.state.chainKey = {
				key: new Uint8Array(data.chainKey.key),
				index: data.chainKey.index
			};
			session.state.signingKey = {
				privateKey: new Uint8Array(data.signingKey.privateKey),
				publicKey: new Uint8Array(data.signingKey.publicKey)
			};

			console.log(`🔑 [SENDER-KEY] Loaded existing session for ${groupId}-${userId}`);
			return session;
		}
		catch (error)
		{
			console.warn(`🔑 [SENDER-KEY] Failed to load session: ${error}`);
			return null;
		}
	}

	static async delete(groupId: string, userId: string): Promise<void>
	{
		try
		{
			await AsyncStorage.removeItem(`sender-key-${groupId}-${userId}`);
			console.log(`🔑 [SENDER-KEY] Deleted session for ${groupId}-${userId}`);
		}
		catch (error)
		{
			console.warn(`🔑 [SENDER-KEY] Failed to delete session: ${error}`);
		}
	}
}