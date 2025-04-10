import Queue from "../utils/dataStructures/Queue";
import { IRoom, User } from "../types";

export class GroupService {
    private waitList: Queue<User>;
    private rooms: Map<string, IRoom>;
    private userToRoom: Map<string, string>; // userId -> roomId

    constructor() {
        this.waitList = new Queue<User>();
        this.rooms = new Map();
        this.userToRoom = new Map();
    }

    public joinWaitList(user: User): void {
        try {
            if (!user.userId || !user.name) {
                throw new Error('Invalid user data');
            }
            this.waitList.enqueue(user);
        } catch (error) {
            console.error('Failed to join waitlist', {
                userId: user.userId,
                error: error
            });
            throw error;
        }
    }

    public createRoomIfPossible(): IRoom | null {
        if (this.waitList.size() >= 10) {
            return this.createRoom();
        }
        return null;
    }

    private createRoom(): IRoom {
        if (this.waitList.isEmpty()) {
            console.log('Waitlist is empty')
            throw new Error('Waitlist is empty');
        }

        const users: User[] = [];
        const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        for (let i = 0; i < 10; i++) {
            const user = this.waitList.dequeue();
            if (user) {
                users.push({
                    userId: user.userId,
                    name: user.name
                });
                this.userToRoom.set(user.userId, roomId);
            }
        }

        const room: IRoom = {
            id: roomId,
            createdAt: new Date(),
            users: users,
            encryptedMessages: []
        };

        this.rooms.set(room.id, room);
        return room;
    }

    public getRoomById(roomId: string): IRoom | undefined {
        return this.rooms.get(roomId);
    }

    public getRoomByUserId(userId: string): IRoom | undefined {
        const roomId = this.userToRoom.get(userId);
        if (roomId) {
            return this.rooms.get(roomId);
        }
        return undefined;
    }

    public handleUserDisconnect(user: User): void {
        // Retirer l'utilisateur de sa room si présent
        const roomId = this.userToRoom.get(user.userId);
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                room.users = room.users.filter(u => u.userId !== user.userId);

                // Si la room est vide, la supprimer
                if (room.users.length === 0) {
                    this.rooms.delete(roomId);
                } else {
                    this.rooms.set(roomId, room);
                }
            }
            this.userToRoom.delete(user.userId);
        }
    }

    public removeUserFromWaitList(userId: string): void {
        // Implémentation pour retirer un utilisateur spécifique de la file d'attente
        const currentQueue = new Queue<User>();
        while (!this.waitList.isEmpty()) {
            const user = this.waitList.dequeue();
            if (user && user.userId !== userId) {
                currentQueue.enqueue(user);
            }
        }
        this.waitList = currentQueue;
    }

    public getWaitListSize(): number {
        return this.waitList.size();
    }

    public isUserInWaitList(userId: string): boolean {
        // À implémenter si nécessaire
        let found = false;
        const tempQueue = new Queue<User>();

        while (!this.waitList.isEmpty()) {
            const user = this.waitList.dequeue();
            if (user) {
                if (user.userId === userId) found = true;
                tempQueue.enqueue(user);
            }
        }

        this.waitList = tempQueue;
        return found;
    }
}