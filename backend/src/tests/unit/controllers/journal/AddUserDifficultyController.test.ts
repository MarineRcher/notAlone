import { Request, Response, NextFunction } from "express";
import { addUserDifficulty } from "../../../../controllers/journal/AddUserDifficultyController";
import Journal from "../../../../models/Journal";
import logger from "../../../../config/logger";
import { UserAttributes } from "../../../../types/users";

jest.mock("../../../../models/Journal");
jest.mock("../../../../config/logger", () => ({
    error: jest.fn(),
}));

describe("addUserDifficulty", () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: NextFunction;

	const mockJournal = {
		id_journal: "j-123",
		difficulty: "Moyen",
		created_at: new Date("2025-06-25"),
	};

	beforeEach(() => {
		req = {
			user: {
				id: "user-abc",
				login: "testuser",
				email: "test@example.com",
				password: "hashed_password",
				hasPremium: false,
				has2FA: false,
				twoFactorSecret: null,
				isBlocked: false,
				notify: false,
				hourNotify: null,
				failedLoginAttempts: 0,
				blockedUntil: null,
				points: 0,
			} as UserAttributes,
			body: {
				date: "2025-06-25",
				difficulty: "Moyen",
			},
		};

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		next = jest.fn();

		(Journal.create as jest.Mock).mockResolvedValue(mockJournal);
		(Journal.findByPk as jest.Mock).mockResolvedValue(mockJournal);
		(Journal.update as jest.Mock).mockResolvedValue([1]);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should return 401 if user not authenticated", async () => {
		req.user = undefined;

		await addUserDifficulty(req as Request, res as Response, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ message: "Non autorisé" });
	});

	it("should return 400 if date or difficulty is missing", async () => {
		req.body = { difficulty: "Facile" }; // no date

		await addUserDifficulty(req as Request, res as Response, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "Date et difficulté sont requises",
		});
	});

	it("should return 400 if difficulty is invalid", async () => {
		req.body.difficulty = "Impossible";

		await addUserDifficulty(req as Request, res as Response, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "La difficulté doit être Facile, Moyen ou Dur.",
		});
	});

	it("should return 400 if date is invalid", async () => {
		req.body.date = "not-a-date";

		await addUserDifficulty(req as Request, res as Response, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "Format de date invalide",
		});
	});

	it("should create journal if no id_journal is given", async () => {
		await addUserDifficulty(req as Request, res as Response, next);

		expect(Journal.create).toHaveBeenCalledWith({
			id_user: "user-abc",
			difficulty: "Moyen",
			created_at: new Date("2025-06-25"),
		});

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: "Difficulté enregistrée avec succès",
			data: mockJournal,
		});
	});

	it("should return 404 if updating and journal not found", async () => {
		req.body.id_journal = "j-xyz";
		(Journal.findOne as jest.Mock).mockResolvedValue(null);

		await addUserDifficulty(req as Request, res as Response, next);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			message: "Journal non trouvé",
		});
	});

	it("should update difficulty if journal exists", async () => {
		req.body.id_journal = "j-123";
		(Journal.findOne as jest.Mock).mockResolvedValue({
			id_journal: "j-123",
		});

		await addUserDifficulty(req as Request, res as Response, next);

		expect(Journal.update).toHaveBeenCalledWith(
			{ difficulty: "Moyen" },
			{
				where: {
					id_journal: "j-123",
					id_user: "user-abc",
				},
			},
		);

		expect(Journal.findByPk).toHaveBeenCalledWith("j-123");

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: "Difficulté enregistrée avec succès",
			data: mockJournal,
		});
	});

	it("should log error and call next on exception", async () => {
		const error = new Error("boom");
		(Journal.create as jest.Mock).mockRejectedValue(error);

		await addUserDifficulty(req as Request, res as Response, next);

		expect(logger.error).toHaveBeenCalledWith(
			"Erreur lors de l'enregistrement de la difficulté de l'utilisateur",
			expect.objectContaining({
				error: "boom",
				user_id: "user-abc",
				body: req.body,
			}),
		);

		expect(next).toHaveBeenCalledWith(error);
	});
});
