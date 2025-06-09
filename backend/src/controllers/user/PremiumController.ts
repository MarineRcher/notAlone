import { Request, Response, NextFunction } from "express";
import User from "../../models/User";
import { generateToken } from "../../services/JwtServices";

export const activatePremium = async (
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
        // Récupération de l'utilisateur
        const user = await User.findByPk(user_id, { raw: true });

        if (!user) {
            res.status(404).json({ message: "Utilisateur introuvable" });
            return;
        }
        await User.update({ hasPremium: true }, { where: { id: user_id } });
        if (user) {
            const token = generateToken(
                {
                    id: user_id,
                    login: user.login,
                    has2FA: user.has2FA,
                    notify: user.notify,
                    notifyHour: user.hourNotify,
                    hasPremium: true,
                },
                "24h"
            );
            res.status(200).json({
                message: "Version premium ajouté avec succès",
                token,
            });
        }
    } catch (error) {
        next(error);
    }
};

export const deactivatePremium = async (
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

        // Récupération de l'utilisateur
        const user = await User.findByPk(user_id, { raw: true });

        if (!user) {
            res.status(404).json({ message: "Utilisateur introuvable" });
            return;
        }

        await User.update({ hasPremium: false }, { where: { id: user_id } });
        if (user) {
            const token = generateToken(
                {
                    id: user.id,
                    login: user.login,
                    has2FA: user.has2FA,
                    notify: user.notify,
                    notifyHour: user.hourNotify,
                    hasPremium: false,
                },
                "24h"
            );
            res.status(200).json({
                message: "Version premium supprimé avec succès",
                token,
            });
        }
    } catch (error) {
        next(error);
    }
};
