import { Request, Response, NextFunction } from "express";
import { changeEmail } from "../../../../src/controllers/user/emailController";
import User from "../../../../src/models/User";

jest.mock("../../../../src/models/User");

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext: NextFunction = jest.fn();

describe("changeEmail controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        const req = { user: null } as unknown as Request;
        const res = mockRes();

        await changeEmail(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return 400 if newEmail is missing", async () => {
        const req = {
            user: { id: 1 },
            body: {},
        } as Request;
        const res = mockRes();

        await changeEmail(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Le nouveau email est requis",
        });
    });

    it("should return 400 if newEmail format is invalid", async () => {
        const req = {
            user: { id: 1 },
            body: { newEmail: "bad-email" },
        } as Request;
        const res = mockRes();

        await changeEmail(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Format d'email invalide",
        });
    });

    it("should return 404 if user is not found", async () => {
        const req = {
            user: { id: 1 },
            body: { newEmail: "test@example.com" },
        } as Request;
        const res = mockRes();

        (User.findByPk as jest.Mock).mockResolvedValue(null);

        await changeEmail(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Utilisateur introuvable",
        });
    });

    it("should return 409 if email is already in use", async () => {
        const req = {
            user: { id: 1 },
            body: { newEmail: "test@example.com" },
        } as Request;
        const res = mockRes();

        (User.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
        (User.findOne as jest.Mock).mockResolvedValue({
            id: 2,
            email: "test@example.com",
        });

        await changeEmail(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            message: "L'email est déjà utilisé",
        });
    });

    it("should update email successfully and return 200", async () => {
        const req = {
            user: { id: 1 },
            body: { newEmail: "new@example.com" },
        } as Request;
        const res = mockRes();

        (User.findByPk as jest.Mock).mockResolvedValue({ id: 1 });
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.update as jest.Mock).mockResolvedValue([1]);

        await changeEmail(req, res, mockNext);

        expect(User.update).toHaveBeenCalledWith(
            { email: "new@example.com" },
            { where: { id: 1 } }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Email modifié avec succès",
        });
    });

    it("should handle unexpected errors and call next()", async () => {
        const req = {
            user: { id: 1 },
            body: { newEmail: "new@example.com" },
        } as Request;
        const res = mockRes();
        const error = new Error("DB failure");

        (User.findByPk as jest.Mock).mockRejectedValue(error);

        await changeEmail(req, res, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
    });
});
