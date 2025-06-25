// Signal Protocol Group Chat Controller

import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    socketId: string;
    username: string;
  };
}

interface GroupMessage {
  groupId: string;
  senderId: string;
  messageId: string;
  timestamp: number;
  encryptedPayload: string; // Base64 encoded
  signature: string; // Base64 encoded
  keyVersion: number;
}

interface SenderKeyBundle {
  userId: string;
  signingKey: string; // Base64 encoded
  chainKey: string; // Base64 encoded
  counter: number;
}

export class SignalGroupController {
  private io: Server;
  private groups: Map<string, Set<string>> = new Map(); // groupId -> Set of socketIds
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId

  constructor(io: Server) {
    this.io = io;
  }

  public handleConnection(socket: AuthenticatedSocket): void {
    this.authenticateSocket(socket, (authenticated) => {
      if (!authenticated) {
        socket.disconnect();
        return;
      }

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
        console.log("❌ No token provided");
        callback(false);
        return;
      }

      if (token.startsWith("mock_jwt_token_")) {
        this.handleMockAuthentication(socket, token, callback);
        return;
      }

      this.handleJWTAuthentication(socket, token, callback);
    } catch (error) {
      console.error("❌ Authentication error:", error);
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
      socket.user = {
        userId: testUser.id.toString(),
        socketId: socket.id,
        username: testUser.login
      };
      this.socketToUser.set(socket.id, testUser.id.toString());
      console.log(`🧪 Test user authenticated: ${testUser.login}`);
      callback(true);
    } else {
      console.log(`❌ Unknown test user: ${loginName}`);
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
        socket.user = {
          userId: userId.toString(),
          socketId: socket.id,
          username: decoded.login || 'unknown'
        };
        this.socketToUser.set(socket.id, userId.toString());
        console.log(`✅ Real user authenticated: ${userId} (${decoded.login || 'unknown'})`);
        callback(true);
      } else {
        console.log("❌ Invalid token payload - missing user ID");
        callback(false);
      }
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError instanceof Error ? jwtError.message : String(jwtError));
      callback(false);
    }
  }

  private setupSocketHandlers(socket: AuthenticatedSocket): void {
    console.log(`✅ Setting up handlers for user: ${socket.user?.username}`);

    // Join group
    socket.on('join_group', (data: { groupId: string }) => {
      this.handleJoinGroup(socket, data.groupId);
    });

    // Leave group
    socket.on('leave_group', (data: { groupId: string }) => {
      this.handleLeaveGroup(socket, data.groupId);
    });

    // Group message
    socket.on('group_message', (data: { 
      groupId: string; 
      encryptedMessage: GroupMessage; 
    }) => {
      console.log(`🔄 Received group_message event from ${socket.user?.username}`);
      this.handleGroupMessage(socket, data);
    });

    // Share sender key bundle
    socket.on('share_sender_key', (data: { 
      groupId: string; 
      targetUserId: string; 
      bundle: SenderKeyBundle; 
    }) => {
      this.handleShareSenderKey(socket, data);
    });

    // Request sender keys for group
    socket.on('request_sender_keys', (data: { groupId: string }) => {
      this.handleRequestSenderKeys(socket, data.groupId);
    });

    // Request specific sender key
    socket.on('request_sender_key', (data: { groupId: string; fromUserId: string }) => {
      this.handleRequestSpecificSenderKey(socket, data);
    });

    // Device info exchange for initial key setup
    socket.on('device_info_exchange', (data: { 
      targetUserId: string; 
      deviceInfo: any; 
    }) => {
      this.handleDeviceInfoExchange(socket, data);
    });

    // Initial message for new sessions
    socket.on('initial_message', (data: {
      targetUserId: string;
      initialMessage: any;
      remoteIdentityKey: string;
    }) => {
      this.handleInitialMessage(socket, data);
    });

    // Key rotation notification
    socket.on('key_rotation', (data: {
      groupId: string;
      newBundle: SenderKeyBundle;
    }) => {
      this.handleKeyRotation(socket, data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private handleJoinGroup(socket: AuthenticatedSocket, groupId: string): void {
    if (!socket.user) return;

    console.log(`👤 ${socket.user.username} joining group ${groupId}`);

    // Add to group
    if (!this.groups.has(groupId)) {
      this.groups.set(groupId, new Set());
    }
    this.groups.get(groupId)!.add(socket.id);

    // Join socket room
    socket.join(groupId);

    // Get current members
    const groupMembers = this.getGroupMembers(groupId);

    // Notify others about new member
    socket.to(groupId).emit('member_joined', {
      userId: socket.user.userId,
      username: socket.user.username,
    });

    // Send current members to new user
    socket.emit('group_members', {
      members: groupMembers.filter(m => m.userId !== socket.user!.userId),
    });

    console.log(`✅ ${socket.user.username} joined group ${groupId}`);
  }

  private handleLeaveGroup(socket: AuthenticatedSocket, groupId: string): void {
    if (!socket.user) return;

    console.log(`👤 ${socket.user.username} leaving group ${groupId}`);

    // Remove from group
    const group = this.groups.get(groupId);
    if (group) {
      group.delete(socket.id);
      if (group.size === 0) {
        this.groups.delete(groupId);
      }
    }

    // Leave socket room
    socket.leave(groupId);

    // Notify others
    socket.to(groupId).emit('member_left', {
      userId: socket.user.userId,
      username: socket.user.username,
    });

    console.log(`✅ ${socket.user.username} left group ${groupId}`);
  }

  private handleGroupMessage(socket: AuthenticatedSocket, data: {
    groupId: string;
    encryptedMessage: GroupMessage;
  }): void {
    if (!socket.user) {
      console.log(`❌ Group message failed - No authenticated user`);
      return;
    }

    const groupMembers = this.groups.get(data.groupId);
    if (!groupMembers) {
      console.log(`❌ Group message failed - Group ${data.groupId} not found`);
      return;
    }

    console.log(`📨 === GROUP MESSAGE TRANSIT ===`);
    console.log(`   From: ${socket.user.username} (${socket.user.userId})`);
    console.log(`   Group: ${data.groupId}`);
    console.log(`   Message ID: ${data.encryptedMessage.messageId}`);
    console.log(`   Timestamp: ${new Date(data.encryptedMessage.timestamp).toISOString()}`);
    console.log(`   Encrypted payload length: ${data.encryptedMessage.encryptedPayload?.length || 0} chars`);
    console.log(`   Group has ${groupMembers.size} total members`);

    const messagePayload = {
      ...data.encryptedMessage,
      senderId: socket.user.userId,
      senderName: socket.user.username,
      groupId: data.groupId,
    };

    // Broadcast to all group members except sender
    let relayedCount = 0;
    groupMembers.forEach(socketId => {
      if (socketId !== socket.id) {
        const targetSocket = this.io.sockets.sockets.get(socketId);
        if (targetSocket) {
          this.io.to(socketId).emit('group_message', messagePayload);
          relayedCount++;
          console.log(`   ✅ Relayed to socket ${socketId}`);
        } else {
          console.log(`   ❌ Socket ${socketId} not found`);
        }
      }
    });

    console.log(`📤 Message relayed to ${relayedCount}/${groupMembers.size - 1} other members`);
    console.log(`🔍 [DEBUG] Group ${data.groupId} members:`, Array.from(groupMembers));
    console.log(`🔍 [DEBUG] Socket mapping for reference:`, Array.from(this.socketToUser.entries()));
    console.log(`=== END MESSAGE TRANSIT ===`);
  }

  private handleShareSenderKey(socket: AuthenticatedSocket, data: {
    groupId: string;
    targetUserId: string;
    bundle: SenderKeyBundle;
  }): void {
    if (!socket.user) return;

    console.log(`🔑 ${socket.user.username} sharing sender key with ${data.targetUserId}`);

    // Find target user's socket
    const targetSocketId = this.findSocketByUserId(data.targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('sender_key_bundle', {
        groupId: data.groupId,
        fromUserId: socket.user.userId,
        bundle: data.bundle,
      });
      console.log(`✅ Sender key shared with ${data.targetUserId}`);
    } else {
      console.log(`❌ Target user ${data.targetUserId} not found`);
    }
  }

  private handleRequestSenderKeys(socket: AuthenticatedSocket, groupId: string): void {
    if (!socket.user) return;

    console.log(`🔑 ${socket.user.username} requesting sender keys for group ${groupId}`);

    // Request sender keys from all group members
    socket.to(groupId).emit('sender_key_request', {
      groupId,
      fromUserId: socket.user.userId,
    });
  }

  private handleRequestSpecificSenderKey(socket: AuthenticatedSocket, data: {
    groupId: string;
    fromUserId: string;
  }): void {
    if (!socket.user) return;

    console.log(`🔑 ${socket.user.username} requesting sender key from specific user ${data.fromUserId}`);

    // Find the target user's socket and request their sender key
    const targetSocketId = this.findSocketByUserId(data.fromUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('request_sender_key', {
        groupId: data.groupId,
        fromUserId: socket.user.userId,
      });
      console.log(`✅ Sender key request sent to ${data.fromUserId}`);
    } else {
      console.log(`❌ Target user ${data.fromUserId} not found for sender key request`);
    }
  }

  private handleDeviceInfoExchange(socket: AuthenticatedSocket, data: {
    targetUserId: string;
    deviceInfo: any;
  }): void {
    if (!socket.user) return;

    console.log(`🔑 Device info exchange from ${socket.user.username} to ${data.targetUserId}`);

    const targetSocketId = this.findSocketByUserId(data.targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('device_info_received', {
        fromUserId: socket.user.userId,
        deviceInfo: data.deviceInfo,
      });
      console.log(`✅ Device info shared with ${data.targetUserId}`);
    } else {
      console.log(`❌ Target user ${data.targetUserId} not found for device info exchange`);
      socket.emit('device_info_error', {
        targetUserId: data.targetUserId,
        error: 'User not online'
      });
    }
  }

  private handleInitialMessage(socket: AuthenticatedSocket, data: {
    targetUserId: string;
    initialMessage: any;
    remoteIdentityKey: string;
  }): void {
    if (!socket.user) return;

    console.log(`📝 Initial message from ${socket.user.username} to ${data.targetUserId}`);

    const targetSocketId = this.findSocketByUserId(data.targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('initial_message_received', {
        fromUserId: socket.user.userId,
        initialMessage: data.initialMessage,
        remoteIdentityKey: data.remoteIdentityKey,
      });
    } else {
      socket.emit('initial_message_error', {
        targetUserId: data.targetUserId,
        error: 'User not online'
      });
    }
  }

  private handleKeyRotation(socket: AuthenticatedSocket, data: {
    groupId: string;
    newBundle: SenderKeyBundle;
  }): void {
    if (!socket.user) return;

    console.log(`🔄 Key rotation from ${socket.user.username} in group ${data.groupId}`);

    // Notify all group members about key rotation
    socket.to(data.groupId).emit('key_rotation', {
      groupId: data.groupId,
      fromUserId: socket.user.userId,
      newBundle: data.newBundle,
    });
  }

  private handleDisconnect(socket: AuthenticatedSocket): void {
    if (!socket.user) return;

    console.log(`👤 ${socket.user.username} disconnected`);

    // Remove from all groups
    for (const [groupId, members] of this.groups.entries()) {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        
        // Notify group members
        socket.to(groupId).emit('member_left', {
          userId: socket.user.userId,
          username: socket.user.username,
        });

        // Clean up empty groups
        if (members.size === 0) {
          this.groups.delete(groupId);
        }
      }
    }

    // Clean up socket mapping
    this.socketToUser.delete(socket.id);
  }

  private getGroupMembers(groupId: string) {
    const group = this.groups.get(groupId);
    if (!group) return [];

    const members = [];
    for (const socketId of group) {
      const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket;
      if (socket?.user) {
        members.push({
          userId: socket.user.userId,
          username: socket.user.username,
          socketId: socket.id,
        });
      }
    }
    return members;
  }

  private findSocketByUserId(userId: string): string | null {
    console.log(`🔍 [DEBUG] Looking for user ${userId} in socket mapping...`);
    console.log(`🔍 [DEBUG] Current socket mapping:`, Array.from(this.socketToUser.entries()));
    
    for (const [socketId, mappedUserId] of this.socketToUser.entries()) {
      if (mappedUserId === userId) {
        console.log(`🔍 [DEBUG] ✅ Found user ${userId} at socket ${socketId}`);
        return socketId;
      }
    }
    
    console.log(`🔍 [DEBUG] ❌ User ${userId} not found in socket mapping`);
    return null;
  }

  // Cleanup method
  public cleanup(): void {
    this.groups.clear();
    this.socketToUser.clear();
  }
} 