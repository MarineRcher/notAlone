import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../../models/User";
import isPasswordCompromised from "../../utils/auth/isPasswordCompromised";
import logger from "../../config/logger";
import { Op } from "sequelize";

export const changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { loginOrEmail, oldPassword, newPassword } = req.body;

        const user = await User.findOne({
            where: {
                [Op.or]: [{ login: loginOrEmail }, { email: loginOrEmail }],
            },
            raw: true,
        });
        if (user && user.id) {
            logger.info("Tentative de changement de mot de passe", {
                user: user.id,
                ip: req.ip,
            });
        }

        if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
            if (user) {
                await User.update(
                    {
                        failedLoginAttempts: user.failedLoginAttempts + 1,
                        blockedUntil:
                            user.failedLoginAttempts + 1 >= 3
                                ? new Date(Date.now() + 15 * 60 * 1000)
                                : null,
                    },
                    {
                        where: { id: user.id },
                    }
                );
                logger.warn(
                    "Échec changement MP - Ancien mot de passe incorrect",
                    {
                        user: loginOrEmail,
                        ip: req.ip,
                    }
                );

                res.status(401).json({
                    message: "Ancien mot de passe incorrect",
                });
                return;
            }
            res.status(401).json({ message: "Email ou login incorrect" });
            return;
        }
        if (user?.blockedUntil && user.blockedUntil > new Date()) {
            const remainingTime = Math.ceil(
                (user.blockedUntil.getTime() - Date.now()) / 60000
            );
            res.status(429).json({
                message: `Compte bloqué. Réessayez dans ${remainingTime} minutes.`,
            });
            return;
        }

        if (await isPasswordCompromised(newPassword)) {
            logger.warn("Échec changement MP - mot de passe compromis", {
                user: user.id,
                ip: req.ip,
            });

            res.status(400).json({
                message:
                    "Ce mot de passe a été compromis. Choisissez-en un autre.",
            });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(newPassword, salt);

        logger.info("Changement de mot de passe réussi", {
            user: user.id,
            ip: req.ip,
        });
        await User.update(
            {
                failedLoginAttempts: 0,
                blockedUntil: null,
                password: password,
            },
            {
                where: { id: user.id },
            }
        );
        res.status(200).json({
            message: "Mot de passe modifié avec succès",
        });
    } catch (error) {
        next(error);
    }
};
