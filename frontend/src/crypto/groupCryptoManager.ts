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
import { keyExchangeHandler } from "./keyExchange";

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
			throw new Error("Group key not found - key exchange may be in progress");
		}

		if (!this.currentUserId)
		{
			throw new Error("Current user not set");
		}

		// Validate that we have a current key version
		if (!groupKeyInfo.keyVersion || groupKeyInfo.keyVersion < 1) {
			throw new Error("Invalid group key version - key exchange may be incomplete");
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
			throw new Error("Group key not found - key exchange may be in progress");
		}

		// If key versions don't match, try to wait for key exchange completion
		if (encryptedMessage.keyVersion !== groupKeyInfo.keyVersion)
		{
			console.log(`⚠️ Key version mismatch: message v${encryptedMessage.keyVersion} vs current v${groupKeyInfo.keyVersion}`);
			
			// If message is newer, we might be behind in key exchange
			if (encryptedMessage.keyVersion > groupKeyInfo.keyVersion) {
				throw new Error(`Message encrypted with newer key version (${encryptedMessage.keyVersion}) - key exchange needed`);
			}
			
			// If message is older, try to decrypt anyway but warn
			console.warn(`⚠️ Attempting to decrypt message with older key version`);
		}

		try {
			const decryptedContent = decryptWithKey(
				encryptedMessage.content,
				groupKeyInfo.groupKey
			);

			return decryptedContent;
		} catch (error) {
			console.error(`❌ Decryption failed for message v${encryptedMessage.keyVersion} with key v${groupKeyInfo.keyVersion}`);
			throw new Error(`Failed to decrypt message - key version mismatch or corrupted data`);
		}
	}

	public async getGroupKey(groupId: string): Promise<GroupKeyInfo | null>
	{
		return await getGroupKey(groupId);
	}

	public async getUserKeyPair(): Promise<UserKeyPair | null>
	{
		return await getUserKeyPair();
	}

	public async joinGroup(
		groupId: string,
		currentUserMember: GroupMember,
		existingMembers: GroupMember[]
	): Promise<void>
	{
		console.log(`🔐 Joining group ${groupId} with ${existingMembers.length} existing members`);
		
		// Save all member keys for the group (including current user)
		const allMembers = [...existingMembers, currentUserMember];
		await this.saveMemberKeysForGroup(groupId, allMembers);

		// If there's already a group key, we don't need to generate a new one
		// The key exchange will handle that
		const existingGroupKey = await getGroupKey(groupId);
		if (!existingGroupKey) {
			console.log(`🔑 No existing group key found, will be generated during key exchange`);
		} else {
			console.log(`🔑 Existing group key found, version: ${existingGroupKey.keyVersion}`);
		}
	}

	public async handleNewMemberJoin(
		groupId: string,
		newMember: GroupMember,
		existingMembers: GroupMember[]
	): Promise<void>
	{
		// Delegate to the key exchange handler
		await keyExchangeHandler.handleNewMemberJoin(groupId, newMember, existingMembers);
	}

	public async handleMemberLeave(
		groupId: string,
		leavingUserId: string,
		remainingMembers: GroupMember[]
	): Promise<void>
	{
		// Delegate to the key exchange handler
		await keyExchangeHandler.handleMemberLeave(groupId, leavingUserId, remainingMembers);
	}

	public async handleKeyExchange(keyExchangeData: any): Promise<void>
	{
		// Delegate to the key exchange handler
		await keyExchangeHandler.handleKeyExchange(keyExchangeData);
	}

	public cleanupExpiredExchanges(): void
	{
		// Delegate to the key exchange handler
		keyExchangeHandler.cleanupExpiredExchanges();
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

	public async handleSynchronizedKeyExchange(
		groupId: string,
		allMembers: GroupMember[]
	): Promise<GroupKeyInfo>
	{
		console.log(`🔄 Handling synchronized key exchange for group ${groupId} with ${allMembers.length} members`);
		
		// Save all member keys for the group
		await this.saveMemberKeysForGroup(groupId, allMembers);

		// Generate a new group key with all members
		const groupKeyInfo = await this.generateNewGroupKey(
			groupId,
			allMembers
		);

		// Save the new group key
		await saveGroupKey(groupKeyInfo);

		console.log(`✅ Synchronized key exchange completed for group ${groupId}, key version: ${groupKeyInfo.keyVersion}`);

		return groupKeyInfo;
	}
}

export const groupCryptoManager = new GroupCryptoManagerImpl();
