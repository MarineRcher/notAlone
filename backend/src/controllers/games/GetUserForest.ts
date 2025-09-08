import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import logger from "../../config/logger";
import Forest from "../../models/Forest";
import Nature from "../../models/Nature";

export const getUserForest = async (
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

		const userForest = await Forest.findAll({
			where: { id_user: user_id },
			order: [["date", "DESC"]],
			raw: true,
		});

		if (userForest.length === 0) {
			res.status(200).json([]);
			return;
		}

		const natureIds = userForest.map(f => f.id_nature);
		const natures = await Nature.findAll({
			where: { id_nature: { [Op.in]: natureIds } },
			raw: true,
		});

		const naturesMap = new Map(natures.map(n => [n.id_nature, n]));

		const formatted = userForest.map(record => {
			const nature = naturesMap.get(record.id_nature);
			return {
				id_forest: record.id_forest,
				id_nature: record.id_nature,
				x: record.x,
				y: record.y,
				url: nature ? nature.url : null,
			};
		});

		res.status(200).json(formatted);
	} catch (error) {
		logger.error(
			"Erreur lors de la récupération de la forêt de l'utilisateur",
			{
				error,
				user_id: req.user?.id,
				ip: req.ip,
			},
		);
		next(error);
	}
};
