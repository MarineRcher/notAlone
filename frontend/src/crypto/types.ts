export interface UserKeyPair {
	publicKey: string;
	privateKey: string;
	userId: string;
}

export interface GroupMember {
	userId: string;
	publicKey: string;
	isActive: boolean;
}

export interface GroupKeyInfo {
	groupId: string;
	groupKey: string;
	keyVersion: number;
	members: GroupMember[];
	createdAt: Date;
}

export interface EncryptedMessage {
	content: string;
	keyVersion: number;
	timestamp: Date;
	senderId: string;
}

export interface KeyExchangeMessage {
	type: "KEY_EXCHANGE" | "NEW_MEMBER" | "MEMBER_LEFT";
	userId: string;
	publicKey: string;
	groupId: string;
	timestamp: Date;
}

export interface CryptoStorageData {
	userKeyPair: UserKeyPair | null;
	groupKeys: Record<string, GroupKeyInfo>;
	memberKeys: Record<string, Record<string, string>>;
}

export interface GroupCryptoManager {
	generateUserKeyPair: (userId: string) => Promise<UserKeyPair>;
	handleUserJoinGroup: (
		groupId: string,
		newMember: GroupMember,
		existingMembers: GroupMember[]
	) => Promise<GroupKeyInfo>;
	handleUserLeaveGroup: (
		groupId: string,
		leavingUserId: string,
		remainingMembers: GroupMember[]
	) => Promise<GroupKeyInfo | null>;
	handleSynchronizedKeyExchange: (
		groupId: string,
		allMembers: GroupMember[]
	) => Promise<GroupKeyInfo>;
	joinGroup: (
		groupId: string,
		currentUserMember: GroupMember,
		existingMembers: GroupMember[]
	) => Promise<void>;
	handleNewMemberJoin: (
		groupId: string,
		newMember: GroupMember,
		existingMembers: GroupMember[]
	) => Promise<void>;
	handleMemberLeave: (
		groupId: string,
		leavingUserId: string,
		remainingMembers: GroupMember[]
	) => Promise<void>;
	handleKeyExchange: (keyExchangeData: any) => Promise<void>;
	encryptMessage: (
		groupId: string,
		message: string
	) => Promise<EncryptedMessage>;
	decryptMessage: (
		groupId: string,
		encryptedMessage: EncryptedMessage
	) => Promise<string>;
	getGroupKey: (groupId: string) => Promise<GroupKeyInfo | null>;
	getUserKeyPair: () => Promise<UserKeyPair | null>;
	cleanupExpiredExchanges: () => void;
}
