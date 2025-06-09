import { Request, Response, NextFunction } from "express";
import User from "../../models/User";
import logger from "../../config/logger";
import { generateToken } from "../../services/JwtServices";
/**
 * Validates a time string in HH:MM 24-hour format.
 *
 * @param {string} hour - The time string to validate (e.g., "09:30").
 * @returns {boolean} `true` if the string matches the HH:MM format, otherwise `false`.
 */
const validateNotificationHour = (hour: string) => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(hour);
};
/**
 * Express controller to activate notifications for the authenticated user.
 *
 * Updates the user's `notify` field to `true`.
 *
 * HTTP Responses:
 * - 200 OK: Notifications successfully activated
 * - 401 Unauthorized: User is not authenticated
 * - 404 Not Found: User not found
 *
 * @param {Request} req - Express request object. Must include `req.user.id`.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} A promise that resolves when the operation completes.
 */
export const activateNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user_id = req.user?.id;

        if (!user_id) {
            res.status(401).json({ message: "Non autorisé" });
            return;
        }

        // Mise à jour
        const [updatedCount] = await User.update(
            { notify: true },
            { where: { id: user_id } }
        );

        if (updatedCount === 0) {
            res.status(404).json({ message: "Utilisateur non trouvé" });
            return;
        }
        const user = await User.findByPk(user_id, { raw: true });
        if (user) {
            const token = generateToken(
                {
                    id: user.id,
                    login: user.login,
                    has2FA: user.has2FA,
                    notify: user.notify,
                    notifyHour: user.hourNotify,
                    hasPremium: user.hasPremium,
                },
                "24h"
            );
            // Journalisation
            logger.info("Notifications activées", {
                user_id,
                ip: req.ip,
            });

            res.status(200).json({
                message: "Notifications activées avec succès",
                token,
            });
        }
    } catch (error) {
        logger.error("Erreur activation notifications", {
            error,
            user_id: req.user?.id,
            ip: req.ip,
        });
        next(error);
    }
};
/**
 * Express controller to deactivate notifications for the authenticated user.
 *
 * Updates the user's `notify` field to `false`.
 *
 * HTTP Responses:
 * - 200 OK: Notifications successfully deactivated
 * - 401 Unauthorized: User is not authenticated
 * - 404 Not Found: User not found
 *
 * @param {Request} req - Express request object. Must include `req.user.id`.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} A promise that resolves when the operation completes.
 */
export const deactivateNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user_id = req.user?.id; // Utilisation de req.user.id

        if (!user_id) {
            res.status(401).json({ message: "Non autorisé" });
            return;
        }

        // Mise à jour
        const [updatedCount] = await User.update(
            { notify: false },
            { where: { id: user_id } }
        );

        if (updatedCount === 0) {
            res.status(404).json({ message: "Utilisateur non trouvé" });
            return;
        }
        const user = await User.findByPk(user_id, { raw: true });
        if (user) {
            const token = generateToken(
                {
                    id: user.id,
                    login: user.login,
                    has2FA: user.has2FA,
                    notify: user.notify,
                    notifyHour: user.hourNotify,
                    hasPremium: user.hasPremium,
                },
                "24h"
            );
            logger.info("Notifications désactivées", {
                user_id,
                ip: req.ip,
            });

            res.status(200).json({
                message: "Notifications désactivées avec succès",
                token,
            });
        }
    } catch (error) {
        logger.error("Erreur désactivation notifications", {
            error,
            user_id: req.user?.id, // Corrigé
            ip: req.ip,
        });
        next(error);
    }
};
/**
 * Express controller to set the notification hour for the authenticated user.
 *
 * Requires notifications to be already activated for the user. Validates the time format (HH:MM).
 *
 * HTTP Responses:
 * - 200 OK: Notification hour updated successfully
 * - 400 Bad Request: Missing or invalid time format
 * - 404 Not Found: User not found or notifications not activated
 *
 * @param {Request} req - Express request object. Must include `req.user.id` and `req.body.hour`.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
export const setNotificationHour = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user_id = req.user?.id; // Utilisation de req.user.id
        const { hour } = req.body;

        // Validation
        if (!hour) {
            res.status(400).json({
                message: "Le paramètre 'hour' est requis (format HH:MM)",
            });
            return;
        }

        // Validation du format horaire
        if (!validateNotificationHour(hour)) {
            res.status(400).json({
                message: "Format d'heure invalide. Utilisez HH:MM (ex: 09:30)",
            });
            return;
        }

        // Mise à jour
        const [updatedCount] = await User.update(
            { hourNotify: hour },
            {
                where: {
                    id: user_id,
                    notify: true, // Seulement si les notifications sont activées
                },
            }
        );

        if (updatedCount === 0) {
            res.status(404).json({
                message: "Utilisateur non trouvé ou notifications non activées",
            });
            return;
        }
        const user = await User.findByPk(user_id, { raw: true });
        if (user) {
            const token = generateToken(
                {
                    id: user.id,
                    login: user.login,
                    has2FA: user.has2FA,
                    notify: user.notify,
                    notifyHour: user.hourNotify,
                    hasPremium: user.hasPremium,
                },
                "24h"
            );
            // Journalisation
            logger.info("Heure de notification mise à jour", {
                user_id,
                hour,
                ip: req.ip,
            });

            res.status(200).json({
                message: `Heure de notification mise à jour à ${hour}`,
                token,
            });
        }
    } catch (error) {
        logger.error("Erreur mise à jour heure notification", {
            error,
            user_id: req.user?.id,
            hour: req.body?.hour,
            ip: req.ip,
        });
        next(error);
    }
};
