import { Request, Response, NextFunction } from "express";
import { AddUserPlatform } from "../../../../src/controllers/forest/AddUserPlatformController";
import Platforms from "../../../../src/models/Platforms";
import Forest from "../../../../src/models/Forest";
import Nature from "../../../../src/models/Nature";

jest.mock("../../../../src/models/Platforms");
jest.mock("../../../../src/models/Forest");
jest.mock("../../../../src/models/Nature");

describe("AddUserPlatform", () => {
    const mockReq = {
        user: { id: 1 },
        body: {
            x: 2,
            y: 3,
            id_nature: 7,
            side: "top",
        },
    } as unknown as Request;

    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as unknown as Response;

    const mockNext: NextFunction = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        const req = { ...mockReq, user: null } as unknown as Request;

        await AddUserPlatform(req, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return 400 for invalid coordinates", async () => {
        const req = {
            ...mockReq,
            body: { x: "bad", y: 2 },
        } as unknown as Request;

        await AddUserPlatform(req, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: "Coordonnées (x, y) invalides",
        });
    });

    it("should return 409 if platform already exists", async () => {
        (Platforms.findOne as jest.Mock).mockResolvedValueOnce({});

        await AddUserPlatform(mockReq, mockRes, mockNext);

        expect(Platforms.findOne).toHaveBeenCalledWith({
            where: { id_user: 1, x: 2, y: 3 },
        });
        expect(mockRes.status).toHaveBeenCalledWith(409);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: "Une plateforme existe déjà à ces coordonnées",
        });
    });

    it("should create platform and forestElement if nature exists", async () => {
        (Platforms.findOne as jest.Mock).mockResolvedValueOnce(null);
        (Platforms.create as jest.Mock).mockResolvedValueOnce({
            id_platform: 42,
        });
        (Nature.findByPk as jest.Mock).mockResolvedValueOnce({
            id_nature: 7,
            type: "tree",
            url: "https://cdn.com/tree.png",
        });
        (Forest.create as jest.Mock).mockResolvedValueOnce({
            id_forest: 100,
            side: "top",
        });

        await AddUserPlatform(mockReq, mockRes, mockNext);

        expect(Platforms.create).toHaveBeenCalledWith({
            x: 2,
            y: 3,
            id_user: 1,
        });

        expect(Nature.findByPk).toHaveBeenCalledWith(7);

        expect(Forest.create).toHaveBeenCalledWith({
            side: "top",
            id_platform: 42,
            id_nature: 7,
        });

        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
            platform: { id_platform: 42 },
            forestElement: {
                id_forest: 100,
                side: "top",
            },
        });
    });
});
