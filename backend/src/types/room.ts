import {User} from "./socket";
import {IMessage, IKeyRotationEvent} from "./roomEvents";

export interface IRoom {
    id: string,
    createdAt: Date,
    users: User[],
    encryptedMessages: IMessage[],
    keyRotations: IKeyRotationEvent[],
}