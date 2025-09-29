import { Request, Response, NextFunction } from "express";
import { Op } from 'sequelize';
import AddictionUser from "../../models/AddictionUser";
import Badge from "../../models/Badges";
import logger from "../../config/logger";

export const getUserBadges = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const user_id = req.user?.id;
		const addiction_id = req.body.addiction_id;

		if (!user_id) {
			res.status(401).json({ message: "Non autorisé" });
			return;
		}

		if (!addiction_id) {
			res.status(400).json({ message: "ID d'addiction requis" });
			return;
		}

		const user_addiction = await AddictionUser.findByPk(addiction_id, { raw: true });

		if (!user_addiction) {
			res.status(404).json({ message: "Relation utilisateur-addiction non trouvée" });
			return;
		}

		// Vérifier que l'addiction appartient bien à l'utilisateur
		if (user_addiction.id_user !== user_id) {
			res.status(403).json({ message: "Accès non autorisé à cette addiction" });
			return;
		}

		// Validation du format de date
		const startDate = new Date(user_addiction.date);
		if (isNaN(startDate.getTime())) {
			res.status(400).json({ message: "Format de date invalide" });
			return;
		}

		// Calculate number of days since the start date
		const currentDate = new Date();
		const timeDifferenceMs = currentDate.getTime() - startDate.getTime();
		const daysSinceStart = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24));

		// Vérifier que la date n'est pas dans le futur
		if (daysSinceStart < 0) {
			res.status(400).json({ message: "Date de début invalide (future)" });
			return;
		}

		// Find badges that the user has earned
		const earnedBadges = await Badge.findAll({
			where: {
				time_in_days: {
					[Op.lte]: daysSinceStart
				}
			},
			order: [['time_in_days', 'ASC']]
		});

		res.status(200).json(earnedBadges);

	} catch (error) {
		logger.error("Erreur lors de la récupération des badges utilisateur", {
			error,
			user_id: req.user?.id,
			addiction_id: req.body.addiction_id,
			ip: req.ip,
		});
		next(error);
	}
};
