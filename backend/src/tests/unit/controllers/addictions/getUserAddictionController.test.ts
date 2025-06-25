import { Request, Response, NextFunction } from "express";
import { getUserAddictions } from "../../../../controllers/addiction/getUserAddictionController";
import AddictionUser from "../../../../models/AddictionUser";
import Addiction from "../../../../models/Addiction";

jest.mock("../../../../models/AddictionUser");
jest.mock("../../../../models/Addiction");

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe("getUserAddictions controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        const req = { user: undefined } as unknown as Request;
        const res = mockRes();

        await getUserAddictions(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return formatted addictions for authenticated user", async () => {
        const req = {
            user: { id: "1" },
        } as Request;

        const res = mockRes();

        (AddictionUser.findAll as jest.Mock).mockResolvedValue([
            {
                id_addiction_user: "100",
                date: new Date("2025-06-01T00:00:00.000Z"),
                id_addiction: "10",
            },
            {
                id_addiction_user: "101",
                date: new Date("2025-05-01T00:00:00.000Z"),
                id_addiction: "11",
            },
        ]);

        (Addiction.findAll as jest.Mock).mockResolvedValue([
            {
                id: "10",
                addiction: "Caféine",
                phoneNumber: "+33612345678",
            },
            {
                id: "11",
                addiction: "Nicotin",
                phoneNumber: "+33699999999",
            },
        ]);

        await getUserAddictions(req, res, mockNext);

        expect(AddictionUser.findAll).toHaveBeenCalledWith({
            where: { id_user: "1" },
            order: [["date", "DESC"]],
            raw: true,
        });

        expect(Addiction.findAll).toHaveBeenCalledWith({
            where: { id: ["10", "11"] },
            raw: true,
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            {
                id: "100",
                addiction: "Caféine",
                addictionId: "10",
                phoneNumber: "+33612345678",
                date: new Date("2025-06-01T00:00:00.000Z"),
            },
            {
                id: "101",
                addiction: "Nicotin",
                addictionId: "11",
                phoneNumber: "+33699999999",
                date: new Date("2025-05-01T00:00:00.000Z"),
            },
        ]);
    });

    it("should call next() on error", async () => {
        const req = {
            user: { id: "1" },
            ip: "127.0.0.1",
        } as Request;

        const res = mockRes();
        const error = new Error("Database error");

        (AddictionUser.findAll as jest.Mock).mockRejectedValue(error);

        await getUserAddictions(req, res, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
    });
});
