import { deleteUserAccount } from "../../../../src/controllers/user/deleteUserAccountController";
import User from "../../../../src/models/User";
import AddictionUser from "../../../../src/models/AddictionUser";
import { Request, Response, NextFunction } from "express";

jest.mock("../../../../src/models/User");
jest.mock("../../../../src/models/AddictionUser");

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext: NextFunction = jest.fn();

describe("deleteUserAccount controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        const req = { user: null } as unknown as Request;
        const res = mockRes();

        await deleteUserAccount(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
    });

    it("should return 404 if user not found (nothing deleted)", async () => {
        const req = { user: { id: 1 } } as Request;
        const res = mockRes();
        (AddictionUser.destroy as jest.Mock).mockResolvedValue(1);
        (User.destroy as jest.Mock).mockResolvedValue(0); // no rows deleted

        await deleteUserAccount(req, res, mockNext);

        expect(AddictionUser.destroy).toHaveBeenCalledWith({
            where: { id_user: 1 },
        });
        expect(User.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Utilisateur introuvable",
        });
    });

    it("should return 200 if user is successfully deleted", async () => {
        const req = { user: { id: 1 } } as Request;
        const res = mockRes();
        (AddictionUser.destroy as jest.Mock).mockResolvedValue(1);
        (User.destroy as jest.Mock).mockResolvedValue(1); // one row deleted

        await deleteUserAccount(req, res, mockNext);

        expect(AddictionUser.destroy).toHaveBeenCalledWith({
            where: { id_user: 1 },
        });
        expect(User.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Compte et données associées supprimés",
        });
    });

    it("should call next() on unexpected error", async () => {
        const req = { user: { id: 1 } } as Request;
        const res = mockRes();
        const error = new Error("Unexpected");

        (AddictionUser.destroy as jest.Mock).mockRejectedValue(error);

        await deleteUserAccount(req, res, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
    });
});
