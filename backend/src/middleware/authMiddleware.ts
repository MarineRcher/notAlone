import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { IUser } from "../types/users";
import { redisClient } from "../config/redis";

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

interface JwtPayload {
    id: number;
    [key: string]: any;
}

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
        const isRevoked = await redisClient.get(`blacklist:${token}`);
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

        req.user = user.get({ plain: true }) as IUser;
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
