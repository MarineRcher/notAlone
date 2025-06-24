import { Request, Response, NextFunction } from "express";
import logger from "../../config/logger";
import Journal from "../../models/Journal";

/**
 * Express controller for checking goal to a user.
 *
 * Requires authentication (via req.user).
 * Update a journal entry with consumed
 *
 * @param {Request} req - Express request with user context.
 * @param {Response} res - Express response.
 * @param {NextFunction} next - Express next middleware.
 * @returns {Promise<void>}
 */
export const addCheckGoal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user_id = req.user?.id;
        const { id_journal, actual_day_goal_completed } = req.body;

        if (!user_id) {
            res.status(401).json({ message: "Non autorisé" });
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
                message: "Journal non trouvé",
            });
            return;
        }

        await Journal.update(
            {
                actual_day_goal_completed: actual_day_goal_completed,
            },
            {
                where: {
                    id_journal: id_journal,
                    id_user: user_id,
                },
            }
        );

        res.status(200).json({
            message:
                "Objectif état de l'objectif remplit / non remplit enregistré avec succès",
        });
    } catch (error) {
        logger.error(
            "Erreur lors de l'enregistrement de l'état de l'objectif de l'utilisateur",
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
