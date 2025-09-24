import { Request, Response, NextFunction } from "express";
import AddictionUser from "../../models/AddictionUser";
import logger from "../../config/logger";
import Acquired from "../../models/Acquired";

export const getAcquired = async (
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
		const acquired = await Acquired.findAll({where: {addiction_id: user_addiction.id_addiction}});

		res.status(200).json({acquired, startDate});

	} catch (error) {
		logger.error("Erreur lors de la récupération des acquis utilisateur", {
			error,
			user_id: req.user?.id,
			addiction_id: req.body.addiction_id,
			ip: req.ip,
		});
		next(error);
	}
};
