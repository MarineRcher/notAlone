import { Request, Response, NextFunction } from "express";
import { addUserActivities } from "../../../../src/controllers/journal/AddUserActivitiesController";
import Journal from "../../../../src/models/Journal";
import UserActivity from "../../../../src/models/UserActivity";
import logger from "../../../../src/config/logger";
import { UserAttributes } from "../../../../src/types/users";

jest.mock("../../../../src/models/Journal");
jest.mock("../../../../src/models/UserActivity");
jest.mock("../../../../src/config/logger", () => ({
    error: jest.fn(),
}));

describe("addUserActivities", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const mockJournal = { id_journal: "1" };

    beforeEach(() => {
        req = {
            user: {
                id: "1",
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
                id_journal: "1",
                activities: ["101", "102"],
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();

        (UserActivity.findAll as jest.Mock).mockResolvedValue([]);
        (UserActivity.destroy as jest.Mock).mockResolvedValue(undefined);
        (UserActivity.create as jest.Mock).mockImplementation(
            async (data) => data
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        req.user = undefined;

        await addUserActivities(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return 400 if activities are missing or empty", async () => {
        req.body.activities = [];

        await addUserActivities(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Les activités sont requises",
        });
    });

    it("should return 404 if journal not found", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValue(null);

        await addUserActivities(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Journal non trouvé.",
        });
    });

    it("should delete existing and create new user activities", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValue(mockJournal);

        await addUserActivities(req as Request, res as Response, next);

        expect(UserActivity.findAll).toHaveBeenCalledWith({
            where: { id_journal: "1", id_user: "1" },
        });

        expect(UserActivity.destroy).toHaveBeenCalledWith({
            where: { id_user: "1", id_journal: "1" },
        });

        expect(UserActivity.create).toHaveBeenCalledTimes(2);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Activités enregistrées avec succès",
            created_count: 2,
        });
    });

    it("should log and throw if an activity creation fails", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValue(mockJournal);
        (UserActivity.create as jest.Mock).mockImplementationOnce(() => {
            throw new Error("Création échouée");
        });

        await addUserActivities(req as Request, res as Response, next);

        expect(logger.error).toHaveBeenCalledWith(
            "Erreur lors de la création d'une activité",
            expect.objectContaining({
                error: "Création échouée",
                activity: "101",
                id_journal: "1",
                user_id: "1",
            })
        );

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next with error on unexpected failure", async () => {
        (Journal.findOne as jest.Mock).mockRejectedValue(new Error("DB down"));

        await addUserActivities(req as Request, res as Response, next);

        expect(logger.error).toHaveBeenCalledWith(
            "Erreur lors de l'enregistrement des activités de l'utilisateur",
            expect.objectContaining({
                error: "DB down",
                user_id: "1",
                body: req.body,
            })
        );

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
