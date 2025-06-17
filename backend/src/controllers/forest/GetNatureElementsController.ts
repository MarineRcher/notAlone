import { Request, Response, NextFunction } from "express";
import logger from "../../config/logger";
import Nature from "../../models/Nature";

/**
 * Express controller for fetching nature elements.
 *
 * Returns nature.
 *
 * @param {Request} req - Express request with user context.
 * @param {Response} res - Express response.
 * @param {NextFunction} next - Express next middleware.
 * @returns {Promise<void>}
 */
export const GetNatureElements = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const nature = await Nature.findAll();
        res.status(200).json({
            nature: nature,
        });
    } catch (error) {
        logger.error(
            "Erreur lors de la récupération des elements de la foret",
            {
                error,
                ip: req.ip,
            }
        );
        next(error);
    }
};
