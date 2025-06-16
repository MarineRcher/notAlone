import { Request, Response, NextFunction } from "express";
import Addiction from "../../models/Addiction";
import AddictionUser from "../../models/AddictionUser";
import logger from "../../config/logger";
import Platforms from "../../models/Platforms";
import Forest from "../../models/Forest";
import Nature from "../../models/Nature";

/**
 * Express controller for fetching forest to a user.
 *
 * Requires authentication (via req.user).
 * Returns forest.
 *
 * @param {Request} req - Express request with user context.
 * @param {Response} res - Express response.
 * @param {NextFunction} next - Express next middleware.
 * @returns {Promise<void>}
 */
export const GetUserForest = async (
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

        const userPlatforms = await Platforms.findAll({
            where: { id_user: user_id },
            include: [
                {
                    model: Forest,
                    as: "forest",
                    include: [
                        {
                            model: Nature,
                            as: "nature",
                            attributes: ["id_nature", "type", "url"],
                        },
                    ],
                },
            ],
        });

        res.status(200).json({
            platforms: userPlatforms,
        });
    } catch (error) {
        logger.error("Erreur lors de la récupération de la forêt utilisateur", {
            error,
            user_id: req.user?.id,
            ip: req.ip,
        });
        next(error);
    }
};
