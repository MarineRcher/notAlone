import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../../models/User";
import isPasswordCompromised from "../../utils/auth/isPasswordCompromised";
import logger from "../../config/logger";
import { Op } from "sequelize";
import validator from "validator";
import { validateLoginOrEmail } from "../../utils/auth/authValidator";

/**
 * Validates the input data for a password change request.
 *
 * @param loginOrEmail - The user's login or email.
 * @param oldPassword - The user's current password.
 * @param newPassword - The desired new password.
 * @returns An object containing a boolean `isValid` and any validation `errors`.
 */
const validatePasswordData = (
    loginOrEmail: string,
    oldPassword: string,
    newPassword: string
) => {
    const errors: {
        loginOrEmail?: string;
        oldPassword?: string;
        newPassword?: string;
    } = {};
    const loginOrEmailError = validateLoginOrEmail(loginOrEmail);
    if (loginOrEmailError) {
        errors.loginOrEmail = loginOrEmailError;
    }

    if (!oldPassword) {
        errors.oldPassword = "L'ancien mot de passe est requis";
    }

    if (!newPassword) {
        errors.newPassword = "Le nouveau mot de passe est requis";
    } else if (
        !validator.isStrongPassword(newPassword, {
            minLength: 12,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })
    ) {
        errors.newPassword =
            "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial";
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Controller to handle password change requests.
 *
 * This endpoint:
 * - Validates login/email, old password, and new password
 * - Checks user identity and account block status
 * - Prevents reuse of compromised passwords
 * - Hashes and saves the new password
 * - Tracks failed login attempts and blocks accounts after too many failures
 *
 * @route POST /auth/change-password
 * @access Public (but requires valid credentials)
 */
export const changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { loginOrEmail, oldPassword, newPassword } = req.body;

        const { isValid, errors } = validatePasswordData(
            loginOrEmail,
            oldPassword,
            newPassword
        );
        if (!isValid) {
            logger.warn(
                "Échec de validation du formulaire de changement de mot de passe.",
                {
                    errors,
                    ip: req.ip,
                }
            );
            res.status(400).json({
                message: "Données de changement de mot de passe invalides",
                errors,
            });
            return;
        }

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
