import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User";
import { Op } from "sequelize";
import logger from "../../config/logger";

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { loginOrEmail, password } = req.body;

        logger.info("Tentative de connexion", {
            user: loginOrEmail,
            ip: req.ip,
            timestamp: new Date(),
        });

        const user = await User.findOne({
            where: {
                [Op.or]: [{ login: loginOrEmail }, { email: loginOrEmail }],
            },
            raw: true,
        });
        if (user?.blockedUntil && user.blockedUntil > new Date()) {
            const remainingTime = Math.ceil(
                (user.blockedUntil.getTime() - Date.now()) / 60000
            );
            res.status(429).json({
                message: `Compte bloqué. Réessayez dans ${remainingTime} minutes.`,
            });
            return;
        }
        if (!user || !(await bcrypt.compare(password, user.password))) {
            if (user) {
                await user.update({
                    failedLoginAttempts: user.failedLoginAttempts + 1,
                    blockedUntil:
                        user.failedLoginAttempts + 1 >= 3
                            ? new Date(Date.now() + 15 * 60 * 1000)
                            : null,
                });
            }
            logger.warn("Échec de connexion - Utilisateur non trouvé", {
                user: loginOrEmail,
                ip: req.ip,
            });

            res.status(401).json({ message: "Login ou Email incorrect" });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            logger.warn("Échec de connexion - Mot de passe incorrect", {
                user: loginOrEmail,
                ip: req.ip,
            });

            res.status(401).json({ message: "Mot de passe incorrect" });
            return;
        }
        if (user.has2FA) {
            const tempToken = jwt.sign(
                { id: user.id, requiresTwoFactor: true },
                process.env.JWT_SECRET!,
                { expiresIn: "5m" }
            );

            res.status(200).json({
                message: "Authentification à deux facteurs requise",
                requiresTwoFactor: true,
                tempToken,
            });
            return;
        }

        const token = jwt.sign(
            { id: user.id, login: user.login },
            process.env.JWT_SECRET!,
            { expiresIn: "24h" }
        );
        logger.info("Connexion réussie", {
            user: user.id,
            ip: req.ip,
        });
        await user.update({
            failedLoginAttempts: 0,
            blockedUntil: null,
        });

        res.status(200).json({
            message: "Connexion réussie",
            token,
        });
    } catch (error) {
        next(error);
    }
};
