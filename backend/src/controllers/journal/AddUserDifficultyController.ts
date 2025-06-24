import { Request, Response, NextFunction } from "express";
import logger from "../../config/logger";
import Journal from "../../models/Journal";

/**
 * Express controller for add difficulty to a user.
 *
 * Requires authentication (via req.user).
 * Creates or updates a journal entry with difficulty and date
 *
 * @param {Request} req - Express request with user context.
 * @param {Response} res - Express response.
 * @param {NextFunction} next - Express next middleware.
 * @returns {Promise<void>}
 */
export const addUserDifficulty = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user_id = req.user?.id;
        const { id_journal, date, difficulty } = req.body;

        if (!user_id) {
            res.status(401).json({ message: "Non autorisé" });
            return;
        }

        if (!date || difficulty === undefined || difficulty === null) {
            res.status(400).json({
                message: "Date et difficulté sont requises",
            });
            return;
        }

        if (
            difficulty !== "Facile" &&
            difficulty !== "Moyen" &&
            difficulty !== "Dur"
        ) {
            res.status(400).json({
                message: "La difficulté doit être Facile, Moyen ou Dur.",
            });
            return;
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            res.status(400).json({
                message: "Format de date invalide",
            });
            return;
        }

        let journal;

        if (!id_journal) {
            journal = await Journal.create({
                id_user: user_id,
                difficulty: difficulty,
                created_at: parsedDate,
            });
        } else {
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
                    difficulty: difficulty,
                },
                {
                    where: {
                        id_journal: id_journal,
                        id_user: user_id,
                    },
                }
            );

            journal = await Journal.findByPk(id_journal);
        }

        res.status(200).json({
            message: "Difficulté enregistrée avec succès",
            data: journal,
        });
    } catch (error) {
        logger.error(
            "Erreur lors de l'enregistrement de la difficulté de l'utilisateur",
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
