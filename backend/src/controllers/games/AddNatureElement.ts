import { Request, Response, NextFunction } from "express";
import Forest from "../../models/Forest";

export const addAddiction = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const { id_nature, x, y } = req.body;
		const user_id = req.user?.id;

		if (!user_id) {
			res.status(401).json({ message: "Non autorisé" });
			return;
		}
		await Forest.create({ x: x, y: y, id_nature: id_nature, id_user: user_id });
		res.status(201).json({
			success: true,
		});
	} catch (error) {
		next(error);
	}
};
