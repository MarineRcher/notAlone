import { Request, Response, NextFunction } from "express";
import { addUserAddiction } from "../../../../src/controllers/addiction/addUserAddictionController";
import Addiction from "../../../../src/models/Addiction";
import AddictionUser from "../../../../src/models/AddictionUser";
import User from "../../../../src/models/User";
import logger from "../../../../src/config/logger";

jest.mock("../../../../src/models/User");
jest.mock("../../../../src/models/Addiction");
jest.mock("../../../../src/models/AddictionUser");
jest.mock("../../../../src/config/logger");

const mockRes = () => {
	const res = {} as Response;
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
};

const nextFunction: NextFunction = jest.fn();

const mockUser = {
	id: "1",
	login: "testuser",
	email: "test@example.com",
	password: "hashed",
	hasPremium: false,
	has2FA: false,
	twoFactorSecret: null,
	isBlocked: false,
	notify: false,
	hourNotify: null,
	failedLoginAttempts: 0,
	blockedUntil: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("addUserAddiction controller", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should return 401 if user is not authenticated", async () => {
		const req = { user: null } as unknown as Request;
		const res = mockRes();

		await addUserAddiction(req, res, nextFunction);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
	});

	it("should return 400 if data is invalid", async () => {
		const req = {
			user: mockUser,
			body: {
				addiction_id: 1, // invalid
				date: "not-a-date", // invalid
			},
		} as unknown as Request;
		const res = mockRes();

		await addUserAddiction(req, res, nextFunction);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Données invalides",
				errors: expect.objectContaining({
					date: "Format de date invalide (utilisez ISO8601)",
				}),
			}),
		);
	});

	it("should return 404 if user is not found", async () => {
		const req = {
			user: mockUser,
			body: { addiction_id: "1", date: "2023-01-01" },
		} as Request;
		const res = mockRes();

		(User.findByPk as jest.Mock).mockResolvedValue(null);

		await addUserAddiction(req, res, nextFunction);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			message: "Utilisateur introuvable",
		});
	});

	it("should return 404 if addiction is not found", async () => {
		const req = {
			user: mockUser,
			body: { addiction_id: "1", date: "2023-01-01" },
		} as Request;
		const res = mockRes();

		(User.findByPk as jest.Mock).mockResolvedValue(mockUser);
		(Addiction.findByPk as jest.Mock).mockResolvedValue(null);

		await addUserAddiction(req, res, nextFunction);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			message: "Addiction introuvable",
		});
	});

	it("should return 409 if addiction already added", async () => {
		const req = {
			user: mockUser,
			body: { addiction_id: "1", date: "2023-01-01" },
		} as Request;
		const res = mockRes();

		(User.findByPk as jest.Mock).mockResolvedValue(mockUser);
		(Addiction.findByPk as jest.Mock).mockResolvedValue({ id: "1" });
		(AddictionUser.findOne as jest.Mock).mockResolvedValue({ id: "1" });

		await addUserAddiction(req, res, nextFunction);

		expect(res.status).toHaveBeenCalledWith(409);
		expect(res.json).toHaveBeenCalledWith({
			message: "Vous avez déjà ajouté cette addiction",
		});
	});

	it("should return 403 if non-premium user exceeds addiction limit", async () => {
		const req = {
			user: mockUser,
			body: { addiction_id: "2", date: "2023-01-01" },
		} as Request;
		const res = mockRes();

		(User.findByPk as jest.Mock).mockResolvedValue(mockUser);
		(Addiction.findByPk as jest.Mock).mockResolvedValue({ id: "2" });
		(AddictionUser.findOne as jest.Mock).mockResolvedValue(null);
		(AddictionUser.count as jest.Mock).mockResolvedValue(1);

		await addUserAddiction(req, res, nextFunction);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({
			message: "Compte premium requis pour ajouter plusieurs addictions",
		});
	});

	it("should create addiction successfully", async () => {
		const req = {
			user: { ...mockUser, hasPremium: true },
			ip: "127.0.0.1",
			body: {
				addiction_id: "2",
				date: "2023-01-01",
				use_a_day: 3,
				spending_a_day: 4.5,
			},
		} as unknown as Request;

		const res = mockRes();

		(User.findByPk as jest.Mock).mockResolvedValue(req.user);
		(Addiction.findByPk as jest.Mock).mockResolvedValue({ id: "2" });
		(AddictionUser.findOne as jest.Mock).mockResolvedValue(null); // ✅ Important!
		(AddictionUser.count as jest.Mock).mockResolvedValue(1);
		(AddictionUser.create as jest.Mock).mockResolvedValue({}); // mock success

		await addUserAddiction(req, res, nextFunction);

		expect(AddictionUser.create).toHaveBeenCalledWith({
			id_addiction: "2",
			id_user: req.user?.id,
			date: new Date("2023-01-01"),
			spending_a_day: 4.5,
			use_a_day: 3,
		});

		expect(logger.info).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith({
			message: "Addiction ajoutée avec succès",
		});
	});

	it("should handle Sequelize unique constraint error", async () => {
		const req = {
			user: mockUser,
			body: { addiction_id: "1", date: "2023-01-01" },
		} as Request;
		const res = mockRes();

		(User.findByPk as jest.Mock).mockResolvedValue(mockUser);
		(Addiction.findByPk as jest.Mock).mockResolvedValue({ id: "1" });
		(AddictionUser.findOne as jest.Mock).mockResolvedValue(null);
		(AddictionUser.count as jest.Mock).mockResolvedValue(0);

		const error = new Error("Unique error") as any;
		error.name = "SequelizeUniqueConstraintError";
		(AddictionUser.create as jest.Mock).mockRejectedValue(error);

		await addUserAddiction(req, res, nextFunction);

		expect(res.status).toHaveBeenCalledWith(409);
		expect(res.json).toHaveBeenCalledWith({
			message: "Cette addiction est déjà associée à votre compte",
		});
	});

	it("should handle Sequelize FK constraint error", async () => {
		const req = {
			user: mockUser,
			body: { addiction_id: "1", date: "2023-01-01" },
		} as Request;
		const res = mockRes();

		(User.findByPk as jest.Mock).mockResolvedValue(mockUser);
		(Addiction.findByPk as jest.Mock).mockResolvedValue({ id: "1" });
		(AddictionUser.findOne as jest.Mock).mockResolvedValue(null);
		(AddictionUser.count as jest.Mock).mockResolvedValue(0);

		const error = new Error("FK error") as any;
		error.name = "SequelizeForeignKeyConstraintError";
		(AddictionUser.create as jest.Mock).mockRejectedValue(error);

		await addUserAddiction(req, res, nextFunction);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			message: "Addiction introuvable",
		});
	});

	it("should handle unexpected errors", async () => {
		const req = {
			user: mockUser,
			ip: "127.0.0.1",
			body: { addiction_id: "1", date: "2023-01-01" },
		} as Request;
		const res = mockRes();

		(User.findByPk as jest.Mock).mockResolvedValue(mockUser);
		(Addiction.findByPk as jest.Mock).mockResolvedValue({ id: "1" });
		(AddictionUser.findOne as jest.Mock).mockResolvedValue(null);
		(AddictionUser.count as jest.Mock).mockResolvedValue(0);

		const error = new Error("Unexpected");
		(AddictionUser.create as jest.Mock).mockRejectedValue(error);

		await addUserAddiction(req, res, nextFunction);

		expect(logger.error).toHaveBeenCalled();
		expect(nextFunction).toHaveBeenCalledWith(error);
	});
});
