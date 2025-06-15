import { Request, Response, NextFunction } from "express";
import Addiction from "../../models/Addiction";
import AddictionUser from "../../models/AddictionUser";
import logger from "../../config/logger";

/**
 * Express controller for fetching all addictions linked to a user.
 *
 * Requires authentication (via req.user).
 * Returns addiction details with metadata from AddictionUser table.
 *
 * @param {Request} req - Express request with user context.
 * @param {Response} res - Express response.
 * @param {NextFunction} next - Express next middleware.
 * @returns {Promise<void>}
 */
export const getUserAddictions = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user_id = req.user?.id;

        if (!user_id) {
            res.status(401).json({ message: "Non autorisé" });
            return;
        }

        const addictions = await AddictionUser.findAll({
            where: { id_user: user_id },
            include: [
                {
                    model: Addiction,
                    as: "addiction",
                    attributes: ["id", "addiction", "phoneNumber"],
                },
            ],
            order: [["date", "DESC"]],
        });

        const formatted = addictions.map((record) => ({
            id: record.id_addiction_user,
            addiction: record.addiction?.addiction,
            addictionId: record.addiction?.id,
            phoneNumber: record.addiction?.phoneNumber,
            date: record.date,
        }));

        res.status(200).json(formatted);
    } catch (error) {
        logger.error(
            "Erreur lors de la récupération des addictions utilisateur",
            {
                error,
                user_id: req.user?.id,
                ip: req.ip,
            }
        );
        next(error);
    }
};
