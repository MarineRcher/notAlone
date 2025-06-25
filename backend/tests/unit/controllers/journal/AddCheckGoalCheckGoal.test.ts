import { Request, Response, NextFunction } from "express";
import { addCheckGoal } from "../../../../src/controllers/journal/AddCheckGoalController";
import Journal from "../../../../src/models/Journal";
import { UserAttributes } from "../../../../src/types/users";

jest.mock("../../../../src/models/Journal", () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

describe("addCheckGoal", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

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
                actual_day_goal_completed: true,
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

        await addCheckGoal(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return 404 if journal not found", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValue(null);

        await addCheckGoal(req as Request, res as Response, next);

        expect(Journal.findOne).toHaveBeenCalledWith({
            where: {
                id_journal: 1,
                id_user: 1,
            },
        });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Journal non trouvé",
        });
    });

    it("should update journal and return 200 if journal exists", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValue({ id_journal: 1 });
        (Journal.update as jest.Mock).mockResolvedValue([1]);

        await addCheckGoal(req as Request, res as Response, next);

        expect(Journal.update).toHaveBeenCalledWith(
            { actual_day_goal_completed: true },
            {
                where: {
                    id_journal: 1,
                    id_user: 1,
                },
            }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message:
                "Objectif état de l'objectif remplit / non remplit enregistré avec succès",
        });
    });

    it("should call next with error on exception", async () => {
        const error = new Error("DB exploded");
        (Journal.findOne as jest.Mock).mockRejectedValue(error);

        await addCheckGoal(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
