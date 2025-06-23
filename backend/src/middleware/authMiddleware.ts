import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { UserAttributes } from "../types/users";
import { safeRedisClient } from "../config/redis";
import { JwtPayload } from "../types/jwt";

declare global {
    namespace Express {
        interface Request {
            user?: UserAttributes;
        }
    }
}

/**
 * Middleware to authenticate requests using a JWT.
 *
 * This function performs the following:
 * - Checks for the presence of a Bearer token in the Authorization header.
 * - Verifies that the token is not revoked (i.e. not present in Redis blacklist).
 * - Decodes and verifies the JWT using the secret key.
 * - Retrieves the user from the database based on the decoded token's `id`.
 * - Ensures the user is not blocked.
 * - Attaches the user data to the request object for use in downstream middleware/routes.
 *
 * If any of these checks fail, it responds with the appropriate error status and message.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function to pass control to the next middleware
 */
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({ message: "Authentification requise" });
            return;
        }

        const token = authHeader.split(" ")[1];
        const isRevoked = await safeRedisClient.get(`blacklist:${token}`);
        if (isRevoked) {
            res.status(401).json({ message: "Token révoqué" });
            return;
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as JwtPayload;

        const user = await User.findByPk(decoded.id);
        if (!user) {
            res.status(401).json({ message: "Utilisateur introuvable" });
            return;
        }

        if (user.isBlocked) {
            res.status(403).json({
                message: "Compte bloqué. Contactez l'administrateur.",
            });
            return;
        }

        req.user = user.get({ plain: true }) as UserAttributes;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: "Session expirée" });
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ message: "Token invalide" });
            return;
        }

        console.error("Erreur authMiddleware:", error);
        res.status(500).json({
            message: "Erreur d'authentification",
            error: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
};
