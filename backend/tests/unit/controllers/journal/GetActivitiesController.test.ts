import { Request, Response, NextFunction } from "express";
import { getActivities } from "../../../../src/controllers/journal/GetActivitiesController";
import Activities from "../../../../src/models/Activities";

jest.mock("../../../../src/models/Activities", () => ({
    findAll: jest.fn(),
}));

describe("getActivities", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return 201 and activities if found", async () => {
        const mockActivities = [
            { id_activity: "1", name: "Lecture" },
            { id_activity: "2", name: "Sport" },
        ];
        (Activities.findAll as jest.Mock).mockResolvedValue(mockActivities);

        await getActivities(req as Request, res as Response, next);

        expect(Activities.findAll).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ activities: mockActivities });
    });

    it("should return 400 if no activities found", async () => {
        (Activities.findAll as jest.Mock).mockResolvedValue([]);

        await getActivities(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Aucune activite" });
    });

    it("should call next with error on exception", async () => {
        const error = new Error("Database error");
        (Activities.findAll as jest.Mock).mockRejectedValue(error);

        await getActivities(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
