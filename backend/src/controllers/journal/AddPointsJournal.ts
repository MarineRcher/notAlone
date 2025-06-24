import { Request, Response, NextFunction } from "express";
import logger from "../../config/logger";
import Journal from "../../models/Journal";
import User from "../../models/User";

/**
 * Express controller for points to a user.
 *
 * Requires authentication (via req.user).
 * Update a journal entry with points
 *
 * @param {Request} req - Express request with user context.
 * @param {Response} res - Express response.
 * @param {NextFunction} next - Express next middleware.
 * @returns {Promise<void>}
 */
export const addPoints = async (
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

        const user = await User.findByPk(user_id);
        if (!user) {
            res.status(404).json({
                message: "Utilisateur non trouvé",
            });
            return;
        }

        let pointsToAdd = 0;
        let message = "";

        if (!existingJournal.consumed) {
            pointsToAdd = 25;
            message = "Objectif accompli ! 25 points ajoutés";
        } else {
            pointsToAdd = 15;
            message = "Participation enregistrée ! 15 points ajoutés";
        }

        await user.increment("points", { by: pointsToAdd });

        await existingJournal.update({
            actual_day_goal_completed: actual_day_goal_completed,
        });

        // Get updated user data to return current points
        await user.reload();

        res.status(200).json({
            message: message,
            pointsAdded: pointsToAdd,
            totalPoints: user.points,
        });
    } catch (error) {
        logger.error("Erreur lors de l'ajout de points de l'utilisateur", {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            user_id: req.user?.id,
            body: req.body,
            ip: req.ip,
        });
        next(error);
    }
};
