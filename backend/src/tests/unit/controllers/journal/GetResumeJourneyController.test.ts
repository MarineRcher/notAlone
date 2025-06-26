import { Request, Response, NextFunction } from "express";
import { getResumeJourney } from "../../../../controllers/journal/GetResumeJourneyController";
import ResumeJourney from "../../../../models/ResumeJourney";

jest.mock("../../../../models/ResumeJourney", () => ({
    findAll: jest.fn(),
}));

describe("getResumeJourney", () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: NextFunction;

	beforeEach(() => {
		req = {};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		next = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should return 201 and resumeJourney if found", async () => {
		const mockResume = [
			{ id_resume_journey: "1", word: "Motivation" },
			{ id_resume_journey: "2", word: "Détermination" },
		];
		(ResumeJourney.findAll as jest.Mock).mockResolvedValue(mockResume);

		await getResumeJourney(req as Request, res as Response, next);

		expect(ResumeJourney.findAll).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith({ resumeJourney: mockResume });
	});

	it("should return 400 if no resumeJourney found", async () => {
		(ResumeJourney.findAll as jest.Mock).mockResolvedValue([]);

		await getResumeJourney(req as Request, res as Response, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "Aucun mot dans resume journey",
		});
	});

	it("should call next with error on exception", async () => {
		const error = new Error("DB failure");
		(ResumeJourney.findAll as jest.Mock).mockRejectedValue(error);

		await getResumeJourney(req as Request, res as Response, next);

		expect(next).toHaveBeenCalledWith(error);
	});
});
