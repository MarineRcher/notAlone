import { Request, Response, NextFunction } from "express";
import Addiction from "../../models/Addiction";
import AddictionUser from "../../models/AddictionUser";
import logger from "../../config/logger";
import User from "../../models/User";

export const addUserAddiction = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { user_id, addiction_id, date, use_a_day, spending_a_day } =
            req.body;

        // validate params
        if (!user_id || !addiction_id || !date) {
            res.status(400).json({
                message:
                    "Paramètres manquants : user_id, addiction_name et date sont requis",
            });
            return;
        }

        // vrerify user
        const user = await User.findOne({ where: { id: user_id } });
        if (!user) {
            res.status(404).json({
                message: "L'utilisateur n'existe pas",
            });
            return;
        }

        // verify user had already a addiction
        const userAddictions = await AddictionUser.findAll({
            where: { id_user: user_id },
        });

        // Vérifier si cette addiction spécifique existe déjà
        const hasThisAddiction = userAddictions.some(
            (ua) => ua.id_addiction === addiction_id
        );
        if (hasThisAddiction) {
            res.status(409).json({
                message: "Vous avez déjà ajouté cette addiction",
            });
            return;
        }

        // Vérifier les limites premium
        const canAddAddiction =
            userAddictions.length === 0 || user.get("hasPremium");

        if (!canAddAddiction) {
            res.status(403).json({
                message:
                    "Vous devez avoir un compte premium pour ajouter plusieurs addictions",
            });
            return;
        }

        // create user addiction
        await AddictionUser.create({
            id_addiction: addiction_id,
            id_user: user_id,
            date: date,
            spending_a_day: spending_a_day,
            use_a_day: use_a_day,
        });

        logger.info("Ajout d'une addiction réussi", {
            user: user_id,
            addiction: addiction_id,
            ip: req.ip,
        });

        res.status(201).json({
            message: "Ajout de l'addiction avec succès",
        });
    } catch (error) {
        if (
            error instanceof Error &&
            "name" in error &&
            error.name === "SequelizeUniqueConstraintError"
        ) {
            res.status(400).json({
                message: "Vous avez déjà ajouté cette addiction",
            });
            return;
        }

        logger.error("Erreur lors de l'ajout d'une addiction", {
            error: error,
            user_id: req.body?.user_id,
            ip: req.ip,
        });
        next(error);
    }
};
