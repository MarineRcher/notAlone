import { Request, Response, NextFunction } from "express";
import { addPoints } from "../../../../src/controllers/journal/AddPointsController";
import Journal from "../../../../src/models/Journal";
import User from "../../../../src/models/User";
import logger from "../../../../src/config/logger";
import { UserAttributes } from "../../../../src/types/users";
jest.mock("../../../../src/models/Journal", () => ({
    findOne: jest.fn(),
}));
jest.mock("../../../../src/models/User", () => ({
    findByPk: jest.fn(),
}));
jest.mock("../../../../src/config/logger", () => ({
    error: jest.fn(),
}));

describe("addPoints", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const mockUser = {
        id: 1,
        increment: jest.fn(),
        reload: jest.fn(),
        dataValues: { points: 100 },
    };

    beforeEach(() => {
        req = {
            user: {
                id: 1,
                login: "testuser",
                email: "test@example.com",
                password: "hashed_password",
                hasPremium: false,
                has2FA: false,
                twoFactorSecret: null,
                isBlocked: false,
                notify: false,
                hourNotify: null,
                failedLoginAttempts: 0,
                blockedUntil: null,
                points: 0,
            } as UserAttributes,
            body: {
                id_journal: 1,
            },
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

    it("should return 401 if user is not authenticated", async () => {
        req.user = undefined;

        await addPoints(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return 404 if journal not found", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValue(null);

        await addPoints(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Journal non trouvé",
        });
    });

    it("should return 404 if user not found", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValue({
            update: jest.fn(),
            consumed: false,
        });
        (User.findByPk as jest.Mock).mockResolvedValue(null);

        await addPoints(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Utilisateur non trouvé",
        });
    });

    it("should add 25 points if journal not consumed", async () => {
        const mockJournal = { update: jest.fn(), consumed: false };

        (Journal.findOne as jest.Mock).mockResolvedValue(mockJournal);
        (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

        await addPoints(req as Request, res as Response, next);

        expect(mockJournal.update).toHaveBeenCalledWith({ have_points: true });
        expect(mockUser.increment).toHaveBeenCalledWith("points", { by: 25 });
        expect(mockUser.reload).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Objectif accompli ! 25 points ajoutés",
            totalPoints: 100,
        });
    });

    it("should add 15 points if journal is consumed", async () => {
        const mockJournal = { update: jest.fn(), consumed: true };

        (Journal.findOne as jest.Mock).mockResolvedValue(mockJournal);
        (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

        await addPoints(req as Request, res as Response, next);

        expect(mockJournal.update).toHaveBeenCalledWith({ have_points: true });
        expect(mockUser.increment).toHaveBeenCalledWith("points", { by: 15 });
        expect(mockUser.reload).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Participation enregistrée ! 15 points ajoutés",
            totalPoints: 100,
        });
    });

    it("should call next with error on exception", async () => {
        const error = new Error("Boom");
        (Journal.findOne as jest.Mock).mockRejectedValue(error);

        await addPoints(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(logger.error).toHaveBeenCalledWith(
            "Erreur lors de l'ajout de points de l'utilisateur",
            expect.objectContaining({
                error: "Boom",
                user_id: 1,
                body: req.body,
            })
        );
    });
});
