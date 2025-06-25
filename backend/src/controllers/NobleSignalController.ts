// Noble Signal Protocol Group Chat Controller
// Compatible with frontend's pure TypeScript implementation

import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import {
  AuthenticatedUser,
  GroupMessageData,
  SenderKeyDistributionData,
  SenderKeyRequestData,
  JoinGroupData,
  GroupMemberInfo,
  EncryptedMessage
} from "../types/signal";
import GroupService from "../services/GroupService";

interface AuthenticatedSocket extends Socket {
  user?: AuthenticatedUser;
}

export class NobleSignalController {
  private io: Server;
  private groups: Map<string, Set<string>> = new Map(); // groupId -> Set of socketIds
  private socketToUser: Map<string, AuthenticatedUser> = new Map(); // socketId -> user
  private userToSocket: Map<string, string> = new Map(); // userId -> socketId
  private groupService: GroupService;

  constructor(io: Server) {
    this.io = io;
    this.groupService = new GroupService();
  }

  public handleConnection(socket: AuthenticatedSocket): void {
    console.log('🔌 [NOBLE-SIGNAL] New socket connection:', socket.id);
    
    this.authenticateSocket(socket, (authenticated) => {
      if (!authenticated) {
        console.log('❌ [NOBLE-SIGNAL] Authentication failed, disconnecting socket');
        socket.disconnect();
        return;
      }

      console.log('✅ [NOBLE-SIGNAL] Socket authenticated:', socket.user?.username);
      this.setupSocketHandlers(socket);
    });
  }

  private authenticateSocket(
    socket: AuthenticatedSocket,
    callback: (authenticated: boolean) => void
  ): void {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        console.log("❌ [NOBLE-SIGNAL] No token provided");
        callback(false);
        return;
      }

      // Handle mock tokens for testing
      if (token.startsWith("mock_jwt_token_")) {
        this.handleMockAuthentication(socket, token, callback);
        return;
      }

      // Handle real JWT tokens
      this.handleJWTAuthentication(socket, token, callback);
    } catch (error) {
      console.error("❌ [NOBLE-SIGNAL] Authentication error:", error);
      callback(false);
    }
  }

  private handleMockAuthentication(
    socket: AuthenticatedSocket,
    token: string,
    callback: (authenticated: boolean) => void
  ): void {
    const loginName = token.replace("mock_jwt_token_", "");
    const testUsers: Record<string, { id: number; login: string }> = {
      alice: { id: 1001, login: "alice" },
      bob: { id: 1002, login: "bob" },
      charlie: { id: 1003, login: "charlie" },
      diana: { id: 1004, login: "diana" },
      eve: { id: 1005, login: "eve" }
    };

    const testUser = testUsers[loginName];

    if (testUser) {
      const user: AuthenticatedUser = {
        userId: testUser.id.toString(),
        socketId: socket.id,
        username: testUser.login
      };
      
      socket.user = user;
      this.socketToUser.set(socket.id, user);
      this.userToSocket.set(user.userId, socket.id);
      
      console.log(`🧪 [NOBLE-SIGNAL] Test user authenticated: ${testUser.login} (ID: ${testUser.id})`);
      callback(true);
    } else {
      console.log(`❌ [NOBLE-SIGNAL] Unknown test user: ${loginName}`);
      callback(false);
    }
  }

  private handleJWTAuthentication(
    socket: AuthenticatedSocket,
    token: string,
    callback: (authenticated: boolean) => void
  ): void {
    try {
      const secret = process.env.JWT_SECRET || "your-secret-key";
      const decoded = jwt.verify(token, secret) as any;

      const userId = decoded.id || decoded.userId;

      if (decoded && userId) {
        const user: AuthenticatedUser = {
          userId: userId.toString(),
          socketId: socket.id,
          username: decoded.login || 'unknown'
        };
        
        socket.user = user;
        this.socketToUser.set(socket.id, user);
        this.userToSocket.set(user.userId, socket.id);
        
        console.log(`✅ [NOBLE-SIGNAL] Real user authenticated: ${userId} (${decoded.login || 'unknown'})`);
        callback(true);
      } else {
        console.log("❌ [NOBLE-SIGNAL] Invalid token payload - missing user ID");
        callback(false);
      }
    } catch (jwtError) {
      console.error("❌ [NOBLE-SIGNAL] JWT verification failed:", jwtError instanceof Error ? jwtError.message : String(jwtError));
      callback(false);
    }
  }

  private setupSocketHandlers(socket: AuthenticatedSocket): void {
    console.log(`🔧 [NOBLE-SIGNAL] Setting up handlers for user: ${socket.user?.username}`);

    // Group management events
    socket.on('join_group', (data: JoinGroupData) => {
      this.handleJoinGroup(socket, data);
    });

    socket.on('leave_group', (data: JoinGroupData) => {
      this.handleLeaveGroup(socket, data);
    });

    // Message events
    socket.on('group_message', (data: GroupMessageData) => {
      this.handleGroupMessage(socket, data);
    });

    // Signal protocol events
    socket.on('sender_key_distribution', (data: SenderKeyDistributionData) => {
      this.handleSenderKeyDistribution(socket, data);
    });

    socket.on('request_sender_key', (data: SenderKeyRequestData) => {
      this.handleSenderKeyRequest(socket, data);
    });

    // Connection management
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    console.log(`✅ [NOBLE-SIGNAL] Event handlers set up for ${socket.user?.username}`);
  }

  private async handleJoinGroup(socket: AuthenticatedSocket, data: JoinGroupData): Promise<void> {
    if (!socket.user) return;

    console.log(`👥 [NOBLE-SIGNAL] ${socket.user.username} joining group: ${data.groupId}`);

    try {
      // Check if this is a non-UUID group ID and ensure it exists in database
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.groupId);
      
      if (!isUuid) {
        console.log(`🔧 [NOBLE-SIGNAL] Non-UUID group ID detected: ${data.groupId}, ensuring group exists...`);
        
        try {
          const result = await this.groupService.findOrCreateGroupByName(data.groupId);
          if (result.isNew) {
            console.log(`✅ [NOBLE-SIGNAL] Created new group in database: ${result.groupId}`);
          } else {
            console.log(`✅ [NOBLE-SIGNAL] Found existing group in database: ${result.groupId}`);
          }
        } catch (dbError) {
          console.error(`❌ [NOBLE-SIGNAL] Failed to find/create group: ${dbError}`);
          console.log(`⚠️ [NOBLE-SIGNAL] Continuing with in-memory only mode`);
        }
      }

      // Add user to in-memory group
      if (!this.groups.has(data.groupId)) {
        this.groups.set(data.groupId, new Set());
      }
      
      this.groups.get(data.groupId)!.add(socket.id);
      
      // Join Socket.IO room
      socket.join(data.groupId);
      
      // Get current group members
      const groupSockets = this.groups.get(data.groupId)!;
      const members: GroupMemberInfo[] = Array.from(groupSockets)
        .map(socketId => this.socketToUser.get(socketId))
        .filter(user => user !== undefined)
        .map(user => ({
          userId: user!.userId,
          username: user!.username,
          isOnline: true
        }));

      // Notify user about current members
      socket.emit('group_members', { members });

      // Notify other members about new join
      socket.to(data.groupId).emit('member_joined', {
        userId: socket.user.userId,
        username: socket.user.username
      });

      console.log(`✅ [NOBLE-SIGNAL] ${socket.user.username} joined group ${data.groupId}, now has ${members.length} members`);
      
    } catch (error) {
      console.error(`❌ [NOBLE-SIGNAL] Error joining group:`, error);
      socket.emit('join_group_error', { 
        groupId: data.groupId, 
        error: 'Failed to join group' 
      });
    }
  }

  private async handleLeaveGroup(socket: AuthenticatedSocket, data: JoinGroupData): Promise<void> {
    if (!socket.user) return;

    console.log(`👥 [NOBLE-SIGNAL] ${socket.user.username} leaving group: ${data.groupId}`);

    try {
      // Remove from in-memory group
      const groupSockets = this.groups.get(data.groupId);
      if (groupSockets) {
        groupSockets.delete(socket.id);
        
        // Clean up empty groups
        if (groupSockets.size === 0) {
          this.groups.delete(data.groupId);
        }
      }
      
      // Leave Socket.IO room
      socket.leave(data.groupId);
      
      // Notify other members
      socket.to(data.groupId).emit('member_left', {
        userId: socket.user.userId,
        username: socket.user.username
      });

      console.log(`✅ [NOBLE-SIGNAL] ${socket.user.username} left group ${data.groupId}`);
      
    } catch (error) {
      console.error(`❌ [NOBLE-SIGNAL] Error leaving group:`, error);
    }
  }

  private async handleGroupMessage(socket: AuthenticatedSocket, data: GroupMessageData): Promise<void> {
    if (!socket.user) {
      console.log(`❌ [NOBLE-SIGNAL] Group message failed - No authenticated user`);
      return;
    }

    const groupSockets = this.groups.get(data.groupId);
    if (!groupSockets || !groupSockets.has(socket.id)) {
      console.log(`❌ [NOBLE-SIGNAL] Group message failed - User not in group ${data.groupId}`);
      socket.emit('group_message_error', { 
        error: 'You are not a member of this group' 
      });
      return;
    }

    console.log(`📨 [NOBLE-SIGNAL] === GROUP MESSAGE RELAY ===`);
    console.log(`   From: ${socket.user.username} (${socket.user.userId})`);
    console.log(`   Group: ${data.groupId}`);
    console.log(`   Message ID: ${data.encryptedMessage.messageId}`);
    console.log(`   Timestamp: ${new Date(data.encryptedMessage.timestamp).toISOString()}`);
    console.log(`   Key Index: ${data.encryptedMessage.keyIndex}`);

    try {
      // Get or create group in database if needed
      let dbGroupId = data.groupId;
      
      // Check if this is a non-UUID group ID (like 'default-group')
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.groupId);
      
      if (!isUuid) {
        console.log(`🔧 [NOBLE-SIGNAL] Non-UUID group ID detected: ${data.groupId}, ensuring group exists...`);
        
        // Try to find or create the group
        try {
          const result = await this.groupService.findOrCreateGroupByName(data.groupId);
          dbGroupId = result.groupId;
          console.log(`✅ [NOBLE-SIGNAL] Using database group ID: ${dbGroupId}`);
        } catch (dbError) {
          console.error(`❌ [NOBLE-SIGNAL] Failed to find/create group: ${dbError}`);
          // Fall back to in-memory only mode
          console.log(`⚠️ [NOBLE-SIGNAL] Continuing with in-memory only mode`);
        }
      }

      // Store encrypted message in database (only if we have a valid UUID)
      if (dbGroupId !== data.groupId) {
        try {
          await this.groupService.storeMessage(
            dbGroupId,
            parseInt(socket.user.userId),
            JSON.stringify(data.encryptedMessage),
            'text'
          );
          console.log(`💾 [NOBLE-SIGNAL] Message stored in database`);
        } catch (dbError) {
          console.error(`❌ [NOBLE-SIGNAL] Database storage failed: ${dbError}`);
          console.log(`⚠️ [NOBLE-SIGNAL] Continuing with message relay only`);
        }
      } else {
        console.log(`⚠️ [NOBLE-SIGNAL] Skipping database storage for non-UUID group`);
      }

      // Prepare message for relay
      const messagePayload = {
        encryptedMessage: data.encryptedMessage,
        senderId: socket.user.userId,
        senderName: socket.user.username,
        groupId: data.groupId, // Use original group ID for relay
      };

      // Relay to all group members except sender
      let relayedCount = 0;
      groupSockets.forEach(socketId => {
        if (socketId !== socket.id) {
          const targetSocket = this.io.sockets.sockets.get(socketId);
          if (targetSocket) {
            targetSocket.emit('group_message', messagePayload);
            relayedCount++;
            console.log(`   ✅ Relayed to socket ${socketId}`);
          }
        }
      });

      console.log(`📤 [NOBLE-SIGNAL] Message relayed to ${relayedCount}/${groupSockets.size - 1} other members`);
      console.log(`=== END MESSAGE RELAY ===`);
      
    } catch (error) {
      console.error(`❌ [NOBLE-SIGNAL] Error handling group message:`, error);
      socket.emit('group_message_error', { 
        error: 'Failed to process message' 
      });
    }
  }

  private async handleSenderKeyDistribution(socket: AuthenticatedSocket, data: SenderKeyDistributionData): Promise<void> {
    if (!socket.user) return;

    console.log(`🔑 [NOBLE-SIGNAL] ${socket.user.username} distributing sender key to ${data.targetUserId}`);

    const targetSocketId = this.userToSocket.get(data.targetUserId);
    if (targetSocketId) {
      const targetSocket = this.io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit('sender_key_distribution', {
          groupId: data.groupId,
          fromUserId: socket.user.userId,
          distributionMessage: data.distributionMessage,
        });
        console.log(`✅ [NOBLE-SIGNAL] Sender key distributed to ${data.targetUserId}`);
      } else {
        console.log(`❌ [NOBLE-SIGNAL] Target socket not found for user ${data.targetUserId}`);
      }
    } else {
      console.log(`❌ [NOBLE-SIGNAL] Target user ${data.targetUserId} not online`);
      socket.emit('sender_key_distribution_error', {
        targetUserId: data.targetUserId,
        error: 'User not online'
      });
    }
  }

  private async handleSenderKeyRequest(socket: AuthenticatedSocket, data: SenderKeyRequestData): Promise<void> {
    if (!socket.user) return;

    console.log(`🔑 [NOBLE-SIGNAL] ${socket.user.username} requesting sender key from ${data.fromUserId}`);

    const targetSocketId = this.userToSocket.get(data.fromUserId);
    if (targetSocketId) {
      const targetSocket = this.io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit('request_sender_key', {
          groupId: data.groupId,
          fromUserId: socket.user.userId,
        });
        console.log(`✅ [NOBLE-SIGNAL] Sender key request sent to ${data.fromUserId}`);
      } else {
        console.log(`❌ [NOBLE-SIGNAL] Target socket not found for user ${data.fromUserId}`);
      }
    } else {
      console.log(`❌ [NOBLE-SIGNAL] Target user ${data.fromUserId} not online`);
    }
  }

  private handleDisconnect(socket: AuthenticatedSocket): void {
    if (!socket.user) return;

    console.log(`🔌 [NOBLE-SIGNAL] ${socket.user.username} disconnected`);

    // Remove from all groups
    this.groups.forEach((groupSockets, groupId) => {
      if (groupSockets.has(socket.id)) {
        groupSockets.delete(socket.id);
        
        // Notify other group members
        socket.to(groupId).emit('member_left', {
          userId: socket.user!.userId,
          username: socket.user!.username
        });
        
        // Clean up empty groups
        if (groupSockets.size === 0) {
          this.groups.delete(groupId);
          console.log(`🧹 [NOBLE-SIGNAL] Cleaned up empty group: ${groupId}`);
        }
      }
    });

    // Remove from mappings
    this.socketToUser.delete(socket.id);
    this.userToSocket.delete(socket.user.userId);

    console.log(`✅ [NOBLE-SIGNAL] Cleanup completed for ${socket.user.username}`);
  }

  // Utility methods
  public getGroupStats(): { totalGroups: number; totalConnections: number } {
    const totalConnections = Array.from(this.groups.values())
      .reduce((sum, sockets) => sum + sockets.size, 0);
    
    return {
      totalGroups: this.groups.size,
      totalConnections
    };
  }

  public getActiveGroups(): string[] {
    return Array.from(this.groups.keys());
  }

  public cleanup(): void {
    console.log('🧹 [NOBLE-SIGNAL] Cleaning up controller...');
    this.groups.clear();
    this.socketToUser.clear();
    this.userToSocket.clear();
  }
} 