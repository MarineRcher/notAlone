export type ChatEventType = 'message' | 'joinroom' | 'leftroom' | 'keyrotation';

export interface IBaseRoomEvent {
    createdAt: Date;
    userId: string;
    userName: string;
}

export interface IMessage extends IBaseRoomEvent {
    id: string;
    encryptedMessage: string;
    publicKey: string;
    // Add signature for message verification (optional)
    signature?: string;
}

export interface IJoinRoom extends IBaseRoomEvent {
    publicKey: string;
}

export interface ILeftRoom extends IBaseRoomEvent {}

// New interface for key rotation events
export interface IKeyRotation extends IBaseRoomEvent {
    keyId: string;
    timestamp: number;
}

export interface IChatRoomEvent {
    type: ChatEventType;
    payload: IMessage | IJoinRoom | ILeftRoom | IKeyRotation;
}