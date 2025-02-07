import Queue from "../utils/dataStructures/Queue";
import {IRoom, User} from "../types";

export class GroupService {
    private waitList: Queue<User>;
    private rooms: IRoom[];

    constructor() {
        this.waitList = new Queue<User>();
        this.rooms = [];
    }

    public getRoomById (roomId: string): IRoom | undefined {
        return this.rooms.find(room => roomId === roomId)
    }

    public joinWaitList (user: User): void{
        try {
            if (!user.userId) {
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

        if (this.waitList.size() >= 10) {
            this.createRoom();
        }
    }

    private createRoom (): void {
        if (this.waitList.isEmpty()) {
            return;
        }

        const users: User[] = [];
        for (let i = 0; i < 10; i++) {
            const user = this.waitList.dequeue();
            if (user) {
                users.push(user);
            }
        }

        const room: IRoom = {
            id: `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            createdAt: new Date(Date.now()),
            users: users,
            encryptedMessages: []
        }

        this.rooms.push(room);
    }


}