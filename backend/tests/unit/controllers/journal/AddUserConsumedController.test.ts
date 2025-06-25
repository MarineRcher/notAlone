import { Request, Response, NextFunction } from "express";
import { addUserConsumed } from "../../../../src/controllers/journal/AddUserConsumedController";
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

describe("addUserConsumed", () => {
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
                consumed: true,
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

        await addUserConsumed(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return 404 if journal not found", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValue(null);

        await addUserConsumed(req as Request, res as Response, next);

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

    it("should update journal and return 200 if journal found", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValue({
            id_journal: "journal-123",
        });
        (Journal.update as jest.Mock).mockResolvedValue([1]);

        await addUserConsumed(req as Request, res as Response, next);

        expect(Journal.update).toHaveBeenCalledWith(
            { consumed: true },
            {
                where: {
                    id_journal: "journal-123",
                    id_user: "user-abc",
                },
            }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Ecart enregistrée avec succès",
        });
    });

    it("should log and call next on unexpected error", async () => {
        const error = new Error("Unexpected failure");
        (Journal.findOne as jest.Mock).mockRejectedValue(error);

        await addUserConsumed(req as Request, res as Response, next);

        expect(logger.error).toHaveBeenCalledWith(
            "Erreur lors de l'enregistrement des ecarts de l'utilisateur",
            expect.objectContaining({
                error: "Unexpected failure",
                user_id: "user-abc",
                body: req.body,
            })
        );

        expect(next).toHaveBeenCalledWith(error);
    });
});
