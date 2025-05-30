import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import GroupService, { JoinGroupResult } from '../services/GroupService';
import RedisService from '../services/RedisService';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userLogin?: string;
}

interface JoinGroupData {
  publicKey?: string; // User's public key for e2ee
}

interface SendMessageData {
  groupId: string;
  encryptedMessage: string; // Serialized encrypted message from frontend
  messageType?: 'text' | 'system' | 'key_exchange';
}

interface LeaveGroupData {
  groupId: string;
}

class GroupController {
  private io: Server;
  private groupService: GroupService;
  private redisService: RedisService;

  constructor(io: Server) {
    this.io = io;
    this.groupService = new GroupService();
    this.redisService = new RedisService();
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket: AuthenticatedSocket) {
    console.log(`New client connected: ${socket.id}`);

    // Authenticate the socket
    this.authenticateSocket(socket, (authenticated) => {
      if (!authenticated) {
        socket.disconnect();
        return;
      }

      // Store user-socket mapping in Redis
      this.redisService.storeUserSocket(socket.userId!, socket.id);

      // Set up event handlers
      this.setupEventHandlers(socket);
    });
  }

  /**
   * Authenticate socket using JWT token
   */
  private authenticateSocket(socket: AuthenticatedSocket, callback: (authenticated: boolean) => void) {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.log('No token provided');
        callback(false);
        return;
      }

      // Verify JWT token
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, secret) as any;
      
      if (decoded && decoded.userId) {
        socket.userId = decoded.userId;
        socket.userLogin = decoded.login || `User${decoded.userId}`;
        console.log(`Authenticated user: ${socket.userLogin} (${socket.userId})`);
        callback(true);
      } else {
        console.log('Invalid token payload');
        callback(false);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      callback(false);
    }
  }

  /**
   * Set up socket event handlers
   */
  private setupEventHandlers(socket: AuthenticatedSocket) {
    // Join random group
    socket.on('join_random_group', async (data: JoinGroupData, callback) => {
      try {
        const result = await this.handleJoinRandomGroup(socket, data);
        
        if (result.success && result.group) {
          // Join socket room for the group
          socket.join(`group:${result.group.id}`);
          
          // Store group member socket mapping
          await this.redisService.storeGroupMemberSocket(
            result.group.id, 
            socket.userId!, 
            socket.id
          );
          
          // Notify other group members
          socket.to(`group:${result.group.id}`).emit('user_joined', {
            userId: socket.userId,
            login: socket.userLogin,
            publicKey: data.publicKey,
            timestamp: new Date()
          });
          
          // Send group info to the user
          callback?.({
            success: true,
            group: result.group,
            message: result.message
          });
        } else {
          callback?.({
            success: false,
            message: result.message || 'Failed to join group'
          });
        }
      } catch (error) {
        console.error('Error in join_random_group:', error);
        callback?.({
          success: false,
          message: 'Internal server error'
        });
      }
    });

    // Send message to group
    socket.on('send_group_message', async (data: SendMessageData, callback) => {
      try {
        const result = await this.handleSendMessage(socket, data);
        callback?.(result);
      } catch (error) {
        console.error('Error in send_group_message:', error);
        callback?.({
          success: false,
          message: 'Failed to send message'
        });
      }
    });

    // Leave group
    socket.on('leave_group', async (data: LeaveGroupData, callback) => {
      try {
        const result = await this.handleLeaveGroup(socket, data);
        callback?.(result);
      } catch (error) {
        console.error('Error in leave_group:', error);
        callback?.({
          success: false,
          message: 'Failed to leave group'
        });
      }
    });

    // Get group messages
    socket.on('get_group_messages', async (data: { groupId: string; limit?: number }, callback) => {
      try {
        const messages = await this.groupService.getGroupMessages(data.groupId, data.limit);
        callback?.({
          success: true,
          messages: messages.map(msg => ({
            id: msg.id,
            senderId: msg.senderId,
            senderLogin: (msg as any).sender?.login,
            encryptedContent: msg.encryptedContent,
            messageType: msg.messageType,
            timestamp: msg.timestamp
          }))
        });
      } catch (error) {
        console.error('Error getting group messages:', error);
        callback?.({
          success: false,
          message: 'Failed to get messages'
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { groupId: string }) => {
      socket.to(`group:${data.groupId}`).emit('user_typing', {
        userId: socket.userId,
        login: socket.userLogin,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data: { groupId: string }) => {
      socket.to(`group:${data.groupId}`).emit('user_typing', {
        userId: socket.userId,
        login: socket.userLogin,
        isTyping: false
      });
    });
  }

  /**
   * Handle joining a random group
   */
  private async handleJoinRandomGroup(
    socket: AuthenticatedSocket, 
    data: JoinGroupData
  ): Promise<JoinGroupResult> {
    return await this.groupService.joinRandomGroup(socket.userId!, data.publicKey);
  }

  /**
   * Handle sending a message to a group
   */
  private async handleSendMessage(socket: AuthenticatedSocket, data: SendMessageData) {
    try {
      // Store the encrypted message in database
      const message = await this.groupService.storeMessage(
        data.groupId,
        socket.userId!,
        data.encryptedMessage,
        data.messageType
      );

      // Broadcast the encrypted message to all group members
      this.io.to(`group:${data.groupId}`).emit('new_message', {
        id: message.id,
        groupId: data.groupId,
        senderId: socket.userId,
        senderLogin: socket.userLogin,
        encryptedContent: data.encryptedMessage,
        messageType: data.messageType || 'text',
        timestamp: message.timestamp
      });

      return {
        success: true,
        messageId: message.id,
        timestamp: message.timestamp
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        message: 'Failed to send message'
      };
    }
  }

  /**
   * Handle leaving a group
   */
  private async handleLeaveGroup(socket: AuthenticatedSocket, data: LeaveGroupData) {
    try {
      const success = await this.groupService.leaveGroup(socket.userId!, data.groupId);
      
      if (success) {
        // Leave socket room
        socket.leave(`group:${data.groupId}`);
        
        // Remove from Redis mapping
        await this.redisService.removeGroupMemberSocket(data.groupId, socket.userId!);
        
        // Notify other group members
        socket.to(`group:${data.groupId}`).emit('user_left', {
          userId: socket.userId,
          login: socket.userLogin,
          timestamp: new Date()
        });
        
        return {
          success: true,
          message: 'Successfully left group'
        };
      } else {
        return {
          success: false,
          message: 'Failed to leave group'
        };
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }

  /**
   * Handle socket disconnection
   */
  private async handleDisconnect(socket: AuthenticatedSocket) {
    console.log(`Client disconnected: ${socket.id}`);
    
    if (socket.userId) {
      // Remove user socket mapping
      await this.redisService.removeUserSocket(socket.userId);
      
      // Notify groups that user is offline
      // You might want to implement presence tracking here
    }
  }

  /**
   * Get group statistics (for admin/monitoring)
   */
  async getGroupStats() {
    return await this.groupService.getGroupStats();
  }

  /**
   * Cleanup inactive groups (can be called periodically)
   */
  async cleanupInactiveGroups() {
    await this.groupService.cleanupInactiveGroups();
  }

  /**
   * Broadcast system message to a group
   */
  async broadcastSystemMessage(groupId: string, message: string) {
    this.io.to(`group:${groupId}`).emit('system_message', {
      message,
      timestamp: new Date()
    });
  }

  /**
   * Get active groups (for admin purposes)
   */
  async getActiveGroups(page: number = 1, limit: number = 20) {
    return await this.groupService.getActiveGroups(page, limit);
  }
}

export default GroupController; 