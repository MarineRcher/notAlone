import { Request, Response, NextFunction } from "express";
import ResumeJourney from "../../models/ResumeJourney";
/**
 * Express controller to retrieve all available resume journey from the database.
 *
 * Sends a list of resume journey words in the response if found, otherwise returns an error message.
 *
 * HTTP Responses:
 * - 201 Created: Successfully retrieved the list of resume journey
 * - 400 Bad Request: No resume journey found in the database
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} A promise that resolves when the response is sent or error handling is triggered.
 */
export const getResumeJourney = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const resumeJourney = await ResumeJourney.findAll();
		if (resumeJourney && resumeJourney.length > 0) {
			res.status(201).json({
				resumeJourney,
			});
		} else {
			res.status(400).json({
				message: "Aucun mot dans resume journey",
			});
		}
	} catch (error) {
		next(error);
	}
};
