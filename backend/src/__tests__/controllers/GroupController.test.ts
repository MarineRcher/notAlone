import GroupController from '../../controllers/GroupController';
import GroupService from '../../services/GroupService';
import RedisService from '../../services/RedisService';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../services/GroupService');
jest.mock('../../services/RedisService');
jest.mock('jsonwebtoken');

const mockedGroupService = GroupService as jest.MockedClass<typeof GroupService>;
const mockedRedisService = RedisService as jest.MockedClass<typeof RedisService>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// AuthenticatedSocket interface from controller
interface AuthenticatedSocket extends Socket {
  userId?: number;
  userLogin?: string;
}

describe('GroupController', () => {
  let groupController: GroupController;
  let mockSocket: jest.Mocked<AuthenticatedSocket>;
  let mockIo: jest.Mocked<Server>;
  let mockGroupServiceInstance: jest.Mocked<GroupService>;
  let mockRedisServiceInstance: jest.Mocked<RedisService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Server instance
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    } as any;

    // Mock GroupService instance
    mockGroupServiceInstance = new mockedGroupService() as jest.Mocked<GroupService>;
    
    // Mock RedisService instance
    mockRedisServiceInstance = new mockedRedisService() as jest.Mocked<RedisService>;
    
    // Mock Socket
    mockSocket = {
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      handshake: {
        auth: { token: 'valid-token' },
        query: {}
      },
      disconnect: jest.fn(),
      on: jest.fn(),
      userId: undefined,
      userLogin: undefined
    } as any;

    groupController = new GroupController(mockIo);
    (groupController as any).groupService = mockGroupServiceInstance;
    (groupController as any).redisService = mockRedisServiceInstance;
  });

  describe('handleConnection', () => {
    it('should handle successful connection and authentication', () => {
      // Mock authentication callback with proper typing
      jest.spyOn(groupController as any, 'authenticateSocket').mockImplementation(
        (socket: any, callback: any) => {
          socket.userId = 123;
          socket.userLogin = 'testuser';
          callback(true);
        }
      );

      jest.spyOn(groupController as any, 'setupEventHandlers').mockImplementation();
      mockRedisServiceInstance.storeUserSocket.mockResolvedValue();

      groupController.handleConnection(mockSocket);

      expect(mockRedisServiceInstance.storeUserSocket).toHaveBeenCalledWith(123, 'test-socket-id');
      expect(groupController['setupEventHandlers']).toHaveBeenCalledWith(mockSocket);
    });

    it('should handle authentication failure', () => {
      // Mock authentication failure with proper typing
      jest.spyOn(groupController as any, 'authenticateSocket').mockImplementation(
        (socket: any, callback: any) => {
          callback(false);
        }
      );

      groupController.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('authentication flow', () => {
    it('should authenticate valid JWT token', () => {
      const mockDecodedToken = {
        userId: 123,
        login: 'testuser',
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockedJwt.verify.mockReturnValue(mockDecodedToken as any);

      const authenticateSocket = groupController['authenticateSocket'].bind(groupController);
      const mockCallback = jest.fn();

      authenticateSocket(mockSocket, mockCallback);

      expect(mockSocket.userId).toBe(123);
      expect(mockSocket.userLogin).toBe('testuser');
      expect(mockCallback).toHaveBeenCalledWith(true);
    });

    it('should reject invalid token', () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      const authenticateSocket = groupController['authenticateSocket'].bind(groupController);
      const mockCallback = jest.fn();

      authenticateSocket(mockSocket, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(false);
    });

    it('should handle missing token', () => {
      mockSocket.handshake.auth = {};

      const authenticateSocket = groupController['authenticateSocket'].bind(groupController);
      const mockCallback = jest.fn();

      authenticateSocket(mockSocket, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(false);
    });
  });

  describe('group operations through socket events', () => {
    beforeEach(() => {
      mockSocket.userId = 123;
      mockSocket.userLogin = 'testuser';
    });

    it('should handle join_random_group event', async () => {
      const mockGroupData = {
        id: 'group-123',
        name: 'Test Group',
        currentMembers: 2,
        maxMembers: 10,
        members: [
          { userId: 123, login: 'testuser', publicKey: 'key1', joinedAt: new Date() }
        ]
      };

      const mockJoinResult = {
        success: true,
        message: 'Successfully joined group',
        group: mockGroupData
      };

      mockGroupServiceInstance.joinRandomGroup.mockResolvedValue(mockJoinResult);
      mockRedisServiceInstance.storeGroupMemberSocket.mockResolvedValue();

      // Get the private method
      const handleJoinRandomGroup = groupController['handleJoinRandomGroup'].bind(groupController);

      const result = await handleJoinRandomGroup(mockSocket, { publicKey: 'user-public-key' });

      expect(mockGroupServiceInstance.joinRandomGroup).toHaveBeenCalledWith(123, 'user-public-key');
      expect(result).toEqual(mockJoinResult);
    });

    it('should handle send_group_message event', async () => {
      const mockMessage = {
        id: 'msg-123',
        groupId: 'group-123',
        senderId: 123,
        encryptedContent: 'encrypted-message',
        timestamp: new Date(),
        messageType: 'text'
      };

      mockGroupServiceInstance.storeMessage.mockResolvedValue(mockMessage as any);

      const handleSendMessage = groupController['handleSendMessage'].bind(groupController);

      const messageData = {
        groupId: 'group-123',
        encryptedMessage: 'encrypted-content',
        messageType: 'text' as const
      };

      const result = await handleSendMessage(mockSocket, messageData);

      expect(mockGroupServiceInstance.storeMessage).toHaveBeenCalledWith(
        'group-123',
        123,
        'encrypted-content',
        'text'
      );
      expect(result.success).toBe(true);
      expect(mockIo.to).toHaveBeenCalledWith('group:group-123');
    });

    it('should handle leave_group event', async () => {
      mockGroupServiceInstance.leaveGroup.mockResolvedValue(true);
      mockRedisServiceInstance.removeGroupMemberSocket.mockResolvedValue();

      const handleLeaveGroup = groupController['handleLeaveGroup'].bind(groupController);

      const result = await handleLeaveGroup(mockSocket, { groupId: 'group-123' });

      expect(mockGroupServiceInstance.leaveGroup).toHaveBeenCalledWith(123, 'group-123');
      expect(result.success).toBe(true);
    });
  });

  describe('setupEventHandlers', () => {
    it('should register all socket event handlers', () => {
      const setupEventHandlers = groupController['setupEventHandlers'].bind(groupController);

      setupEventHandlers(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith('join_random_group', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('send_group_message', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('leave_group', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('get_group_messages', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('typing_start', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('typing_stop', expect.any(Function));
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockSocket.userId = 123;
      mockSocket.userLogin = 'testuser';
    });

    it('should handle GroupService errors gracefully', async () => {
      mockGroupServiceInstance.joinRandomGroup.mockRejectedValue(new Error('Service error'));

      const handleJoinRandomGroup = groupController['handleJoinRandomGroup'].bind(groupController);

      await expect(handleJoinRandomGroup(mockSocket, { publicKey: 'key' }))
        .rejects.toThrow('Service error');
    });

    it('should handle message sending errors gracefully', async () => {
      mockGroupServiceInstance.storeMessage.mockRejectedValue(new Error('Storage error'));

      const handleSendMessage = groupController['handleSendMessage'].bind(groupController);

      const result = await handleSendMessage(mockSocket, {
        groupId: 'group-123',
        encryptedMessage: 'encrypted-content',
        messageType: 'text' as const
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to send message');
    });
  });
}); 