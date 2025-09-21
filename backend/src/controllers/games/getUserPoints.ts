import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import logger from "../../config/logger";
import Forest from "../../models/Forest";
import Nature from "../../models/Nature";
import User from "../../models/User";

export const getUserPoints = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const user_id = req.user?.id;

		if (!user_id) {
			res.status(401).json({ message: "Non autorisé" });
			return;
		}

		const user = await User.findByPk(user_id, {
			attributes: ["points"],
			raw: true,
		});

		if (!user) {
			res.status(404).json({ message: "Utilisateur non trouvé" });
			return;
		}

		res.status(200).json(user.points);
	} catch (error) {
		logger.error("Erreur lors de la récupération des points de l'utilisateur", {
			error,
			user_id: req.user?.id,
			ip: req.ip,
		});
		next(error);
	}
};
