import { Request, Response, NextFunction } from "express";
import logger from "../../config/logger";
import Journal from "../../models/Journal";
import UserActivity from "../../models/UserActivity";

/**
 * Express controller for add activities to a user.
 *
 * Requires authentication (via req.user).
 * Update a journal entry with activities
 *
 * @param {Request} req - Express request with user context.
 * @param {Response} res - Express response.
 * @param {NextFunction} next - Express next middleware.
 * @returns {Promise<void>}
 */
export const addUserActivities = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user_id = req.user?.id;
        const { id_journal, activities } = req.body;

        if (!user_id) {
            res.status(401).json({ message: "Non autorisé" });
            return;
        }

        if (
            !activities ||
            !Array.isArray(activities) ||
            activities.length === 0
        ) {
            res.status(400).json({
                message: "Les activités sont requises",
            });
            return;
        }

        const existingJournal = await Journal.findOne({
            where: {
                id_journal: id_journal,
                id_user: user_id,
            },
        });

        if (!existingJournal) {
            res.status(404).json({
                message: "Journal non trouvé ou non autorisé",
            });
            return;
        }

        const createdActivities = [];
        for (const activity of activities) {
            try {
                const userActivity = await UserActivity.create({
                    id_journal: id_journal,
                    id_activity: activity,
                    id_user: user_id,
                });
                createdActivities.push(userActivity);
            } catch (createError) {
                logger.error("Erreur lors de la création d'une activité", {
                    error:
                        createError instanceof Error
                            ? createError.message
                            : createError,
                    activity: activity,
                    user_id: user_id,
                    id_journal: id_journal,
                });
                throw createError;
            }
        }

        res.status(200).json({
            message: "Activités enregistrées avec succès",
            created_count: createdActivities.length,
        });
    } catch (error) {
        logger.error(
            "Erreur lors de l'enregistrement des activités de l'utilisateur",
            {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined,
                user_id: req.user?.id,
                body: req.body,
                ip: req.ip,
            }
        );
        next(error);
    }
};
