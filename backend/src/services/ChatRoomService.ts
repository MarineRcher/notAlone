import User from "../models/User";

class ChatRoomService {
    rooms: Map<string, object>;
    waitlist: string[];

    constructor() {
        this.rooms = new Map();
        this.waitlist = new Array(0);
    }

    createRoom(users: User[], ): void {
        const roomId = Math.random().toString(36).substring(7);

        const room = {
            "users": users,
            "encryptedMessage": [],
            "createdAt": new Date()
        };

        this.rooms.set(roomId, room);
    }

    joinWaitlist(user: User): void {
        if (!this.waitlist.includes(user.id)){
            this.waitlist.push(user.id);
        } else {
            throw new Error("User already in the waitlist")
        }
    }

    joinGroup(users: User[]): void {

    }
}

export default ChatRoomService;