import { Request, Response, NextFunction } from "express";
import Addiction from "../../models/Addiction";
import AddictionUser from "../../models/AddictionUser";
import logger from "../../config/logger";

export const addUserAddiction = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { user_id, addiction_name, date, use_a_day, spending_a_day } =
            req.body;

        const addiction = await Addiction.findOne({
            where: { addiction: addiction_name },
        });
        if (addiction) {
            await AddictionUser.create({
                id_addiction: addiction.id,
                id_user: user_id,
                date: date,
                spending_a_day: spending_a_day,
                use_a_day: use_a_day,
            });
            logger.warn("Ajout d'une addiction", {
                user: user_id,
                ip: req.ip,
            });
            res.status(201).json({
                message: "Ajout de l'addiction avec succès",
            });
        } else {
            logger.warn("Echec de l'ajout, l'addiction n'existe pas", {
                user: user_id,
                ip: req.ip,
            });
            res.status(400).json({
                message: "Cette addiction n'est pas dans notre liste",
            });
            return;
        }
    } catch (error) {
        logger.error("Erreur lors de l'ajout d'une addiction", {
            error: error,
            ip: req.ip,
        });
        next(error);
    }
};
