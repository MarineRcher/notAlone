import { GroupService } from '../../../src/services/GroupService'
import { User, IRoom } from '../../../src/types';

describe('GroupService', () => {
    let groupService: GroupService;
    let mockUser: User;

    beforeEach(() => {
        groupService = new GroupService();
        mockUser = {
            userId: '123',
            name: 'Test User',
            socketId: 'socket-123'
        };
    });

    describe('joinWaitList', () => {
        it('should add a user to the waitlist', () => {
            groupService.joinWaitList(mockUser);
            // Vérification indirecte via la création de room qui nécessite 10 utilisateurs
            expect(() => groupService.joinWaitList(mockUser)).not.toThrow();
        });

        it('should throw error when user data is invalid', () => {
            const invalidUser = { ...mockUser, userId: '' };
            expect(() => groupService.joinWaitList(invalidUser)).toThrow('Invalid user data');
        });

        it('should create a room when waitlist reaches 10 users', () => {
            // Ajouter 10 utilisateurs
            for (let i = 0; i < 10; i++) {
                const user: User = {
                    userId: `user-${i}`,
                    name: `User ${i}`,
                    socketId: `socket-${i}`
                };
                groupService.joinWaitList(user);
            }

            // Vérifier qu'une room a été créée
            const rooms = groupService['rooms']; // Accès à la propriété privée pour le test
            expect(rooms.length).toBe(1);
            expect(rooms[0].users.length).toBe(10);
        });
    });

    describe('getRoomById', () => {
        it('should return undefined for non-existent room', () => {
            const room = groupService.getRoomById('non-existent');
            expect(room).toBeUndefined();
        });

        it('should return the correct room when it exists', () => {
            // Créer une room en ajoutant 10 utilisateurs
            for (let i = 0; i < 10; i++) {
                const user: User = {
                    userId: `user-${i}`,
                    name: `User ${i}`,
                    socketId: `socket-${i}`
                };
                groupService.joinWaitList(user);
            }

            // Récupérer l'ID de la room créée
            const room = groupService['rooms'][0];
            const foundRoom = groupService.getRoomById(room.id);

            expect(foundRoom).toBeDefined();
            expect(foundRoom?.id).toBe(room.id);
            expect(foundRoom?.users.length).toBe(10);
        });
    });

    // Test des cas limites
    describe('edge cases', () => {
        it('should not create room with insufficient users', () => {
            // Ajouter seulement 9 utilisateurs
            for (let i = 0; i < 9; i++) {
                const user: User = {
                    userId: `user-${i}`,
                    name: `User ${i}`,
                    socketId: `socket-${i}`
                };
                groupService.joinWaitList(user);
            }

            // Vérifier qu'aucune room n'a été créée
            expect(groupService['rooms'].length).toBe(0);
        });

        it('should handle multiple room creations', () => {
            // Ajouter 20 utilisateurs pour créer 2 rooms
            for (let i = 0; i < 20; i++) {
                const user: User = {
                    userId: `user-${i}`,
                    name: `User ${i}`,
                    socketId: `socket-${i}`
                };
                groupService.joinWaitList(user);
            }

            expect(groupService['rooms'].length).toBe(2);
        });
    });
});