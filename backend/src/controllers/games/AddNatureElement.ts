import { Request, Response, NextFunction } from "express";
import Forest from "../../models/Forest";
import User from "../../models/User";

export const addNatureElement = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const { id_nature, x, y, points } = req.body;
		const user_id = req.user?.id;

		console.log("Request body:", req.body);
		console.log("User ID:", user_id);

		if (!user_id) {
			res.status(401).json({ message: "Non autorisé" });
			return;
		}

		const userData = await User.findByPk(user_id, { raw: true });

		if (!userData) {
			res.status(404).json({ message: "Utilisateur non trouvé" });
			return;
		}

		if (userData.points < points) {
			res.status(400).json({
				message: "Points insuffisants",
				currentPoints: userData.points,
				requiredPoints: points,
			});
			return;
		}

		await Forest.create({
			x: x,
			y: y,
			id_nature: id_nature,
			id_user: user_id,
		});

		const newPointsTotal = userData.points - points;
		console.log(
			"Updating user points from",
			userData.points,
			"to",
			newPointsTotal,
		);

		await User.update({ points: newPointsTotal }, { where: { id: user_id } });

		console.log("Points updated successfully");

		res.status(201).json({
			success: true,
			message: "Élément ajouté avec succès",
			remainingPoints: newPointsTotal,
		});
	} catch (error) {
		console.error("Error in addNatureElement:", error);
		res.status(500).json({
			error: "Erreur serveur",
			message: error instanceof Error ? error.message : "Erreur inconnue",
			details: error instanceof Error ? error.stack : undefined,
		});
	}
};
