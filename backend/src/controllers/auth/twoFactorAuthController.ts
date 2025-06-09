import { Request, Response, NextFunction, raw } from "express";
import jwt from "jsonwebtoken";
import User from "../../models/User";
import logger from "../../config/logger";
import validator from "validator";
import { generateToken } from "../../services/JwtServices";
import { TwoFactorService } from "../../services/TwoFactorServices";

const twoFactorService = new TwoFactorService();

/**
 * Validates the OTP (One-Time Password) format.
 * Ensures it is numeric and exactly 6 digits long.
 *
 * @param otp - The OTP code to validate
 * @returns An error message if invalid, otherwise undefined
 */
const validateOtpData = async (otp: string) => {
    if (!validator.isNumeric(otp) || otp.length !== 6) {
        return "Le code doit être à 6 chiffres";
    }
};

/**
 * Generates a 2FA secret and corresponding QR code for the authenticated user.
 * The secret is included in a temporary JWT token, valid for 10 minutes.
 *
 * @param req - Express request (user must be authenticated)
 * @param res - Express response
 * @param next - Express next function for error handling
 */
export const generate2FASecret = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;
        const user = await User.findByPk(userId, { raw: true });

        if (!user) {
            res.status(404).json({ message: "Utilisateur non trouvé" });
            return;
        }

        const { base32, otpauth_url, qrCode } =
            await twoFactorService.generateSecret(user.email);

        const tempToken = generateToken(
            { userId: user.id, secret: base32, setupPhase: true },
            "10m"
        );

        res.status(200).json({
            message: "Secret 2FA généré avec succès",
            tempToken,
            qrCodeUrl: qrCode,
            secret: base32,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verifies the user's OTP during the 2FA setup process.
 * If valid, 2FA is activated and the secret is stored in the database.
 *
 * @param req - Express request containing temp token and OTP
 * @param res - Express response
 * @param next - Express next function for error handling
 */
export const verify2FASetup = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { token, otp } = req.body;
        const error = await validateOtpData(otp);
        if (error) {
            logger.warn("Échec de validation du code", {
                error,
                ip: req.ip,
            });
            res.status(400).json({
                message: "Échec de validation du code",
                error,
            });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            setupPhase: boolean;
            secret: string;
            userId: number;
        };

        if (!decoded.setupPhase || !decoded.secret) {
            res.status(400).json({
                message: "Token invalide pour la configuration 2FA",
            });
            return;
        }

        const isValid = twoFactorService.verifyOTP(decoded.secret, otp);

        if (!isValid) {
            res.status(400).json({ message: "Code incorrect" });
            return;
        }

        const user = await User.findByPk(decoded.userId, { raw: true });
        if (!user) {
            res.status(404).json({ message: "Utilisateur non trouvé" });
            return;
        }

        await User.update(
            {
                twoFactorSecret: decoded.secret,
                has2FA: true,
            },
            {
                where: { id: decoded.userId },
            }
        );

        const newToken = generateToken(
            {
                id: user.id,
                login: user.login,
                has2FA: true,
                notify: user.notify,
                notifyHour: user.hourNotify,
            },
            "24h"
        );

        res.status(200).json({
            message:
                "L'authentification à deux facteurs a été activée avec succès",
            newToken,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verifies the OTP during the login flow after initial credentials check.
 * Issues a new full-session JWT if 2FA is successful.
 *
 * @param req - Express request containing the tempToken and OTP
 * @param res - Express response
 * @param next - Express next function for error handling
 */
export const verify2FALogin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { tempToken, otp } = req.body;
        const error = await validateOtpData(otp);
        if (error) {
            logger.warn("Échec de validation du code", {
                error,
                ip: req.ip,
            });
            res.status(400).json({
                message: "Échec de validation du code",
                error,
            });
            return;
        }
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET!) as {
            requiresTwoFactor: boolean;
            id: number;
        };
        logger.info("Tentative de vérification 2FA", {
            user: decoded.id,
            ip: req.ip,
        });
        if (!decoded.requiresTwoFactor) {
            logger.warn("Échec 2FA - Code invalide", {
                user: decoded.id,
                ip: req.ip,
            });

            res.status(400).json({
                message: "Token invalide pour la vérification 2FA",
            });
            return;
        }
        const user = await User.findByPk(decoded.id, { raw: true });
        if (!user || !user.twoFactorSecret) {
            logger.warn(
                "Échec 2FA - Utilisateur non trouvé ou 2FA non configurée",
                {
                    user: decoded.id,
                    ip: req.ip,
                }
            );

            res.status(404).json({
                message: "Utilisateur non trouvé ou 2FA non configurée",
            });
            return;
        }

        const isValid = twoFactorService.verifyOTP(user.twoFactorSecret, otp);

        if (!isValid) {
            res.status(401).json({
                message: "Code d'authentification incorrect",
            });
            return;
        }

        const token = generateToken(
            {
                id: user.id,
                login: user.login,
                has2FA: user.has2FA,
                notify: user.notify,
                notifyHour: user.hourNotify,
            },
            "24h"
        );

        const {
            password: _,
            twoFactorSecret: __,
            ...userWithoutSensitiveData
        } = user;
        logger.info("Vérification 2FA réussie", {
            user: decoded.id,
            ip: req.ip,
        });

        res.status(200).json({
            message: "Authentification à deux facteurs réussie",
            user: userWithoutSensitiveData,
            token,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Disables 2FA for a user after validating their OTP.
 * Removes the stored secret and flag from the user record.
 *
 * @param req - Express request containing userId and OTP
 * @param res - Express response
 * @param next - Express next function for error handling
 */
export const disable2FA = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findByPk(userId, { raw: true });
        if (!user) {
            res.status(404).json({ message: "Utilisateur non trouvé" });
            return;
        }

        if (!user.has2FA || !user.twoFactorSecret) {
            res.status(400).json({
                message:
                    "L'authentification à deux facteurs n'est pas activée pour cet utilisateur",
            });
            return;
        }

        const isValid = twoFactorService.verifyOTP(user.twoFactorSecret, otp);

        if (!isValid) {
            res.status(401).json({
                message: "Code d'authentification incorrect",
            });
            return;
        }

        await User.update(
            {
                twoFactorSecret: null,
                has2FA: false,
            },
            {
                where: { id: userId },
            }
        );
        const newToken = generateToken(
            {
                id: user.id,
                login: user.login,
                has2FA: false,
                notify: user.notify,
                notifyHour: user.hourNotify,
            },
            "24h"
        );
        res.status(200).json({
            message:
                "L'authentification à deux facteurs a été désactivée avec succès",
            newToken,
        });
    } catch (error) {
        next(error);
    }
};
