import { Request, Response, NextFunction } from "express";
import { addUserResumeJourney } from "../../../../controllers/journal/AddUserResumeJourneyController";
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

describe("addUserResumeJourney", () => {
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
                id_resume_journey: "resume-001",
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

        await addUserResumeJourney(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return 404 if journal not found", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValue(null);

        await addUserResumeJourney(req as Request, res as Response, next);

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

    it("should update journal and return 200 if journal exists", async () => {
        await addUserResumeJourney(req as Request, res as Response, next);

        expect(Journal.update).toHaveBeenCalledWith(
            { id_resume_journey: "resume-001" },
            {
                where: {
                    id_journal: "journal-xyz",
                    id_user: "user-abc",
                },
            }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Résumé de la journée enregistrée avec succès",
        });
    });

    it("should log and call next on unexpected error", async () => {
        const error = new Error("DB is down");
        (Journal.findOne as jest.Mock).mockRejectedValue(error);

        await addUserResumeJourney(req as Request, res as Response, next);

        expect(logger.error).toHaveBeenCalledWith(
            "Erreur lors de l'enregistrement du résumé de la journée de l'utilisateur",
            expect.objectContaining({
                error: "DB is down",
                user_id: "user-abc",
                body: req.body,
            })
        );

        expect(next).toHaveBeenCalledWith(error);
    });
});
