import { Request, Response, NextFunction } from "express";
import User from "../../models/User";
import logger from "../../config/logger";

export const activateNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { user_id } = req.body;

        // Validation
        if (!user_id) {
            res.status(400).json({ message: "user est requis" });
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

        // Journalisation
        logger.info("Notifications activées", {
            user_id,
            ip: req.ip,
        });

        res.status(200).json({ message: "Notifications activées avec succès" });
    } catch (error) {
        logger.error("Erreur activation notifications", {
            error,
            user_id: req.body?.user_id,
            ip: req.ip,
        });
        next(error);
    }
};

export const deactivateNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { user_id } = req.body;

        // Validation
        if (!user_id) {
            res.status(400).json({ message: "user_id est requis" });
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

        // Journalisation
        logger.info("Notifications désactivées", {
            user_id,
            ip: req.ip,
        });

        res.status(200).json({
            message: "Notifications désactivées avec succès",
        });
    } catch (error) {
        logger.error("Erreur désactivation notifications", {
            error,
            user_id: req.body?.user_id,
            ip: req.ip,
        });
        next(error);
    }
};

export const setNotificationHour = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { user_id, hour } = req.body;

        // Validation
        if (!user_id || !hour) {
            res.status(400).json({
                message: "user et hour sont requis (format HH:MM)",
            });
            return;
        }

        // Validation du format horaire
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(hour)) {
            res.status(400).json({
                message: "Format d'heure invalide. Utilisez HH:MM (ex: 09:30)",
            });
            return;
        }

        // Mise à jour
        const [updatedCount] = await User.update(
            { hourNotify: hour },
            { where: { id: user_id, notify: true } }
        );

        if (updatedCount === 0) {
            res.status(404).json({ message: "Utilisateur non trouvé" });
            return;
        }

        // Journalisation
        logger.info("Heure de notification mise à jour", {
            user_id,
            hour,
            ip: req.ip,
        });

        res.status(200).json({
            message: `Heure de notification mise à jour à ${hour}`,
        });
    } catch (error) {
        logger.error("Erreur mise à jour heure notification", {
            error,
            user_id: req.body?.user_id,
            hour: req.body?.hour,
            ip: req.ip,
        });
        next(error);
    }
};
