import { Request, Response, NextFunction } from "express";
import User from "../../models/User";

export const changeEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { user_id, newEmail } = req.body;

        // Validation des paramètres
        if (!user_id || !newEmail) {
            res.status(400).json({
                message:
                    "Paramètres manquants : user_id et newEmail sont requis",
            });
            return;
        }

        // Récupération de l'utilisateur
        const user = await User.findByPk(user_id);

        if (!user) {
            res.status(404).json({ message: "Utilisateur introuvable" });
            return;
        }

        // Vérification si le nouvel email existe déjà
        const emailExists = await User.findOne({ where: { email: newEmail } });

        if (emailExists) {
            res.status(409).json({ message: "L'email est déjà utilisé" });
            return;
        }

        // Mise à jour de l'email
        await User.update({ email: newEmail }, { where: { id: user_id } });

        res.status(200).json({ message: "Email modifié avec succès" });
    } catch (error) {
        next(error);
    }
};
