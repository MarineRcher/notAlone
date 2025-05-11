import { Request, Response, NextFunction } from "express";
import { getCurrentUser } from "../../../../src/controllers/auth/meController";
import User from "../../../../src/models/User";
import { UserAttributes } from "../../../../src/types/users";
jest.mock("../../../../src/models/User", () => ({
    findByPk: jest.fn(),
}));

describe("meController", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            user: {
                id: 1,
                login: "testuser",
                email: "test@example.com",
                password: "hashedPassword",
                hasPremium: false,
                isBlocked: false,
                role: "user",
                lastLogin: new Date(),
                profilePicture: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                has2FA: false,
                twoFactorSecret: null,
                notify: false,
                hourNotify: null,
                failedLoginAttempts: 0,
                blockedUntil: null,
            } as unknown as UserAttributes,
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getCurrentUser", () => {
        it("devrait renvoyer les informations de l'utilisateur connecté avec le statut 200", async () => {
            // Arrange
            const mockUser = {
                id: 1,
                login: "testuser",
                email: "test@example.com",
                hasPremium: false,
                isBlocked: false,
                role: "user",
                lastLogin: new Date(),
                profilePicture: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                has2FA: false,
                twoFactorSecret: null,
                notify: false,
                hourNotify: null,
                failedLoginAttempts: 0,
                blockedUntil: null,
                // Notez que le mot de passe est exclu comme spécifié dans le contrôleur
            };
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

            // Act
            await getCurrentUser(req as Request, res as Response, next);

            // Assert
            expect(User.findByPk).toHaveBeenCalledWith(1, {
                attributes: { exclude: ["password"] },
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockUser);
            expect(next).not.toHaveBeenCalled();
        });

        it("devrait renvoyer une erreur 401 si l'utilisateur n'est pas authentifié", async () => {
            // Arrange
            req.user = undefined;

            // Act
            await getCurrentUser(req as Request, res as Response, next);

            // Assert
            expect(User.findByPk).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: "Non authentifié",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("devrait renvoyer une erreur 404 si l'utilisateur n'est pas trouvé dans la base de données", async () => {
            // Arrange
            (User.findByPk as jest.Mock).mockResolvedValue(null);

            // Act
            await getCurrentUser(req as Request, res as Response, next);

            // Assert
            expect(User.findByPk).toHaveBeenCalledWith(1, {
                attributes: { exclude: ["password"] },
            });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Utilisateur non trouvé",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("devrait appeler next avec l'erreur en cas d'exception", async () => {
            // Arrange
            const error = new Error("Erreur de base de données");
            (User.findByPk as jest.Mock).mockRejectedValue(error);

            // Act
            await getCurrentUser(req as Request, res as Response, next);

            // Assert
            expect(User.findByPk).toHaveBeenCalledWith(1, {
                attributes: { exclude: ["password"] },
            });
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
