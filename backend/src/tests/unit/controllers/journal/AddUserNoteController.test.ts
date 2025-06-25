import { Request, Response, NextFunction } from "express";
import { addUserNote } from "../../../../controllers/journal/AddUserNoteController";
import Journal from "../../../../models/Journal";
import logger from "../../../../config/logger";
import { UserAttributes } from "../../../../types/users";

jest.mock("../../../../models/Journal", () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

jest.mock("../../../../config/logger", () => ({
    error: jest.fn(),
}));

describe("addUserNote", () => {
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
                id_journal: "journal-xyz",
                note: "C'était une bonne journée",
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();

        (Journal.findOne as jest.Mock).mockResolvedValue({
            id_journal: "journal-xyz",
        });
        (Journal.update as jest.Mock).mockResolvedValue([1]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        req.user = undefined;

        await addUserNote(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return 404 if user has 2FA (premium required)", async () => {
        req.user!.has2FA = true;

        await addUserNote(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Version premium obligatoire",
        });
    });

    it("should return 404 if journal not found", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValue(null);

        await addUserNote(req as Request, res as Response, next);

        expect(Journal.findOne).toHaveBeenCalledWith({
            where: {
                id_journal: "journal-xyz",
                id_user: "user-abc",
            },
        });

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Journal non trouvé",
        });
    });

    it("should update note and return 200 if journal exists", async () => {
        await addUserNote(req as Request, res as Response, next);

        expect(Journal.update).toHaveBeenCalledWith(
            { note: "C'était une bonne journée" },
            {
                where: {
                    id_journal: "journal-xyz",
                    id_user: "user-abc",
                },
            }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Notes de la journée enregistrée avec succès",
        });
    });

    it("should log and call next on unexpected error", async () => {
        const error = new Error("Boom");
        (Journal.findOne as jest.Mock).mockRejectedValue(error);

        await addUserNote(req as Request, res as Response, next);

        expect(logger.error).toHaveBeenCalledWith(
            "Erreur lors de l'enregistrement des notes de la journée de l'utilisateur",
            expect.objectContaining({
                error: "Boom",
                user_id: "user-abc",
                body: req.body,
            })
        );

        expect(next).toHaveBeenCalledWith(error);
    });
});
