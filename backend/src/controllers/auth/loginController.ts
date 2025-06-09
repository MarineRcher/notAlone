import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../../models/User";
import { Op } from "sequelize";
import logger from "../../config/logger";
import { validateLoginOrEmail } from "../../utils/auth/authValidator";
import { generateToken } from "../../services/JwtServices";

/**
 * Validates the login data for user authentication.
 *
 * @param {string} loginOrEmail - The login or email of the user.
 * @param {string} password - The password provided by the user.
 * @returns {object} - The validation result and any validation errors.
 */
const validateLoginData = (loginOrEmail: string, password: string) => {
    const errors: { loginOrEmail?: string; password?: string } = {};

    const loginOrEmailError = validateLoginOrEmail(loginOrEmail);
    if (loginOrEmailError) {
        errors.loginOrEmail = loginOrEmailError;
    }

    if (!password) {
        errors.password = "Le mot de passe est requis";
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Authenticates a user and generates a JWT token for session management.
 *
 * This endpoint:
 * - Validates the login data (email or login and password).
 * - Checks the user account status (e.g., locked due to multiple failed attempts).
 * - If 2FA is enabled, generates a temporary token for 2FA.
 * - Otherwise, generates a JWT token and returns it to the user.
 *
 * @route POST /auth/login
 * @access Public
 * @param {Request} req - The HTTP request.
 * @param {Response} res - The HTTP response.
 * @param {NextFunction} next - The next middleware function.
 */
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

        const { isValid, errors } = validateLoginData(loginOrEmail, password);
        if (!isValid) {
            logger.warn("Échec de validation du formulaire de connexion", {
                errors,
                ip: req.ip,
            });
            res.status(400).json({
                message: "Données de connexion invalides",
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
                logger.warn("Échec de connexion - Mot de passe incorrect", {
                    user: loginOrEmail,
                    ip: req.ip,
                });

                res.status(401).json({ message: "Mot de passe incorrect" });
                return;
            }
            logger.warn("Échec de connexion - Utilisateur non trouvé", {
                user: loginOrEmail,
                ip: req.ip,
            });

            res.status(401).json({ message: "Login ou Email incorrect" });
            return;
        }

        if (user.has2FA) {
            const tempToken = generateToken(
                { id: user.id, login: user.login, requiresTwoFactor: true },
                "24h"
            );

            res.status(200).json({
                message: "Authentification à deux facteurs requise",
                requiresTwoFactor: true,
                tempToken,
            });
            return;
        }

        const token = generateToken(
            { id: user.id, login: user.login, has2FA: user.has2FA },
            "24h"
        );
        logger.info("Connexion réussie", {
            user: user.id,
            ip: req.ip,
        });

        await User.update(
            {
                failedLoginAttempts: 0,
                blockedUntil: null,
            },
            {
                where: { id: user.id },
            }
        );
        res.status(200).json({
            message: "Connexion réussie",
            token,
        });
    } catch (error) {
        next(error);
    }
};
