import { Request, Response, NextFunction } from "express";
import { selectAddictions } from "../../../../controllers/addiction/selectAddictionController";
import Addiction from "../../../../models/Addiction";

jest.mock("../../../../models/Addiction");

describe("selectAddictions Controller", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    describe("Successful cases", () => {
        test("should return addictions with 201 status when found", async () => {
            const mockAddictions = [
                { id: "1", name: "Café" },
                { id: "2", name: "Réseaux sociaux" },
            ];

            (Addiction.findAll as jest.Mock).mockResolvedValue(mockAddictions);

            await selectAddictions(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(Addiction.findAll).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                addictions: mockAddictions,
            });
        });
    });

    describe("Error cases", () => {
        test("should return 400 when no addictions found", async () => {
            (Addiction.findAll as jest.Mock).mockResolvedValue(null);

            await selectAddictions(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(Addiction.findAll).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Aucune addiction",
            });
        });

        test("should return 400 when empty addictions array", async () => {
            (Addiction.findAll as jest.Mock).mockResolvedValue([]);

            await selectAddictions(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(Addiction.findAll).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Aucune addiction",
            });
        });

        test("should handle database errors", async () => {
            const testError = new Error("Database connection failed");
            (Addiction.findAll as jest.Mock).mockRejectedValue(testError);

            await selectAddictions(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(Addiction.findAll).toHaveBeenCalled();
            expect(nextFunction).toHaveBeenCalledWith(testError);
        });
    });
});
