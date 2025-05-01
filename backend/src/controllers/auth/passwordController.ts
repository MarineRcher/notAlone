import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../../models/User";
import isPasswordCompromised from "../../utils/auth/isPasswordCompromised";
import logger from "../../config/logger";

export const changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        const user = await User.findOne({ where: { email }, raw: false });
        if (user && user.id) {
            logger.info("Tentative de changement de mot de passe", {
                user: user.id,
                ip: req.ip,
            });
        }

        if (
            !user ||
            !(await bcrypt.compare(oldPassword, user.getDataValue("password")))
        ) {
            if (user) {
                await user.update({
                    failedLoginAttempts: user.failedLoginAttempts + 1,
                    blockedUntil:
                        user.failedLoginAttempts + 1 >= 3
                            ? new Date(Date.now() + 15 * 60 * 1000)
                            : null,
                });
            }
            res.status(401).json({ message: "Email incorrect" });
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
        const isPasswordValid = await bcrypt.compare(
            oldPassword,
            user.getDataValue("password")
        );
        if (!isPasswordValid) {
            logger.warn("Échec changement MP - Ancien mot de passe incorrect", {
                user: user.id,
                ip: req.ip,
            });

            res.status(401).json({ message: "Mot de passe incorrect" });
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
        user.password = await bcrypt.hash(newPassword, salt);
        const updatedUser = await user.save();

        const { password: _, ...userWithoutPassword } = updatedUser.get({
            plain: true,
        });
        logger.info("Changement de mot de passe réussi", {
            user: user.id,
            ip: req.ip,
        });
        await user.update({
            failedLoginAttempts: 0,
            blockedUntil: null,
        });
        res.status(200).json({
            message: "Mot de passe modifié avec succès",
            user: userWithoutPassword,
        });
    } catch (error) {
        next(error);
    }
};
