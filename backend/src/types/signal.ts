// Signal Protocol Types for Backend - Compatible with Noble Crypto Implementation

export interface EncryptedMessage {
	messageId: string;
	timestamp: number;
	groupId: string;
	senderId: string;
	encryptedPayload: number[]; // Serialized for JSON
	signature: number[]; // Serialized for JSON
	keyIndex: number;
}

export interface SenderKeyBundle {
	userId: string;
	groupId: string;
	chainKey: number[]; // Serialized for JSON
	signingPublicKey: number[]; // Serialized for JSON
	keyIndex: number;
}

export interface DeviceInfo {
	deviceId: string;
	registrationId: number;
	identityKey: number[];
	signedPreKey: number[];
	preKeys: number[][];
}

// Socket event data structures
export interface GroupMessageData {
	groupId: string;
	encryptedMessage: EncryptedMessage;
}

export interface SenderKeyDistributionData {
	groupId: string;
	targetUserId: string;
	distributionMessage: SenderKeyBundle;
}

export interface SenderKeyRequestData {
	groupId: string;
	fromUserId: string;
}

export interface JoinGroupData {
	groupId: string;
}

export interface GroupMemberInfo {
	userId: string;
	username: string;
	isOnline: boolean;
	deviceInfo?: DeviceInfo;
}

// User session data for socket authentication
export interface AuthenticatedUser {
	userId: string;
	socketId: string;
	username: string;
	deviceInfo?: DeviceInfo;
}

// Message storage interface (for database)
export interface StoredMessage {
	id: string;
	groupId: string;
	senderId: string;
	encryptedData: string; // JSON serialized EncryptedMessage
	messageType: "text" | "system" | "key_distribution";
	timestamp: Date;
	isDelivered: boolean;
}
