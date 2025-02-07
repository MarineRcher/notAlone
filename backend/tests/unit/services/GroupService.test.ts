import { GroupService } from '../../../src/services/GroupService';
import { IRoom, User } from '../../../src/types';

describe('GroupService', () => {
    let groupService: GroupService;
    let mockUser: User;

    beforeEach(() => {
        groupService = new GroupService();
        mockUser = {
            userId: 'user1',
            name: 'John Doe'
        };
    });

    describe('waitlist operations', () => {
        describe('joinWaitList', () => {
            it('should add a valid user to waitlist', () => {
                groupService.joinWaitList(mockUser);
                expect(groupService.getWaitListSize()).toBe(1);
                expect(groupService.isUserInWaitList(mockUser.userId)).toBe(true);
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
                groupService.joinWaitList(mockUser);
                expect(groupService.getWaitListSize()).toBe(1);

                groupService.removeUserFromWaitList(mockUser.userId);
                expect(groupService.getWaitListSize()).toBe(0);
                expect(groupService.isUserInWaitList(mockUser.userId)).toBe(false);
            });

            it('should handle removing non-existent user', () => {
                groupService.joinWaitList(mockUser);
                groupService.removeUserFromWaitList('nonexistent-user');
                expect(groupService.getWaitListSize()).toBe(1);
                expect(groupService.isUserInWaitList(mockUser.userId)).toBe(true);
            });
        });

        describe('isUserInWaitList', () => {
            it('should return true for user in waitlist', () => {
                groupService.joinWaitList(mockUser);
                expect(groupService.isUserInWaitList(mockUser.userId)).toBe(true);
            });

            it('should return false for user not in waitlist', () => {
                expect(groupService.isUserInWaitList('nonexistent')).toBe(false);
            });

            it('should preserve waitlist order when checking', () => {
                const user2 = { userId: 'user2', name: 'Jane Doe' };
                groupService.joinWaitList(mockUser);
                groupService.joinWaitList(user2);

                groupService.isUserInWaitList(mockUser.userId);
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