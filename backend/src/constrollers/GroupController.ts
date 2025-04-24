
import { Server, Socket } from 'socket.io';
import { GroupService } from '../services/GroupService';
import { User, IRoom, IMessage, IJoinRoom, IKeyRotation } from '../types';

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
        
        // Add E2EE specific event handlers
        socket.on('publishPublicKey', (data: { publicKey: string }) => 
            this.handlePublishPublicKey(socket, data.publicKey));
        
        socket.on('joinRoomWithKey', (data: { roomId: string, publicKey: string }) => 
            this.handleJoinRoomWithKey(socket, data));
            
        socket.on('sendEncryptedMessage', (data: { roomId: string, encryptedMessage: string, signature?: string }) => 
            this.handleEncryptedMessage(socket, data));
            
        socket.on('rotateGroupKey', (data: { roomId: string, keyId: string }) => 
            this.handleKeyRotation(socket, data));
    }

    // Add these new handlers for E2EE operations

    private handlePublishPublicKey(socket: Socket, publicKey: string) {
        const user = this.activeConnections.get(socket.id);
        if (!user) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }

        try {
            this.groupService.storeUserPublicKey(user.userId, publicKey);
            socket.emit('publicKeyStored', { success: true });
        } catch (error) {
            console.error('Error storing public key:', error);
            socket.emit('error', { message: 'Failed to store public key' });
        }
    }

    private handleJoinRoomWithKey(socket: Socket, data: { roomId: string, publicKey: string }) {
        const user = this.activeConnections.get(socket.id);
        if (!user) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }

        try {
            const { roomId, publicKey } = data;
            const room = this.groupService.getRoomById(roomId);
            
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Join the socket room
            socket.join(roomId);
            
            // Store the public key and add user to room
            this.groupService.handleUserJoinRoom(roomId, user, publicKey);
            
            // Create join event
            const joinEvent: IJoinRoom = {
                userId: user.userId,
                userName: user.name,
                createdAt: new Date(),
                publicKey: publicKey
            };

            // Notify everyone in the room
            this.io.to(roomId).emit('userJoinedRoom', joinEvent);
            
            // Send the room member info back to the joining user
            const roomMembers = room.users.map(u => ({
                userId: u.userId,
                name: u.name,
                publicKey: this.groupService.getUserPublicKey(u.userId)
            }));
            
            socket.emit('roomMembers', {
                roomId,
                members: roomMembers
            });
        } catch (error) {
            console.error('Error joining room with key:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    }

    private handleEncryptedMessage(socket: Socket, data: { roomId: string, encryptedMessage: string, signature?: string }) {
        const user = this.activeConnections.get(socket.id);
        if (!user) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }

        try {
            const { roomId, encryptedMessage, signature } = data;
            const room = this.groupService.getRoomById(roomId);
            
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Get the user's public key
            const publicKey = this.groupService.getUserPublicKey(user.userId);
            
            if (!publicKey) {
                socket.emit('error', { message: 'Public key not found, please publish your key first' });
                return;
            }

            // Create message object
            const message: IMessage = {
                id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                userId: user.userId,
                userName: user.name,
                createdAt: new Date(),
                encryptedMessage: encryptedMessage,
                publicKey: publicKey,
                signature: signature
            };

            // Store message in room
            room.encryptedMessages.push(message);
            
            // Broadcast to everyone in the room
            this.io.to(roomId).emit('newEncryptedMessage', message);
        } catch (error) {
            console.error('Error sending encrypted message:', error);
            socket.emit('error', { message: 'Failed to send encrypted message' });
        }
    }

    private handleKeyRotation(socket: Socket, data: { roomId: string, keyId: string }) {
        const user = this.activeConnections.get(socket.id);
        if (!user) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }

        try {
            const { roomId, keyId } = data;
            const room = this.groupService.getRoomById(roomId);
            
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Create key rotation event
            const keyRotation: IKeyRotation = {
                userId: user.userId,
                userName: user.name,
                createdAt: new Date(),
                keyId: keyId,
                timestamp: Date.now()
            };

            // Notify everyone in the room about key rotation
            // Note: The actual new key will be encrypted and sent individually to each user
            this.io.to(roomId).emit('keyRotated', keyRotation);
        } catch (error) {
            console.error('Error handling key rotation:', error);
            socket.emit('error', { message: 'Failed to process key rotation' });
        }
    }

    private handleUserConnect(socket: Socket, userData: User) {
        try {
            if (!userData.userId || !userData.name) {
                socket.emit('error', { message: 'Invalid user data' });
                return;
            }

            // Plus besoin de spread avec socketId puisqu'il n'est plus dans l'interface User
            const user: User = {
                userId: userData.userId,
                name: userData.name
            };

            // Stocker la connexion active
            this.activeConnections.set(socket.id, user);

            // Ajouter à la liste d'attente
            this.groupService.joinWaitList(user);

            // Le serveur vérifie et crée automatiquement une room si nécessaire
            this.checkAndCreateRoom();

        } catch (error) {
            console.error('Error in handleUserConnect:', error);
            socket.emit('error', { message: 'Connection failed' });
        }
    }

    private checkAndCreateRoom() {
        try {
            const newRoom = this.groupService.createRoomIfPossible();

            if (newRoom) {
                this.handleNewRoom(newRoom);
            }
        } catch (error) {
            console.error('Error in checkAndCreateRoom:', error);
        }
    }

    private handleNewRoom(room: IRoom) {
        // Pour chaque utilisateur dans la room, on doit retrouver son socketId via activeConnections
        room.users.forEach(user => {
            // Trouver le socketId correspondant à cet utilisateur
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
                    name: user.name,  // Ajout du nom pour plus de contexte
                    roomId: room.id,
                    timestamp: new Date(),
                    remainingUsers: room.users.length - 1
                });
            }
        }
    }

    // Nouvelle méthode utilitaire pour trouver un socketId à partir d'un userId
    private findSocketIdByUserId(userId: string): string | undefined {
        for (const [socketId, user] of this.activeConnections.entries()) {
            if (user.userId === userId) {
                return socketId;
            }
        }
        return undefined;
    }

    public sendMessageToRoom(roomId: string, event: string, data: any) {
        this.io.to(roomId).emit(event, data);
    }
}

export default GroupController;