import { Request, Response, NextFunction } from "express";
import { addAddiction } from "../../../../src/controllers/addiction/addAddictionController";
import Addiction from "../../../../src/models/Addiction";

jest.mock("../../../../src/models/Addiction");

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe("addAddiction controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 400 if addiction name is invalid (too short)", async () => {
        const req = {
            body: {
                addiction: "a",
                phoneNumber: "+33612345678", // ✅ Ajouté
            },
        } as Request;

        const res = mockRes();

        await addAddiction(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            errors: {
                addiction: "Nom d'addiction invalide (min. 2 caractères)",
            },
        });
    });

    it("should return 400 if addiction name is missing", async () => {
        const req = {
            body: {
                phoneNumber: "+33612345678", // ✅ Ajouté
            },
        } as Request;

        const res = mockRes();

        await addAddiction(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            errors: {
                addiction: "Nom d'addiction invalide (min. 2 caractères)",
            },
        });
    });

    it("should return 201 and create addiction successfully", async () => {
        const req = {
            body: {
                addiction: "Nicotin",
                phoneNumber: "+33612345678",
            },
        } as Request;

        const res = mockRes();
        (Addiction.create as jest.Mock).mockResolvedValue({
            id: 1,
            addiction: "Nicotin",
            phoneNumber: "+33612345678",
        });

        await addAddiction(req, res, mockNext);

        expect(Addiction.create).toHaveBeenCalledWith({
            addiction: "Nicotin",
            phoneNumber: "+33612345678",
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("should return 409 if addiction already exists (unique constraint)", async () => {
        const req = {
            body: {
                addiction: "Nicotin",
                phoneNumber: "+33612345678",
            },
        } as Request;

        const res = mockRes();
        const error = new Error("Duplicate") as any;
        error.name = "SequelizeUniqueConstraintError";

        (Addiction.create as jest.Mock).mockRejectedValue(error);

        await addAddiction(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            message: "Cette addiction existe déjà",
        });
    });

    it("should call next() for generic errors", async () => {
        const req = {
            body: {
                addiction: "Caféine",
                phoneNumber: "+33612345678",
            },
        } as Request;

        const res = mockRes();
        const error = new Error("Database failure");

        (Addiction.create as jest.Mock).mockRejectedValue(error);

        await addAddiction(req, res, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should return 400 if phone number is invalid", async () => {
        const req = {
            body: {
                addiction: "Caféine",
                phoneNumber: "abc123", // invalide
            },
        } as Request;

        const res = mockRes();

        await addAddiction(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            errors: {
                phoneNumber:
                    "Numéro de téléphone invalide (10 à 20 caractères)",
            },
        });
    });
});
