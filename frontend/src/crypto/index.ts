import {
	UserKeyPair,
	GroupMember,
	GroupKeyInfo,
	EncryptedMessage,
	KeyExchangeMessage
} from "./types";
import { groupCryptoManager } from "./groupCryptoManager";
import { keyExchangeHandler } from "./keyExchange";
import { getUserKeyPair, clearAllCryptoData } from "./storage";

export class GroupChatCrypto
{
	public async initializeUser(userId: string): Promise<UserKeyPair>
	{
		const existingKeyPair = await getUserKeyPair();

		if (existingKeyPair && existingKeyPair.userId === userId)
		{
			groupCryptoManager.setCurrentUserId(userId);
			return existingKeyPair;
		}

		const newKeyPair = await groupCryptoManager.generateUserKeyPair(userId);

		return newKeyPair;
	}

	public async joinGroup(
		groupId: string,
		newMember: GroupMember,
		existingMembers: GroupMember[]
	): Promise<GroupKeyInfo>
	{
		return await groupCryptoManager.handleUserJoinGroup(
			groupId,
			newMember,
			existingMembers
		);
	}

	public async leaveGroup(
		groupId: string,
		leavingUserId: string,
		remainingMembers: GroupMember[]
	): Promise<GroupKeyInfo | null>
	{
		return await groupCryptoManager.handleUserLeaveGroup(
			groupId,
			leavingUserId,
			remainingMembers
		);
	}

	public async encryptMessage(
		groupId: string,
		message: string
	): Promise<EncryptedMessage>
	{
		return await groupCryptoManager.encryptMessage(groupId, message);
	}

	public async decryptMessage(
		groupId: string,
		encryptedMessage: EncryptedMessage
	): Promise<string>
	{
		return await groupCryptoManager.decryptMessage(
			groupId,
			encryptedMessage
		);
	}

	public async getGroupKeyInfo(
		groupId: string
	): Promise<GroupKeyInfo | null>
	{
		return await groupCryptoManager.getGroupKey(groupId);
	}

	public async handleKeyExchange(message: KeyExchangeMessage): Promise<void>
	{
		return await keyExchangeHandler.handleKeyExchange(message);
	}

	public async sendKeyExchange(
		groupId: string,
		type: "KEY_EXCHANGE" | "NEW_MEMBER" | "MEMBER_LEFT"
	): Promise<KeyExchangeMessage | null>
	{
		return await keyExchangeHandler.sendKeyExchange(groupId, type);
	}

	public async handleNewMemberJoin(
		groupId: string,
		newMember: GroupMember,
		existingMembers: GroupMember[]
	): Promise<void>
	{
		return await keyExchangeHandler.handleNewMemberJoin(
			groupId,
			newMember,
			existingMembers
		);
	}

	public async handleMemberLeave(
		groupId: string,
		leavingUserId: string,
		remainingMembers: GroupMember[]
	): Promise<void>
	{
		return await keyExchangeHandler.handleMemberLeave(
			groupId,
			leavingUserId,
			remainingMembers
		);
	}

	public async getUserKeyPair(): Promise<UserKeyPair | null>
	{
		return await getUserKeyPair();
	}

	public async clearAllData(): Promise<void>
	{
		return await clearAllCryptoData();
	}
}

export const groupChatCrypto = new GroupChatCrypto();

export * from "./types";
export { groupCryptoManager } from "./groupCryptoManager";
export { keyExchangeHandler } from "./keyExchange";
