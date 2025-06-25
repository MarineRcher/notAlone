import { Request, Response, NextFunction } from "express";
import Addiction from "../../models/Addiction";
/**
 * Express controller to retrieve all available addictions from the database.
 *
 * Sends a list of addictions in the response if found, otherwise returns an error message.
 *
 * HTTP Responses:
 * - 201 Created: Successfully retrieved the list of addictions
 * - 400 Bad Request: No addictions found in the database
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} A promise that resolves when the response is sent or error handling is triggered.
 */
export const selectAddictions = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const addictions = await Addiction.findAll();
		if (addictions && addictions.length > 0) {
			res.status(201).json({
				addictions,
			});
		} else {
			res.status(400).json({
				message: "Aucune addiction",
			});
		}
	} catch (error) {
		next(error);
	}
};
