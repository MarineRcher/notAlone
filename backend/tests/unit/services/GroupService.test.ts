import { GroupService } from '../../../src/services/GroupService';
import { IRoom, User, IMessage, IKeyRotationEvent } from '../../../src/types';

describe('GroupService', () => {
    let groupService: GroupService;
    const mockUser1: User = { userId: 'user1', name: 'User 1' };
    const mockUser2: User = { userId: 'user2', name: 'User 2' };
    const mockPublicKey1 = 'base64EncodedPublicKey1';
    const mockPublicKey2 = 'base64EncodedPublicKey2';

    beforeEach(() => {
        groupService = new GroupService();
    });

    describe('Public Key Management', () => {
        it('should store and retrieve user public keys', () => {
            groupService.setUserPublicKey(mockUser1.userId, mockPublicKey1);
            expect(groupService.getUserPublicKey(mockUser1.userId)).toBe(mockPublicKey1);
        });

        it('should get all public keys for room members', () => {
            // Add users to waitlist
            groupService.joinWaitList(mockUser1);
            groupService.joinWaitList(mockUser2);

            // Set their public keys
            groupService.setUserPublicKey(mockUser1.userId, mockPublicKey1);
            groupService.setUserPublicKey(mockUser2.userId, mockPublicKey2);

            // Create room
            const room = groupService.checkAndCreateRoom();
            expect(room).toBeDefined();

            if (room) {
                const publicKeys = groupService.getAllRoomUserPublicKeys(room.id);
                expect(publicKeys.size).toBe(2);
                expect(publicKeys.get(mockUser1.userId)).toBe(mockPublicKey1);
                expect(publicKeys.get(mockUser2.userId)).toBe(mockPublicKey2);
            }
        });

        it('should remove public key when user disconnects', () => {
            groupService.setUserPublicKey(mockUser1.userId, mockPublicKey1);
            groupService.handleUserDisconnect(mockUser1);
            expect(groupService.getUserPublicKey(mockUser1.userId)).toBeUndefined();
        });
    });

    describe('Encrypted Messages', () => {
        it('should store encrypted messages in room', () => {
            // Setup room with users
            groupService.joinWaitList(mockUser1);
            groupService.joinWaitList(mockUser2);
            const room = groupService.checkAndCreateRoom();
            expect(room).toBeDefined();

            if (room) {
                const mockMessage: IMessage = {
                    id: 'msg1',
                    encryptedContent: 'encryptedData',
                    iv: 'base64IV',
                    signature: 'base64Signature',
                    timestamp: Date.now(),
                    senderId: mockUser1.userId,
                    header: {
                        version: '1.0',
                        senderId: mockUser1.userId,
                        recipientId: '',
                        messageId: 'msg1',
                        timestamp: Date.now()
                    }
                };

                groupService.addEncryptedMessage(room.id, mockMessage);
                const updatedRoom = groupService.getRoomById(room.id);
                expect(updatedRoom?.encryptedMessages).toContainEqual(mockMessage);
            }
        });
    });

    describe('Key Rotation', () => {
        it('should handle key rotation events', () => {
            // Setup room with users
            groupService.joinWaitList(mockUser1);
            groupService.joinWaitList(mockUser2);
            const room = groupService.checkAndCreateRoom();
            expect(room).toBeDefined();

            if (room) {
                const keyRotation: IKeyRotationEvent = {
                    groupId: room.id,
                    encryptedGroupKey: 'encryptedNewKey',
                    keyId: 'key1',
                    timestamp: Date.now(),
                    senderId: mockUser1.userId
                };

                groupService.handleKeyRotation(room.id, keyRotation);
                const updatedRoom = groupService.getRoomById(room.id);
                expect(updatedRoom?.keyRotations).toContainEqual(keyRotation);
            }
        });
    });

    describe('Room Management', () => {
        it('should create room when enough users are in waitlist', () => {
            groupService.joinWaitList(mockUser1);
            groupService.joinWaitList(mockUser2);
            
            const room = groupService.checkAndCreateRoom();
            expect(room).toBeDefined();
            expect(room?.users).toHaveLength(2);
            expect(room?.users).toContainEqual(expect.objectContaining(mockUser1));
            expect(room?.users).toContainEqual(expect.objectContaining(mockUser2));
        });

        it('should handle user disconnection from room', () => {
            groupService.joinWaitList(mockUser1);
            groupService.joinWaitList(mockUser2);
            
            const room = groupService.checkAndCreateRoom();
            expect(room).toBeDefined();

            if (room) {
                groupService.handleUserDisconnect(mockUser1);
                const updatedRoom = groupService.getRoomById(room.id);
                expect(updatedRoom?.users).toHaveLength(1);
                expect(updatedRoom?.users).not.toContainEqual(expect.objectContaining(mockUser1));
            }
        });
    });

    describe('waitlist operations', () => {
        describe('joinWaitList', () => {
            it('should add a valid user to waitlist', () => {
                groupService.joinWaitList(mockUser1);
                expect(groupService.getWaitListSize()).toBe(1);
                expect(groupService.isUserInWaitList(mockUser1.userId)).toBe(true);
            });

            it('should throw error for missing userId', () => {
                const invalidUser = { userId: '', name: 'John' };
                expect(() => groupService.joinWaitList(invalidUser)).toThrow('Invalid user data');
            });

            it('should throw error for missing name', () => {
                const invalidUser = { userId: 'user1', name: '' };
                expect(() => groupService.joinWaitList(invalidUser)).toThrow('Invalid user data');
            });
        });

        describe('removeUserFromWaitList', () => {
            it('should remove user from waitlist', () => {
                groupService.joinWaitList(mockUser1);
                expect(groupService.getWaitListSize()).toBe(1);

                groupService.removeUserFromWaitList(mockUser1.userId);
                expect(groupService.getWaitListSize()).toBe(0);
                expect(groupService.isUserInWaitList(mockUser1.userId)).toBe(false);
            });

            it('should handle removing non-existent user', () => {
                groupService.joinWaitList(mockUser1);
                groupService.removeUserFromWaitList('nonexistent-user');
                expect(groupService.getWaitListSize()).toBe(1);
                expect(groupService.isUserInWaitList(mockUser1.userId)).toBe(true);
            });
        });

        describe('isUserInWaitList', () => {
            it('should return true for user in waitlist', () => {
                groupService.joinWaitList(mockUser1);
                expect(groupService.isUserInWaitList(mockUser1.userId)).toBe(true);
            });

            it('should return false for user not in waitlist', () => {
                expect(groupService.isUserInWaitList('nonexistent')).toBe(false);
            });

            it('should preserve waitlist order when checking', () => {
                const user2 = { userId: 'user2', name: 'Jane Doe' };
                groupService.joinWaitList(mockUser1);
                groupService.joinWaitList(user2);

                groupService.isUserInWaitList(mockUser1.userId);
                expect(groupService.getWaitListSize()).toBe(2);
            });
        });
    });

    describe('room operations', () => {
        describe('createRoomIfPossible', () => {
            it('should return null if less than 10 users in waitlist', () => {
                for (let i = 0; i < 9; i++) {
                    groupService.joinWaitList({
                        userId: `user${i}`,
                        name: `User ${i}`
                    });
                }
                const room = groupService.createRoomIfPossible();
                expect(room).toBeNull();
            });

            it('should create room with exactly 10 users', () => {
                for (let i = 0; i < 10; i++) {
                    groupService.joinWaitList({
                        userId: `user${i}`,
                        name: `User ${i}`
                    });
                }
                const room = groupService.createRoomIfPossible();
                expect(room).not.toBeNull();
                expect(room?.users.length).toBe(10);
            });

            it('should clear users from waitlist after room creation', () => {
                for (let i = 0; i < 10; i++) {
                    groupService.joinWaitList({
                        userId: `user${i}`,
                        name: `User ${i}`
                    });
                }
                groupService.createRoomIfPossible();
                expect(groupService.getWaitListSize()).toBe(0);
            });
        });

        describe('room management', () => {
            let room: IRoom;

            beforeEach(() => {
                for (let i = 0; i < 10; i++) {
                    groupService.joinWaitList({
                        userId: `user${i}`,
                        name: `User ${i}`
                    });
                }
                room = groupService.createRoomIfPossible()!;
            });

            it('should get room by roomId', () => {
                const foundRoom = groupService.getRoomById(room.id);
                expect(foundRoom).toBeDefined();
                expect(foundRoom?.id).toBe(room.id);
            });

            it('should get room by userId', () => {
                const foundRoom = groupService.getRoomByUserId('user0');
                expect(foundRoom).toBeDefined();
                expect(foundRoom?.id).toBe(room.id);
            });

            it('should return undefined for non-existent roomId', () => {
                expect(groupService.getRoomById('nonexistent')).toBeUndefined();
            });

            it('should return undefined for non-existent userId', () => {
                expect(groupService.getRoomByUserId('nonexistent')).toBeUndefined();
            });
        });

        describe('handleUserDisconnect', () => {
            let room: IRoom;

            beforeEach(() => {
                for (let i = 0; i < 10; i++) {
                    groupService.joinWaitList({
                        userId: `user${i}`,
                        name: `User ${i}`
                    });
                }
                room = groupService.createRoomIfPossible()!;
            });

            it('should remove user from room', () => {
                const user = room.users[0];
                groupService.handleUserDisconnect(user);
                const updatedRoom = groupService.getRoomById(room.id);
                expect(updatedRoom?.users.length).toBe(9);
                expect(updatedRoom?.users.find(u => u.userId === user.userId)).toBeUndefined();
            });

            it('should delete room when last user disconnects', () => {
                room.users.forEach(user => {
                    groupService.handleUserDisconnect(user);
                });
                expect(groupService.getRoomById(room.id)).toBeUndefined();
            });

            it('should handle disconnection of user not in room', () => {
                const nonexistentUser = { userId: 'nonexistent', name: 'Non Existent' };
                expect(() => {
                    groupService.handleUserDisconnect(nonexistentUser);
                }).not.toThrow();
            });
        });
    });
});