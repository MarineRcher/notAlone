import { Server, Socket } from "socket.io";
import { E2EEGroupService } from "./E2EEGroupService";
import {
	GroupMember,
	WaitingUser,
	EncryptedMessage,
	KeyExchangeMessage,
	SocketUserData,
	GroupSession
} from "../types/e2ee";

interface AuthenticatedSocket extends Socket 
{
	user?: SocketUserData;
}

export class E2EESocketService 
{
	private io: Server;
	private groupService: E2EEGroupService;
	private connectedUsers: Map<string, SocketUserData> = new Map();

	constructor(io: Server) 
	{
		this.io = io;
		this.groupService = new E2EEGroupService();
		
		// Set up the callback for when groups are created
		this.groupService.setGroupCreatedCallback((group: GroupSession) => {
			console.log(`📞 Group creation callback triggered for ${group.groupId}`);
			this.onGroupCreated(group);
		});
	}

	public handleConnection(socket: AuthenticatedSocket): void 
	{
		if (!socket.user) 
		{
			socket.disconnect();
			return;
		}

		this.connectedUsers.set(socket.user.userId, socket.user);
		this.setupEventHandlers(socket);
	}

	public handleDisconnection(socket: AuthenticatedSocket): void 
	{
		if (!socket.user) 
		{
			return;
		}

		const userData = socket.user;

		this.connectedUsers.delete(userData.userId);
		this.groupService.removeUserFromWaitroom(userData.userId);

		if (userData.currentGroupId) 
		{
			this.handleUserLeaveGroup(socket, userData.currentGroupId);
		}
	}

	private setupEventHandlers(socket: AuthenticatedSocket): void 
	{
		console.log(`🔗 Setting up event handlers for socket ${socket.id} (user: ${socket.user?.userId})`);

		socket.on("join_random_group", (data) => {
			console.log(`🎯 Received join_random_group event from ${socket.user?.userId}`);
			this.handleJoinRandomGroup(socket, data);
		});

		socket.on("send_group_message", (data) => {
			console.log(`💬 Received send_group_message event from ${socket.user?.userId}`);
			this.handleSendGroupMessage(socket, data);
		});

		socket.on("leave_group", (data) => {
			console.log(`🚪 Received leave_group event from ${socket.user?.userId}`);
			this.handleLeaveGroup(socket, data);
		});

		socket.on("crypto_key_exchange", (data) => {
			console.log(`🔐 Received crypto_key_exchange event from ${socket.user?.userId}`);
			this.handleKeyExchange(socket, data);
		});

		socket.on("disconnect", () => {
			console.log(`🔌 User ${socket.user?.userId} disconnecting`);
			this.handleDisconnection(socket);
		});

		console.log(`✅ Event handlers set up for user ${socket.user?.userId}`);
	}

	private handleJoinRandomGroup(
		socket: AuthenticatedSocket,
		data: { publicKey: string }
	): void 
	{
		console.log(`📍 User ${socket.user?.userId} requesting to join random group with data:`, data);

		if (!socket.user || !data.publicKey) 
		{
			console.log(`❌ Invalid join request - User: ${!!socket.user}, PublicKey: ${!!data.publicKey}`);
			socket.emit("error", { message: "Invalid request data" });
			return;
		}

		const existingGroup = this.groupService.getUserGroup(socket.user.userId);

		if (existingGroup) 
		{
			console.log(`❌ User ${socket.user.userId} already in group ${existingGroup.groupId}`);
			socket.emit("error", { 
				message: "Already in a group" 
			});
			return;
		}

		console.log(`🎲 Adding user ${socket.user.userId} to waitroom...`);
		this.groupService.addUserToWaitroom({
			userId: socket.user.userId,
			socketId: socket.id,
			publicKey: data.publicKey,
			joinedWaitroom: new Date(),
		});

		// Try to create a group FIRST if we have enough people
		const groupInfo = this.groupService.tryCreateGroup();
		if (groupInfo) {
			console.log(`🎉 Group created! Notifying ${groupInfo.members.length} members`);
			this.onGroupCreated(groupInfo);
		} else {
			// Only broadcast waitroom status if no group was created
			const waitingCount = this.groupService.getWaitingRoomCount();
			console.log(`✅ User ${socket.user.userId} added to waitroom. Total waiting: ${waitingCount}`);
			this.broadcastWaitroomStatus(waitingCount);
		}
	}

	private async handleSendGroupMessage(
		socket: AuthenticatedSocket,
		data: { groupId: string; encryptedMessage: EncryptedMessage | string }
	): Promise<void> 
	{
		if (!socket.user || !data.groupId || !data.encryptedMessage) 
		{
			socket.emit("error", { message: "Invalid message data" });
			return;
		}

		const group = this.groupService.getGroupSession(data.groupId);

		if (!group) 
		{
			socket.emit("error", { message: "Group not found" });
			return;
		}

		const isMember = group.members.some(
			m => m.userId === socket.user?.userId && m.isActive
		);

		if (!isMember) 
		{
			socket.emit("error", { message: "Not a group member" });
			return;
		}

		// Parse encrypted message if it's a string
		const encryptedMessage = typeof data.encryptedMessage === 'string' 
			? JSON.parse(data.encryptedMessage) as EncryptedMessage
			: data.encryptedMessage;

		// Store message in database and get the stored message info
		const messageInfo = await this.groupService.storeMessage(
			data.groupId,
			socket.user.userId,
			encryptedMessage
		);

		console.log('🔍 Message stored:', JSON.stringify(encryptedMessage));

		this.broadcastToGroup(data.groupId, "group_message", {
			messageId: messageInfo.id,
			encryptedMessage: encryptedMessage,
			groupId: data.groupId,
			senderUsername: socket.user.username || socket.user.userId
		});
	}

	private handleLeaveGroup(
		socket: AuthenticatedSocket,
		data: { groupId: string }
	): void 
	{
		if (!socket.user || !data.groupId) 
		{
			return;
		}

		this.handleUserLeaveGroup(socket, data.groupId);
	}

	private handleKeyExchange(
		socket: AuthenticatedSocket,
		data: KeyExchangeMessage
	): void 
	{
		if (!socket.user || !data.groupId) 
		{
			return;
		}

		const group = this.groupService.getGroupSession(data.groupId);

		if (!group) 
		{
			return;
		}

		this.broadcastToGroup(data.groupId, "crypto_key_exchange", data);
	}

	private async handleUserLeaveGroup(
		socket: AuthenticatedSocket,
		groupId: string
	): Promise<void> 
	{
		if (!socket.user) 
		{
			return;
		}

		const group = await this.groupService.removeMemberFromGroup(
			groupId,
			socket.user.userId
		);

		socket.leave(`group:${groupId}`);

		if (group) 
		{
			// All remaining members are active now (inactive ones are removed)
			const remainingMembers = group.members;

			this.broadcastToGroup(groupId, "user_left_group", {
				userId: socket.user.userId,
				groupId,
				remainingMembers
			});

			// Only trigger key exchange if there are remaining members
			if (remainingMembers.length > 0) {
				console.log(`🔄 Triggering key exchange for ${remainingMembers.length} remaining members after ${socket.user.userId} left`);
				remainingMembers.forEach(member => {
					const memberSocket = this.findSocketByUserId(member.userId);
					if (memberSocket) {
						memberSocket.emit("request_key_exchange", {
							type: "MEMBER_LEFT",
							groupId: groupId,
							remainingMembers: remainingMembers // Send consistent member list
						});
					}
				});
			} else {
				console.log(`📭 No remaining members after ${socket.user.userId} left group ${groupId}`);
			}
		}
	}

	private checkForNewGroups(): void 
	{
		// Check if any groups were created and notify accordingly
		// This is handled by the service internally when users join waitroom
	}

	private broadcastToGroup(
		groupId: string,
		event: string,
		data: any
	): void 
	{
		console.log(`📡 Broadcasting ${event} to group ${groupId}:`, data);
		const room = this.io.sockets.adapter.rooms.get(`group:${groupId}`);
		console.log(`📊 Group ${groupId} has ${room?.size || 0} connected sockets`);
		
		this.io.to(`group:${groupId}`).emit(event, data);
	}

	public getGroupService(): E2EEGroupService 
	{
		return this.groupService;
	}

	private onGroupCreated(group: GroupSession): void 
	{
		console.log(`🚀 Setting up group ${group.groupId} for ${group.members.length} members`);
		
		// Check if this is a new group or an existing group with new members
		const isNewGroup = group.members.length <= this.groupService.getMinMembers();
		
		if (isNewGroup) {
			console.log(`🆕 This is a new group creation`);
			this.setupNewGroup(group);
		} else {
			console.log(`➕ This is an existing group with new members`);
			this.handleUserJoinedExistingGroup(group);
		}
	}

	private setupNewGroup(group: GroupSession): void 
	{
		group.members.forEach(member => {
			const memberSocket = this.findSocketByUserId(member.userId);

			if (memberSocket) 
			{
				// Join the socket room
				memberSocket.join(`group:${group.groupId}`);
				
				// Update the user's current group ID in our connected users map
				const userData = this.connectedUsers.get(member.userId);
				if (userData) {
					userData.currentGroupId = group.groupId;
					this.connectedUsers.set(member.userId, userData);
				}
				
				// Clear any waitroom status first
				memberSocket.emit('waitroom_cleared');
				
				// Send group creation event
				memberSocket.emit("joined_random_group", {
					groupId: group.groupId,
					members: group.members
				});
				
				console.log(`✅ User ${member.userId} added to new group ${group.groupId}`);
			} else {
				console.warn(`⚠️ Socket not found for user ${member.userId}`);
			}
		});

		// Send welcome message to the group with a small delay to ensure frontend has processed the join
		setTimeout(() => {
			this.sendWelcomeMessage(group.groupId, group.members.map(m => m.userId));
		}, 100);

		// Trigger key exchange for all members of the new group
		// Each member will participate in the synchronized key exchange
		console.log(`🔄 Triggering key exchange for new group ${group.groupId} with ${group.members.length} members`);
		
		// Add a small delay to ensure all clients have processed the join event
		setTimeout(() => {
			group.members.forEach(member => {
				const memberSocket = this.findSocketByUserId(member.userId);
				if (memberSocket) {
					memberSocket.emit("request_key_exchange", {
						type: "NEW_MEMBER",
						groupId: group.groupId,
						allMembers: group.members // Send all members for consistent state
					});
				}
			});
		}, 200); // 200ms delay to ensure frontend is ready
	}

	private handleUserJoinedExistingGroup(group: GroupSession): void 
	{
		// Find the member who joined most recently based on joinedAt timestamp
		const sortedMembers = [...group.members].sort((a, b) => 
			new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
		);
		const newestMember = sortedMembers[0]; // Most recent joiner
		const existingMembers = group.members.filter(m => m.userId !== newestMember.userId);
		
		console.log(`👤 New member ${newestMember.userId} joining existing group ${group.groupId}`);
		console.log(`📊 Group now has ${group.members.length} total members (${existingMembers.length} existing + 1 new)`);
		
		const memberSocket = this.findSocketByUserId(newestMember.userId);
		
		if (memberSocket) 
		{
			// Join the socket room
			memberSocket.join(`group:${group.groupId}`);
			
			// Update the user's current group ID in our connected users map
			const userData = this.connectedUsers.get(newestMember.userId);
			if (userData) {
				userData.currentGroupId = group.groupId;
				this.connectedUsers.set(newestMember.userId, userData);
			}
			
			// Clear any waitroom status first
			memberSocket.emit('waitroom_cleared');
			
			// Send group join event (different from new group creation)
			memberSocket.emit("joined_existing_group", {
				groupId: group.groupId,
				members: group.members
			});
			
			console.log(`✅ User ${newestMember.userId} joined existing group ${group.groupId}`);
		} else {
			console.warn(`⚠️ Socket not found for user ${newestMember.userId}`);
		}

		// Notify existing members about the new member
		this.broadcastToGroup(group.groupId, "user_joined_group", {
			user: {
				userId: newestMember.userId,
				username: newestMember.userId, // Will be updated with actual username
				isOnline: true
			},
			groupId: group.groupId,
			members: group.members
		});

		// Send welcome message for the new member
		setTimeout(() => {
			this.sendWelcomeMessage(group.groupId, [newestMember.userId]);
		}, 100);

		// Trigger synchronized key exchange for ALL members (not just the new member)
		// This ensures all members participate in the key exchange together
		console.log(`🔄 Triggering synchronized key exchange for all ${group.members.length} members`);
		
		// Add a small delay to ensure all clients have processed the join event
		setTimeout(() => {
			group.members.forEach(member => {
				const memberSocket = this.findSocketByUserId(member.userId);
				if (memberSocket) {
					memberSocket.emit("request_key_exchange", {
						type: "NEW_MEMBER",
						groupId: group.groupId,
						allMembers: group.members // Send all members for consistent state
					});
				}
			});
		}, 200); // 200ms delay to ensure frontend is ready
	}

	private async sendWelcomeMessage(groupId: string, memberIds: string[]): Promise<void> {
		console.log(`📢 Sending welcome message to group ${groupId} with ${memberIds.length} members`);
		
		const welcomeContent = `Bienvenue ! Groupe créé avec ${memberIds.length} membres. Vous pouvez maintenant discuter de manière sécurisée.`;
		
		// Use the first member's ID as the sender for the system message
		const systemSenderId = memberIds[0];
		console.log(`🤖 System sender ID: ${systemSenderId}`);
		
		const systemMessage: EncryptedMessage = {
			content: welcomeContent,
			keyVersion: 0, // System messages use keyVersion 0
			timestamp: new Date(),
			senderId: systemSenderId // Use first member as sender instead of 'system'
		};

		// Store the message in database and get timestamp
		const { id: messageId } = await this.groupService.storeMessage(
			groupId, 
			systemSenderId, // Pass the real user ID
			systemMessage
		);

		// Broadcast to all group members using correct room format
		const room = `group:${groupId}`;
		this.io.to(room).emit('group_message', {
			messageId,
			encryptedMessage: systemMessage,
			groupId,
			senderUsername: 'Système' // Display name remains "Système"
		});

		console.log(`📡 Broadcasting group_message to group ${groupId}:`, {
			messageId,
			encryptedMessage: systemMessage,
			groupId,
			senderUsername: 'Système'
		});

		const connectedSockets = await this.io.in(room).fetchSockets();
		console.log(`📊 Group ${groupId} has ${connectedSockets.length} connected sockets`);
		
		console.log(`📢 Welcome message sent to group ${groupId}`);
	}

	private triggerKeyExchangeForGroup(
		groupId: string,
		exchangeType: "NEW_MEMBER" | "MEMBER_LEFT"
	): void 
	{
		const group = this.groupService.getGroupSession(groupId);

		if (!group) 
		{
			return;
		}

		group.members.forEach(member => {
			const memberSocket = this.findSocketByUserId(member.userId);

			if (memberSocket) 
			{
				memberSocket.emit("request_key_exchange", {
					type: exchangeType,
					groupId
				});
			}
		});
	}

	private findSocketByUserId(userId: string): Socket | null 
	{
		const socketId = this.connectedUsers.get(userId)?.socketId;

		if (!socketId) 
		{
			return null;
		}

		return this.io.sockets.sockets.get(socketId) || null;
	}

	private broadcastWaitroomStatus(waitingCount: number): void {
		// Get all waiting users and update their status
		const waitingUsers = this.groupService.getWaitingUsers();
		
		waitingUsers.forEach((waitingUser: WaitingUser) => {
			const socket = this.io.sockets.sockets.get(waitingUser.socketId);
			if (socket) {
				socket.emit('joined_waitroom', {
					message: 'En attente d\'autres utilisateurs...',
					waitingCount: waitingCount
				});
			}
		});

		console.log(`📢 Broadcasted waitroom status to ${waitingUsers.length} users: ${waitingCount} waiting`);
	}
}