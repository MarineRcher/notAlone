import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { redisClient } from "./../../config/redis";
import User from "../../models/User";
import logger from "../../config/logger";
import { generateToken } from "../../services/JwtServices";

/**
 * Refreshes an access token by validating the old one,
 * ensuring it is not revoked, and issuing a new token.
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next middleware
 */
export const refreshToken = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			res.status(401).json({ message: "Authentification requise" });
			return;
		}

		const oldToken = authHeader.split(" ")[1];
		const decoded = jwt.verify(
			oldToken,
			process.env.JWT_SECRET!,
		) as jwt.JwtPayload;

		const isRevoked = await redisClient.get(`blacklist:${oldToken}`);
		if (isRevoked) {
			res.status(401).json({ message: "Token révoqué" });
			return;
		}

		const user = await User.findByPk(decoded.id);
		if (!user) {
			res.status(404).json({ message: "Utilisateur introuvable" });
			return;
		}

		const newToken = generateToken(
			{
				id: user.id,
				login: user.login,
				has2FA: user.has2FA,
				notify: user.notify,
				notifyHour: user.hourNotify,
				hasPremium: user.hasPremium,
			},
			"24h",
		);

		await redisClient.setEx(`blacklist:${oldToken}`, 24 * 60 * 60, "revoked");

		logger.info("Token rafraîchi avec succès", {
			userId: user.id,
			ip: req.ip,
		});

		res.status(200).json({
			message: "Token rafraîchi",
			token: newToken,
		});
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			res.status(401).json({ message: "Session expirée" });
			return;
		}

		if (error instanceof jwt.JsonWebTokenError) {
			res.status(401).json({ message: "Token invalide" });
			return;
		}

		logger.error("Erreur de rafraîchissement du token", {
			error: error instanceof Error ? error.message : "Erreur inconnue",
		});
		next(error);
	}
};
