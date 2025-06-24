export interface GroupMember 
{
	userId: string;
	publicKey: string;
	isActive: boolean;
	joinedAt: Date;
}

export interface EncryptedMessage 
{
	content: string;
	keyVersion: number;
	timestamp: Date;
	senderId: string;
}

export interface KeyExchangeMessage 
{
	type: "KEY_EXCHANGE" | "NEW_MEMBER" | "MEMBER_LEFT";
	userId: string;
	publicKey: string;
	groupId: string;
	timestamp: Date;
	remainingMembers?: GroupMember[];
	allMembers?: GroupMember[];
}

export interface GroupSession 
{
	groupId: string;
	members: GroupMember[];
	maxMembers: number;
	minMembers: number;
	status: "waiting" | "active" | "sealed" | "deleted";
	createdAt: Date;
	lastActivity: Date;
}

export interface WaitingUser 
{
	userId: string;
	socketId: string;
	publicKey: string;
	joinedWaitroom: Date;
}

export interface GroupMessage 
{
	id: string;
	groupId: string;
	encryptedMessage: EncryptedMessage;
	messageType: "message" | "key_exchange" | "system";
	timestamp: Date;
}

export interface SocketUserData 
{
	userId: string;
	socketId: string;
	currentGroupId?: string;
	publicKey?: string;
	username?: string;
} 