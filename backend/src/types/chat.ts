export type ChatEventType = 'message' | 'joinroom' | 'leftroom';

export interface BaseRoomEvent {
    createdAt: Date;
    userId: string;
    userName: string;
}

export interface Message extends BaseRoomEvent {
    id: string;
    encryptedMessage: string;
    publicKey: string;
}

export interface JoinRoom extends BaseRoomEvent {
    publicKey: string;
}

export interface LeftRoom extends BaseRoomEvent {}

export interface ChatRoomEvent {
    type: ChatEventType;
    payload: Message | JoinRoom | LeftRoom;
}