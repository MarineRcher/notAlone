import { Request, Response, NextFunction } from "express";
import AddictionUser from "../../models/AddictionUser";
import logger from "../../config/logger";

export const getMoneySave = async (
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

		const startDate = new Date(user_addiction.date);
		if (isNaN(startDate.getTime())) {
			res.status(400).json({ message: "Format de date invalide" });
			return;
		}

		// Calculer le nombre de jours depuis l'arrêt
		const currentDate = new Date();
		const timeDifference = currentDate.getTime() - startDate.getTime();
		const daysSinceQuit = Math.floor(timeDifference / (1000 * 3600 * 24));

		// Calculer les économies
		const dailySpending = user_addiction.spending_a_day || 0;
		const totalSavings = daysSinceQuit * dailySpending;

		res.status(200).json(totalSavings);

	} catch (error) {
		logger.error("Erreur lors de la récupération des economies de l'utilisateur", {
			error,
			user_id: req.user?.id,
			addiction_id: req.body.addiction_id,
			ip: req.ip,
		});
		next(error);
	}
}
