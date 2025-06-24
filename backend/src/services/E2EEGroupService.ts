import {
	GroupSession,
	GroupMember,
	WaitingUser,
	GroupMessage,
	EncryptedMessage
} from "../types/e2ee";
import Group from "../models/Group";
import GroupMemberModel from "../models/GroupMember";
import Message from "../models/Message";
import sequelize from "../config/database";
import { v4 as uuidv4 } from 'uuid';

export class E2EEGroupService 
{
	private groupSessions: Map<string, GroupSession> = new Map();
	private waitingRoom: WaitingUser[] = [];
	private userToGroup: Map<string, string> = new Map();
	private onGroupCreated?: (group: GroupSession) => void;
	
	// Use environment variables with fallback defaults
	private readonly MAX_MEMBERS = parseInt(process.env.E2EE_MAX_MEMBERS || '8');
	private readonly MIN_MEMBERS = parseInt(process.env.E2EE_MIN_MEMBERS || '3');
	private readonly WAITROOM_TIMEOUT = parseInt(process.env.E2EE_WAITROOM_TIMEOUT || '5') * 60 * 1000; // Convert minutes to ms
	private readonly GROUP_INACTIVITY_TIMEOUT = parseInt(process.env.E2EE_GROUP_INACTIVITY_TIMEOUT || '30') * 60 * 1000; // Convert minutes to ms

	constructor() {
		console.log(`🔧 E2EE Group Service initialized with:`);
		console.log(`   📊 Min members: ${this.MIN_MEMBERS} (env: ${process.env.E2EE_MIN_MEMBERS})`);
		console.log(`   📊 Max members: ${this.MAX_MEMBERS} (env: ${process.env.E2EE_MAX_MEMBERS})`);
		console.log(`   ⏱️  Waitroom timeout: ${this.WAITROOM_TIMEOUT / 60000} minutes`);
		console.log(`   ⏱️  Group inactivity timeout: ${this.GROUP_INACTIVITY_TIMEOUT / 60000} minutes`);
	}

	public addUserToWaitroom(user: WaitingUser): void 
	{
		const existingIndex = this.waitingRoom.findIndex(
			u => u.userId === user.userId
		);

		if (existingIndex !== -1) 
		{
			this.waitingRoom[existingIndex] = user;
		} 
		else 
		{
			this.waitingRoom.push(user);
		}

		this.cleanupExpiredWaitingUsers();
		this.tryCreateGroup();
	}

	public removeUserFromWaitroom(userId: string): void 
	{
		this.waitingRoom = this.waitingRoom.filter(
			u => u.userId !== userId
		);
	}

	public async createGroup(waitingUsers: WaitingUser[]): Promise<GroupSession> 
	{
		const groupId = this.generateGroupId();
		const members: GroupMember[] = waitingUsers.map(user => ({
			userId: user.userId,
			publicKey: user.publicKey,
			isActive: true,
			joinedAt: new Date()
		}));

		const groupSession: GroupSession = {
			groupId,
			members,
			maxMembers: this.MAX_MEMBERS,
			minMembers: this.MIN_MEMBERS,
			status: "active",
			createdAt: new Date(),
			lastActivity: new Date()
		};

		this.groupSessions.set(groupId, groupSession);

		members.forEach(member => {
			this.userToGroup.set(member.userId, groupId);
		});

		// Store in database if available
		await this.persistGroupToDatabase(groupSession);

		return groupSession;
	}

	public async addMemberToGroup(
		groupId: string, 
		newMember: GroupMember
	): Promise<GroupSession | null> 
	{
		const group = this.groupSessions.get(groupId);

		if (!group || group.status === "sealed") 
		{
			return null;
		}

		if (group.members.length >= group.maxMembers) 
		{
			group.status = "sealed";
			await this.updateGroupInDatabase(group);
			return null;
		}

		group.members.push(newMember);
		group.lastActivity = new Date();
		this.userToGroup.set(newMember.userId, groupId);

		if (group.members.length >= group.maxMembers) 
		{
			group.status = "sealed";
		}

		// Update in database
		await this.updateGroupInDatabase(group);
		await this.addMemberToDatabase(groupId, newMember);

		return group;
	}

	public async removeMemberFromGroup(
		groupId: string, 
		userId: string
	): Promise<GroupSession | null> 
	{
		const group = this.groupSessions.get(groupId);

		if (!group) 
		{
			return null;
		}

		// Set member as inactive instead of removing
		const member = group.members.find(m => m.userId === userId);
		if (member) {
			member.isActive = false;
		}

		group.lastActivity = new Date();
		this.userToGroup.delete(userId);

		// Update member status in database
		await this.setMemberInactiveInDatabase(groupId, userId);

		// Check if group is empty (no active members)
		const activeMembers = group.members.filter(m => m.isActive);
		if (activeMembers.length === 0) 
		{
			await this.deleteGroupCompletely(groupId);
			return null;
		}

		await this.updateGroupInDatabase(group);
		return group;
	}

	public getGroupSession(groupId: string): GroupSession | null 
	{
		return this.groupSessions.get(groupId) || null;
	}

	public getUserGroup(userId: string): GroupSession | null 
	{
		const groupId = this.userToGroup.get(userId);

		if (!groupId) 
		{
			return null;
		}

		return this.getGroupSession(groupId);
	}

	public getWaitingRoomSize(): number 
	{
		return this.waitingRoom.length;
	}

	public getWaitingRoomCount(): number 
	{
		return this.waitingRoom.length;
	}

	public getWaitingUsers(): WaitingUser[] 
	{
		return [...this.waitingRoom]; // Return a copy to prevent external modifications
	}

	public async deleteGroupCompletely(groupId: string): Promise<void> 
	{
		const group = this.groupSessions.get(groupId);

		if (group) 
		{
			group.members.forEach(member => {
				this.userToGroup.delete(member.userId);
			});
		}

		this.groupSessions.delete(groupId);

		// Delete from database completely (messages and group)
		await this.deleteGroupFromDatabase(groupId);
	}

	public async cleanupInactiveGroups(): Promise<void> 
	{
		const now = new Date();

		for (const [groupId, group] of this.groupSessions) 
		{
			const timeSinceLastActivity = now.getTime() 
				- group.lastActivity.getTime();

			if (timeSinceLastActivity > this.GROUP_INACTIVITY_TIMEOUT) 
			{
				console.log(`🧹 Cleaning up inactive group ${groupId} (inactive for ${Math.round(timeSinceLastActivity / 60000)} minutes)`);
				await this.deleteGroupCompletely(groupId);
			}
		}
	}

	public async storeMessage(
		groupId: string,
		senderId: string,
		encryptedMessage: EncryptedMessage
	): Promise<{ id: string; timestamp: Date }> 
	{
		const messageId = this.generateMessageId();
		const timestamp = new Date();

		// Store in database if available
		try {
			await Message.create({
				id: messageId,
				groupId: groupId,
				senderId: parseInt(senderId),
				encryptedContent: JSON.stringify(encryptedMessage),
				messageType: 'text',
				timestamp: timestamp,
				isDelivered: true
			});
		} catch (error) {
			console.warn('Failed to store message in database:', error);
		}

		// Update group activity
		const group = this.groupSessions.get(groupId);
		if (group) {
			group.lastActivity = timestamp;
			await this.updateGroupInDatabase(group);
		}

		return { id: messageId, timestamp };
	}

	private cleanupExpiredWaitingUsers(): void 
	{
		const now = new Date();

		this.waitingRoom = this.waitingRoom.filter(user => {
			const elapsed = now.getTime() - user.joinedWaitroom.getTime();
			return elapsed < this.WAITROOM_TIMEOUT;
		});
	}

	public setGroupCreatedCallback(
		callback: (group: GroupSession) => void
	): void 
	{
		this.onGroupCreated = callback;
	}

	public tryCreateGroup(): GroupSession | null 
	{
		console.log(`🔍 tryCreateGroup called: ${this.waitingRoom.length} users waiting, min required: ${this.MIN_MEMBERS}`);
		
		if (this.waitingRoom.length >= this.MIN_MEMBERS) 
		{
			console.log(`✅ Creating group with ${this.waitingRoom.length} users`);
			const selectedUsers = this.waitingRoom.splice(0, this.MAX_MEMBERS);
			const groupId = uuidv4();

			const members: GroupMember[] = selectedUsers.map((user) => ({
				userId: user.userId,
				publicKey: user.publicKey,
				isActive: true,
				joinedAt: new Date(),
			}));

			const group: GroupSession = {
				groupId,
				members,
				maxMembers: this.MAX_MEMBERS,
				minMembers: this.MIN_MEMBERS,
				status: 'active',
				createdAt: new Date(),
				lastActivity: new Date(),
			};

			this.groupSessions.set(groupId, group);

			// Map users to this group
			selectedUsers.forEach((user) => {
				this.userToGroup.set(user.userId, groupId);
			});

			console.log(`✅ Created new group ${groupId} with ${members.length} members`);

			console.log(`🔍 Checking onGroupCreated callback: ${!!this.onGroupCreated}`);
			if (this.onGroupCreated) {
				console.log(`📞 Calling onGroupCreated callback for group ${groupId}`);
				this.onGroupCreated(group);
			} else {
				console.warn(`❌ No onGroupCreated callback set!`);
			}

			return group;
		} else {
			console.log(`❌ Not enough users to create group: ${this.waitingRoom.length} < ${this.MIN_MEMBERS}`);
		}

		return null;
	}

	private generateGroupId(): string 
	{
		const timestamp = Date.now().toString(36);
		const random = Math.random().toString(36).substr(2, 9);
		return `group_${timestamp}_${random}`;
	}

	private generateMessageId(): string 
	{
		return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Database persistence methods
	private async persistGroupToDatabase(groupSession: GroupSession): Promise<void> 
	{
		try {
			// Create group in database
			await Group.create({
				id: groupSession.groupId,
				name: `Group ${groupSession.groupId}`,
				maxMembers: groupSession.maxMembers,
				currentMembers: groupSession.members.length,
				status: 'active',
				isPublic: false,
				createdAt: groupSession.createdAt,
				updatedAt: groupSession.lastActivity
			});

			// Add members to database
			for (const member of groupSession.members) {
				await this.addMemberToDatabase(groupSession.groupId, member);
			}
		} catch (error) {
			console.warn('Failed to persist group to database:', error);
		}
	}

	private async addMemberToDatabase(groupId: string, member: GroupMember): Promise<void> 
	{
		try {
			await GroupMemberModel.create({
				groupId: groupId,
				userId: parseInt(member.userId),
				publicKey: member.publicKey,
				isActive: member.isActive,
				joinedAt: member.joinedAt || new Date()
			});
		} catch (error) {
			console.warn('Failed to add member to database:', error);
		}
	}

	private async setMemberInactiveInDatabase(groupId: string, userId: string): Promise<void> 
	{
		try {
			await GroupMemberModel.update(
				{ isActive: false },
				{ 
					where: { 
						groupId: groupId, 
						userId: parseInt(userId) 
					} 
				}
			);
		} catch (error) {
			console.warn('Failed to set member inactive in database:', error);
		}
	}

	private async updateGroupInDatabase(group: GroupSession): Promise<void> 
	{
		try {
			const activeMembers = group.members.filter(m => m.isActive);
			await Group.update(
				{ 
					currentMembers: activeMembers.length,
					status: 'active',
					updatedAt: group.lastActivity
				},
				{ where: { id: group.groupId } }
			);
		} catch (error) {
			console.warn('Failed to update group in database:', error);
		}
	}

	private async deleteGroupFromDatabase(groupId: string): Promise<void> 
	{
		try {
			// Delete all messages first
			await Message.destroy({
				where: { groupId: groupId }
			});

			// Delete all group members
			await GroupMemberModel.destroy({
				where: { groupId: groupId }
			});

			// Delete the group
			await Group.destroy({
				where: { id: groupId }
			});

			console.log(`🗑️ Completely deleted group ${groupId} from database`);
		} catch (error) {
			console.error('Failed to delete group from database:', error);
		}
	}
} 