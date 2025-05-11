import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { refreshToken } from "../../../../src/controllers/auth/refreshTokenController";
import User from "../../../../src/models/User";
import { redisClient } from "../../../../src/config/redis";
import logger from "../../../../src/config/logger";

// Mocks
jest.mock("jsonwebtoken");
jest.mock("../../../../src/models/User");
jest.mock("../../../../src/config/redis");
jest.mock("../../../../src/config/logger");

describe("refreshToken Controller", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const originalEnv = process.env;

    beforeEach(() => {
        // Setup request and response objects
        req = {
            headers: {
                authorization: "Bearer valid.token.here",
            },
            ip: "127.0.0.1",
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();

        // Setup environment variables
        process.env.JWT_SECRET = "test-secret";

        // Reset all mocks
        jest.clearAllMocks();
    });

    afterAll(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    it("devrait renvoyer 401 si l'en-tête d'autorisation est manquant", async () => {
        // Arrange
        req.headers = {};

        // Act
        await refreshToken(req as Request, res as Response, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: "Authentification requise",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("devrait renvoyer 401 si le token est révoqué", async () => {
        // Arrange
        (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
        (redisClient.get as jest.Mock).mockResolvedValue("revoked");

        // Act
        await refreshToken(req as Request, res as Response, next);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith(
            "valid.token.here",
            "test-secret"
        );
        expect(redisClient.get).toHaveBeenCalledWith(
            "blacklist:valid.token.here"
        );
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token révoqué" });
        expect(next).not.toHaveBeenCalled();
    });

    it("devrait renvoyer 404 si l'utilisateur n'est pas trouvé", async () => {
        // Arrange
        (jwt.verify as jest.Mock).mockReturnValue({ id: 999 });
        (redisClient.get as jest.Mock).mockResolvedValue(null);
        (User.findByPk as jest.Mock).mockResolvedValue(null);

        // Act
        await refreshToken(req as Request, res as Response, next);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith(
            "valid.token.here",
            "test-secret"
        );
        expect(redisClient.get).toHaveBeenCalledWith(
            "blacklist:valid.token.here"
        );
        expect(User.findByPk).toHaveBeenCalledWith(999);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Utilisateur introuvable",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("devrait rafraîchir le token avec succès", async () => {
        // Arrange
        const user = { id: 1, login: "testuser" };
        const newToken = "new.token.here";

        (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
        (redisClient.get as jest.Mock).mockResolvedValue(null);
        (User.findByPk as jest.Mock).mockResolvedValue(user);
        (jwt.sign as jest.Mock).mockReturnValue(newToken);
        (redisClient.setEx as jest.Mock).mockResolvedValue("OK");

        // Act
        await refreshToken(req as Request, res as Response, next);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith(
            "valid.token.here",
            "test-secret"
        );
        expect(redisClient.get).toHaveBeenCalledWith(
            "blacklist:valid.token.here"
        );
        expect(User.findByPk).toHaveBeenCalledWith(1);
        expect(jwt.sign).toHaveBeenCalledWith(
            { id: user.id, login: user.login },
            "test-secret",
            { expiresIn: "24h" }
        );
        expect(redisClient.setEx).toHaveBeenCalledWith(
            "blacklist:valid.token.here",
            24 * 60 * 60,
            "revoked"
        );
        expect(logger.info).toHaveBeenCalledWith(
            "Token rafraîchi avec succès",
            {
                userId: user.id,
                ip: req.ip,
            }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Token rafraîchi",
            token: newToken,
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("devrait renvoyer 401 si le token est expiré", async () => {
        // Arrange
        const error = new jwt.TokenExpiredError("Token expiré", new Date());
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw error;
        });

        // Act
        await refreshToken(req as Request, res as Response, next);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith(
            "valid.token.here",
            "test-secret"
        );
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Session expirée" });
        expect(next).not.toHaveBeenCalled();
    });

    it("devrait renvoyer 401 si le token est invalide", async () => {
        // Arrange
        const error = new jwt.JsonWebTokenError("Token invalide");
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw error;
        });

        // Act
        await refreshToken(req as Request, res as Response, next);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith(
            "valid.token.here",
            "test-secret"
        );
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token invalide" });
        expect(next).not.toHaveBeenCalled();
    });

    it("devrait appeler next avec l'erreur pour les autres types d'erreurs", async () => {
        // Arrange
        const error = new Error("Erreur inattendue");
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw error;
        });

        // Act
        await refreshToken(req as Request, res as Response, next);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith(
            "valid.token.here",
            "test-secret"
        );
        expect(logger.error).toHaveBeenCalledWith(
            "Erreur de rafraîchissement du token",
            {
                error: "Erreur inattendue",
            }
        );
        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
