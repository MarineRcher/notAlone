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
        if (!user) {
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

        res.status(200).json({
            message: "Connexion réussie",
            token,
        });
    } catch (error) {
        next(error);
    }
};
