import { Request, Response, NextFunction } from "express";
import logger from "../../config/logger";
import Nature from "../../models/Nature";

export const getNatureByFlower = async (
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

		const trees = await Nature.findAll({
			where: { type: "flower" },
			raw: true,
		});

		res.status(200).json(trees);
	} catch (error) {
		logger.error("Erreur lors de la récupération des fleurs", {
			error,
			user_id: req.user?.id,
			ip: req.ip,
		});
		next(error);
	}
};
