import { Server, Socket } from 'socket.io';
import { GroupService } from '../services/GroupService';
import { User, IRoom, IMessage, IKeyRotationEvent } from '../types';

class GroupController {
    private io: Server;
    private groupService: GroupService;
    private activeConnections: Map<string, User>; // socketId -> User

    constructor(io: Server) {
        this.io = io;
        this.groupService = new GroupService();
        this.activeConnections = new Map();
    }

    public handleConnection(socket: Socket) {
        socket.on('userConnect', (userData: User) => this.handleUserConnect(socket, userData));
        socket.on('disconnect', () => this.handleDisconnect(socket));
        socket.on('message', (message: IMessage) => this.handleEncryptedMessage(socket, message));
        socket.on('publicKey', (data: { userId: string, publicKey: string }) => this.handlePublicKey(socket, data));
        socket.on('keyRotation', (data: IKeyRotationEvent) => this.handleKeyRotation(socket, data));
    }

    private handleUserConnect(socket: Socket, userData: User) {
        try {
            if (!userData.userId || !userData.name) {
                socket.emit('error', { message: 'Invalid user data' });
                return;
            }

            const user: User = {
                userId: userData.userId,
                name: userData.name
            };

            this.activeConnections.set(socket.id, user);
            this.groupService.joinWaitList(user);
            this.checkAndCreateRoom();

        } catch (error) {
            console.error('Error in handleUserConnect:', error);
            socket.emit('error', { message: 'Connection failed' });
        }
    }

    private handlePublicKey(socket: Socket, data: { userId: string, publicKey: string }) {
        try {
            const { userId, publicKey } = data;
            this.groupService.setUserPublicKey(userId, publicKey);

            // When a user provides their public key, send them the public keys of their room members
            const room = this.groupService.getRoomByUserId(userId);
            if (room) {
                const publicKeys = this.groupService.getAllRoomUserPublicKeys(room.id);
                socket.emit('roomPublicKeys', {
                    roomId: room.id,
                    publicKeys: Object.fromEntries(publicKeys)
                });
            }
        } catch (error) {
            console.error('Error in handlePublicKey:', error);
            socket.emit('error', { message: 'Failed to process public key' });
        }
    }

    private handleEncryptedMessage(socket: Socket, message: IMessage) {
        try {
            const user = this.activeConnections.get(socket.id);
            if (!user) {
                socket.emit('error', { message: 'User not found' });
                return;
            }

            const room = this.groupService.getRoomByUserId(user.userId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Store the encrypted message
            this.groupService.addEncryptedMessage(room.id, message);

            // Broadcast the encrypted message to all room members
            this.io.to(room.id).emit('message', message);
        } catch (error) {
            console.error('Error in handleEncryptedMessage:', error);
            socket.emit('error', { message: 'Failed to process message' });
        }
    }

    private handleKeyRotation(socket: Socket, keyRotation: IKeyRotationEvent) {
        try {
            const user = this.activeConnections.get(socket.id);
            if (!user) {
                socket.emit('error', { message: 'User not found' });
                return;
            }

            const room = this.groupService.getRoomByUserId(user.userId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Store the key rotation event
            this.groupService.handleKeyRotation(room.id, keyRotation);

            // Broadcast the key rotation to all room members
            this.io.to(room.id).emit('keyRotation', keyRotation);
        } catch (error) {
            console.error('Error in handleKeyRotation:', error);
            socket.emit('error', { message: 'Failed to process key rotation' });
        }
    }

    private handleNewRoom(room: IRoom) {
        room.users.forEach(user => {
            const socketId = this.findSocketIdByUserId(user.userId);
            if (socketId) {
                const socket = this.io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.join(room.id);
                    socket.emit('roomAssigned', {
                        roomId: room.id,
                        users: room.users
                    });
                }
            }
        });

        this.io.to(room.id).emit('roomReady', {
            roomId: room.id,
            message: 'Room is ready'
        });
    }

    private handleDisconnect(socket: Socket) {
        const user = this.activeConnections.get(socket.id);
        if (user) {
            this.activeConnections.delete(socket.id);

            const room = this.groupService.getRoomByUserId(user.userId);
            this.groupService.handleUserDisconnect(user);

            if (room) {
                this.io.to(room.id).emit('user:disconnected', {
                    userId: user.userId,
                    name: user.name,
                    roomId: room.id,
                    timestamp: new Date(),
                    remainingUsers: room.users.length - 1
                });
            }
        }
    }

    private findSocketIdByUserId(userId: string): string | undefined {
        for (const [socketId, user] of this.activeConnections.entries()) {
            if (user.userId === userId) {
                return socketId;
            }
        }
        return undefined;
    }

    private checkAndCreateRoom() {
        const newRoom = this.groupService.checkAndCreateRoom();
        if (newRoom) {
            this.handleNewRoom(newRoom);
        }
    }

    public sendMessageToRoom(roomId: string, event: string, data: any) {
        this.io.to(roomId).emit(event, data);
    }
}

export default GroupController;