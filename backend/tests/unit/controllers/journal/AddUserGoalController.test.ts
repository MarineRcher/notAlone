import { Request, Response, NextFunction } from "express";
import { addUserGoal } from "../../../../src/controllers/journal/AddUserGoalController";
import Journal from "../../../../src/models/Journal";
import logger from "../../../../src/config/logger";
import { UserAttributes } from "../../../../src/types/users";

jest.mock("../../../../src/models/Journal", () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

jest.mock("../../../../src/config/logger", () => ({
    error: jest.fn(),
}));

describe("addUserGoal", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            user: {
                id: "user-abc",
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
                id_journal: "journal-123",
                next_day_goal: "Faire du sport",
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();

        (Journal.update as jest.Mock).mockResolvedValue([1]);
        (Journal.findOne as jest.Mock).mockResolvedValue({
            id_journal: "journal-123",
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        req.user = undefined;

        await addUserGoal(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return 404 if user has 2FA (premium required)", async () => {
        req.user!.has2FA = true;

        await addUserGoal(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Version premium obligatoire",
        });
    });

    it("should return 404 if journal not found", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValue(null);

        await addUserGoal(req as Request, res as Response, next);

        expect(Journal.findOne).toHaveBeenCalledWith({
            where: {
                id_journal: "journal-123",
                id_user: "user-abc",
            },
        });

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Journal non trouvé",
        });
    });

    it("should update goal and return 200 if journal found", async () => {
        await addUserGoal(req as Request, res as Response, next);

        expect(Journal.update).toHaveBeenCalledWith(
            { next_day_goal: "Faire du sport" },
            {
                where: {
                    id_journal: "journal-123",
                    id_user: "user-abc",
                },
            }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Objectif de la journée enregistrée avec succès",
        });
    });

    it("should call next and log error on exception", async () => {
        const error = new Error("Explosion");
        (Journal.findOne as jest.Mock).mockRejectedValue(error);

        await addUserGoal(req as Request, res as Response, next);

        expect(logger.error).toHaveBeenCalledWith(
            "Erreur lors de l'enregistrement de l'Objectif de la journée de l'utilisateur",
            expect.objectContaining({
                error: "Explosion",
                user_id: "user-abc",
                body: req.body,
            })
        );

        expect(next).toHaveBeenCalledWith(error);
    });
});
