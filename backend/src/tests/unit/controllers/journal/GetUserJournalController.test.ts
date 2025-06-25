import { Request, Response, NextFunction } from "express";
import { getUserJournal } from "../../../../controllers/journal/GetUserJournalController";
import Journal from "../../../../models/Journal";
import UserActivity from "../../../../models/UserActivity";
import Activities from "../../../../models/Activities";
import ResumeJourney from "../../../../models/ResumeJourney";
import logger from "../../../../config/logger";
import { UserAttributes } from "../../../../types/users";

jest.mock("../../../../models/Journal");
jest.mock("../../../../models/UserActivity");
jest.mock("../../../../models/Activities");
jest.mock("../../../../models/ResumeJourney");
jest.mock("../../../../config/logger", () => ({
    error: jest.fn(),
}));

describe("getUserJournal", () => {
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
            body: { date: "2025-06-25" },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();

        jest.clearAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        req.user = undefined;

        await getUserJournal(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return null if journal not found", async () => {
        (Journal.findOne as jest.Mock).mockResolvedValueOnce(null);

        await getUserJournal(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(null);
    });

    it("should return journal with no activities or resume", async () => {
        const journalMock = {
            id_journal: "j-123",
            id_user: "user-abc",
            created_at: "2025-06-25",
        };

        (Journal.findOne as jest.Mock)
            .mockResolvedValueOnce(journalMock) // current journal
            .mockResolvedValueOnce(null); // previous day

        (UserActivity.findAll as jest.Mock).mockResolvedValue([]);

        await getUserJournal(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            journal: journalMock,
            activities: [],
            resume_journey: null,
            previous_day_goal: null,
        });
    });

    it("should return journal with activities and resume", async () => {
        const journalMock = {
            id_journal: "j-123",
            id_user: "user-abc",
            id_resume_journey: "resume-001",
            created_at: "2025-06-25",
        };

        const previousJournalMock = {
            next_day_goal: "Faire du sport",
        };

        const userActivityMock = [{ id_activity: 1 }, { id_activity: 2 }];

        const activityMock = [{ id_activity: 1, name: "lecture" }];
        const resumeMock = { id_resume_journey: "resume-001", word: "Fierté" };

        (Journal.findOne as jest.Mock)
            .mockResolvedValueOnce(journalMock) // current journal
            .mockResolvedValueOnce(previousJournalMock); // previous day journal

        (UserActivity.findAll as jest.Mock).mockResolvedValue(userActivityMock);
        (Activities.findAll as jest.Mock).mockResolvedValue(activityMock);
        (ResumeJourney.findOne as jest.Mock).mockResolvedValue(resumeMock);

        await getUserJournal(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            journal: journalMock,
            activities: [
                {
                    user_activity: userActivityMock[0],
                    activity_details: activityMock,
                },
                {
                    user_activity: userActivityMock[1],
                    activity_details: activityMock,
                },
            ],
            resume_journey: resumeMock,
            previous_day_goal: "Faire du sport",
        });
    });

    it("should log and call next on unexpected error", async () => {
        const error = new Error("Boum");
        (Journal.findOne as jest.Mock).mockRejectedValue(error);

        await getUserJournal(req as Request, res as Response, next);

        expect(logger.error).toHaveBeenCalledWith(
            "Erreur lors de la récupération du journal de l'utilisateur",
            expect.objectContaining({
                error,
                user_id: "user-abc",
                ip: undefined,
            })
        );

        expect(next).toHaveBeenCalledWith(error);
    });
});
