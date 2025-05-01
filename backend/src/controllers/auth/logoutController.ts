import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { redisClient } from "./../../config/redis";
import crypto from "crypto";

export const logout = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(400).json({ message: "Token manquant" });
            return;
        }

        const decoded = jwt.decode(token) as { exp: number };
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        await redisClient.set(`blacklist:${tokenHash}`, "revoked", {
            EX: ttl > 0 ? ttl : 60,
        });

        res.status(200).json({ message: "Déconnexion réussie" });
    } catch (error) {
        next(error);
    }
};
