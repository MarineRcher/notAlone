import {User} from "./socket";
import {IMessage} from "./roomEvents";

export interface IRoom {
    id: string,
    createdAt: Date,
    users: User[],
    encryptedMessages: IMessage[],
}