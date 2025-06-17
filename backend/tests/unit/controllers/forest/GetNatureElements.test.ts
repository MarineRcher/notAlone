import { Request, Response, NextFunction } from "express";
import { GetNatureElements } from "../../../../src/controllers/forest/GetNatureElementsController";
import Nature from "../../../../src/models/Nature";

jest.mock("../../../../src/models/Nature", () => ({
    __esModule: true,
    default: {
        findAll: jest.fn(),
    },
}));

describe("GetNatureElements controller", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            ip: "127.0.0.1",
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should return 200 and nature elements on success", async () => {
        const mockNatureData = [
            {
                id_nature: 1,
                type: "tree",
                url: "https://example.com/tree.jpg",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        (Nature.findAll as jest.Mock).mockResolvedValue(mockNatureData);

        await GetNatureElements(req as Request, res as Response, next);

        expect(Nature.findAll).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ nature: mockNatureData });
        expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error on failure", async () => {
        const mockError = new Error("DB connection failed");

        (Nature.findAll as jest.Mock).mockRejectedValue(mockError);

        await GetNatureElements(req as Request, res as Response, next);

        expect(Nature.findAll).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(mockError);
    });
});
