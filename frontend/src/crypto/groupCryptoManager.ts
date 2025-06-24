import {
	UserKeyPair,
	GroupMember,
	GroupKeyInfo,
	EncryptedMessage,
	GroupCryptoManager
} from "./types";
import {
	generateKeyPair,
	combineKeysToGroupKey,
	encryptWithKey,
	decryptWithKey
} from "./utils";
import {
	saveUserKeyPair,
	getUserKeyPair,
	saveGroupKey,
	getGroupKey,
	saveMemberKey,
	deleteGroupKey
} from "./storage";

class GroupCryptoManagerImpl implements GroupCryptoManager
{
	private currentUserId: string | null = null;

	public setCurrentUserId(userId: string): void
	{
		this.currentUserId = userId;
	}

	public async generateUserKeyPair(userId: string): Promise<UserKeyPair>
	{
		const keyPair = await generateKeyPair();

		const userKeyPair: UserKeyPair = {
			publicKey: keyPair.publicKey,
			privateKey: keyPair.privateKey,
			userId: userId
		};

		await saveUserKeyPair(userKeyPair);
		this.currentUserId = userId;

		return userKeyPair;
	}

	public async handleUserJoinGroup(
		groupId: string,
		newMember: GroupMember,
		existingMembers: GroupMember[]
	): Promise<GroupKeyInfo>
	{
		const allMembers = [...existingMembers, newMember];

		await this.saveMemberKeysForGroup(groupId, allMembers);

		const groupKeyInfo = await this.generateNewGroupKey(
			groupId,
			allMembers
		);

		await saveGroupKey(groupKeyInfo);

		return groupKeyInfo;
	}

	public async handleUserLeaveGroup(
		groupId: string,
		leavingUserId: string,
		remainingMembers: GroupMember[]
	): Promise<GroupKeyInfo | null>
	{
		if (remainingMembers.length === 0)
		{
			await deleteGroupKey(groupId);
			return null;
		}

		const groupKeyInfo = await this.generateNewGroupKey(
			groupId,
			remainingMembers
		);

		await saveGroupKey(groupKeyInfo);

		return groupKeyInfo;
	}

	public async encryptMessage(
		groupId: string,
		message: string
	): Promise<EncryptedMessage>
	{
		const groupKeyInfo = await getGroupKey(groupId);

		if (!groupKeyInfo)
		{
			throw new Error("Group key not found");
		}

		if (!this.currentUserId)
		{
			throw new Error("Current user not set");
		}

		const encryptedContent = encryptWithKey(message, groupKeyInfo.groupKey);

		return {
			content: encryptedContent,
			keyVersion: groupKeyInfo.keyVersion,
			timestamp: new Date(),
			senderId: this.currentUserId
		};
	}

	public async decryptMessage(
		groupId: string,
		encryptedMessage: EncryptedMessage
	): Promise<string>
	{
		const groupKeyInfo = await getGroupKey(groupId);

		if (!groupKeyInfo)
		{
			throw new Error("Group key not found");
		}

		if (encryptedMessage.keyVersion !== groupKeyInfo.keyVersion)
		{
			throw new Error("Message encrypted with different key version");
		}

		const decryptedContent = decryptWithKey(
			encryptedMessage.content,
			groupKeyInfo.groupKey
		);

		return decryptedContent;
	}

	public async getGroupKey(groupId: string): Promise<GroupKeyInfo | null>
	{
		return await getGroupKey(groupId);
	}

	private async generateNewGroupKey(
		groupId: string,
		members: GroupMember[]
	): Promise<GroupKeyInfo>
	{
		const publicKeys = members
			.filter(member => member.isActive)
			.map(member => member.publicKey);

		const groupKey = await combineKeysToGroupKey(publicKeys);

		const existingGroupKey = await getGroupKey(groupId);

		const keyVersion = existingGroupKey
			? existingGroupKey.keyVersion + 1
			: 1;

		return {
			groupId,
			groupKey,
			keyVersion,
			members: members.map(member => ({ ...member })),
			createdAt: new Date()
		};
	}

	private async saveMemberKeysForGroup(
		groupId: string,
		members: GroupMember[]
	): Promise<void>
	{
		const savePromises = members.map(member =>
			saveMemberKey(groupId, member.userId, member.publicKey)
		);

		await Promise.all(savePromises);
	}
}

export const groupCryptoManager = new GroupCryptoManagerImpl();
