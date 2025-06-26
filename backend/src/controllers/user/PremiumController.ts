import { Request, Response, NextFunction } from "express";
import User from "../../models/User";
import { generateToken } from "../../services/JwtServices";

/**
 * Activates premium status for the authenticated user.
 *
 * - Checks if the user is authenticated via `req.user`.
 * - Updates the user's `hasPremium` status to `true`.
 * - Generates a new JWT token including updated user info.
 * - Responds with a success message and the new token.
 *
 * @param req - Express request object, expects `req.user.id` to be set.
 * @param res - Express response object used to send the response.
 * @param next - Express next function to pass errors to the error handler.
 */
export const activatePremium = async (
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

		// Retrieve the user from the database
		const user = await User.findByPk(user_id, { raw: true });

		if (!user) {
			res.status(404).json({ message: "Utilisateur introuvable" });
			return;
		}

		await User.update({ hasPremium: true }, { where: { id: user_id } });

		const token = generateToken(
			{
				id: user_id,
				login: user.login,
				has2FA: user.has2FA,
				notify: user.notify,
				notifyHour: user.hourNotify,
				hasPremium: true,
			},
			"24h",
		);

		res.status(200).json({
			message: "Version premium ajouté avec succès",
			token,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Deactivates premium status for the authenticated user.
 *
 * - Checks if the user is authenticated via `req.user`.
 * - Updates the user's `hasPremium` status to `false`.
 * - Generates a new JWT token including updated user info.
 * - Responds with a success message and the new token.
 *
 * @param req - Express request object, expects `req.user.id` to be set.
 * @param res - Express response object used to send the response.
 * @param next - Express next function to pass errors to the error handler.
 */
export const deactivatePremium = async (
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

		// Retrieve the user from the database
		const user = await User.findByPk(user_id, { raw: true });

		if (!user) {
			res.status(404).json({ message: "Utilisateur introuvable" });
			return;
		}

		await User.update({ hasPremium: false }, { where: { id: user_id } });

		const token = generateToken(
			{
				id: user.id,
				login: user.login,
				has2FA: user.has2FA,
				notify: user.notify,
				notifyHour: user.hourNotify,
				hasPremium: false,
			},
			"24h",
		);

		res.status(200).json({
			message: "Version premium supprimé avec succès",
			token,
		});
	} catch (error) {
		next(error);
	}
};
