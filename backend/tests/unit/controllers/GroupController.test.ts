import { Server, Socket } from 'socket.io';
import GroupController from '../../../src/constrollers/GroupController';
import { GroupService } from '../../../src/services/GroupService';
import { User, IRoom, IMessage, IKeyRotationEvent } from '../../../src/types';

// Mock de Socket.IO
jest.mock('socket.io', () => {
    const mockEmit = jest.fn();
    const mockTo = jest.fn(() => ({
        emit: mockEmit
    }));

    const mockSocket = {
        emit: jest.fn(),
        on: jest.fn(),
        join: jest.fn(),
        to: mockTo,
        id: 'mockSocketId'
    };

    const mockServer = {
        sockets: {
            sockets: new Map()
        },
        to: mockTo
    };

    return {
        Server: jest.fn(() => mockServer),
        Socket: jest.fn(() => mockSocket)
    };
});

// Mock du GroupService
jest.mock('../../../src/services/GroupService');

describe('GroupController', () => {
    let controller: GroupController;
    let mockIo: jest.Mocked<Server>;
    let mockSocket: jest.Mocked<Socket>;
    let mockGroupService: jest.Mocked<GroupService>;
    let mockEmit: jest.Mock;

    const mockUser: User = {
        userId: 'testUser',
        name: 'Test User'
    };

    const mockRoom: IRoom = {
        id: 'room1',
        createdAt: new Date(),
        users: [mockUser],
        encryptedMessages: [],
        keyRotations: []
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockEmit = jest.fn();
        const mockTo = jest.fn(() => ({
            emit: mockEmit
        }));

        mockIo = {
            sockets: {
                sockets: new Map()
            },
            to: mockTo
        } as unknown as jest.Mocked<Server>;

        mockSocket = {
            emit: jest.fn(),
            on: jest.fn(),
            join: jest.fn(),
            to: mockTo,
            id: 'mockSocketId'
        } as unknown as jest.Mocked<Socket>;

        mockGroupService = {
            joinWaitList: jest.fn(),
            getRoomByUserId: jest.fn(),
            handleUserDisconnect: jest.fn(),
            checkAndCreateRoom: jest.fn(),
            setUserPublicKey: jest.fn(),
            getAllRoomUserPublicKeys: jest.fn(),
            addEncryptedMessage: jest.fn(),
            handleKeyRotation: jest.fn()
        } as unknown as jest.Mocked<GroupService>;

        controller = new GroupController(mockIo);
        (controller as any).groupService = mockGroupService;
    });

    describe('handleConnection', () => {
        it('should set up all socket event listeners', () => {
            controller.handleConnection(mockSocket);
            
            expect(mockSocket.on).toHaveBeenCalledWith('userConnect', expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith('publicKey', expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith('keyRotation', expect.any(Function));
        });
    });

    describe('handleUserConnect', () => {
        it('should handle valid user connection', () => {
            // Simuler l'appel à userConnect
            controller.handleConnection(mockSocket);
            const userConnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'userConnect')?.[1];

            if (userConnectCallback) {
                userConnectCallback(mockUser);

                expect(mockGroupService.joinWaitList).toHaveBeenCalledWith(mockUser);
                expect(mockGroupService.createRoomIfPossible).toHaveBeenCalled();
            }
        });

        it('should emit error for invalid user data', () => {
            const invalidUser = { userId: '', name: '' };

            controller.handleConnection(mockSocket);
            const userConnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'userConnect')?.[1];

            if (userConnectCallback) {
                userConnectCallback(invalidUser);
                expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid user data' });
            }
        });
    });

    describe('handleNewRoom', () => {
        const mockRoom: IRoom = {
            id: 'room1',
            createdAt: new Date(),
            users: [
                { userId: 'user1', name: 'User 1' },
                { userId: 'user2', name: 'User 2' }
            ],
            encryptedMessages: [],
            keyRotations: []
        };

        beforeEach(() => {
            // Setup mock pour findSocketIdByUserId
            mockIo.sockets.sockets.set('socket1', mockSocket);
        });

        it('should handle room creation and notify users', () => {
            // Simuler un utilisateur connecté
            controller['activeConnections'].set('socket1', mockRoom.users[0]);

            controller['handleNewRoom'](mockRoom);

            // Vérifier que les utilisateurs ont rejoint la room
            expect(mockSocket.join).toHaveBeenCalledWith(mockRoom.id);
            expect(mockSocket.emit).toHaveBeenCalledWith('roomAssigned', {
                roomId: mockRoom.id,
                users: mockRoom.users
            });

            // Vérifier l'émission du roomReady
            expect(mockIo.to).toHaveBeenCalledWith(mockRoom.id);
        });
    });

    describe('handleDisconnect', () => {
        const mockUser: User = {
            userId: 'testUser',
            name: 'Test User'
        };

        const mockRoom: IRoom = {
            id: 'room1',
            createdAt: new Date(),
            users: [mockUser],
            encryptedMessages: [],
            keyRotations: []
        };

        beforeEach(() => {
            controller['activeConnections'].set(mockSocket.id, mockUser);
            mockGroupService.getRoomByUserId.mockReturnValue(mockRoom);
        });

        it('should handle user disconnection', () => {
            controller.handleConnection(mockSocket);
            const disconnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];

            if (disconnectCallback) {
                disconnectCallback();

                expect(mockGroupService.handleUserDisconnect).toHaveBeenCalledWith(mockUser);
                expect(mockSocket.to).toHaveBeenCalledWith(mockRoom.id);
                expect(mockEmit).toHaveBeenCalledWith('user:disconnected', expect.objectContaining({
                    userId: mockUser.userId,
                    name: mockUser.name,
                    roomId: mockRoom.id
                }));
            }
        });
    });

    describe('sendMessageToRoom', () => {
        it('should emit message to room', () => {
            const roomId = 'room1';
            const event = 'testEvent';
            const data = { message: 'test' };

            controller.sendMessageToRoom(roomId, event, data);
            expect(mockIo.to).toHaveBeenCalledWith(roomId);
            expect(mockEmit).toHaveBeenCalledWith(event, data);
        });
    });

    describe('handleEncryptedMessage', () => {
        const mockMessage: IMessage = {
            id: 'msg1',
            encryptedContent: 'encryptedData',
            iv: 'base64IV',
            signature: 'base64Signature',
            timestamp: Date.now(),
            senderId: 'testUser',
            header: {
                version: '1.0',
                senderId: 'testUser',
                recipientId: '',
                messageId: 'msg1',
                timestamp: Date.now()
            }
        };

        beforeEach(() => {
            (controller as any).activeConnections.set(mockSocket.id, mockUser);
            mockGroupService.getRoomByUserId.mockReturnValue(mockRoom);
        });

        it('should handle encrypted message', () => {
            controller.handleConnection(mockSocket);
            const messageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'message')?.[1];

            if (messageHandler) {
                messageHandler(mockMessage);

                expect(mockGroupService.addEncryptedMessage).toHaveBeenCalledWith(mockRoom.id, mockMessage);
                expect(mockIo.to).toHaveBeenCalledWith(mockRoom.id);
                expect(mockIo.emit).toHaveBeenCalledWith('message', mockMessage);
            }
        });
    });

    describe('handlePublicKey', () => {
        const mockPublicKeyData = {
            userId: 'testUser',
            publicKey: 'base64EncodedPublicKey'
        };

        beforeEach(() => {
            mockGroupService.getRoomByUserId.mockReturnValue(mockRoom);
            mockGroupService.getAllRoomUserPublicKeys.mockReturnValue(new Map([
                ['testUser', 'base64EncodedPublicKey']
            ]));
        });

        it('should handle public key exchange', () => {
            controller.handleConnection(mockSocket);
            const publicKeyHandler = mockSocket.on.mock.calls.find(call => call[0] === 'publicKey')?.[1];

            if (publicKeyHandler) {
                publicKeyHandler(mockPublicKeyData);

                expect(mockGroupService.setUserPublicKey).toHaveBeenCalledWith(
                    mockPublicKeyData.userId,
                    mockPublicKeyData.publicKey
                );
                expect(mockSocket.emit).toHaveBeenCalledWith('roomPublicKeys', {
                    roomId: mockRoom.id,
                    publicKeys: { testUser: 'base64EncodedPublicKey' }
                });
            }
        });
    });

    describe('handleKeyRotation', () => {
        const mockKeyRotation: IKeyRotationEvent = {
            groupId: 'room1',
            encryptedGroupKey: 'encryptedNewKey',
            keyId: 'key1',
            timestamp: Date.now(),
            senderId: 'testUser'
        };

        beforeEach(() => {
            (controller as any).activeConnections.set(mockSocket.id, mockUser);
            mockGroupService.getRoomByUserId.mockReturnValue(mockRoom);
        });

        it('should handle key rotation', () => {
            controller.handleConnection(mockSocket);
            const keyRotationHandler = mockSocket.on.mock.calls.find(call => call[0] === 'keyRotation')?.[1];

            if (keyRotationHandler) {
                keyRotationHandler(mockKeyRotation);

                expect(mockGroupService.handleKeyRotation).toHaveBeenCalledWith(mockRoom.id, mockKeyRotation);
                expect(mockIo.to).toHaveBeenCalledWith(mockRoom.id);
                expect(mockIo.emit).toHaveBeenCalledWith('keyRotation', mockKeyRotation);
            }
        });
    });
});