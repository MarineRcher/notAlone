export type ChatEventType = 'message' | 'joinroom' | 'leftroom';

export interface IBaseRoomEvent {
    createdAt: Date;
    userId: string;
    userName: string;
}

export interface IMessage extends IBaseRoomEvent {
    id: string;
    encryptedMessage: string;
    publicKey: string;
}

export interface IJoinRoom extends IBaseRoomEvent {
    publicKey: string;
}

export interface ILeftRoom extends IBaseRoomEvent {}

export interface IChatRoomEvent {
    type: ChatEventType;
    payload: IMessage | IJoinRoom | ILeftRoom;
}