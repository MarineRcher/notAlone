import { Request, Response, NextFunction } from "express";
import logger from "../../config/logger";
import Journal from "../../models/Journal";

/**
 * Express controller for add note to a user.
 *
 * Requires authentication (via req.user).
 * Update a journal entry with notes
 *
 * @param {Request} req - Express request with user context.
 * @param {Response} res - Express response.
 * @param {NextFunction} next - Express next middleware.
 * @returns {Promise<void>}
 */
export const addUserNote = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const user_id = req.user?.id;
		const { id_journal, note } = req.body;
		if (!user_id) {
			res.status(401).json({ message: "Non autorisé" });
			return;
		}
		if (req.user?.has2FA) {
			res.status(404).json({
				message: "Version premium obligatoire",
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
				message: "Journal non trouvé",
			});
			return;
		}

		await Journal.update(
			{
				note: note,
			},
			{
				where: {
					id_journal: id_journal,
					id_user: user_id,
				},
			},
		);

		res.status(200).json({
			message: "Notes de la journée enregistrée avec succès",
		});
	} catch (error) {
		logger.error(
			"Erreur lors de l'enregistrement des notes de la journée de l'utilisateur",
			{
				error: error instanceof Error ? error.message : error,
				stack: error instanceof Error ? error.stack : undefined,
				user_id: req.user?.id,
				body: req.body,
				ip: req.ip,
			},
		);
		next(error);
	}
};
