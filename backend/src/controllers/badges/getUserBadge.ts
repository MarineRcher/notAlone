import { Request, Response, NextFunction } from "express";
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
		const user_addiction = await AddictionUser.findOne({
			where: {
				id_user: user_id,
				id_addiction: addiction_id
			}
		});

		if (!user_addiction) {
			res.status(404).json({ message: "Relation utilisateur-addiction non trouvée" });
			return;
		}

		// Calculate number of days since the start date
		const startDate = new Date(user_addiction.date);
		const currentDate = new Date();
		const timeDifferenceMs = currentDate.getTime() - startDate.getTime();
		const daysSinceStart = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24));

		// Find badges that the user has earned (timeInDays <= daysSinceStart)
		const earnedBadges = await Badge.findAll({
			where: {
				timeInDays: {
					[require('sequelize').Op.lte]: daysSinceStart
				}
			},
			order: [['timeInDays', 'ASC']]
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
