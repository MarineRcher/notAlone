import { Request, Response, NextFunction } from "express";
import {
	activatePremium,
	deactivatePremium,
} from "../../../../src/controllers/user/PremiumController";
import User from "../../../../src/models/User";
import { generateToken } from "../../../../src/services/JwtServices";

jest.mock("../../../../src/models/User");
jest.mock("../../../../src/services/JwtServices");

const mockRes = (): Partial<Response> => {
	const res: Partial<Response> = {};
	res.status = jest.fn().mockReturnThis();
	res.json = jest.fn().mockReturnThis();
	return res;
};

describe("Premium Controllers", () => {
	const mockUser = {
		id: 1,
		login: "Athena",
		has2FA: true,
		notify: false,
		hourNotify: null,
		hasPremium: false,
	};

	const mockToken = "jwt-token";

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("activatePremium", () => {
		it("should activate premium and return token", async () => {
			(User.findByPk as jest.Mock).mockResolvedValue({ ...mockUser });
			(User.update as jest.Mock).mockResolvedValue([1]);
			(generateToken as jest.Mock).mockReturnValue(mockToken);

			const req = {
				user: { id: mockUser.id },
			} as Request;

			const res = mockRes();
			const next = jest.fn();

			await activatePremium(req, res as Response, next);

			expect(User.findByPk).toHaveBeenCalledWith(mockUser.id, {
				raw: true,
			});
			expect(User.update).toHaveBeenCalledWith(
				{ hasPremium: true },
				{ where: { id: mockUser.id } },
			);
			expect(generateToken).toHaveBeenCalledWith(
				expect.objectContaining({
					hasPremium: true,
					id: mockUser.id,
					login: mockUser.login,
				}),
				"24h",
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: "Version premium ajouté avec succès",
				token: mockToken,
			});
		});

		it("should return 404 if user not found", async () => {
			(User.findByPk as jest.Mock).mockResolvedValue(null);

			const req = {
				user: { id: 999 },
			} as Request;
			const res = mockRes();
			const next = jest.fn();

			await activatePremium(req, res as Response, next);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				message: "Utilisateur introuvable",
			});
		});
	});

	describe("deactivatePremium", () => {
		it("should deactivate premium and return token", async () => {
			(User.findByPk as jest.Mock).mockResolvedValue({
				...mockUser,
				hasPremium: true,
			});
			(User.update as jest.Mock).mockResolvedValue([1]);
			(generateToken as jest.Mock).mockReturnValue(mockToken);

			const req = {
				user: { id: mockUser.id },
			} as Request;

			const res = mockRes();
			const next = jest.fn();

			await deactivatePremium(req, res as Response, next);

			expect(User.update).toHaveBeenCalledWith(
				{ hasPremium: false },
				{ where: { id: mockUser.id } },
			);
			expect(generateToken).toHaveBeenCalledWith(
				expect.objectContaining({
					hasPremium: false,
				}),
				"24h",
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: "Version premium supprimé avec succès",
				token: mockToken,
			});
		});

		it("should return 401 if user is not authenticated", async () => {
			const req = { user: null } as unknown as Request;
			const res = mockRes();
			const next = jest.fn();

			await deactivatePremium(req, res as Response, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
		});
	});
});
