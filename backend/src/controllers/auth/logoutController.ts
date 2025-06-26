import { Request, Response, NextFunction } from "express";

import { revokeToken } from "../../services/JwtServices";

/**
 * Logs out the currently authenticated user by blacklisting the JWT.
 *
 * This endpoint:
 * - Extracts the JWT from the Authorization header
 * - Decodes the token to get its expiration time
 * - Hashes the token and stores it in Redis as blacklisted until it expires
 * - Prevents reuse of the token after logout
 *
 * @route POST /auth/logout
 * @access Private
 */
export const logout = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) {
			res.status(400).json({ message: "Token manquant" });
			return;
		}

		await revokeToken(token);

		res.status(200).json({ message: "Déconnexion réussie" });
	} catch (error) {
		next(error);
	}
};
