import { Request, Response, NextFunction } from "express";
import { GetUserForestController } from "../../../../src/controllers/forest/GetUserForestController";
import Platforms from "../../../../src/models/Platforms";
import Forest from "../../../../src/models/Forest";
import Nature from "../../../../src/models/Nature";

jest.mock("../../../../src/models/Platforms");

describe("GetUserForestController", () => {
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as unknown as Response;

    const mockNext: NextFunction = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        const req = { user: null } as unknown as Request;

        await GetUserForestController(req, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return platforms with forest and nature for authenticated user", async () => {
        const req = { user: { id: 1 } } as Request;

        const mockPlatforms = [
            {
                id_platform: 1,
                x: 1,
                y: 1,
                forest: [
                    {
                        id_forest: 100,
                        side: "top",
                        nature: {
                            id_nature: 55,
                            type: "tree",
                            url: "https://cdn.com/tree.png",
                        },
                    },
                ],
            },
        ];

        (Platforms.findAll as jest.Mock).mockResolvedValueOnce(mockPlatforms);

        await GetUserForestController(req, mockRes, mockNext);

        expect(Platforms.findAll).toHaveBeenCalledWith({
            where: { id_user: 1 },
            include: [
                {
                    model: Forest,
                    as: "forest",
                    include: [
                        {
                            model: Nature,
                            as: "nature",
                            attributes: ["id_nature", "type", "url"],
                        },
                    ],
                },
            ],
        });

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            platforms: mockPlatforms,
        });
    });

    it("should return empty platforms array if none found", async () => {
        const req = { user: { id: 2 } } as Request;

        (Platforms.findAll as jest.Mock).mockResolvedValueOnce([]);

        await GetUserForestController(req, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            platforms: [],
        });
    });

    it("should call next with error if something fails", async () => {
        const req = { user: { id: 3 } } as Request;
        const error = new Error("DB failure");
        (Platforms.findAll as jest.Mock).mockRejectedValueOnce(error);

        await GetUserForestController(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
    });
});
