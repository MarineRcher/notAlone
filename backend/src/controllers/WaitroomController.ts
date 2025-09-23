import { Socket, Server } from "socket.io";
import config from "../config/environment";

interface WaitingUser {
  userId: string;
  username: string;
  socketId: string;
}

interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    username: string;
    login?: string;
  };
}

export class WaitroomController {
  private waitingUsers: Map<string, WaitingUser> = new Map();
  private userToSocket: Map<string, string> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  setupSocketHandlers(socket: AuthenticatedSocket): void {
    console.log(`🔧 [WAITROOM] Setting up handlers for user: ${socket.user?.username}`);

    socket.on("join_waitroom", () => {
      this.handleJoinWaitroom(socket);
    });

    socket.on("leave_waitroom", () => {
      this.handleLeaveWaitroom(socket);
    });

    socket.on("disconnect", () => {
      this.handleDisconnect(socket);
    });
  }

  private handleJoinWaitroom(socket: AuthenticatedSocket): void {
    if (!socket.user) {
      socket.emit("waitroom_error", { 
        message: "User not authenticated" 
      });
      return;
    }

    const { userId, username, login } = socket.user;
    const displayName = username || login || userId;

    console.log(`📋 [WAITROOM] ${displayName} joining waitroom`);

    // Check if user is already in waitroom
    if (this.waitingUsers.has(userId)) {
      console.log(`⚠️ [WAITROOM] ${username} already in waitroom`);
      
      // Update socket ID in case of reconnection
      const existingUser = this.waitingUsers.get(userId)!;
      existingUser.socketId = socket.id;
      this.userToSocket.set(userId, socket.id);
      
      // Send current waitroom state
      this.sendWaitroomState(socket);
      return;
    }

    // Add user to waitroom
    const waitingUser: WaitingUser = {
      userId,
      username: displayName,
      socketId: socket.id,
    };

    this.waitingUsers.set(userId, waitingUser);
    this.userToSocket.set(userId, socket.id);

    console.log(`✅ [WAITROOM] ${displayName} added to waitroom. Total waiting: ${this.waitingUsers.size}`);

    // Send initial state to the joining user
    this.sendWaitroomState(socket);

    // Notify all users about the updated waitroom
    this.broadcastWaitroomUpdate();

    // Check if we have enough users to create a group
    if (this.waitingUsers.size >= config.e2ee.minMembers) {
      this.createGroupFromWaitroom();
    }
  }

  private handleLeaveWaitroom(socket: AuthenticatedSocket): void {
    if (!socket.user) return;

    const { userId, username, login } = socket.user;
    const displayName = username || login || userId;

    console.log(`🚪 [WAITROOM] ${displayName} leaving waitroom`);

    this.waitingUsers.delete(userId);
    this.userToSocket.delete(userId);

    console.log(`✅ [WAITROOM] ${displayName} removed from waitroom. Total waiting: ${this.waitingUsers.size}`);

    // Notify remaining users about the updated waitroom
    this.broadcastWaitroomUpdate();
  }

  private handleDisconnect(socket: AuthenticatedSocket): void {
    if (!socket.user) return;

    const { userId, username, login } = socket.user;
    const displayName = username || login || userId;

    console.log(`🔌 [WAITROOM] ${displayName} disconnected from waitroom`);

    this.waitingUsers.delete(userId);
    this.userToSocket.delete(userId);

    console.log(`✅ [WAITROOM] ${displayName} removed from waitroom due to disconnect. Total waiting: ${this.waitingUsers.size}`);

    // Notify remaining users about the updated waitroom
    this.broadcastWaitroomUpdate();
  }

  private sendWaitroomState(socket: AuthenticatedSocket): void {
    const waitingUsers = Array.from(this.waitingUsers.values()).map(user => ({
      userId: user.userId,
      username: user.username,
    }));

    socket.emit("waitroom_joined", {
      waitingUsers,
      minMembers: config.e2ee.minMembers,
      currentCount: this.waitingUsers.size,
    });
  }

  private broadcastWaitroomUpdate(): void {
    const waitingUsers = Array.from(this.waitingUsers.values()).map(user => ({
      userId: user.userId,
      username: user.username,
    }));

    const updateData = {
      waitingUsers,
      minMembers: config.e2ee.minMembers,
      currentCount: this.waitingUsers.size,
    };

    // Send update to all waiting users
    this.waitingUsers.forEach((user) => {
      const socket = this.io.sockets.sockets.get(user.socketId);
      if (socket) {
        socket.emit("waitroom_updated", updateData);
      }
    });

    console.log(`📢 [WAITROOM] Broadcasted update to ${this.waitingUsers.size} waiting users`);
  }

  private async createGroupFromWaitroom(): Promise<void> {
    console.log(`🎉 [WAITROOM] Creating group! ${this.waitingUsers.size} users ready`);

    try {
      // Generate a unique group ID and name
      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const groupName = `Cercle de parole ${new Date().toLocaleTimeString()}`;

      console.log(`🎯 [WAITROOM] Created group: ${groupId} (${groupName})`);

      // Get all waiting users
      const groupMembers = Array.from(this.waitingUsers.values());

      // Notify all users that the group has been created
      groupMembers.forEach((user) => {
        const socket = this.io.sockets.sockets.get(user.socketId);
        if (socket) {
          socket.emit("group_created", {
            groupId,
            groupName,
            members: groupMembers.map(member => ({
              userId: member.userId,
              username: member.username,
            })),
          });
        }
      });

      console.log(`✅ [WAITROOM] Notified ${groupMembers.length} users about group creation`);

      // Clear the waitroom
      this.waitingUsers.clear();
      this.userToSocket.clear();

      console.log(`🧹 [WAITROOM] Waitroom cleared after group creation`);

    } catch (error) {
      console.error("❌ [WAITROOM] Error creating group:", error);

      // Notify users about the error
      this.waitingUsers.forEach((user) => {
        const socket = this.io.sockets.sockets.get(user.socketId);
        if (socket) {
          socket.emit("waitroom_error", {
            message: "Failed to create group. Please try again.",
          });
        }
      });
    }
  }

  // Method to get current waitroom stats (for debugging/monitoring)
  getWaitroomStats() {
    return {
      waitingUsers: this.waitingUsers.size,
      minMembers: config.e2ee.minMembers,
      needMore: Math.max(0, config.e2ee.minMembers - this.waitingUsers.size),
    };
  }
} 