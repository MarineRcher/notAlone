/**
 * End-to-End Encryption Type Definitions
 *
 * This file contains TypeScript type definitions for the E2EE implementation.
 * These types are used across the encryption system to ensure type safety and consistency.
 */

// -------------- Core Cryptographic Types --------------

/**
 * Represents a public/private key pair
 */
export interface KeyPair {
	publicKey: CryptoKey;
	privateKey: CryptoKey;
}

/**
 * Represents a serialized version of a KeyPair that can be stored
 */
export interface SerializedKeyPair {
	publicKey: string; // Base64-encoded public key
	privateKey: string; // Base64-encoded private key
}

/**
 * Type alias for a symmetric encryption key
 */
export type SymmetricKey = CryptoKey;

/**
 * Bundle of keys used in an encryption session
 */
export interface KeyBundle {
	asymmetricKeyPair: KeyPair; // For asymmetric encryption/decryption
	ecdhKeyPair: KeyPair; // For key exchange
	symmetricKey: SymmetricKey; // For symmetric encryption/decryption
}

// -------------- Encrypted Message Types --------------

/**
 * Represents the header of an encrypted message
 */
export interface MessageHeader {
	version: string; // Protocol version
	senderId: string; // ID of the sender
	recipientId?: string; // ID of the recipient (optional for group messages)
	messageId: string; // Unique ID for the message
	timestamp: number; // Message timestamp
	iv: string; // Base64-encoded initialization vector
	encryptedKey?: string; // Base64-encoded encrypted symmetric key (for new sessions)
	keyExchangeMode?: KeyExchangeMode; // Method used for key exchange
}

/**
 * Represents a fully encrypted message
 */
export interface EncryptedMessage {
	header: MessageHeader; // Message header with metadata
	ciphertext: string; // Base64-encoded encrypted message content
	signature: string; // Base64-encoded digital signature
	groupId?: string; // ID of the group (for group messages)
}

/**
 * Represents a decrypted message
 */
export interface DecryptedMessage {
	content: string; // Plaintext message content
	senderId: string; // ID of the sender
	recipientId?: string; // ID of the recipient
	messageId: string; // Unique ID for the message
	timestamp: number; // Message timestamp
	groupId?: string; // ID of the group (for group messages)
	verified: boolean; // Whether the signature was verified
}

// -------------- Session & Key Exchange Types --------------

/**
 * Enum for key exchange methods
 */
export enum KeyExchangeMode {
	DIRECT = "direct", // Direct key exchange (for 1:1 chats)
	GROUP = "group", // Group key exchange
	RATCHET = "ratchet", // Ratcheting key exchange (for forward secrecy)
}

/**
 * Represents an encryption session with another user
 */
export interface Session {
	userId: string; // ID of the other user
	sessionId: string; // Unique ID for this session
	symmetricKey: string; // Base64-encoded symmetric key for this session
	lastRatchetTimestamp?: number; // Timestamp of the last key ratchet
	established: boolean; // Whether the session is established
	publicKey?: string; // Their public key (Base64-encoded)
}

/**
 * Represents a group encryption session
 */
export interface GroupSession {
	groupId: string; // ID of the group
	sessionId: string; // Unique ID for this session
	symmetricKey: string; // Base64-encoded symmetric key for this group
	members: string[]; // IDs of group members
	established: boolean; // Whether the session is established
	lastRotationTimestamp: number; // Timestamp of the last key rotation
}

// -------------- API & Request/Response Types --------------

/**
 * Request to initiate a new encryption session
 */
export interface SessionInitRequest {
	userId: string; // ID of the requesting user
	publicKey: string; // Base64-encoded public key
	timestamp: number; // Request timestamp
	signature: string; // Signature to verify authenticity
}

/**
 * Response to a session initialization request
 */
export interface SessionInitResponse {
	userId: string; // ID of the responding user
	publicKey: string; // Base64-encoded public key
	encryptedKey?: string; // Base64-encoded encrypted symmetric key
	timestamp: number; // Response timestamp
	signature: string; // Signature to verify authenticity
}

/**
 * Request to update keys in a session
 */
export interface KeyUpdateRequest {
	userId: string; // ID of the requesting user
	sessionId: string; // ID of the session
	newPublicKey: string; // Base64-encoded new public key
	previousKeySignature: string; // Signature of the previous key
	timestamp: number; // Request timestamp
}

/**
 * Group key distribution message
 */
export interface GroupKeyDistribution {
	groupId: string; // ID of the group
	distributorId: string; // ID of the user distributing the key
	recipients: {
		// Map of recipient ID to their encrypted key
		[userId: string]: string; // User ID -> Base64-encoded encrypted key
	};
	keyId: string; // Unique ID for this key
	timestamp: number; // Distribution timestamp
	signature: string; // Signature to verify authenticity
}

// -------------- Hook and Context Types --------------

/**
 * State managed by the encryption hook/context
 */
export interface EncryptionState {
	initialized: boolean; // Whether encryption is initialized
	identity: {
		// User's cryptographic identity
		userId: string; // User ID
		publicKey: string; // Base64-encoded public key
	} | null;
	sessions: {
		// Map of user ID to session
		[userId: string]: Session;
	};
	groupSessions: {
		// Map of group ID to group session
		[groupId: string]: GroupSession;
	};
	pendingSessions: string[]; // IDs of pending sessions
}

/**
 * Functions provided by the encryption hook/context
 */
export interface EncryptionFunctions {
	initialize: (userId: string) => Promise<void>;
	encryptMessage: (
		message: string,
		recipientId: string
	) => Promise<EncryptedMessage>;
	decryptMessage: (message: EncryptedMessage) => Promise<DecryptedMessage>;
	encryptGroupMessage: (
		message: string,
		groupId: string
	) => Promise<EncryptedMessage>;
	initSession: (userId: string) => Promise<void>;
	rotateGroupKey: (groupId: string) => Promise<void>;
	exportIdentity: () => Promise<{ userId: string; publicKey: string }>;
	importIdentity: (userId: string, privateKey: string) => Promise<void>;
	createGroupSession: (groupId: string, memberIds: string[]) => Promise<void>;
}

/**
 * Combined encryption context value
 */
export interface EncryptionContextValue
	extends EncryptionState,
		EncryptionFunctions {}

// -------------- Error Types --------------

/**
 * Specific error types for the encryption system
 */
export enum EncryptionErrorType {
	INITIALIZATION_FAILED = "initialization_failed",
	SESSION_NOT_ESTABLISHED = "session_not_established",
	DECRYPTION_FAILED = "decryption_failed",
	INVALID_SIGNATURE = "invalid_signature",
	KEY_GENERATION_FAILED = "key_generation_failed",
	STORAGE_ERROR = "storage_error",
	UNKNOWN_ERROR = "unknown_error",
}

/**
 * Custom error class for encryption errors
 */
export class EncryptionError extends Error {
	type: EncryptionErrorType;

	constructor(
		message: string,
		type: EncryptionErrorType = EncryptionErrorType.UNKNOWN_ERROR
	) {
		super(message);
		this.name = "EncryptionError";
		this.type = type;
	}
}
