import {
    activateNotifications,
    deactivateNotifications,
    setNotificationHour,
} from "../../../../src/controllers/user/notificationController";
import User from "../../../../src/models/User";
import logger from "../../../../src/config/logger";
import { Request, Response, NextFunction } from "express";

jest.mock("../../../../src/models/User");
jest.mock("../../../../src/config/logger");
jest.mock("../../../../src/services/JwtServices", () => ({
    generateToken: jest.fn(() => "mocked-token"),
}));

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext: NextFunction = jest.fn();

describe("Notification Controllers", () => {
    const mockUser = {
        id: 1,
        login: "testuser",
        has2FA: true,
        notify: true,
        hourNotify: "08:30",
        hasPremium: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("activateNotifications", () => {
        it("should return 401 if unauthenticated", async () => {
            const req = { user: null } as unknown as Request;
            const res = mockRes();

            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await activateNotifications(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
        });

        it("should return 404 if update count is 0", async () => {
            const req = { user: { id: 1 }, ip: "127.0.0.1" } as Request;
            const res = mockRes();
            (User.update as jest.Mock).mockResolvedValue([0]);
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            await activateNotifications(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Utilisateur non trouvé",
            });
        });

        it("should activate notifications successfully", async () => {
            const req = { user: { id: 1 }, ip: "127.0.0.1" } as Request;
            const res = mockRes();
            (User.update as jest.Mock).mockResolvedValue([1]);
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            await activateNotifications(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Notifications activées avec succès",
                    token: "mocked-token",
                })
            );
        });

        it("should call next() on unexpected error", async () => {
            const req = { user: { id: 1 }, ip: "127.0.0.1" } as Request;
            const res = mockRes();
            const error = new Error("DB error");
            (User.update as jest.Mock).mockRejectedValue(error);
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            await activateNotifications(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe("deactivateNotifications", () => {
        it("should return 401 if unauthenticated", async () => {
            const req = { user: null } as unknown as Request;
            const res = mockRes();
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            await deactivateNotifications(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("should return 404 if user not found", async () => {
            const req = { user: { id: 1 }, ip: "127.0.0.1" } as Request;
            const res = mockRes();
            (User.update as jest.Mock).mockResolvedValue([0]);
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            await deactivateNotifications(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("should deactivate notifications successfully", async () => {
            const req = { user: { id: 1 }, ip: "127.0.0.1" } as Request;
            const res = mockRes();
            (User.update as jest.Mock).mockResolvedValue([1]);
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            await deactivateNotifications(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Notifications désactivées avec succès",
                    token: "mocked-token",
                })
            );
        });

        it("should call next() on error", async () => {
            const req = { user: { id: 1 }, ip: "127.0.0.1" } as Request;
            const res = mockRes();
            const error = new Error("Failure");
            (User.update as jest.Mock).mockRejectedValue(error);
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            await deactivateNotifications(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe("setNotificationHour", () => {
        it("should return 400 if hour is missing", async () => {
            const req = { user: { id: 1 }, body: {} } as Request;
            const res = mockRes();
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            await setNotificationHour(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Le paramètre 'hour' est requis (format HH:MM)",
            });
        });

        it("should return 400 if hour format is invalid", async () => {
            const req = {
                user: { id: 1 },
                body: { hour: "99:99" },
            } as Request;
            const res = mockRes();
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            await setNotificationHour(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Format d'heure invalide. Utilisez HH:MM (ex: 09:30)",
            });
        });

        it("should return 404 if update fails", async () => {
            const req = {
                user: { id: 1 },
                body: { hour: "08:30" },
                ip: "127.0.0.1",
            } as Request;
            const res = mockRes();

            (User.update as jest.Mock).mockResolvedValue([0]);
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            await setNotificationHour(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Utilisateur non trouvé ou notifications non activées",
            });
        });

        it("should update notification hour successfully", async () => {
            const req = {
                user: { id: 1 },
                body: { hour: "08:30" },
                ip: "127.0.0.1",
            } as Request;
            const res = mockRes();

            (User.update as jest.Mock).mockResolvedValue([1]);
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            await setNotificationHour(req, res, mockNext);
            expect(User.update).toHaveBeenCalledWith(
                { hourNotify: "08:30" },
                {
                    where: { id: 1, notify: true },
                }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Heure de notification mise à jour à 08:30",
                    token: "mocked-token",
                })
            );
        });

        it("should call next() on DB error", async () => {
            const req = {
                user: { id: 1 },
                body: { hour: "08:30" },
                ip: "127.0.0.1",
            } as Request;
            const res = mockRes();
            const error = new Error("Failure");
            (User.update as jest.Mock).mockRejectedValue(error);
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            await setNotificationHour(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});
