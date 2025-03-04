import { Server, Socket } from 'socket.io';
import { GroupService } from '../services/GroupService';
import { User, IRoom } from '../types';

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