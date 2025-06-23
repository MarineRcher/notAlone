import { Request, Response, NextFunction } from "express";
import ResumeJourney from "../../models/ResumeJourney";
import Activities from "../../models/Activities";
/**
 * Express controller to retrieve all available activities from the database.
 *
 * Sends a list of activities in the response if found, otherwise returns an error message.
 *
 * HTTP Responses:
 * - 201 Created: Successfully retrieved the list of activities
 * - 400 Bad Request: No activities found in the database
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} A promise that resolves when the response is sent or error handling is triggered.
 */
export const getActivities = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const activities = await Activities.findAll();
        if (activities && activities.length > 0) {
            res.status(201).json({
                activities,
            });
        } else {
            res.status(400).json({
                message: "Aucune activite",
            });
        }
    } catch (error) {
        next(error);
    }
};
