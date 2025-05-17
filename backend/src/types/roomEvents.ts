export type ChatEventType = 'message' | 'joinroom' | 'leftroom' | 'key_rotation';

export interface IBaseRoomEvent {
    timestamp: number;
    senderId: string;
}

export interface IMessage extends IBaseRoomEvent {
    id: string;
    encryptedContent: string;     // Base64 encoded encrypted message
    iv: string;                   // Base64 encoded initialization vector
    signature: string;            // Base64 encoded signature
    header: {
        version: string;
        senderId: string;
        recipientId: string;
        messageId: string;
        timestamp: number;
        encryptedKey?: string;    // For key exchange messages
        keyExchangeMode?: 'direct' | 'group';
    };
}

export interface IKeyRotationEvent extends IBaseRoomEvent {
    groupId: string;
    encryptedGroupKey: string;    // Base64 encoded, encrypted with recipient's public key
    keyId: string;                // Unique identifier for this key version
}

export interface IJoinRoom extends IBaseRoomEvent {
    userId: string;
    publicKey: string;            // User's public key for E2EE
}

export interface ILeftRoom extends IBaseRoomEvent {
    userId: string;
}

export interface IChatRoomEvent {
    type: ChatEventType;
    payload: IMessage | IJoinRoom | ILeftRoom | IKeyRotationEvent;
}